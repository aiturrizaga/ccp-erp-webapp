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
