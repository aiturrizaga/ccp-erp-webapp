import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrnDialogContent } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmDialogImports } from '@ui/dialog';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { SUPPLIERS } from '@core/mock-data';
import { Invoice, InvoiceStatus, INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, PaymentMethod, PAYMENT_METHOD_LABEL, Tone } from '@core/models';
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

  protected readonly paymentMethodOptions = PAYMENT_METHOD_OPTIONS;

  protected readonly paymentAmount = signal(0);
  protected readonly paymentDate = signal('2026-08-23');
  protected readonly paymentMethod = signal<PaymentMethod>('transfer');

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
    return invoice.outstandingBalance > 0 && invoice.status !== 'draft' && invoice.status !== 'voided';
  }

  protected openPaymentDialog(invoice: Invoice): void {
    this.paymentAmount.set(invoice.outstandingBalance);
    this.paymentDate.set('2026-08-23');
    this.paymentMethod.set('transfer');
  }

  protected confirmPayment(invoiceId: string): void {
    const amount = this.paymentAmount();
    if (amount <= 0) return;
    this.state.registerPayment(invoiceId, {
      amount,
      date: this.paymentDate(),
      method: this.paymentMethod(),
    });
    toast.success('Pago registrado', { description: `${PAYMENT_METHOD_LABEL[this.paymentMethod()]} · ${amount.toFixed(2)}` });
  }
}
