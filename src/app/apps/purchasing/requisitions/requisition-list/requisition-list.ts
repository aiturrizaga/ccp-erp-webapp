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
  PurchaseRequisition,
  PurchaseRequisitionStatus,
  PURCHASE_REQUISITION_STATUS_LABEL,
  RequisitionPriority,
  REQUISITION_PRIORITY_LABEL,
  Tone,
} from '@core/models';

type RequisitionOrigin = PurchaseRequisition['origin'];

const STATUS_TONE: Record<PurchaseRequisitionStatus, Tone> = {
  draft: 'neutral',
  pending_approval: 'warning',
  approved: 'info',
  sourcing: 'info',
  awarded: 'info',
  purchasing: 'info',
  fulfilled: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

const STATUS_OPTIONS: { value: PurchaseRequisitionStatus; label: string }[] = (
  Object.keys(PURCHASE_REQUISITION_STATUS_LABEL) as PurchaseRequisitionStatus[]
).map((value) => ({ value, label: PURCHASE_REQUISITION_STATUS_LABEL[value] }));

const PRIORITY_OPTIONS: { value: RequisitionPriority; label: string }[] = (
  Object.keys(REQUISITION_PRIORITY_LABEL) as RequisitionPriority[]
).map((value) => ({ value, label: REQUISITION_PRIORITY_LABEL[value] }));

const ORIGIN_LABEL: Record<RequisitionOrigin, string> = {
  production: 'Producción',
  inventory: 'Almacén',
  forecast: 'Proyección de inventario',
  other: 'Otro',
};

const ORIGIN_OPTIONS: { value: RequisitionOrigin; label: string }[] = (
  Object.keys(ORIGIN_LABEL) as RequisitionOrigin[]
).map((value) => ({ value, label: ORIGIN_LABEL[value] }));

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
  { value: 'priority', label: 'Prioridad' },
  { value: 'origin', label: 'Origen' },
];

@Component({
  selector: 'app-requisition-list',
  imports: [RouterLink, NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, DataKanban, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './requisition-list.html',
})
export class RequisitionList {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<PurchaseRequisitionStatus>>(new Set());
  protected readonly priorityFilter = signal<Set<RequisitionPriority>>(new Set());
  protected readonly originFilter = signal<Set<RequisitionOrigin>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid, LIST_VIEW_OPTIONS.kanban];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly priorityOptions = PRIORITY_OPTIONS;
  protected readonly originOptions = ORIGIN_OPTIONS;

  protected readonly statusColumns: KanbanColumn[] = STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label, tone: STATUS_TONE[o.value] }));
  protected readonly statusKey = (row: PurchaseRequisition): string => row.status;

  protected readonly columns: DataTableColumn[] = [
    { key: 'number', header: 'Requerimiento', width: '130px' },
    { key: 'requestedBy', header: 'Solicitante' },
    { key: 'area', header: 'Área', width: '150px' },
    { key: 'workSheetRef', header: 'H. Trabajo', width: '130px' },
    { key: 'priority', header: 'Prioridad', width: '100px' },
    { key: 'createdAt', header: 'Fecha de requerimiento', width: '140px' },
    { key: 'neededBy', header: 'Fecha requerida', width: '130px' },
    { key: 'status', header: 'Estado', width: '160px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    const priorities = this.priorityFilter();
    const origins = this.originFilter();
    return this.purchasingState.requisitions().filter((r) => {
      const matchesSearch = !term || r.number.toLowerCase().includes(term) || r.requestedBy.toLowerCase().includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(r.status);
      const matchesPriority = priorities.size === 0 || priorities.has(r.priority);
      const matchesOrigin = origins.size === 0 || origins.has(r.origin);
      return matchesSearch && matchesStatus && matchesPriority && matchesOrigin;
    }).reverse();
  });

  protected readonly filterCount = computed(() => this.statusFilter().size + this.priorityFilter().size + this.originFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: PurchaseRequisition[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, PurchaseRequisition[]>();
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

  protected toggleStatusFilter(value: PurchaseRequisitionStatus): void {
    this.statusFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected togglePriorityFilter(value: RequisitionPriority): void {
    this.priorityFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleOriginFilter(value: RequisitionOrigin): void {
    this.originFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.statusFilter.set(new Set());
    this.priorityFilter.set(new Set());
    this.originFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected statusLabel(status: PurchaseRequisitionStatus): string {
    return PURCHASE_REQUISITION_STATUS_LABEL[status];
  }

  protected statusTone(status: PurchaseRequisitionStatus): Tone {
    return STATUS_TONE[status];
  }

  protected priorityLabel(priority: RequisitionPriority): string {
    return REQUISITION_PRIORITY_LABEL[priority];
  }

  protected openDetail(requisition: PurchaseRequisition): void {
    this.router.navigate(['/apps/purchasing/requisitions', requisition.id]);
  }

  protected workSheetId(workSheetRef: string | undefined): string | undefined {
    return WORK_SHEETS.find((ws) => ws.number === workSheetRef)?.id;
  }

  protected createRequisition(): void {
    this.router.navigate(['/apps/purchasing/requisitions/new']);
  }
}
