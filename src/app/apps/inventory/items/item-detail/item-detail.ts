import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmTabsImports } from '@ui/tabs';
import { HlmCardImports } from '@ui/card';
import { HlmButtonImports } from '@ui/button';
import { HlmDialogImports } from '@ui/dialog';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmCheckboxImports } from '@ui/checkbox';
import { HlmComboboxImports } from '@ui/combobox';
import { HlmSelectImports } from '@ui/select';
import { toast } from '@shared/toast';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { SUPPLIERS, STOCK_LOTS, STOCK_LEDGER, WAREHOUSES } from '@core/mock-data';
import { InventoryState } from '../../inventory-state';
import {
  CostCenterCode,
  COST_CENTER_LABEL,
  Currency,
  ItemCategory,
  ITEM_CATEGORY_LABEL,
  ItemGroupCode,
  ITEM_GROUP_LABEL,
  STOCK_STATUS_LABEL,
  StockStatus,
  StockTypeCode,
  STOCK_TYPE_LABEL,
  Tone,
} from '@core/models';

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

const CURRENCY_OPTIONS: SelectFilterOption[] = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
];

@Component({
  selector: 'app-item-detail',
  imports: [
    FormsModule,
    ...HlmTabsImports,
    ...HlmCardImports,
    ...HlmButtonImports,
    ...HlmDialogImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    ...HlmCheckboxImports,
    ...HlmComboboxImports,
    ...HlmSelectImports,
    EntityHeader,
    StatusBadge,
    EmptyState,
  ],
  templateUrl: './item-detail.html',
})
export class ItemDetail {
  private readonly inventoryState = inject(InventoryState);

  readonly id = input.required<string>();

  protected readonly item = computed(() => this.inventoryState.items().find((i) => i.id === this.id()));
  protected readonly lots = computed(() => STOCK_LOTS.filter((l) => l.itemId === this.id()));
  protected readonly ledger = computed(() => STOCK_LEDGER.filter((m) => m.itemId === this.id()));

  protected readonly currencyOptions = CURRENCY_OPTIONS;

  protected readonly availableSupplierOptions = computed<SelectFilterOption[]>(() => {
    const linkedIds = new Set(this.item()?.suppliers.map((s) => s.supplierId));
    return SUPPLIERS.filter((s) => !linkedIds.has(s.id)).map((s) => ({ value: s.id, label: s.legalName }));
  });

  protected readonly newSupplierId = signal('');
  protected readonly newPrice = signal(0);
  protected readonly newCurrency = signal<string>('PEN');
  protected readonly newLeadTimeDays = signal(1);
  protected readonly newIsPrimary = signal(false);

  protected supplierPickerToString = (value: string): string => this.availableSupplierOptions().find((o) => o.value === value)?.label ?? value;
  protected currencyToString = (value: string): string => this.currencyOptions.find((o) => o.value === value)?.label ?? value;

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

  protected stockTypeLabel(stockType: StockTypeCode): string {
    return STOCK_TYPE_LABEL[stockType];
  }

  protected itemGroupLabel(itemGroup: ItemGroupCode | undefined): string {
    return itemGroup ? ITEM_GROUP_LABEL[itemGroup] : '—';
  }

  protected costCenterLabel(costCenter: CostCenterCode | undefined): string {
    return costCenter ? COST_CENTER_LABEL[costCenter] : '—';
  }

  protected stockStatusLabel(status: StockStatus): string {
    return STOCK_STATUS_LABEL[status];
  }

  protected stockStatusTone(status: StockStatus): Tone {
    return STOCK_STATUS_TONE[status];
  }

  protected openAddSupplierDraft(): void {
    this.newSupplierId.set('');
    this.newPrice.set(0);
    this.newCurrency.set('PEN');
    this.newLeadTimeDays.set(1);
    this.newIsPrimary.set(false);
  }

  protected canAddSupplier(): boolean {
    return this.newSupplierId().length > 0 && this.newPrice() > 0;
  }

  protected confirmAddSupplier(): void {
    const itemId = this.id();
    const supplierId = this.newSupplierId();
    if (!itemId || !supplierId || this.newPrice() <= 0) return;

    this.inventoryState.addSupplierLink(itemId, {
      supplierId,
      price: this.newPrice(),
      currency: this.newCurrency() as Currency,
      leadTimeDays: this.newLeadTimeDays(),
      isPrimary: this.newIsPrimary(),
    });
    toast.success(`${this.supplierName(supplierId)} agregado como proveedor`);
  }
}
