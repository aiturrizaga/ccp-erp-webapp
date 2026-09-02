import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
import { WORK_SHEETS } from '@core/mock-data';
import { PurchasingState } from '../../purchasing-state';
import {
  ProductionOrderStatus,
  PRODUCTION_ORDER_STATUS_LABEL,
  ReplenishmentSuggestion,
  ReplenishmentSuggestionStatus,
  REPLENISHMENT_SUGGESTION_STATUS_LABEL,
  RequisitionPriority,
  REQUISITION_PRIORITY_LABEL,
  Tone,
} from '@core/models';

type SuggestionOrigin = ReplenishmentSuggestion['origin'];

const STATUS_TONE: Record<ReplenishmentSuggestionStatus, Tone> = {
  draft: 'neutral',
  grouped: 'info',
  cancelled: 'danger',
};

const STATUS_OPTIONS: { value: ReplenishmentSuggestionStatus; label: string }[] = (
  Object.keys(REPLENISHMENT_SUGGESTION_STATUS_LABEL) as ReplenishmentSuggestionStatus[]
).map((value) => ({ value, label: REPLENISHMENT_SUGGESTION_STATUS_LABEL[value] }));

const PRIORITY_OPTIONS: { value: RequisitionPriority; label: string }[] = (
  Object.keys(REQUISITION_PRIORITY_LABEL) as RequisitionPriority[]
).map((value) => ({ value, label: REQUISITION_PRIORITY_LABEL[value] }));

const ORIGIN_LABEL: Record<SuggestionOrigin, string> = {
  production: 'Producción',
  inventory: 'Almacén',
  forecast: 'Proyección de inventario',
  other: 'Otro',
};

const ORIGIN_OPTIONS: { value: SuggestionOrigin; label: string }[] = (
  Object.keys(ORIGIN_LABEL) as SuggestionOrigin[]
).map((value) => ({ value, label: ORIGIN_LABEL[value] }));

const HT_STATUS_OPTIONS: { value: ProductionOrderStatus; label: string }[] = (
  Object.keys(PRODUCTION_ORDER_STATUS_LABEL) as ProductionOrderStatus[]
).map((value) => ({ value, label: PRODUCTION_ORDER_STATUS_LABEL[value] }));

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
  { value: 'priority', label: 'Prioridad' },
  { value: 'origin', label: 'Origen' },
];

/** Catálogo de HT con quiebre de stock y solicitudes manuales, todavía sin agrupar en un Requerimiento de Compra — o ya agrupadas, mostradas de solo lectura. */
@Component({
  selector: 'app-suggestion-list',
  imports: [RouterLink, NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, DataKanban, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './suggestion-list.html',
})
export class SuggestionList {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<ReplenishmentSuggestionStatus>>(new Set());
  protected readonly priorityFilter = signal<Set<RequisitionPriority>>(new Set());
  protected readonly originFilter = signal<Set<SuggestionOrigin>>(new Set());
  /** Filters by the status of the originating Hoja de Trabajo — rows without a linked HT (manual suggestions) never match when this filter is active. */
  protected readonly htStatusFilter = signal<Set<ProductionOrderStatus>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid, LIST_VIEW_OPTIONS.kanban];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly priorityOptions = PRIORITY_OPTIONS;
  protected readonly originOptions = ORIGIN_OPTIONS;
  protected readonly htStatusOptions = HT_STATUS_OPTIONS;

  protected readonly statusColumns: KanbanColumn[] = STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label, tone: STATUS_TONE[o.value] }));
  protected readonly statusKey = (row: ReplenishmentSuggestion): string => row.status;

  /** Sugerencias seleccionadas para agrupar en un solo Requerimiento de Compra — solo puede haber filas 'draft' aquí dentro. */
  protected readonly selectedIds = signal<Set<string>>(new Set());

  protected readonly columns: DataTableColumn[] = [
    { key: 'select', header: '', width: '40px' },
    { key: 'number', header: 'Sugerencia', width: '130px' },
    { key: 'requestedBy', header: 'Solicitante' },
    { key: 'area', header: 'Área', width: '150px' },
    { key: 'workSheetRef', header: 'H. Trabajo', width: '130px' },
    { key: 'priority', header: 'Prioridad', width: '100px' },
    { key: 'createdAt', header: 'Fecha de sugerencia', width: '140px' },
    { key: 'neededBy', header: 'Fecha requerida', width: '130px' },
    { key: 'status', header: 'Estado', width: '160px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    const priorities = this.priorityFilter();
    const origins = this.originFilter();
    const htStatuses = this.htStatusFilter();
    return this.purchasingState.suggestions().filter((s) => {
      const matchesSearch = !term || s.number.toLowerCase().includes(term) || s.requestedBy.toLowerCase().includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(s.status);
      const matchesPriority = priorities.size === 0 || priorities.has(s.priority);
      const matchesOrigin = origins.size === 0 || origins.has(s.origin);
      const htStatus = this.htStatus(s.workSheetRef);
      const matchesHtStatus = htStatuses.size === 0 || (!!htStatus && htStatuses.has(htStatus));
      return matchesSearch && matchesStatus && matchesPriority && matchesOrigin && matchesHtStatus;
    }).reverse();
  });

  protected readonly filterCount = computed(
    () => this.statusFilter().size + this.priorityFilter().size + this.originFilter().size + this.htStatusFilter().size,
  );

  protected readonly groupedSections = computed<{ label: string; rows: ReplenishmentSuggestion[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, ReplenishmentSuggestion[]>();
    for (const row of rows) {
      const key = field === 'status' ? this.statusLabel(row.status) : field === 'priority' ? this.priorityLabel(row.priority) : ORIGIN_LABEL[row.origin];
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected readonly selectedCount = computed(() => this.selectedIds().size);

  protected toggleStatusFilter(value: ReplenishmentSuggestionStatus): void {
    this.statusFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected togglePriorityFilter(value: RequisitionPriority): void {
    this.priorityFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleOriginFilter(value: SuggestionOrigin): void {
    this.originFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleHtStatusFilter(value: ProductionOrderStatus): void {
    this.htStatusFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.statusFilter.set(new Set());
    this.priorityFilter.set(new Set());
    this.originFilter.set(new Set());
    this.htStatusFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected isSelectable(row: ReplenishmentSuggestion): boolean {
    return row.status === 'draft';
  }

  protected isSelected(row: ReplenishmentSuggestion): boolean {
    return this.selectedIds().has(row.id);
  }

  protected toggleSelected(row: ReplenishmentSuggestion, checked: boolean): void {
    if (!this.isSelectable(row)) return;
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (checked) next.add(row.id);
      else next.delete(row.id);
      return next;
    });
  }

  protected statusLabel(status: ReplenishmentSuggestionStatus): string {
    return REPLENISHMENT_SUGGESTION_STATUS_LABEL[status];
  }

  protected statusTone(status: ReplenishmentSuggestionStatus): Tone {
    return STATUS_TONE[status];
  }

  protected priorityLabel(priority: RequisitionPriority): string {
    return REQUISITION_PRIORITY_LABEL[priority];
  }

  protected openDetail(suggestion: ReplenishmentSuggestion): void {
    this.router.navigate(['/apps/purchasing/replenishment-suggestions', suggestion.id]);
  }

  protected workSheetId(workSheetRef: string | undefined): string | undefined {
    return WORK_SHEETS.find((ws) => ws.number === workSheetRef)?.id;
  }

  protected htStatus(workSheetRef: string | undefined): ProductionOrderStatus | undefined {
    return WORK_SHEETS.find((ws) => ws.number === workSheetRef)?.status;
  }

  protected htStatusLabel(status: ProductionOrderStatus): string {
    return PRODUCTION_ORDER_STATUS_LABEL[status];
  }

  protected createSuggestion(): void {
    this.router.navigate(['/apps/purchasing/replenishment-suggestions/new']);
  }

  /** Lleva la selección actual a la pantalla de transacción del RC, donde Almacén completa cabecera y confirma el bloque. */
  protected groupIntoRequirement(): void {
    if (this.selectedCount() === 0) return;
    this.router.navigate(['/apps/purchasing/requirements/new'], { queryParams: { suggestionIds: Array.from(this.selectedIds()).join(',') } });
  }
}
