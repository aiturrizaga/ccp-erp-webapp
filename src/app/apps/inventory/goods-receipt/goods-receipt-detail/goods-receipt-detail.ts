import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { GOODS_RECEIPTS, PURCHASE_ORDERS, SUPPLIERS, ITEMS, WAREHOUSES } from '@core/mock-data';
import { GoodsReceiptStatus, GOODS_RECEIPT_STATUS_LABEL, InspectionResult, Tone } from '@core/models';

const STATUS_TONE: Record<GoodsReceiptStatus, Tone> = {
  scheduled: 'neutral',
  in_progress: 'info',
  partial: 'warning',
  received: 'success',
  with_discrepancies: 'danger',
  in_claim: 'danger',
  closed: 'success',
};

const INSPECTION_LABEL: Record<InspectionResult, string> = {
  compliant: 'Conforme',
  observed: 'Observado',
  rejected: 'Rechazado',
};

const INSPECTION_TONE: Record<InspectionResult, Tone> = {
  compliant: 'success',
  observed: 'warning',
  rejected: 'danger',
};

/** Designed mobile-first: warehouse staff confirm receipt, photos and signatures from a phone at the loading dock. */
@Component({
  selector: 'app-goods-receipt-detail',
  imports: [RouterLink, NgIcon, ...HlmButtonImports, ...HlmCardImports, EntityHeader, StatusBadge, EmptyState],
  templateUrl: './goods-receipt-detail.html',
})
export class GoodsReceiptDetail {
  readonly id = input.required<string>();

  protected readonly receipt = computed(() => GOODS_RECEIPTS.find((r) => r.id === this.id()));
  protected readonly purchaseOrder = computed(() => PURCHASE_ORDERS.find((po) => po.id === this.receipt()?.purchaseOrderId));

  protected supplierName(supplierId: string): string {
    return SUPPLIERS.find((s) => s.id === supplierId)?.legalName ?? supplierId;
  }

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected locationName(locationId: string): string {
    for (const wh of WAREHOUSES) {
      const loc = wh.locations.find((l) => l.id === locationId);
      if (loc) return loc.name;
    }
    return locationId;
  }

  protected statusLabel(status: GoodsReceiptStatus): string {
    return GOODS_RECEIPT_STATUS_LABEL[status];
  }

  protected statusTone(status: GoodsReceiptStatus): Tone {
    return STATUS_TONE[status];
  }

  protected inspectionLabel(result: InspectionResult): string {
    return INSPECTION_LABEL[result];
  }

  protected inspectionTone(result: InspectionResult): Tone {
    return INSPECTION_TONE[result];
  }
}
