import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCheckboxImports } from '@ui/checkbox';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { DataGrid } from '@shared/components/data-grid/data-grid';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { ListPagination } from '@shared/components/list-pagination/list-pagination';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { ListViewOption, LIST_VIEW_OPTIONS } from '@shared/models/list-view.model';
import { WAREHOUSES } from '@core/mock-data';
import { Warehouse } from '@core/models';

const PLANT_OPTIONS: { value: string; label: string }[] = Array.from(new Set(WAREHOUSES.map((w) => w.plant))).map((plant) => ({
  value: plant,
  label: plant,
}));

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'plant', label: 'Planta' },
];

@Component({
  selector: 'app-warehouse-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, ListToolbar, ListPagination],
  templateUrl: './warehouse-list.html',
})
export class WarehouseList {
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly plantFilter = signal<Set<string>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly plantOptions = PLANT_OPTIONS;

  protected readonly columns: DataTableColumn[] = [
    { key: 'code', header: 'Código', width: '100px' },
    { key: 'name', header: 'Nombre' },
    { key: 'plant', header: 'Planta', width: '160px' },
    { key: 'locationCount', header: 'Ubicaciones', align: 'end', width: '120px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const plants = this.plantFilter();
    return WAREHOUSES.filter((w) => {
      const matchesSearch = !term || w.code.toLowerCase().includes(term) || w.name.toLowerCase().includes(term);
      const matchesPlant = plants.size === 0 || plants.has(w.plant);
      return matchesSearch && matchesPlant;
    });
  });

  protected readonly filterCount = computed(() => this.plantFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: Warehouse[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, Warehouse[]>();
    for (const row of rows) {
      groups.set(row.plant, [...(groups.get(row.plant) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected togglePlantFilter(value: string): void {
    this.plantFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.plantFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected locationCount(warehouse: Warehouse): number {
    return warehouse.locations.length;
  }

  protected openDetail(warehouse: Warehouse): void {
    this.router.navigate(['/apps/inventory/warehouses', warehouse.id]);
  }
}
