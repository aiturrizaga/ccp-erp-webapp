import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmPopoverImports } from '@ui/popover';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { toast } from '@shared/toast';
import { salesQuotations } from '../../sales-state';
import { SalesQuotationStatus, SALES_QUOTATION_STATUS_LABEL, SALES_QUOTATION_STATUS_TONE, Tone } from '@core/models';
import { createSalesOrderFromQuotation } from '../../sales-state';

@Component({
  selector: 'app-quotation-detail',
  imports: [DecimalPipe, ...HlmButtonImports, ...HlmCardImports, ...HlmPopoverImports, EntityHeader, EmptyState],
  templateUrl: './quotation-detail.html',
})
export class QuotationDetail {
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly quotation = computed(() => salesQuotations().find((q) => q.id === this.id()));

  protected readonly canConfirmSale = computed(() => {
    const status = this.quotation()?.status;
    return status === 'sent' || status === 'accepted';
  });

  protected statusLabel(status: SalesQuotationStatus): string {
    return SALES_QUOTATION_STATUS_LABEL[status];
  }

  protected statusTone(status: SalesQuotationStatus): Tone {
    return SALES_QUOTATION_STATUS_TONE[status];
  }

  protected readonly confirmSalePopover = signal<'open' | 'closed'>('closed');

  protected confirmSale(): void {
    const quotation = this.quotation();
    if (!quotation) return;
    this.confirmSalePopover.set('closed');
    const order = createSalesOrderFromQuotation({
      id: quotation.id,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      currency: quotation.currency,
      total: quotation.total,
      lines: quotation.lines,
    });
    toast.success(`Pedido ${order.number} creado`, { description: quotation.customerName });
    this.router.navigate(['/apps/sales/orders', order.id]);
  }
}
