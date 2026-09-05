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
import { PRODUCTS, WAREHOUSES } from '@core/mock-data';
import { Tone, WorkSheet, WorkSheetStatus, WORK_SHEET_STATUS_LABEL, workSheetProgressPct, workSheetStatus } from '@core/models';
import { ProductionState } from '../../production-state';

const STATUS_TONE: Record<WorkSheetStatus, Tone> = {
  planned: 'neutral',
  released: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

const STATUS_OPTIONS: { value: WorkSheetStatus; label: string }[] = (Object.keys(WORK_SHEET_STATUS_LABEL) as WorkSheetStatus[]).map((value) => ({
  value,
  label: WORK_SHEET_STATUS_LABEL[value],
}));

/** Real plantas (ubicaciones de tipo producción) del almacén — "AL01 · Planta 02", etc. */
const PLANT_OPTIONS: { value: string; label: string }[] = (WAREHOUSES[0]?.locations ?? [])
  .filter((l) => l.type === 'production')
  .map((l) => ({ value: `${WAREHOUSES[0].shortName} · ${l.name}`, label: `${WAREHOUSES[0].shortName} · ${l.name}` }));

const RISK_OPTIONS: { value: boolean; label: string }[] = [
  { value: true, label: 'En riesgo' },
  { value: false, label: 'Sin riesgo' },
];

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
  { value: 'plant', label: 'Planta' },
];

interface WorkSheetRow {
  ws: WorkSheet;
  status: WorkSheetStatus;
  progress: number;
  productLabel: string;
  plannedQuantity: number;
}

@Component({
  selector: 'app-work-sheet-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, DataKanban, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './work-sheet-list.html',
})
export class WorkSheetList {
  private readonly router = inject(Router);
  private readonly productionState = inject(ProductionState);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<WorkSheetStatus>>(new Set());
  protected readonly plantFilter = signal<Set<string>>(new Set());
  protected readonly riskFilter = signal<Set<boolean>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid, LIST_VIEW_OPTIONS.kanban];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly plantOptions = PLANT_OPTIONS;
  protected readonly riskOptions = RISK_OPTIONS;

  protected readonly statusColumns: KanbanColumn[] = STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label, tone: STATUS_TONE[o.value] }));
  protected readonly statusKey = (row: WorkSheetRow): string => row.status;

  protected readonly columns: DataTableColumn[] = [
    { key: 'number', header: 'Hoja de trabajo', width: '150px' },
    { key: 'productLabel', header: 'Producto' },
    { key: 'plant', header: 'Planta', width: '170px' },
    { key: 'progress', header: 'Avance', width: '120px' },
    { key: 'committedDate', header: 'Fecha compromiso', width: '140px' },
    { key: 'atRisk', header: 'Riesgo', width: '110px' },
    { key: 'status', header: 'Estado', width: '140px' },
  ];

  private readonly rows = computed<WorkSheetRow[]>(() =>
    this.productionState.workSheets().map((ws) => ({
      ws,
      status: workSheetStatus(ws),
      progress: workSheetProgressPct(ws),
      productLabel: this.productLabel(ws),
      plannedQuantity: ws.lines.reduce((s, l) => s + l.plannedQuantity, 0),
    })),
  );

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    const plants = this.plantFilter();
    const risks = this.riskFilter();
    return this.rows()
      .filter((r) => {
        const matchesSearch = !term || r.ws.number.toLowerCase().includes(term) || r.productLabel.toLowerCase().includes(term);
        const matchesStatus = statuses.size === 0 || statuses.has(r.status);
        const matchesPlant = plants.size === 0 || plants.has(r.ws.plant);
        const matchesRisk = risks.size === 0 || risks.has(r.ws.atRisk);
        return matchesSearch && matchesStatus && matchesPlant && matchesRisk;
      })
      .reverse();
  });

  protected readonly filterCount = computed(() => this.statusFilter().size + this.plantFilter().size + this.riskFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: WorkSheetRow[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, WorkSheetRow[]>();
    for (const row of rows) {
      const key = field === 'status' ? this.statusLabel(row.status) : row.ws.plant;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleStatusFilter(value: WorkSheetStatus): void {
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

  private productLabel(ws: WorkSheet): string {
    const names = ws.lines.map((l) => PRODUCTS.find((p) => p.id === l.productId)?.name ?? l.productId);
    if (names.length === 0) return '—';
    return names.length === 1 ? names[0] : `${names[0]} +${names.length - 1}`;
  }

  protected statusLabel(status: WorkSheetStatus): string {
    return WORK_SHEET_STATUS_LABEL[status];
  }

  protected statusTone(status: WorkSheetStatus): Tone {
    return STATUS_TONE[status];
  }

  protected openDetail(row: WorkSheetRow): void {
    this.router.navigate(['/apps/production/work-sheets', row.ws.id]);
  }
}
