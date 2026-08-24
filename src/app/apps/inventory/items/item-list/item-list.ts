import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCheckboxImports } from '@ui/checkbox';
import { HlmAccordionImports } from '@ui/accordion';
import { HlmTooltipImports } from '@ui/tooltip';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { DataGrid } from '@shared/components/data-grid/data-grid';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { ListPagination } from '@shared/components/list-pagination/list-pagination';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { ListViewOption, LIST_VIEW_OPTIONS } from '@shared/models/list-view.model';
import { STOCK_LEDGER } from '@core/mock-data';
import { InventoryState } from '../../inventory-state';
import {
  CostCenterCode,
  COST_CENTER_LABEL,
  Item,
  ItemCategory,
  ITEM_CATEGORY_LABEL,
  ItemGroupCode,
  ITEM_GROUP_LABEL,
  StockTypeCode,
  STOCK_TYPE_LABEL,
  Tone,
  UNIT_OF_MEASURE_LABEL,
} from '@core/models';

const CATEGORY_TONE: Record<ItemCategory, Tone> = {
  raw_material: 'info',
  supply: 'neutral',
  work_in_process: 'warning',
  finished_good: 'success',
};

const STOCK_TYPE_TONE: Record<StockTypeCode, Tone> = {
  '01': 'neutral',
  '03': 'info',
  '05': 'neutral',
  '06': 'warning',
};

const ACTIVE_TONE: Record<'active' | 'inactive', Tone> = {
  active: 'success',
  inactive: 'neutral',
};

const ACTIVE_OPTIONS: { value: boolean; label: string }[] = [
  { value: true, label: 'Activo' },
  { value: false, label: 'Inactivo' },
];

const STOCK_TYPE_OPTIONS: { value: StockTypeCode; label: string }[] = (
  Object.entries(STOCK_TYPE_LABEL) as [StockTypeCode, string][]
).map(([value, label]) => ({ value, label }));

const ITEM_GROUP_OPTIONS: { value: ItemGroupCode; label: string }[] = (
  Object.entries(ITEM_GROUP_LABEL) as [ItemGroupCode, string][]
).sort(([, a], [, b]) => a.localeCompare(b)).map(([value, label]) => ({ value, label }));

const COST_CENTER_OPTIONS: { value: CostCenterCode; label: string }[] = (
  Object.entries(COST_CENTER_LABEL) as [CostCenterCode, string][]
).sort(([, a], [, b]) => a.localeCompare(b)).map(([value, label]) => ({ value, label }));

const MONTH_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Fixed "today" reference, consistent with the rest of the prototype's demo data. */
const TODAY = new Date(2026, 7, 24);

interface StatsMonth {
  year: number;
  month: number;
  label: string;
}

/** The 3 calendar months ending at the current one, oldest first (matches the "Estadísticas" columns). */
const STATS_MONTHS: StatsMonth[] = Array.from({ length: 3 }, (_, i) => {
  const offset = 2 - i;
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - offset, 1);
  return { year: d.getFullYear(), month: d.getMonth(), label: MONTH_ABBR[d.getMonth()] };
});

interface MonthStats {
  inbound: number;
  outbound: number;
  stock: number;
}

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'category', label: 'Categoría' },
  { value: 'stockType', label: 'Tipo de existencia' },
  { value: 'itemGroup', label: 'Grupo' },
];

@Component({
  selector: 'app-item-list',
  imports: [
    NgIcon,
    NgTemplateOutlet,
    ...HlmButtonImports,
    ...HlmCheckboxImports,
    ...HlmAccordionImports,
    ...HlmTooltipImports,
    DataTable,
    DataGrid,
    ListToolbar,
    ListPagination,
    StatusBadge,
  ],
  templateUrl: './item-list.html',
})
export class ItemList {
  private readonly router = inject(Router);
  private readonly inventoryState = inject(InventoryState);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly activeFilter = signal<Set<boolean>>(new Set());
  protected readonly stockTypeFilter = signal<Set<StockTypeCode>>(new Set());
  protected readonly itemGroupFilter = signal<Set<ItemGroupCode>>(new Set());
  protected readonly costCenterFilter = signal<Set<CostCenterCode>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly activeOptions = ACTIVE_OPTIONS;
  protected readonly stockTypeOptions = STOCK_TYPE_OPTIONS;
  protected readonly itemGroupOptions = ITEM_GROUP_OPTIONS;
  protected readonly costCenterOptions = COST_CENTER_OPTIONS;

  protected readonly columns: DataTableColumn[] = [
    { key: 'code', header: 'Código', width: '110px' },
    { key: 'description', header: 'Descripción', width: '300px' },
    { key: 'stockType', header: 'Tipo Existencia', width: '150px' },
    { key: 'itemGroup', header: 'Grupo', width: '210px' },
    { key: 'unitOfMeasure', header: 'U.M.', width: '70px' },
    { key: 'averageCost', header: 'Costo promedio', align: 'end', width: '130px' },
    { key: 'statsM0', header: STATS_MONTHS[0].label, groupLabel: 'Estadísticas', width: '140px' },
    { key: 'statsM1', header: STATS_MONTHS[1].label, groupLabel: 'Estadísticas', width: '140px' },
    { key: 'statsM2', header: STATS_MONTHS[2].label, groupLabel: 'Estadísticas', width: '140px' },
    { key: 'active', header: 'Estado', width: '110px' },
  ];

  protected readonly statsColumnMonth: Record<string, number> = { statsM0: 0, statsM1: 1, statsM2: 2 };

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const actives = this.activeFilter();
    const stockTypes = this.stockTypeFilter();
    const itemGroups = this.itemGroupFilter();
    const costCenters = this.costCenterFilter();
    return this.inventoryState.items().filter((i) => {
      const matchesSearch = !term || i.code.toLowerCase().includes(term) || i.description.toLowerCase().includes(term);
      const matchesActive = actives.size === 0 || actives.has(i.active);
      const matchesStockType = stockTypes.size === 0 || stockTypes.has(i.stockType);
      const matchesItemGroup = itemGroups.size === 0 || (i.itemGroup !== undefined && itemGroups.has(i.itemGroup));
      const matchesCostCenter = costCenters.size === 0 || (i.costCenter !== undefined && costCenters.has(i.costCenter));
      return matchesSearch && matchesActive && matchesStockType && matchesItemGroup && matchesCostCenter;
    }).reverse();
  });

  protected readonly filterCount = computed(
    () => this.activeFilter().size + this.stockTypeFilter().size + this.itemGroupFilter().size + this.costCenterFilter().size,
  );

  protected readonly groupedSections = computed<{ label: string; rows: Item[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, Item[]>();
    for (const row of rows) {
      const key =
        field === 'category'
          ? this.categoryLabel(row.category)
          : field === 'stockType'
            ? this.stockTypeLabel(row.stockType)
            : (this.itemGroupLabel(row.itemGroup) ?? 'Sin grupo');
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleActiveFilter(value: boolean): void {
    this.activeFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleStockTypeFilter(value: StockTypeCode): void {
    this.stockTypeFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleItemGroupFilter(value: ItemGroupCode): void {
    this.itemGroupFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleCostCenterFilter(value: CostCenterCode): void {
    this.costCenterFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.activeFilter.set(new Set());
    this.stockTypeFilter.set(new Set());
    this.itemGroupFilter.set(new Set());
    this.costCenterFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected categoryLabel(category: ItemCategory): string {
    return ITEM_CATEGORY_LABEL[category];
  }

  protected categoryTone(category: ItemCategory): Tone {
    return CATEGORY_TONE[category];
  }

  protected activeLabel(active: boolean): string {
    return active ? 'Activo' : 'Inactivo';
  }

  protected activeTone(active: boolean): Tone {
    return ACTIVE_TONE[active ? 'active' : 'inactive'];
  }

  protected stockTypeLabel(stockType: StockTypeCode): string {
    return STOCK_TYPE_LABEL[stockType];
  }

  protected stockTypeTone(stockType: StockTypeCode): Tone {
    return STOCK_TYPE_TONE[stockType];
  }

  protected itemGroupLabel(itemGroup: ItemGroupCode | undefined): string | undefined {
    return itemGroup ? ITEM_GROUP_LABEL[itemGroup] : undefined;
  }

  protected unitOfMeasureLabel(unitOfMeasure: string): string {
    return UNIT_OF_MEASURE_LABEL[unitOfMeasure] ?? unitOfMeasure;
  }

  /** Sums inbound/outbound movements within the given month and reads the closing stock balance as of that month's end. */
  protected monthStats(item: Item, columnKey: string): MonthStats {
    const { year, month } = STATS_MONTHS[this.statsColumnMonth[columnKey]];
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    let inbound = 0;
    let outbound = 0;
    let stock = 0;
    let lastBalanceDate: Date | null = null;

    for (const entry of STOCK_LEDGER) {
      if (entry.itemId !== item.id) continue;
      const entryDate = new Date(entry.date);
      if (entryDate >= monthStart && entryDate <= monthEnd) {
        inbound += entry.inboundQuantity;
        outbound += entry.outboundQuantity;
      }
      if (entryDate <= monthEnd && (!lastBalanceDate || entryDate >= lastBalanceDate)) {
        lastBalanceDate = entryDate;
        stock = entry.balance;
      }
    }

    return { inbound, outbound, stock };
  }

  protected openDetail(item: Item): void {
    this.router.navigate(['/apps/inventory/items', item.id]);
  }

  protected createItem(): void {
    this.router.navigate(['/apps/inventory/items/new']);
  }
}
