import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmAlertDialogImports } from '@ui/alert-dialog';
import { toast } from '@shared/toast';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { PURCHASE_REQUISITIONS, ITEMS, SUPPLIERS } from '@core/mock-data';
import { Quotation } from '@core/models';
import { PurchasingState } from '../../purchasing-state';
import { WarehouseOpsState } from '../../../inventory/warehouse-ops-state';

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
  imports: [RouterLink, DecimalPipe, ...HlmButtonImports, ...HlmCardImports, ...HlmAlertDialogImports, EntityHeader, EmptyState],
  templateUrl: './quotation-comparison.html',
})
export class QuotationComparison {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);
  private readonly warehouseOpsState = inject(WarehouseOpsState);

  readonly requisitionId = input.required<string>();

  protected readonly requisition = computed(() => PURCHASE_REQUISITIONS.find((r) => r.id === this.requisitionId()));

  protected readonly quotationSummaries = computed<QuotationSummary[]>(() => {
    const quotations = this.purchasingState.quotations().filter((q) => q.requisitionId === this.requisitionId());
    return quotations.map((quotation) => this.summarize(quotation));
  });

  /** Winner picked per item, keyed `${quotationId}:${itemId}` — lets two different suppliers win different items in the same RFQ. */
  private readonly selectedWinners = signal<Record<string, string>>({});

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

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected supplierName(supplierId: string): string {
    return SUPPLIERS.find((s) => s.id === supplierId)?.legalName ?? supplierId;
  }

  private winnerKey(quotationId: string, itemId: string): string {
    return `${quotationId}:${itemId}`;
  }

  protected winnerFor(quotationId: string, itemId: string): string | undefined {
    return this.selectedWinners()[this.winnerKey(quotationId, itemId)];
  }

  protected selectWinner(quotationId: string, itemId: string, supplierId: string): void {
    this.selectedWinners.update((w) => ({ ...w, [this.winnerKey(quotationId, itemId)]: supplierId }));
  }

  /** Shortcut for the common case: this one supplier wins every item it quoted in the RFQ. */
  protected pickSupplierForAllQuotedLines(quotation: Quotation, supplierId: string): void {
    for (const line of quotation.lines) {
      if (line.offers.some((o) => o.supplierId === supplierId)) {
        this.selectWinner(quotation.id, line.itemId, supplierId);
      }
    }
  }

  protected hasAnyWinnerSelected(quotation: Quotation): boolean {
    return quotation.lines.some((line) => this.winnerFor(quotation.id, line.itemId));
  }

  /** Distinct winning supplier names for this quotation's current selection — used in the confirm dialog. */
  protected winningSupplierNames(quotation: Quotation): string {
    const ids = new Set<string>();
    for (const line of quotation.lines) {
      const supplierId = this.winnerFor(quotation.id, line.itemId);
      if (supplierId) ids.add(supplierId);
    }
    return Array.from(ids)
      .map((id) => this.supplierName(id))
      .join(', ');
  }

  protected award(quotation: Quotation): void {
    const winners: Record<string, string> = {};
    for (const line of quotation.lines) {
      const supplierId = this.winnerFor(quotation.id, line.itemId);
      if (supplierId) winners[line.itemId] = supplierId;
    }
    const orders = this.purchasingState.awardQuotationMixed(quotation, winners);
    for (const order of orders) {
      this.warehouseOpsState.scheduleReceiptForPurchaseOrder(order);
    }

    toast.success(
      orders.length === 1 ? `Se generó la orden de compra ${orders[0].number}` : `Se generaron ${orders.length} órdenes de compra`,
      { description: 'Almacén ya puede ver la recepción programada en su agenda.' },
    );

    if (orders.length === 1) {
      this.router.navigate(['/apps/purchasing/purchase-orders', orders[0].id]);
    } else {
      this.router.navigate(['/apps/purchasing/purchase-orders']);
    }
  }
}
