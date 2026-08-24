import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { salesQuotations } from '../../sales-state';
import { SalesQuotationStatus, SALES_QUOTATION_STATUS_LABEL, SALES_QUOTATION_STATUS_TONE, Tone } from '@core/models';
import { createSalesOrderFromQuotation } from '../../sales-state';

@Component({
  selector: 'app-quotation-detail',
  imports: [DecimalPipe, ...HlmButtonImports, ...HlmCardImports, EntityHeader, EmptyState],
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

  protected confirmSale(): void {
    const quotation = this.quotation();
    if (!quotation) return;
    const order = createSalesOrderFromQuotation({
      id: quotation.id,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      currency: quotation.currency,
      total: quotation.total,
      lines: quotation.lines,
    });
    this.router.navigate(['/apps/sales/orders', order.id]);
  }
}
