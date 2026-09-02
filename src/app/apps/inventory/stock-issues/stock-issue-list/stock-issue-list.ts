import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
import { WORK_SHEETS } from '@core/mock-data';
import { StockIssue, StockIssueOrigin, StockIssueStatus, STOCK_ISSUE_ORIGIN_LABEL, STOCK_ISSUE_STATUS_LABEL, Tone } from '@core/models';
import { WarehouseOpsState } from '../../warehouse-ops-state';

const STATUS_TONE: Record<StockIssueStatus, Tone> = {
  pending: 'neutral',
  partial: 'warning',
  dispatched: 'success',
  cancelled: 'danger',
};

const STATUS_OPTIONS: { value: StockIssueStatus; label: string }[] = (Object.entries(STOCK_ISSUE_STATUS_LABEL) as [StockIssueStatus, string][]).map(
  ([value, label]) => ({ value, label }),
);

const ORIGIN_OPTIONS: { value: StockIssueOrigin; label: string }[] = (Object.entries(STOCK_ISSUE_ORIGIN_LABEL) as [StockIssueOrigin, string][]).map(
  ([value, label]) => ({ value, label }),
);

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
  { value: 'origin', label: 'Origen' },
];

@Component({
  selector: 'app-stock-issue-list',
  imports: [RouterLink, NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './stock-issue-list.html',
})
export class StockIssueList {
  private readonly router = inject(Router);
  private readonly warehouseOpsState = inject(WarehouseOpsState);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<StockIssueStatus>>(new Set());
  protected readonly originFilter = signal<Set<StockIssueOrigin>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly originOptions = ORIGIN_OPTIONS;

  /** Notas de salida seleccionadas para despachar en bloque — solo pueden entrar filas pendientes/parciales. */
  protected readonly selectedIds = signal<Set<string>>(new Set());

  protected readonly columns: DataTableColumn[] = [
    { key: 'select', header: '', width: '40px' },
    { key: 'number', header: 'Nota de salida', width: '150px' },
    { key: 'origin', header: 'Origen', width: '150px' },
    { key: 'workSheetId', header: 'H. Trabajo', width: '130px' },
    { key: 'plant', header: 'Planta' },
    { key: 'createdAt', header: 'Creado', width: '120px' },
    { key: 'status', header: 'Estado', width: '140px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    const origins = this.originFilter();
    return this.warehouseOpsState
      .stockIssues()
      .filter((i) => {
        const matchesSearch = !term || i.number.toLowerCase().includes(term) || (i.reason ?? '').toLowerCase().includes(term);
        const matchesStatus = statuses.size === 0 || statuses.has(i.status);
        const matchesOrigin = origins.size === 0 || origins.has(i.origin);
        return matchesSearch && matchesStatus && matchesOrigin;
      })
      .reverse();
  });

  protected readonly filterCount = computed(() => this.statusFilter().size + this.originFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: StockIssue[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, StockIssue[]>();
    for (const row of rows) {
      const key = field === 'status' ? this.statusLabel(row.status) : this.originLabel(row.origin);
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleStatusFilter(value: StockIssueStatus): void {
    this.statusFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleOriginFilter(value: StockIssueOrigin): void {
    this.originFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.statusFilter.set(new Set());
    this.originFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected statusLabel(status: StockIssueStatus): string {
    return STOCK_ISSUE_STATUS_LABEL[status];
  }

  protected statusTone(status: StockIssueStatus): Tone {
    return STATUS_TONE[status];
  }

  protected originLabel(origin: StockIssueOrigin): string {
    return STOCK_ISSUE_ORIGIN_LABEL[origin];
  }

  protected workSheetNumber(workSheetId: string | undefined): string | undefined {
    return WORK_SHEETS.find((ws) => ws.id === workSheetId)?.number;
  }

  protected openDetail(issue: StockIssue): void {
    this.router.navigate(['/apps/inventory/stock-issues', issue.id]);
  }

  protected createIssue(): void {
    this.router.navigate(['/apps/inventory/stock-issues/new']);
  }

  protected readonly selectedCount = computed(() => this.selectedIds().size);

  protected isSelectable(row: StockIssue): boolean {
    return row.status === 'pending' || row.status === 'partial';
  }

  protected isSelected(row: StockIssue): boolean {
    return this.selectedIds().has(row.id);
  }

  protected toggleSelected(row: StockIssue, checked: boolean): void {
    if (!this.isSelectable(row)) return;
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (checked) next.add(row.id);
      else next.delete(row.id);
      return next;
    });
  }

  /** Lleva la selección actual a la pantalla de despacho en bloque. */
  protected dispatchInBulk(): void {
    if (this.selectedCount() === 0) return;
    this.router.navigate(['/apps/inventory/stock-issues/dispatch'], { queryParams: { issueIds: Array.from(this.selectedIds()).join(',') } });
  }
}
