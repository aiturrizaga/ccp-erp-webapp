import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmCheckboxImports } from '@ui/checkbox';
import { HlmSelectImports } from '@ui/select';
import { HlmComboboxImports } from '@ui/combobox';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { SelectFilter, SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { toast } from '@shared/toast';
import { InventoryState } from '../../inventory-state';
import {
  CostCenterCode,
  COST_CENTER_LABEL,
  Currency,
  ItemCategory,
  ItemGroupCode,
  ITEM_GROUP_LABEL,
  OutboundStrategy,
  StockTypeCode,
  STOCK_TYPE_LABEL,
  UNIT_OF_MEASURE_LABEL,
} from '@core/models';

const NONE = '';

/** CCP doesn't use `category` operationally — derived silently from the stock type so the rest of the model (which still reads it) stays consistent. */
const CATEGORY_BY_STOCK_TYPE: Record<StockTypeCode, ItemCategory> = {
  '01': 'finished_good',
  '03': 'raw_material',
  '05': 'supply',
  '06': 'supply',
};

const STOCK_TYPE_OPTIONS: SelectFilterOption[] = (Object.entries(STOCK_TYPE_LABEL) as [StockTypeCode, string][]).map(([value, label]) => ({
  value,
  label,
}));

const ITEM_GROUP_OPTIONS: SelectFilterOption[] = (Object.entries(ITEM_GROUP_LABEL) as [ItemGroupCode, string][])
  .sort(([, a], [, b]) => a.localeCompare(b))
  .map(([value, label]) => ({ value, label }));

const COST_CENTER_OPTIONS: SelectFilterOption[] = (Object.entries(COST_CENTER_LABEL) as [CostCenterCode, string][])
  .sort(([, a], [, b]) => a.localeCompare(b))
  .map(([value, label]) => ({ value, label }));

/** Odoo groups its unit-of-measure picker by physical quantity (Unit/Weight/Volume/...). Same idea here, over only the codes CCP already uses — none added. */
interface UomGroup {
  label: string;
  codes: string[];
}

const UOM_GROUPS: UomGroup[] = [
  { label: 'Unidad', codes: ['UNI'] },
  { label: 'Peso', codes: ['KG', 'TN'] },
  { label: 'Volumen', codes: ['GAL', 'M3', 'LT', 'BR'] },
  { label: 'Longitud', codes: ['MT'] },
  { label: 'Superficie', codes: ['M2'] },
  { label: 'Empaque', codes: ['SET', 'BOL', 'BID', 'PAQ', 'CJ', 'ROL', 'MLL', 'PAR'] },
];

const CURRENCY_OPTIONS: SelectFilterOption[] = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
];

@Component({
  selector: 'app-item-create',
  imports: [
    FormsModule,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    ...HlmCheckboxImports,
    ...HlmSelectImports,
    ...HlmComboboxImports,
    EntityHeader,
    SelectFilter,
  ],
  templateUrl: './item-create.html',
})
export class ItemCreate {
  private readonly router = inject(Router);
  private readonly inventoryState = inject(InventoryState);

  protected readonly description = signal('');
  protected readonly stockType = signal<string>('03');
  protected readonly itemGroup = signal<string>(NONE);
  protected readonly costCenter = signal<string>(NONE);
  protected readonly unitOfMeasure = signal<string>('UNI');
  protected readonly tracksLot = signal(false);
  protected readonly tracksExpiration = signal(false);
  protected readonly active = signal(true);
  protected readonly currency = signal<string>('PEN');
  protected readonly standardCost = signal(0);
  protected readonly minStock = signal(0);
  protected readonly reorderPoint = signal(0);
  protected readonly maxStock = signal(0);

  protected readonly stockTypeOptions = STOCK_TYPE_OPTIONS;
  protected readonly itemGroupOptions = ITEM_GROUP_OPTIONS;
  protected readonly costCenterOptions = COST_CENTER_OPTIONS;
  protected readonly uomGroups = UOM_GROUPS.map((group) => ({
    label: group.label,
    options: group.codes.map((code) => ({ value: code, label: `${UNIT_OF_MEASURE_LABEL[code]} (${code})` })),
  }));
  protected readonly currencyOptions = CURRENCY_OPTIONS;

  protected readonly canSubmit = computed(() => this.description().trim().length > 0);

  protected itemGroupToString = (value: string): string => this.itemGroupOptions.find((o) => o.value === value)?.label ?? value;
  protected costCenterToString = (value: string): string => this.costCenterOptions.find((o) => o.value === value)?.label ?? value;
  protected stockTypeToString = (value: string): string => this.stockTypeOptions.find((o) => o.value === value)?.label ?? value;
  protected unitOfMeasureToString = (value: string): string =>
    this.uomGroups.flatMap((g) => g.options).find((o) => o.value === value)?.label ?? value;

  protected submit(): void {
    if (!this.canSubmit()) return;

    const cost = this.standardCost();
    const itemGroup = (this.itemGroup() || undefined) as ItemGroupCode | undefined;
    const costCenter = (this.costCenter() || undefined) as CostCenterCode | undefined;
    const stockType = this.stockType() as StockTypeCode;

    const item = this.inventoryState.addItem({
      description: this.description().trim().toUpperCase(),
      category: CATEGORY_BY_STOCK_TYPE[stockType],
      group: itemGroup ? ITEM_GROUP_LABEL[itemGroup] : '',
      stockType,
      itemGroup,
      costCenter,
      unitOfMeasure: this.unitOfMeasure(),
      tracksLot: this.tracksLot(),
      tracksExpiration: this.tracksExpiration(),
      outboundStrategy: this.inferOutboundStrategy(),
      minStock: this.minStock(),
      maxStock: this.maxStock(),
      reorderPoint: this.reorderPoint(),
      standardCost: cost,
      lastCost: cost,
      averageCost: cost,
      currency: this.currency() as Currency,
      suppliers: [],
      active: this.active(),
    });

    toast.success(`Artículo ${item.code} creado`, { description: item.description });
    this.router.navigate(['/apps/inventory/items', item.id]);
  }

  /** No manual picker for this — infer the sensible outbound rule from what the item already tracks. */
  private inferOutboundStrategy(): OutboundStrategy {
    if (this.tracksExpiration()) return 'FEFO';
    if (this.tracksLot()) return 'FIFO';
    return 'NONE';
  }

  protected cancel(): void {
    this.router.navigate(['/apps/inventory/items']);
  }
}
