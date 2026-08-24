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
import { SUPPLIERS } from '@core/mock-data';
import { Quotation, QuotationStatus, QUOTATION_STATUS_LABEL, Tone } from '@core/models';
import { PurchasingState } from '../../purchasing-state';

const STATUS_TONE: Record<QuotationStatus, Tone> = {
  draft: 'neutral',
  sent: 'info',
  received: 'info',
  under_evaluation: 'warning',
  awarded: 'success',
  discarded: 'danger',
};

const STATUS_OPTIONS: { value: QuotationStatus; label: string }[] = (Object.keys(QUOTATION_STATUS_LABEL) as QuotationStatus[]).map((value) => ({
  value,
  label: QUOTATION_STATUS_LABEL[value],
}));

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
];

@Component({
  selector: 'app-quotation-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, DataKanban, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './quotation-list.html',
})
export class QuotationList {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<QuotationStatus>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid, LIST_VIEW_OPTIONS.kanban];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;

  protected readonly statusColumns: KanbanColumn[] = STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label, tone: STATUS_TONE[o.value] }));
  protected readonly statusKey = (row: Quotation): string => row.status;

  protected readonly columns: DataTableColumn[] = [
    { key: 'number', header: 'Cotización', width: '140px' },
    { key: 'requisitionId', header: 'Solicitud', width: '110px' },
    { key: 'lines', header: 'Artículos', width: '90px', align: 'end' },
    { key: 'awardedSupplierId', header: 'Proveedor adjudicado' },
    { key: 'dueDate', header: 'Fecha límite', width: '120px' },
    { key: 'status', header: 'Estado', width: '150px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    return this.purchasingState.quotations().filter((q) => {
      const matchesSearch = !term || q.number.toLowerCase().includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(q.status);
      return matchesSearch && matchesStatus;
    }).reverse();
  });

  protected readonly filterCount = computed(() => this.statusFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: Quotation[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, Quotation[]>();
    for (const row of rows) {
      const key = this.statusLabel(row.status);
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleStatusFilter(value: QuotationStatus): void {
    this.statusFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.statusFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected supplierName(supplierId?: string): string {
    if (!supplierId) return '—';
    return SUPPLIERS.find((s) => s.id === supplierId)?.legalName ?? supplierId;
  }

  protected statusLabel(status: QuotationStatus): string {
    return QUOTATION_STATUS_LABEL[status];
  }

  protected statusTone(status: QuotationStatus): Tone {
    return STATUS_TONE[status];
  }

  protected openDetail(quotation: Quotation): void {
    this.router.navigate(['/apps/purchasing/sourcing', quotation.id]);
  }
}
