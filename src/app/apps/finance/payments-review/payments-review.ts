import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmPopoverImports } from '@ui/popover';
import { NgIcon } from '@ng-icons/core';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { toast } from '@shared/toast';
import { PAYMENT_METHOD_LABEL, PaymentMethod } from '@core/models';
import { InvoicingState, PendingPayment } from '@apps/finance/invoicing-state';

@Component({
  selector: 'app-payments-review',
  imports: [DecimalPipe, FormsModule, RouterLink, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmPopoverImports, EntityHeader],
  templateUrl: './payments-review.html',
})
export class PaymentsReview {
  private readonly state = inject(InvoicingState);

  protected readonly rows = computed(() => this.state.pendingPayments());
  protected readonly zoom = signal<string | null>(null);
  protected readonly openPopover = signal<string | null>(null);
  protected readonly rejectComment = signal('');

  protected methodLabel = (m: PaymentMethod) => PAYMENT_METHOD_LABEL[m];

  protected validate(row: PendingPayment): void {
    this.openPopover.set(null);
    if (row.source === 'invoice') {
      this.state.validatePayment(row.invoiceId, row.payment.id);
      toast.success(`Pago de ${row.invoiceNumber} validado`, { description: 'Aplicado al saldo de la factura' });
      return;
    }
    this.state.validateOrderAdvancePayment(row.orderId);
    toast.success(`Adelanto de ${row.orderNumber} validado`, { description: 'Ventas ya puede continuar el flujo y crear la HT.' });
  }

  protected reject(row: PendingPayment): void {
    const comment = this.rejectComment().trim();
    if (!comment) return;
    this.openPopover.set(null);
    if (row.source === 'invoice') {
      this.state.rejectPayment(row.invoiceId, row.payment.id, comment);
      toast.info(`Pago de ${row.invoiceNumber} rechazado`);
    } else {
      this.state.rejectOrderAdvancePayment(row.orderId, comment);
      toast.info(`Adelanto de ${row.orderNumber} observado`, { description: 'Ventas puede corregir el voucher y volver a enviarlo.' });
    }
    this.rejectComment.set('');
  }
}
