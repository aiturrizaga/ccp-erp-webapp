import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCheckboxImports } from '@ui/checkbox';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { DataGrid } from '@shared/components/data-grid/data-grid';
import { DataKanban, KanbanColumn } from '@shared/components/data-kanban/data-kanban';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { ListPagination } from '@shared/components/list-pagination/list-pagination';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { ListViewOption, LIST_VIEW_OPTIONS } from '@shared/models/list-view.model';
import { OUTPUT_BUNDLES, WAREHOUSES } from '@core/mock-data';
import { OutputBundle, OutputBundleStatus, OUTPUT_BUNDLE_STATUS_LABEL, Tone } from '@core/models';

const STATUS_TONE: Record<OutputBundleStatus, Tone> = {
  preparing: 'neutral',
  lot_selected: 'info',
  signed: 'warning',
  dispatched: 'success',
};

const STATUS_OPTIONS: { value: OutputBundleStatus; label: string }[] = [
  { value: 'preparing', label: 'En preparación' },
  { value: 'lot_selected', label: 'Lote seleccionado' },
  { value: 'signed', label: 'Firmada' },
  { value: 'dispatched', label: 'Despachada' },
];

/** Real plantas (ubicaciones de tipo producción) del almacén — "AL01 · Planta 02", etc. */
const PLANT_OPTIONS: { value: string; label: string }[] = (WAREHOUSES[0]?.locations ?? [])
  .filter((l) => l.type === 'production')
  .map((l) => ({ value: `${WAREHOUSES[0].shortName} · ${l.name}`, label: `${WAREHOUSES[0].shortName} · ${l.name}` }));

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
  { value: 'plant', label: 'Planta' },
];

@Component({
  selector: 'app-output-bundle-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, DataKanban, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './output-bundle-list.html',
})
export class OutputBundleList {
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<OutputBundleStatus>>(new Set());
  protected readonly plantFilter = signal<Set<string>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid, LIST_VIEW_OPTIONS.kanban];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly plantOptions = PLANT_OPTIONS;

  protected readonly statusColumns: KanbanColumn[] = STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label, tone: STATUS_TONE[o.value] }));
  protected readonly statusKey = (row: OutputBundle): string => row.status;

  protected readonly columns: DataTableColumn[] = [
    { key: 'number', header: 'Bolsa de salida', width: '150px' },
    { key: 'plant', header: 'Planta' },
    { key: 'date', header: 'Fecha', width: '120px' },
    { key: 'workSheetIds', header: 'Hojas de trabajo', width: '150px', align: 'end' },
    { key: 'status', header: 'Estado', width: '140px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    const plants = this.plantFilter();
    return OUTPUT_BUNDLES.filter((b) => {
      const matchesSearch = !term || b.number.toLowerCase().includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(b.status);
      const matchesPlant = plants.size === 0 || plants.has(b.plant);
      return matchesSearch && matchesStatus && matchesPlant;
    }).reverse();
  });

  protected readonly filterCount = computed(() => this.statusFilter().size + this.plantFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: OutputBundle[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, OutputBundle[]>();
    for (const row of rows) {
      const key = field === 'status' ? this.statusLabel(row.status) : row.plant;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleStatusFilter(value: OutputBundleStatus): void {
    this.statusFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected togglePlantFilter(value: string): void {
    this.plantFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.statusFilter.set(new Set());
    this.plantFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected statusLabel(status: OutputBundleStatus): string {
    return OUTPUT_BUNDLE_STATUS_LABEL[status];
  }

  protected statusTone(status: OutputBundleStatus): Tone {
    return STATUS_TONE[status];
  }

  protected openDetail(bundle: OutputBundle): void {
    this.router.navigate(['/apps/production/output-bundles', bundle.id]);
  }
}
