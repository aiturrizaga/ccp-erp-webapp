import { Component, computed, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { HlmPopoverImports } from '@ui/popover';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { ProductPicker } from '@shared/components/product-picker/product-picker';
import { toast } from '@shared/toast';

import { salesCustomers, salesOrders, salesProducts, salesContacts, salesQuotations } from '@apps/sales/sales-state';
import { InvoicingState } from '../../invoicing-state';
import {
  COMPROBANTE_KIND_LABEL,
  ComprobanteKind,
  Currency,
  PAYMENT_CONDITION_LABEL,
  PaymentCondition,
  PaymentVoucher,
  SalesInvoice,
  SalesProduct,
  InvoiceRelatedDocument,
  cuotaIdentifier,
  formatSalesProductName,
} from '@core/models';

interface DraftLine {
  description: string;
  salesProductId: string;
  quantity: number;
  unitPrice: number;
}

interface DraftInstallment {
  dueDate: string;
  amount: number;
}

interface DraftAdvance {
  /** Id del comprobante de anticipo en el sistema, o '' si es externo/manual. */
  sourceInvoiceId: string;
  /** Serie-número del comprobante de anticipo. */
  reference: string;
  docType: 'factura' | 'boleta';
  issuedAt: string;
  /** Monto del anticipo incluido IGV. */
  amount: number;
}

const NEW_LINE: DraftLine = { description: '', salesProductId: '', quantity: 1, unitPrice: 0 };
const ISSUE_DATE = '2026-09-01';

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-invoice-create',
  imports: [FormsModule, DecimalPipe, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, ...HlmPopoverImports, EntityHeader, ProductPicker],
  templateUrl: './invoice-create.html',
})
export class InvoiceCreate {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly state = inject(InvoicingState);

  protected readonly docKind = signal<ComprobanteKind>('factura');
  protected readonly orderId = signal('');
  protected readonly guideId = signal('');
  protected readonly billingEmail = signal('');
  protected readonly rucValidation = signal<'pending' | 'valid' | 'observed'>('pending');
  protected readonly customerId = signal('');
  protected readonly customerName = signal('');
  protected readonly customerTaxId = signal('');
  protected readonly currency = signal<Currency>('PEN');
  protected readonly glosa = signal('');
  protected readonly paymentCondition = signal<PaymentCondition>('contado');
  protected readonly earlyPaymentDiscountPct = signal(0);
  protected readonly withInstallments = signal(false);
  protected readonly installmentCount = signal(3);
  protected readonly installments = signal<DraftInstallment[]>([]);
  protected readonly lines = signal<DraftLine[]>([{ ...NEW_LINE }]);

  // Nota de crédito / débito
  protected readonly correctsInvoiceId = signal('');
  protected readonly noteReason = signal('');

  // Voucher de pago
  protected readonly voucher = signal<PaymentVoucher | null>(null);

  // Anticipos (SUNAT)
  protected readonly isAdvanceInvoice = signal(false);
  /** Importe total del comprobante cuando se emite exclusivamente por anticipo. No genera líneas de pedido. */
  protected readonly advanceAmount = signal(0);
  protected readonly advanceSearch = signal('');
  protected readonly advances = signal<DraftAdvance[]>([]);

  protected readonly customers = salesCustomers;
  protected readonly contacts = salesContacts;
  protected readonly products = salesProducts;
  protected readonly orders = computed(() => salesOrders().filter((o) => o.status !== 'cancelled'));
  protected readonly salesQuotations = salesQuotations;
  protected readonly salesInvoices = computed(() => this.state.invoices().filter((i): i is SalesInvoice => i.documentType === 'sales' && i.status !== 'voided'));
  protected readonly kindOptions = (['factura', 'boleta', 'nota_credito', 'nota_debito'] as ComprobanteKind[]).map((value) => ({ value, label: COMPROBANTE_KIND_LABEL[value] }));

  protected readonly isNote = computed(() => this.docKind() === 'nota_credito' || this.docKind() === 'nota_debito');
  protected readonly showInstallments = computed(() => !this.isNote() && this.paymentCondition() === 'credito' && this.withInstallments());

  protected readonly subtotal = computed(() =>
    this.isAdvanceInvoice()
      ? Math.round((this.advanceAmount() / 1.18) * 100) / 100
      : this.lines().reduce((s, l) => s + l.quantity * l.unitPrice, 0),
  );
  protected readonly discount = computed(() => (this.subtotal() * this.earlyPaymentDiscountPct()) / 100);
  protected readonly taxable = computed(() => this.subtotal() - this.discount());
  protected readonly igv = computed(() => this.taxable() * 0.18);
  protected readonly total = computed(() => this.taxable() + this.igv());

  // --- Anticipos --------------------------------------------------------------
  /** Comprobantes de anticipo ya emitidos para este cliente, disponibles para deducir. */
  /** Anticipos emitidos previamente para el cliente y, cuando se ha elegido, para el mismo pedido. */
  protected readonly eligibleAdvances = computed(() => {
    const customerId = this.customerId();
    const orderId = this.orderId();
    const search = this.advanceSearch().trim().toLowerCase();
    return this.salesInvoices().filter((i) => {
      if (!i.isAdvanceInvoice || i.status === 'draft') return false;
      if (!customerId || i.customerId !== customerId) return false;
      if (!orderId || i.salesOrderId !== orderId) return false;
      if (!search) return true;
      return [i.number, i.salesOrderId, i.customerName, i.glosa].filter(Boolean).some((v) => String(v).toLowerCase().includes(search));
    });
  });
  protected readonly showAdvances = computed(() => !this.isNote() && !this.isAdvanceInvoice() && !this.showInstallments());
  protected readonly advancesTotal = computed(() => this.advances().reduce((s, a) => s + (a.amount || 0), 0));
  protected readonly advancesBase = computed(() => Math.round((this.advancesTotal() / 1.18) * 100) / 100);
  protected readonly advancesIgv = computed(() => Math.round((this.advancesTotal() - this.advancesBase()) * 100) / 100);
  /** Neto a pagar = importe total − anticipos aplicados (SUNAT). */
  protected readonly netPayable = computed(() => Math.max(0, Math.round((this.total() - this.advancesTotal()) * 100) / 100));
  protected readonly advancesValid = computed(
    () => this.advancesTotal() <= this.total() + 0.01 && this.advances().every((a) => a.reference.trim().length > 0 && a.amount > 0),
  );

  /**
   * Número de cuotas saneado: entero entre 2 y 36. Un valor vacío / NaN / < 2 en el input
   * (p. ej. al borrar el campo) se trata como 2 — evita que el effect de reparto entre en
   * un bucle infinito comparando `installments().length` con un objetivo imposible.
   */
  protected readonly effectiveInstallmentCount = computed(() => {
    const n = Math.floor(Number(this.installmentCount()));
    if (!Number.isFinite(n) || n < 2) return 2;
    return Math.min(n, 36);
  });

  /** Monto neto pendiente de pago para el cuadro de cuotas = total (a las cuotas no se les aplican anticipos). */
  protected readonly creditAmount = computed(() => this.total());
  protected readonly installmentsSum = computed(() => this.installments().reduce((s, c) => s + (c.amount || 0), 0));
  protected readonly installmentsValid = computed(() => Math.abs(this.installmentsSum() - this.creditAmount()) < 0.01 && this.installments().every((c) => !!c.dueDate && c.amount > 0));

  protected readonly canSubmit = computed(() => {
    if (this.customerName().trim().length === 0 || this.total() <= 0) return false;
    if (this.guideId() && this.rucValidation() !== 'valid') return false;
    if (this.isNote() && (!this.correctsInvoiceId() || this.noteReason().trim().length === 0)) return false;
    if (this.showInstallments() && !this.installmentsValid()) return false;
    if (this.showAdvances() && this.advances().length > 0 && !this.advancesValid()) return false;
    if (this.isAdvanceInvoice() && this.advanceAmount() <= 0) return false;
    return true;
  });

  constructor() {
    const guideId = this.route.snapshot.queryParamMap.get('guideId');
    const orderId = this.route.snapshot.queryParamMap.get('orderId');
    if (guideId) {
      this.guideId.set(guideId);
      this.loadFromGuide(guideId);
    } else if (orderId) {
      this.orderId.set(orderId);
      this.onOrderChange(orderId);
      this.validateRuc();
    }
    effect(() => {
      if (!this.isNote()) return;
      this.correctsInvoiceId.set('');
      this.noteReason.set('');
    });
    // Rebuild the cuota rows when the toggle turns on or the count changes. Compare against the
    // *saneado* count so the effect converges (a raw < 2 / NaN count would loop forever).
    effect(() => {
      if (this.showInstallments() && this.installments().length !== this.effectiveInstallmentCount()) {
        this.distributeInstallments();
      }
      if (!this.showInstallments() && this.installments().length) {
        this.installments.set([]);
      }
    });
    // Anticipos only apply to a final factura/boleta at contado or crédito sin cuotas.
    effect(() => {
      if (!this.showAdvances() && this.advances().length) this.advances.set([]);
    });
    // A comprobante por anticipo is always a cash document and can't itself deduct anticipos.
    effect(() => {
      if (this.isAdvanceInvoice()) {
        this.paymentCondition.set('contado');
        this.withInstallments.set(false);
        if (this.advances().length) this.advances.set([]);
      }
    });
  }

  protected kindToString = (v: string) => COMPROBANTE_KIND_LABEL[v as ComprobanteKind] ?? v;
  protected condToString = (v: string) => PAYMENT_CONDITION_LABEL[v as PaymentCondition] ?? v;
  protected currencyToString = (v: string) => (v === 'PEN' ? 'Soles (PEN)' : 'Dólares (USD)');
  protected orderToString = (v: string) => this.orders().find((o) => o.id === v)?.number ?? 'Sin pedido (comprobante libre)';
  protected customerToString = (v: string) => salesCustomers().find((c) => c.id === v)?.legalName ?? 'Sin cliente en maestro';
  protected invoiceToString = (v: string) => {
    const i = this.salesInvoices().find((x) => x.id === v);
    return i ? `${i.number} — ${i.customerName}` : 'Selecciona el documento';
  };
  protected cuotaId = (i: number) => cuotaIdentifier(i + 1);
  protected readonly submitPopover = signal<'open' | 'closed'>('closed');
  protected readonly docKindLower = computed(() => COMPROBANTE_KIND_LABEL[this.docKind()].toLowerCase());

  protected loadFromGuide(id: string): void {
    const guide = this.state.guides().find((g) => g.id === id);
    if (!guide) return;
    const order = this.orders().find((o) => o.id === guide.salesOrderId);
    this.orderId.set(guide.salesOrderId ?? '');
    this.customerName.set(guide.customerName);
    this.customerTaxId.set(guide.customerTaxId);
    this.customerId.set(order?.customerId ?? salesCustomers().find((c) => c.taxId === guide.customerTaxId)?.id ?? '');
    this.currency.set(order?.currency ?? 'PEN');
    this.glosa.set(order?.glosa ?? '');
    this.paymentCondition.set(order?.paymentGate ? 'contado' : (salesCustomers().find((c) => c.id === this.customerId())?.paymentMode === 'cash' ? 'contado' : 'credito'));
    this.lines.set(guide.lines.map((l) => ({ description: l.description, salesProductId: '', quantity: l.quantity, unitPrice: order?.lines.find((ol) => ol.description === l.description)?.unitPrice ?? 0 })));
    const contact = salesContacts().find((c) => c.id === order?.contactId) ?? salesContacts().find((c) => c.customerId === this.customerId());
    this.billingEmail.set(contact?.email ?? '');
    this.validateRuc();
  }

  protected validateRuc(): void {
    const result = this.state.validateCustomerTaxId(this.customerTaxId());
    this.rucValidation.set(result.status);
  }

  protected onCustomerChange(id: string): void {
    this.advances.set([]);
    this.advanceSearch.set('');
    this.customerId.set(id);
    const c = salesCustomers().find((x) => x.id === id);
    if (!c) return;
    this.customerName.set(c.legalName);
    this.customerTaxId.set(c.taxId);
    this.currency.set(c.currency);
    this.rucValidation.set('pending');
    const contact = salesContacts().find((x) => x.customerId === id);
    this.billingEmail.set(contact?.email ?? '');
    this.paymentCondition.set(c.paymentMode === 'cash' ? 'contado' : 'credito');
  }

  protected onOrderChange(id: string): void {
    this.advances.set([]);
    this.advanceSearch.set('');
    this.orderId.set(id);
    const order = this.orders().find((o) => o.id === id);
    if (!order) return;
    const cust = salesCustomers().find((c) => c.id === order.customerId);
    this.customerId.set(order.customerId);
    this.customerName.set(order.customerName);
    this.customerTaxId.set(cust?.taxId ?? '');
    this.currency.set(order.currency);
    this.glosa.set(order.glosa ?? '');
    this.paymentCondition.set(cust?.paymentMode === 'cash' ? 'contado' : 'credito');
    const deliveredGuide = this.state.guides().find((g) => g.salesOrderId === order.id && g.status === 'delivered');
    if (deliveredGuide) this.guideId.set(deliveredGuide.id);
    this.lines.set(order.lines
      .map((l) => ({ description: l.description, salesProductId: l.salesProductId ?? '', quantity: l.dispatchedQuantity ?? l.quantity, unitPrice: l.unitPrice }))
      .filter((l) => l.quantity > 0));
    // If the pedido came with an advance voucher, carry it over as the payment voucher.
    const v = order.paymentGate?.advanceVoucher;
    if (v) this.voucher.set({ name: v.name, mimeType: 'image/jpeg', url: '/vouchers/comprobante_de_pago.jpeg', uploadedAt: v.uploadedAt });
  }

  protected onCorrectsChange(id: string): void {
    this.correctsInvoiceId.set(id);
    const src = this.salesInvoices().find((i) => i.id === id);
    if (!src) return;
    this.customerId.set(src.customerId ?? '');
    this.customerName.set(src.customerName);
    this.customerTaxId.set(src.customerTaxId ?? '');
    this.currency.set(src.currency);
    this.orderId.set(src.salesOrderId ?? '');
    this.lines.set(src.lines.map((l) => ({ description: l.description, salesProductId: '', quantity: l.quantity, unitPrice: l.unitPrice })));
  }

  // --- Líneas -----------------------------------------------------------------

  protected onLinePicked(i: number, p: SalesProduct): void {
    this.setLine(i, { description: formatSalesProductName(p), salesProductId: p.id, unitPrice: this.lines()[i].unitPrice || p.costBand.max });
  }
  protected onLineFreeText(i: number, text: string): void {
    this.setLine(i, { description: text, salesProductId: '' });
  }
  protected setLine(i: number, patch: Partial<DraftLine>): void {
    this.lines.update((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  protected addLine(): void {
    this.lines.update((rows) => [...rows, { ...NEW_LINE }]);
  }
  protected removeLine(i: number): void {
    this.lines.update((rows) => rows.filter((_, idx) => idx !== i));
  }

  // --- Cuotas ---------------------------------------------------------------

  protected distributeInstallments(): void {
    const n = this.effectiveInstallmentCount();
    const base = Math.floor((this.creditAmount() / n) * 100) / 100;
    this.installments.set(
      Array.from({ length: n }, (_, i) => ({
        dueDate: addDays(ISSUE_DATE, 30 * (i + 1)),
        amount: i === n - 1 ? Math.round((this.creditAmount() - base * (n - 1)) * 100) / 100 : base,
      })),
    );
  }
  protected setInstallment(i: number, patch: Partial<DraftInstallment>): void {
    this.installments.update((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  // --- Voucher -----------------------------------------------------------------

  protected onVoucherFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      this.voucher.set({ name: file.name, mimeType: file.type || 'application/octet-stream', url: reader.result as string, uploadedAt: ISSUE_DATE });
    reader.readAsDataURL(file);
  }
  protected clearVoucher(): void {
    this.voucher.set(null);
  }

  // --- Anticipos -----------------------------------------------------------

  protected addAdvance(): void {
    this.advanceSearch.set('');
  }

  /** Agrega un anticipo ya emitido, siempre que pertenezca al cliente/pedido actual y no esté repetido. */
  protected isAdvanceApplied(id: string): boolean {
    return this.advances().some((a) => a.sourceInvoiceId === id);
  }

  protected applyAdvance(invoice: SalesInvoice): void {
    if (!invoice.isAdvanceInvoice || this.advances().some((a) => a.sourceInvoiceId === invoice.id)) return;
    this.advances.update((rows) => [
      ...rows,
      {
        sourceInvoiceId: invoice.id,
        reference: invoice.number,
        docType: invoice.docKind === 'boleta' ? 'boleta' : 'factura',
        issuedAt: invoice.issuedAt,
        amount: invoice.total,
      },
    ]);
    this.advanceSearch.set('');
  }
  protected removeAdvance(i: number): void {
    this.advances.update((rows) => rows.filter((_, idx) => idx !== i));
  }
  private buildRelatedDocuments(): InvoiceRelatedDocument[] {
    const docs: InvoiceRelatedDocument[] = [];
    const guide = this.guideId() ? this.state.guides().find((g) => g.id === this.guideId()) : undefined;
    const order = this.orderId() ? this.orders().find((o) => o.id === this.orderId()) : undefined;
    if (order?.customerOrderDocumentNumber) docs.push({ id: `OC-${order.id}`, type: 'orden_compra', label: 'Orden de compra del cliente', number: order.customerOrderDocumentNumber, fileName: order.customerOrderDocument?.name });
    if (order?.quotationId) {
      const quotation = this.salesQuotations().find((q) => q.id === order.quotationId);
      docs.push({ id: `COT-${order.quotationId}`, type: 'cotizacion', label: 'Cotización', number: quotation?.number ?? order.quotationId });
    }
    if (order) docs.push({ id: `PED-${order.id}`, type: 'pedido', label: 'Pedido de venta', number: order.number });
    if (order?.workSheetId) docs.push({ id: `HT-${order.workSheetId}`, type: 'hoja_trabajo', label: 'Hoja de trabajo (HT)', number: order.workSheetId });
    if (guide) docs.push({ id: guide.id, type: 'guia', label: 'Guía de remisión', number: guide.number });
    if (order?.guaranteeLetter) docs.push({ id: `GAR-${order.id}`, type: 'garantia', label: 'Carta de garantía', fileName: order.guaranteeLetter.name });
    docs.push({ id: `RIN-${this.orderId() || '001'}`, type: 'rin', label: 'RIN / documento de almacén', fileName: 'RIN.pdf' });
    return docs;
  }

  // --- Emitir -----------------------------------------------------------------

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.submitPopover.set('closed');

    const installments = this.showInstallments()
      ? this.installments().map((c, i) => ({ number: i + 1, identifier: cuotaIdentifier(i + 1), dueDate: c.dueDate, amount: c.amount, paid: false }))
      : undefined;

    const src = this.isNote() ? this.salesInvoices().find((i) => i.id === this.correctsInvoiceId()) : undefined;
    const glosa = this.isNote() ? `${this.noteReason().trim()}${src ? ` (ref. ${src.number})` : ''}` : this.glosa().trim() || undefined;

    const advances =
      this.showAdvances() && this.advances().length > 0
        ? this.advances().map((a) => {
            const base = Math.round((a.amount / 1.18) * 100) / 100;
            return { invoiceNumber: a.reference.trim(), docType: a.docType, issuedAt: a.issuedAt, amount: a.amount, base, igv: Math.round((a.amount - base) * 100) / 100, reasonCode: '04' as const };
          })
        : undefined;
    const outstanding = this.isNote() ? 0 : advances ? this.netPayable() : this.total();

    const invoice = this.state.createFreeInvoice({
      status: 'issued',
      customerName: this.customerName().trim(),
      customerId: this.customerId() || undefined,
      customerTaxId: this.customerTaxId().trim() || undefined,
      billingEmail: this.billingEmail().trim() || undefined,
      rucValidationStatus: this.rucValidation(),
      rucValidatedAt: this.rucValidation() !== 'pending' ? ISSUE_DATE : undefined,
      salesOrderId: this.orderId() || undefined,
      quotationCode: src?.quotationCode,
      purchaseOrderRef: src?.purchaseOrderRef,
      issuedAt: ISSUE_DATE,
      dueDate: installments ? installments[installments.length - 1].dueDate : '2026-09-30',
      currency: this.currency(),
      lines: this.isAdvanceInvoice()
        ? []
        : this.lines().map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, subtotal: l.quantity * l.unitPrice })),
      subtotal: this.taxable(),
      taxAmount: this.igv(),
      total: this.total(),
      paidAmount: 0,
      outstandingBalance: outstanding,
      docKind: this.docKind(),
      glosa: this.isAdvanceInvoice() ? (glosa ?? 'Comprobante por anticipo') : glosa,
      correctsInvoiceId: this.correctsInvoiceId() || undefined,
      paymentCondition: this.isNote() ? undefined : this.paymentCondition(),
      earlyPaymentDiscountPct: this.earlyPaymentDiscountPct() || undefined,
      installments,
      advances,
      isAdvanceInvoice: this.isAdvanceInvoice() || undefined,
      paymentVoucher: this.voucher() ?? undefined,
      relatedDocuments: this.buildRelatedDocuments(),
      digitalFolderPath: `/expedientes/2026/${this.customerTaxId()}/${this.orderId() || 'sin-pedido'}/`,
      emailStatus: 'not_sent',
      sunatTotals: {
        gravado: this.taxable(), inafecto: 0, exonerado: 0, exportacion: 0,
        descuentos: this.discount(), gratuitos: 0, igv: this.igv(), isc: 0,
        anticipos: advances ? this.advancesTotal() : 0, importeTotal: this.total(),
      },
    });
    if (this.guideId()) this.state.linkInvoiceToGuide(this.guideId(), invoice.id);
    toast.success(`${COMPROBANTE_KIND_LABEL[this.docKind()]} ${invoice.number} emitida`, {
      description: advances ? `Neto a pagar tras anticipos: ${this.currency()} ${this.netPayable().toFixed(2)}` : this.isAdvanceInvoice() ? 'Comprobante por anticipo' : undefined,
    });
    this.router.navigate(['/apps/finance/invoices', invoice.id]);
  }

  protected cancel(): void {
    this.router.navigate(['/apps/finance/invoices']);
  }
}
