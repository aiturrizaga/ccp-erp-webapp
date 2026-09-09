import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmDialogImports } from '@ui/dialog';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { SUPPLIERS } from '@core/mock-data';
import { salesOrders, salesQuotations } from '@apps/sales/sales-state';
import {
  COMPROBANTE_KIND_LABEL,
  Invoice,
  InvoiceStatus,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  PAYMENT_CONDITION_LABEL,
  PAYMENT_RECORD_STATUS_LABEL,
  PAYMENT_RECORD_STATUS_TONE,
  PaymentMethod,
  PAYMENT_METHOD_LABEL,
  PaymentRecordStatus,
  PaymentVoucher,
  SalesInvoice,
  Tone,
} from '@core/models';
import { toast } from '@shared/toast';
import { InvoicingState } from '../../invoicing-state';

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = (Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((value) => ({
  value,
  label: PAYMENT_METHOD_LABEL[value],
}));

@Component({
  selector: 'app-invoice-detail',
  imports: [
    RouterLink,
    DecimalPipe,
    FormsModule,
    NgIcon,
    BrnDialogContent,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmInputImports,
    ...HlmDialogImports,
    EntityHeader,
    EmptyState,
  ],
  templateUrl: './invoice-detail.html',
})
export class InvoiceDetail {
  private readonly state = inject(InvoicingState);

  readonly id = input.required<string>();

  protected readonly invoice = computed(() => this.state.invoices().find((i) => i.id === this.id()));
  protected readonly voucherZoom = signal(false);

  protected readonly paymentMethodOptions = PAYMENT_METHOD_OPTIONS;
  protected kindLabel = (k?: string) => (k ? COMPROBANTE_KIND_LABEL[k as keyof typeof COMPROBANTE_KIND_LABEL] ?? k : '—');
  protected conditionLabel = (c?: string) => (c ? PAYMENT_CONDITION_LABEL[c as keyof typeof PAYMENT_CONDITION_LABEL] ?? c : '—');
  protected paymentStatusLabel = (s: PaymentRecordStatus) => PAYMENT_RECORD_STATUS_LABEL[s];
  protected paymentStatusTone = (s: PaymentRecordStatus): Tone => PAYMENT_RECORD_STATUS_TONE[s];

  protected readonly paymentAmount = signal(0);
  protected readonly paymentDate = signal('2026-09-01');
  protected readonly paymentMethod = signal<PaymentMethod>('transfer');
  protected readonly paymentVoucher = signal<PaymentVoucher | null>(null);
  protected readonly emailTo = signal('');

  protected readonly payments = computed(() => {
    const inv = this.invoice();
    return inv && inv.documentType === 'sales' ? (inv as SalesInvoice).payments ?? [] : [];
  });
  protected readonly hasPendingPayment = computed(() => this.payments().some((p) => p.status === 'pending_validation'));

  protected readonly salesInvoice = computed(() => {
    const inv = this.invoice();
    return inv && inv.documentType === 'sales' ? (inv as SalesInvoice) : null;
  });
  protected readonly advances = computed(() => this.salesInvoice()?.advances ?? []);
  protected readonly advancesTotal = computed(() => this.advances().reduce((s, a) => s + (a.amount || 0), 0));
  protected readonly relatedDocuments = computed(() => this.salesInvoice()?.relatedDocuments ?? []);

  protected openEmailDialog(invoice: SalesInvoice): void {
    this.emailTo.set(invoice.billingEmail ?? '');
  }

  protected sendExpedient(invoice: SalesInvoice): void {
    const to = this.emailTo().trim();
    if (!to) return;
    this.state.sendInvoiceExpedient(invoice.id, to);
    toast.success('Expediente enviado', { description: `Factura ${invoice.number} y documentos asociados enviados a ${to}` });
  }


  protected downloadUrl(invoice: SalesInvoice, kind: 'pdf' | 'xml' | 'cdr'): string {
    const existing = kind === 'pdf' ? invoice.pdfUrl : kind === 'xml' ? invoice.xmlUrl : invoice.cdrUrl;
    if (existing) return existing;
    if (kind === 'pdf') {
      const pdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF';
      return 'data:application/pdf;base64,' + btoa(pdf);
    }
    const xml = kind === 'xml'
      ? `<?xml version="1.0" encoding="UTF-8"?><Invoice><ID>${invoice.number}</ID><Customer>${invoice.customerName}</Customer><Total currencyID="${invoice.currency}">${invoice.total.toFixed(2)}</Total></Invoice>`
      : `<?xml version="1.0" encoding="UTF-8"?><ApplicationResponse><ID>${invoice.number}</ID><ResponseCode>0</ResponseCode><Description>La factura ha sido aceptada</Description></ApplicationResponse>`;
    return 'data:application/xml;charset=utf-8,' + encodeURIComponent(xml);
  }

  protected downloadName(invoice: SalesInvoice, kind: 'pdf' | 'xml' | 'cdr'): string {
    return kind === 'pdf' ? `${invoice.number}.pdf` : kind === 'xml' ? `${invoice.number}.xml` : `R-${invoice.customerTaxId ?? '20549546626'}-${invoice.number}.xml`;
  }


  protected documentRoute(invoice: SalesInvoice, type: string): string[] | null {
    switch (type) {
      case 'pedido':
        return invoice.salesOrderId ? ['/apps/sales/orders', invoice.salesOrderId] : null;
      case 'cotizacion': {
        const order = invoice.salesOrderId ? salesOrders().find((o) => o.id === invoice.salesOrderId) : null;
        const quotationId = order?.quotationId ?? salesQuotations().find((q) => q.number === invoice.quotationCode)?.id;
        return quotationId ? ['/apps/sales/quotations', quotationId] : null;
      }
      case 'hoja_trabajo': {
        const order = invoice.salesOrderId ? salesOrders().find((o) => o.id === invoice.salesOrderId) : null;
        return order?.workSheetId ? ['/apps/production/work-sheets', order.workSheetId] : null;
      }
      case 'guia':
        return invoice.dispatchGuideId ? ['/apps/finance/guides'] : null;
      default:
        return null;
    }
  }

  protected supplierName(supplierId: string): string {
    return SUPPLIERS.find((s) => s.id === supplierId)?.legalName ?? supplierId;
  }

  protected statusLabel(status: InvoiceStatus): string {
    return INVOICE_STATUS_LABEL[status];
  }

  protected statusTone(status: InvoiceStatus): Tone {
    return INVOICE_STATUS_TONE[status];
  }

  protected canRegisterPayment(invoice: Invoice): boolean {
    return (
      invoice.documentType === 'sales' &&
      invoice.outstandingBalance > 0 &&
      invoice.status !== 'draft' &&
      invoice.status !== 'voided' &&
      !this.hasPendingPayment()
    );
  }

  protected openPaymentDialog(invoice: Invoice): void {
    this.paymentAmount.set(invoice.outstandingBalance);
    this.paymentDate.set('2026-09-01');
    this.paymentMethod.set('transfer');
    this.paymentVoucher.set(null);
  }

  protected onVoucherFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      this.paymentVoucher.set({ name: file.name, mimeType: file.type || 'application/octet-stream', url: reader.result as string, uploadedAt: '2026-09-01' });
    reader.readAsDataURL(file);
  }

  protected readonly canConfirmPayment = computed(() => this.paymentAmount() > 0 && !!this.paymentVoucher());

  protected confirmPayment(invoiceId: string): void {
    const amount = this.paymentAmount();
    const voucher = this.paymentVoucher();
    if (amount <= 0 || !voucher) return;
    this.state.registerPayment(invoiceId, {
      amount,
      date: this.paymentDate(),
      method: this.paymentMethod(),
      voucher: { ...voucher, amount },
      registeredBy: 'Facturación',
    });
    toast.success('Pago reportado', { description: 'Queda en validación de pago por Cobranzas' });
  }
}
