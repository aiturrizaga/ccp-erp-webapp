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
import { PurchasingState } from '../../purchasing-state';
import {
  PurchaseRequirement,
  PurchaseRequirementStatus,
  PURCHASE_REQUIREMENT_STATUS_LABEL,
  RequisitionPriority,
  REQUISITION_PRIORITY_LABEL,
  Tone,
} from '@core/models';

const STATUS_TONE: Record<PurchaseRequirementStatus, Tone> = {
  draft: 'neutral',
  reviewed: 'info',
  pending_approval: 'warning',
  approved: 'success',
  rejected: 'danger',
  observed: 'warning',
};

const STATUS_OPTIONS: { value: PurchaseRequirementStatus; label: string }[] = (
  Object.keys(PURCHASE_REQUIREMENT_STATUS_LABEL) as PurchaseRequirementStatus[]
).map((value) => ({ value, label: PURCHASE_REQUIREMENT_STATUS_LABEL[value] }));

const PRIORITY_OPTIONS: { value: RequisitionPriority; label: string }[] = (
  Object.keys(REQUISITION_PRIORITY_LABEL) as RequisitionPriority[]
).map((value) => ({ value, label: REQUISITION_PRIORITY_LABEL[value] }));

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
  { value: 'priority', label: 'Prioridad' },
];

@Component({
  selector: 'app-requirement-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, DataKanban, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './requirement-list.html',
})
export class RequirementList {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<PurchaseRequirementStatus>>(new Set());
  protected readonly priorityFilter = signal<Set<RequisitionPriority>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid, LIST_VIEW_OPTIONS.kanban];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly priorityOptions = PRIORITY_OPTIONS;

  protected readonly statusColumns: KanbanColumn[] = STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label, tone: STATUS_TONE[o.value] }));
  protected readonly statusKey = (row: PurchaseRequirement): string => row.status;

  protected readonly columns: DataTableColumn[] = [
    { key: 'number', header: 'Requerimiento de Compra', width: '160px' },
    { key: 'suggestionCount', header: 'HT/Sugerencias', width: '130px', align: 'end' },
    { key: 'area', header: 'Área', width: '150px' },
    { key: 'priority', header: 'Prioridad', width: '100px' },
    { key: 'createdAt', header: 'Fecha de creación', width: '140px' },
    { key: 'neededBy', header: 'Fecha requerida', width: '130px' },
    { key: 'status', header: 'Estado', width: '170px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    const priorities = this.priorityFilter();
    return this.purchasingState.requirements().filter((r) => {
      const matchesSearch = !term || r.number.toLowerCase().includes(term) || r.requestedBy.toLowerCase().includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(r.status);
      const matchesPriority = priorities.size === 0 || priorities.has(r.priority);
      return matchesSearch && matchesStatus && matchesPriority;
    }).reverse();
  });

  protected readonly filterCount = computed(() => this.statusFilter().size + this.priorityFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: PurchaseRequirement[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, PurchaseRequirement[]>();
    for (const row of rows) {
      const key = field === 'status' ? this.statusLabel(row.status) : this.priorityLabel(row.priority);
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleStatusFilter(value: PurchaseRequirementStatus): void {
    this.statusFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected togglePriorityFilter(value: RequisitionPriority): void {
    this.priorityFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.statusFilter.set(new Set());
    this.priorityFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected statusLabel(status: PurchaseRequirementStatus): string {
    return PURCHASE_REQUIREMENT_STATUS_LABEL[status];
  }

  protected statusTone(status: PurchaseRequirementStatus): Tone {
    return STATUS_TONE[status];
  }

  protected priorityLabel(priority: RequisitionPriority): string {
    return REQUISITION_PRIORITY_LABEL[priority];
  }

  protected suggestionCount(row: PurchaseRequirement): number {
    return row.suggestionIds.length;
  }

  protected openDetail(requirement: PurchaseRequirement): void {
    this.router.navigate(['/apps/purchasing/requirements', requirement.id]);
  }

  protected createRequirement(): void {
    this.router.navigate(['/apps/purchasing/requirements/new']);
  }
}
