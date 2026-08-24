import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { PURCHASE_REQUISITIONS, SUPPLIERS } from '@core/mock-data';
import { Quotation } from '@core/models';
import { PurchasingState } from '../../purchasing-state';

interface SupplierSummary {
  supplierId: string;
  supplierName: string;
  totalPrice: number;
  currency: string;
  maxDeliveryDays: number;
  paymentTerms: string;
  linesQuoted: number;
  totalLines: number;
}

interface QuotationSummary {
  quotation: Quotation;
  suppliers: SupplierSummary[];
  bestPriceSupplierId: string | null;
  bestDeliverySupplierId: string | null;
}

@Component({
  selector: 'app-quotation-comparison',
  imports: [RouterLink, DecimalPipe, ...HlmButtonImports, ...HlmCardImports, EntityHeader, EmptyState],
  templateUrl: './quotation-comparison.html',
})
export class QuotationComparison {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);

  readonly requisitionId = input.required<string>();

  protected readonly requisition = computed(() => PURCHASE_REQUISITIONS.find((r) => r.id === this.requisitionId()));

  protected readonly quotationSummaries = computed<QuotationSummary[]>(() => {
    const quotations = this.purchasingState.quotations().filter((q) => q.requisitionId === this.requisitionId());
    return quotations.map((quotation) => this.summarize(quotation));
  });

  private summarize(quotation: Quotation): QuotationSummary {
    const bySupplier = new Map<string, SupplierSummary>();

    for (const line of quotation.lines) {
      for (const offer of line.offers) {
        const existing = bySupplier.get(offer.supplierId);
        const lineTotal = offer.unitPrice * line.quantity;
        if (existing) {
          existing.totalPrice += lineTotal;
          existing.maxDeliveryDays = Math.max(existing.maxDeliveryDays, offer.deliveryDays);
          existing.linesQuoted += 1;
        } else {
          bySupplier.set(offer.supplierId, {
            supplierId: offer.supplierId,
            supplierName: this.supplierName(offer.supplierId),
            totalPrice: lineTotal,
            currency: offer.currency,
            maxDeliveryDays: offer.deliveryDays,
            paymentTerms: offer.paymentTerms,
            linesQuoted: 1,
            totalLines: quotation.lines.length,
          });
        }
      }
    }

    const suppliers = Array.from(bySupplier.values()).map((s) => ({ ...s, totalLines: quotation.lines.length }));

    const bestPriceSupplierId = suppliers.length
      ? suppliers.reduce((best, s) => (s.totalPrice < best.totalPrice ? s : best)).supplierId
      : null;
    const bestDeliverySupplierId = suppliers.length
      ? suppliers.reduce((best, s) => (s.maxDeliveryDays < best.maxDeliveryDays ? s : best)).supplierId
      : null;

    return { quotation, suppliers, bestPriceSupplierId, bestDeliverySupplierId };
  }

  protected supplierName(supplierId: string): string {
    return SUPPLIERS.find((s) => s.id === supplierId)?.legalName ?? supplierId;
  }

  protected award(quotation: Quotation, supplierId: string): void {
    const order = this.purchasingState.awardQuotationToSupplier(quotation, supplierId);
    this.router.navigate(['/apps/purchasing/purchase-orders', order.id]);
  }
}
