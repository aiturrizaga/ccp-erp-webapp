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
import { InvoicingState } from '@apps/invoicing/invoicing-state';

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

  protected validate(invoiceId: string, paymentId: string, invoiceNumber: string): void {
    this.openPopover.set(null);
    this.state.validatePayment(invoiceId, paymentId);
    toast.success(`Pago de ${invoiceNumber} validado`, { description: 'Aplicado al saldo de la factura' });
  }

  protected reject(invoiceId: string, paymentId: string, invoiceNumber: string): void {
    const comment = this.rejectComment().trim();
    if (!comment) return;
    this.openPopover.set(null);
    this.state.rejectPayment(invoiceId, paymentId, comment);
    this.rejectComment.set('');
    toast.info(`Pago de ${invoiceNumber} rechazado`);
  }
}
