import { Injectable, WritableSignal, signal } from '@angular/core';
import { CREDIT_AGREEMENTS, DISPATCH_GUIDES, DOCUMENT_DELIVERIES, DOC_SERIES, INVOICES } from '@core/mock-data';
import {
  CreditAgreement,
  DispatchGuide,
  DocSeries,
  DocumentDelivery,
  Invoice,
  InvoicePaymentRecord,
  PaymentMethod,
  PaymentVoucher,
  SalesInvoice,
  SeriesDocKind,
} from '@core/models';
import { TableStore } from '@core/supabase/table-store';

export interface InvoicePayment {
  amount: number;
  date: string;
  method: PaymentMethod;
  voucher?: PaymentVoucher;
  registeredBy?: string;
}

/** An invoice's pending payment surfaced for Cobranzas' validation queue. */
export interface PendingPayment {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  currency: string;
  invoiceTotal: number;
  outstandingBalance: number;
  payment: InvoicePaymentRecord;
}

/**
 * Mutable store for the Finanzas app (comprobantes, guías, series, convenios de crédito y validación
 * de pagos — antes las apps separadas Facturación y Cobranzas). Fixtures are the baseline; when Supabase is configured
 * the tables (`sales_invoices` here is folded into a single `invoices` row set, plus `doc_series`,
 * `dispatch_guides`, `credit_agreements`, `document_deliveries`) overlay and receive fire-and-forget
 * upserts. Prototype-grade: no real SUNAT calls, correlativos advance locally.
 */
@Injectable({ providedIn: 'root' })
export class InvoicingState {
  readonly invoices = signal<Invoice[]>(INVOICES.map((invoice) => ({ ...invoice })));
  readonly series = signal<DocSeries[]>([...DOC_SERIES]);
  readonly guides = signal<DispatchGuide[]>([...DISPATCH_GUIDES]);
  readonly agreements = signal<CreditAgreement[]>([...CREDIT_AGREEMENTS]);
  readonly deliveries = signal<DocumentDelivery[]>([...DOCUMENT_DELIVERIES]);

  private readonly invoicesStore = new TableStore<Invoice>('invoices');
  private readonly seriesStore = new TableStore<DocSeries>('doc_series');
  private readonly guidesStore = new TableStore<DispatchGuide>('dispatch_guides');
  private readonly agreementsStore = new TableStore<CreditAgreement>('credit_agreements');
  private readonly deliveriesStore = new TableStore<DocumentDelivery>('document_deliveries');

  private seq = { invoice: INVOICES.length + 1, guide: DISPATCH_GUIDES.length + 1, agreement: CREDIT_AGREEMENTS.length + 1, delivery: DOCUMENT_DELIVERIES.length + 1 };

  constructor() {
    this.invoicesStore.fetchAll().then((r) => r?.length && this.invoices.set(r));
    this.seriesStore.fetchAll().then((r) => r?.length && this.series.set(r));
    this.guidesStore.fetchAll().then((r) => r?.length && this.guides.set(r));
    this.agreementsStore.fetchAll().then((r) => r?.length && this.agreements.set(r));
    this.deliveriesStore.fetchAll().then((r) => r?.length && this.deliveries.set(r));
  }

  private mergeRow<T extends { id: string }>(sig: WritableSignal<T[]>, entity: T): void {
    sig.update((rows) => (rows.some((r) => r.id === entity.id) ? rows.map((r) => (r.id === entity.id ? entity : r)) : [...rows, entity]));
  }

  // ---- Invoices --------------------------------------------------------------

  addInvoice(invoice: Invoice): void {
    this.mergeRow(this.invoices, invoice);
    this.invoicesStore.upsert(invoice, (i) => ({ status: i.status, document_type: i.documentType }));
  }

  /**
   * A payment reported against an invoice is NOT applied to the balance yet — it goes into
   * `payments[]` as `pending_validation` and the invoice moves to `in_validation`. Cobranzas then
   * validates (or rejects) the voucher.
   */
  registerPayment(invoiceId: string, payment: InvoicePayment): void {
    this.invoices.update((invoices) =>
      invoices.map((invoice) => {
        if (invoice.id !== invoiceId || invoice.documentType !== 'sales') return invoice;
        const record: InvoicePaymentRecord = {
          id: `PAY-${Date.now().toString().slice(-8)}`,
          amount: payment.amount,
          date: payment.date,
          method: payment.method,
          voucher: payment.voucher,
          status: 'pending_validation',
          registeredBy: payment.registeredBy ?? 'Facturación',
          registeredAt: '2026-09-01',
        };
        const next: Invoice = { ...invoice, status: 'in_validation', payments: [...(invoice.payments ?? []), record] };
        this.invoicesStore.upsert(next, (i) => ({ status: i.status, document_type: i.documentType }));
        return next;
      }),
    );
  }

  /** Cobranzas validates a reported payment — now it is applied to the invoice balance. */
  validatePayment(invoiceId: string, paymentId: string, by = 'Cobranzas'): void {
    this.invoices.update((invoices) =>
      invoices.map((invoice) => {
        if (invoice.id !== invoiceId || invoice.documentType !== 'sales' || !invoice.payments) return invoice;
        const payments = invoice.payments.map((p) =>
          p.id === paymentId ? { ...p, status: 'validated' as const, validatedBy: by, validatedAt: '2026-09-01' } : p,
        );
        const rec = payments.find((p) => p.id === paymentId);
        const paidAmount = Math.min(invoice.total, invoice.paidAmount + (rec?.amount ?? 0));
        const outstandingBalance = Math.max(0, invoice.total - paidAmount);
        const stillPending = payments.some((p) => p.status === 'pending_validation');
        const status = stillPending ? 'in_validation' : outstandingBalance === 0 ? 'paid' : 'partial';
        const next: Invoice = {
          ...invoice,
          payments,
          paidAmount,
          outstandingBalance,
          status,
          paymentVoucher: rec?.voucher ?? invoice.paymentVoucher,
        };
        this.invoicesStore.upsert(next, (i) => ({ status: i.status, document_type: i.documentType }));
        return next;
      }),
    );
  }

  /** Cobranzas rejects a reported payment (voucher no coincide, monto errado, etc.). */
  rejectPayment(invoiceId: string, paymentId: string, comment: string, by = 'Cobranzas'): void {
    this.invoices.update((invoices) =>
      invoices.map((invoice) => {
        if (invoice.id !== invoiceId || invoice.documentType !== 'sales' || !invoice.payments) return invoice;
        const payments = invoice.payments.map((p) =>
          p.id === paymentId ? { ...p, status: 'rejected' as const, validatedBy: by, validatedAt: '2026-09-01', comment } : p,
        );
        const stillPending = payments.some((p) => p.status === 'pending_validation');
        const status = stillPending ? 'in_validation' : invoice.paidAmount > 0 ? 'partial' : 'issued';
        const next: Invoice = { ...invoice, payments, status };
        this.invoicesStore.upsert(next, (i) => ({ status: i.status, document_type: i.documentType }));
        return next;
      }),
    );
  }

  /** Flat list of payments awaiting Cobranzas' validation. */
  pendingPayments(): PendingPayment[] {
    const out: PendingPayment[] = [];
    for (const inv of this.invoices()) {
      if (inv.documentType !== 'sales' || !inv.payments) continue;
      for (const p of inv.payments) {
        if (p.status !== 'pending_validation') continue;
        out.push({
          invoiceId: inv.id,
          invoiceNumber: inv.number,
          customerName: inv.customerName,
          currency: inv.currency,
          invoiceTotal: inv.total,
          outstandingBalance: inv.outstandingBalance,
          payment: p,
        });
      }
    }
    return out;
  }

  /** Advances the correlativo for a doc kind/environment and returns the formatted `SERIE-00000123`. */
  nextComprobante(docKind: SeriesDocKind, environment: 'sunat' | 'interna' = 'sunat'): { series: string; correlativo: string; number: string } {
    let out = { series: '', correlativo: '', number: '' };
    this.series.update((rows) =>
      rows.map((s) => {
        if (s.docKind !== docKind || s.environment !== environment || !s.active || out.number) return s;
        const next = s.lastCorrelativo + 1;
        out = { series: s.series, correlativo: String(next).padStart(8, '0'), number: `${s.series}-${String(next).padStart(8, '0')}` };
        const updated = { ...s, lastCorrelativo: next };
        this.seriesStore.upsert(updated, (x) => ({ doc_kind: x.docKind, environment: x.environment }));
        return updated;
      }),
    );
    return out;
  }

  saveSeries(s: DocSeries): void {
    this.mergeRow(this.series, s);
    this.seriesStore.upsert(s, (x) => ({ doc_kind: x.docKind, environment: x.environment }));
  }

  createFreeInvoice(input: Omit<SalesInvoice, 'id' | 'documentType' | 'number' | 'series' | 'correlativo'>): SalesInvoice {
    const kind = input.docKind ?? 'factura';
    const num = this.nextComprobante(kind, 'sunat');
    const invoice: SalesInvoice = {
      ...input,
      id: `INV-S-${String(this.seq.invoice++).padStart(3, '0')}`,
      documentType: 'sales',
      number: num.number,
      series: num.series,
      correlativo: num.correlativo,
      isFreeDocument: input.salesOrderId ? false : true,
      sunatStatus: 'pending',
    };
    this.addInvoice(invoice);
    return invoice;
  }

  markInvoiceSent(invoiceId: string): void {
    this.invoices.update((rows) =>
      rows.map((i) => {
        if (i.id !== invoiceId || i.documentType !== 'sales') return i;
        const next = { ...i, sentToCustomerAt: '2026-09-01' } as Invoice;
        this.invoicesStore.upsert(next, (x) => ({ status: x.status, document_type: x.documentType }));
        return next;
      }),
    );
  }

  // ---- Guías de remisión ---------------------------------------------------

  createGuide(input: Omit<DispatchGuide, 'id' | 'series' | 'correlativo' | 'number'>): DispatchGuide {
    const num = this.nextComprobante('guia_remision', input.kind);
    const guide: DispatchGuide = { ...input, id: `DG-${String(this.seq.guide++).padStart(3, '0')}`, series: num.series, correlativo: num.correlativo, number: num.number };
    this.mergeRow(this.guides, guide);
    this.guidesStore.upsert(guide, (g) => ({ status: g.status, kind: g.kind }));
    return guide;
  }

  updateGuide(id: string, patch: Partial<DispatchGuide>): void {
    this.guides.update((rows) =>
      rows.map((g) => {
        if (g.id !== id) return g;
        const next = { ...g, ...patch };
        this.guidesStore.upsert(next, (x) => ({ status: x.status, kind: x.kind }));
        return next;
      }),
    );
  }

  // ---- Convenios ---------------------------------------------------------

  saveAgreement(a: CreditAgreement): void {
    this.mergeRow(this.agreements, a);
    this.agreementsStore.upsert(a, (x) => ({ status: x.status, customer_id: x.customerId }));
  }

  // ---- Envío de documentos -----------------------------------------------

  recordDelivery(input: Omit<DocumentDelivery, 'id'>): DocumentDelivery {
    const delivery: DocumentDelivery = { ...input, id: `DLV-${String(this.seq.delivery++).padStart(3, '0')}` };
    this.mergeRow(this.deliveries, delivery);
    this.deliveriesStore.upsert(delivery, (d) => ({ kind: d.kind, customer_id: d.customerId }));
    return delivery;
  }
}
