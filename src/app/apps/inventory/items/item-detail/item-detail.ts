import { Component, computed, input } from '@angular/core';
import { HlmTabsImports } from '@ui/tabs';
import { HlmCardImports } from '@ui/card';
import { HlmButtonImports } from '@ui/button';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ITEMS, SUPPLIERS, STOCK_LOTS, STOCK_LEDGER, WAREHOUSES } from '@core/mock-data';
import { ItemCategory, ITEM_CATEGORY_LABEL, STOCK_STATUS_LABEL, StockStatus, Tone } from '@core/models';

const CATEGORY_TONE: Record<ItemCategory, Tone> = {
  raw_material: 'info',
  supply: 'neutral',
  work_in_process: 'warning',
  finished_good: 'success',
};

const STOCK_STATUS_TONE: Record<StockStatus, Tone> = {
  available: 'success',
  reserved: 'info',
  in_transit: 'info',
  quarantine: 'warning',
  claimed: 'danger',
  blocked: 'danger',
};

@Component({
  selector: 'app-item-detail',
  imports: [...HlmTabsImports, ...HlmCardImports, ...HlmButtonImports, EntityHeader, StatusBadge, EmptyState],
  templateUrl: './item-detail.html',
})
export class ItemDetail {
  readonly id = input.required<string>();

  protected readonly item = computed(() => ITEMS.find((i) => i.id === this.id()));
  protected readonly lots = computed(() => STOCK_LOTS.filter((l) => l.itemId === this.id()));
  protected readonly ledger = computed(() => STOCK_LEDGER.filter((m) => m.itemId === this.id()));

  protected supplierName(supplierId: string): string {
    return SUPPLIERS.find((s) => s.id === supplierId)?.legalName ?? supplierId;
  }

  protected locationName(locationId: string): string {
    for (const wh of WAREHOUSES) {
      const loc = wh.locations.find((l) => l.id === locationId);
      if (loc) return loc.name;
    }
    return locationId;
  }

  protected categoryLabel(category: ItemCategory): string {
    return ITEM_CATEGORY_LABEL[category];
  }

  protected categoryTone(category: ItemCategory): Tone {
    return CATEGORY_TONE[category];
  }

  protected stockStatusLabel(status: StockStatus): string {
    return STOCK_STATUS_LABEL[status];
  }

  protected stockStatusTone(status: StockStatus): Tone {
    return STOCK_STATUS_TONE[status];
  }
}
