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
import { WORK_SHEETS, PRODUCTS } from '@core/mock-data';
import { WorkSheet, ProductionOrderStatus, PRODUCTION_ORDER_STATUS_LABEL, Tone } from '@core/models';

const STATUS_TONE: Record<ProductionOrderStatus, Tone> = {
  planned: 'neutral',
  released: 'info',
  preparing: 'info',
  in_progress: 'warning',
  paused: 'danger',
  completed: 'success',
  cancelled: 'danger',
};

const STATUS_OPTIONS: { value: ProductionOrderStatus; label: string }[] = [
  { value: 'planned', label: 'Planificada' },
  { value: 'released', label: 'Liberada' },
  { value: 'preparing', label: 'En preparación' },
  { value: 'in_progress', label: 'En producción' },
  { value: 'paused', label: 'Pausada' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
];

const PLANT_OPTIONS: { value: string; label: string }[] = [
  { value: 'Planta Lima — P2', label: 'Planta Lima — P2' },
  { value: 'Planta Lima — P3', label: 'Planta Lima — P3' },
  { value: 'Planta Accesorios', label: 'Planta Accesorios' },
];

const RISK_OPTIONS: { value: boolean; label: string }[] = [
  { value: true, label: 'En riesgo' },
  { value: false, label: 'Sin riesgo' },
];

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
  { value: 'plant', label: 'Planta' },
];

@Component({
  selector: 'app-work-sheet-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, DataKanban, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './work-sheet-list.html',
})
export class WorkSheetList {
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<ProductionOrderStatus>>(new Set());
  protected readonly plantFilter = signal<Set<string>>(new Set());
  protected readonly riskFilter = signal<Set<boolean>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid, LIST_VIEW_OPTIONS.kanban];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly plantOptions = PLANT_OPTIONS;
  protected readonly riskOptions = RISK_OPTIONS;

  protected readonly statusColumns: KanbanColumn[] = STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label, tone: STATUS_TONE[o.value] }));
  protected readonly statusKey = (row: WorkSheet): string => row.status;

  protected readonly columns: DataTableColumn[] = [
    { key: 'number', header: 'Hoja de trabajo', width: '150px' },
    { key: 'productId', header: 'Producto' },
    { key: 'plant', header: 'Planta', width: '170px' },
    { key: 'committedDate', header: 'Fecha compromiso', width: '140px' },
    { key: 'atRisk', header: 'Riesgo', width: '110px' },
    { key: 'status', header: 'Estado', width: '140px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    const plants = this.plantFilter();
    const risks = this.riskFilter();
    return WORK_SHEETS.filter((w) => {
      const matchesSearch = !term || w.number.toLowerCase().includes(term) || this.productName(w.productId).toLowerCase().includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(w.status);
      const matchesPlant = plants.size === 0 || plants.has(w.plant);
      const matchesRisk = risks.size === 0 || risks.has(w.atRisk);
      return matchesSearch && matchesStatus && matchesPlant && matchesRisk;
    });
  });

  protected readonly filterCount = computed(() => this.statusFilter().size + this.plantFilter().size + this.riskFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: WorkSheet[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, WorkSheet[]>();
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

  protected toggleStatusFilter(value: ProductionOrderStatus): void {
    this.statusFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected togglePlantFilter(value: string): void {
    this.plantFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleRiskFilter(value: boolean): void {
    this.riskFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.statusFilter.set(new Set());
    this.plantFilter.set(new Set());
    this.riskFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected productName(productId: string): string {
    return PRODUCTS.find((p) => p.id === productId)?.name ?? productId;
  }

  protected statusLabel(status: ProductionOrderStatus): string {
    return PRODUCTION_ORDER_STATUS_LABEL[status];
  }

  protected statusTone(status: ProductionOrderStatus): Tone {
    return STATUS_TONE[status];
  }

  protected openDetail(ws: WorkSheet): void {
    this.router.navigate(['/apps/production/work-sheets', ws.id]);
  }
}
