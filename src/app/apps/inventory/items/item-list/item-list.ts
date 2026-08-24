import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCheckboxImports } from '@ui/checkbox';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { DataGrid } from '@shared/components/data-grid/data-grid';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { ListPagination } from '@shared/components/list-pagination/list-pagination';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { ListViewOption, LIST_VIEW_OPTIONS } from '@shared/models/list-view.model';
import { ITEMS } from '@core/mock-data';
import { Item, ItemCategory, ITEM_CATEGORY_LABEL, OutboundStrategy, Tone } from '@core/models';

const CATEGORY_TONE: Record<ItemCategory, Tone> = {
  raw_material: 'info',
  supply: 'neutral',
  work_in_process: 'warning',
  finished_good: 'success',
};

const ACTIVE_TONE: Record<'active' | 'inactive', Tone> = {
  active: 'success',
  inactive: 'neutral',
};

const CATEGORY_OPTIONS: { value: ItemCategory; label: string }[] = (
  Object.entries(ITEM_CATEGORY_LABEL) as [ItemCategory, string][]
).map(([value, label]) => ({ value, label }));

const STRATEGY_OPTIONS: { value: OutboundStrategy; label: string }[] = [
  { value: 'FIFO', label: 'FIFO (PEPS)' },
  { value: 'FEFO', label: 'FEFO' },
  { value: 'NONE', label: 'Sin control' },
];

const ACTIVE_OPTIONS: { value: boolean; label: string }[] = [
  { value: true, label: 'Activo' },
  { value: false, label: 'Inactivo' },
];

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'category', label: 'Categoría' },
  { value: 'group', label: 'Grupo' },
];

@Component({
  selector: 'app-item-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './item-list.html',
})
export class ItemList {
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly categoryFilter = signal<Set<ItemCategory>>(new Set());
  protected readonly strategyFilter = signal<Set<OutboundStrategy>>(new Set());
  protected readonly activeFilter = signal<Set<boolean>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly categoryOptions = CATEGORY_OPTIONS;
  protected readonly strategyOptions = STRATEGY_OPTIONS;
  protected readonly activeOptions = ACTIVE_OPTIONS;

  protected readonly columns: DataTableColumn[] = [
    { key: 'code', header: 'Código', width: '110px' },
    { key: 'description', header: 'Descripción' },
    { key: 'category', header: 'Categoría', width: '150px' },
    { key: 'unitOfMeasure', header: 'U.M.', width: '70px' },
    { key: 'averageCost', header: 'Costo promedio', align: 'end', width: '130px' },
    { key: 'active', header: 'Estado', width: '100px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const categories = this.categoryFilter();
    const strategies = this.strategyFilter();
    const actives = this.activeFilter();
    return ITEMS.filter((i) => {
      const matchesSearch = !term || i.code.toLowerCase().includes(term) || i.description.toLowerCase().includes(term);
      const matchesCategory = categories.size === 0 || categories.has(i.category);
      const matchesStrategy = strategies.size === 0 || strategies.has(i.outboundStrategy);
      const matchesActive = actives.size === 0 || actives.has(i.active);
      return matchesSearch && matchesCategory && matchesStrategy && matchesActive;
    });
  });

  protected readonly filterCount = computed(() => this.categoryFilter().size + this.strategyFilter().size + this.activeFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: Item[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, Item[]>();
    for (const row of rows) {
      const key = field === 'category' ? this.categoryLabel(row.category) : row.group;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleCategoryFilter(value: ItemCategory): void {
    this.categoryFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleStrategyFilter(value: OutboundStrategy): void {
    this.strategyFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleActiveFilter(value: boolean): void {
    this.activeFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.categoryFilter.set(new Set());
    this.strategyFilter.set(new Set());
    this.activeFilter.set(new Set());
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

  protected openDetail(item: Item): void {
    this.router.navigate(['/apps/inventory/items', item.id]);
  }
}
