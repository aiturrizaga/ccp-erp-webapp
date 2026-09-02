import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmInputImports } from '@ui/input';
import { HlmCheckboxImports } from '@ui/checkbox';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { DataGrid } from '@shared/components/data-grid/data-grid';
import { DataKanban, KanbanColumn } from '@shared/components/data-kanban/data-kanban';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { ListPagination } from '@shared/components/list-pagination/list-pagination';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { ListViewOption, LIST_VIEW_OPTIONS } from '@shared/models/list-view.model';
import { salesQuotations } from '../../sales-state';
import { Currency, SalesQuotation, SalesQuotationStatus, SALES_QUOTATION_STATUS_LABEL, SALES_QUOTATION_STATUS_TONE, Tone } from '@core/models';

const STATUS_OPTIONS: { value: SalesQuotationStatus; label: string }[] = (Object.keys(SALES_QUOTATION_STATUS_LABEL) as SalesQuotationStatus[]).map((value) => ({
  value,
  label: SALES_QUOTATION_STATUS_LABEL[value],
}));

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
];

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
  { value: 'currency', label: 'Moneda' },
];

@Component({
  selector: 'app-quotation-list',
  imports: [FormsModule, NgIcon, ...HlmButtonImports, ...HlmInputImports, ...HlmCheckboxImports, DataTable, DataGrid, DataKanban, ListToolbar, ListPagination, StatusBadge, DecimalPipe],
  templateUrl: './quotation-list.html',
})
export class QuotationList {
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('kanban');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<SalesQuotationStatus>>(new Set());
  protected readonly currencyFilter = signal<Set<Currency>>(new Set());
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid, LIST_VIEW_OPTIONS.kanban];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly currencyOptions = CURRENCY_OPTIONS;

  protected readonly statusColumns: KanbanColumn[] = STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label, tone: SALES_QUOTATION_STATUS_TONE[o.value] }));
  protected readonly statusKey = (row: SalesQuotation): string => row.status;

  protected readonly columns: DataTableColumn[] = [
    { key: 'number', header: 'Cotización', width: '150px' },
    { key: 'customerName', header: 'Cliente' },
    { key: 'expiresAt', header: 'Vigente hasta', width: '130px' },
    { key: 'currency', header: 'Moneda', width: '90px' },
    { key: 'total', header: 'Total', width: '110px', align: 'end' },
    { key: 'status', header: 'Estado', width: '140px' },
  ];

  /** Rows matching every filter EXCEPT status — used to count how many fall in each status. */
  protected readonly baseRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const currencies = this.currencyFilter();
    const from = this.dateFrom();
    const to = this.dateTo();
    return salesQuotations()
      .filter((q) => {
        const matchesSearch = !term || q.number.toLowerCase().includes(term) || q.customerName.toLowerCase().includes(term);
        const matchesCurrency = currencies.size === 0 || currencies.has(q.currency);
        const matchesFrom = !from || q.issuedAt >= from;
        const matchesTo = !to || q.issuedAt <= to;
        return matchesSearch && matchesCurrency && matchesFrom && matchesTo;
      })
      .reverse();
  });

  protected readonly filteredRows = computed(() => {
    const statuses = this.statusFilter();
    return this.baseRows().filter((q) => statuses.size === 0 || statuses.has(q.status));
  });

  /** Counts per status (over baseRows) + the "Todos" total, for the badge row. */
  protected readonly statusCounts = computed(() => {
    const counts: Record<string, number> = { all: this.baseRows().length };
    for (const s of STATUS_OPTIONS) counts[s.value] = 0;
    for (const q of this.baseRows()) counts[q.status] = (counts[q.status] ?? 0) + 1;
    return counts;
  });
  protected count = (status: string): number => this.statusCounts()[status] ?? 0;

  protected readonly filterCount = computed(
    () => this.statusFilter().size + this.currencyFilter().size + (this.dateFrom() ? 1 : 0) + (this.dateTo() ? 1 : 0),
  );

  protected readonly groupedSections = computed<{ label: string; rows: SalesQuotation[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, SalesQuotation[]>();
    for (const row of rows) {
      const key = field === 'status' ? this.statusLabel(row.status) : row.currency;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleStatusFilter(value: SalesQuotationStatus): void {
    this.statusFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleCurrencyFilter(value: Currency): void {
    this.currencyFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  /** "Todos" clears the status filter; a specific status toggles it. */
  protected selectStatusBadge(value: string): void {
    if (value === 'all') this.statusFilter.set(new Set());
    else this.toggleStatusFilter(value as SalesQuotationStatus);
    this.page.set(1);
  }

  protected dotClass(tone: Tone): string {
    return {
      neutral: 'bg-muted-foreground',
      info: 'bg-blue-500',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-red-500',
    }[tone];
  }

  protected clearFilters(): void {
    this.statusFilter.set(new Set());
    this.currencyFilter.set(new Set());
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected isExpiringSoon(quotation: SalesQuotation): boolean {
    const activeStates: SalesQuotationStatus[] = ['sent', 'draft'];
    if (!activeStates.includes(quotation.status)) return false;
    const daysLeft = (new Date(quotation.expiresAt).getTime() - new Date('2026-08-23').getTime()) / 86_400_000;
    return daysLeft >= 0 && daysLeft <= 7;
  }

  protected statusLabel(status: SalesQuotationStatus): string {
    return SALES_QUOTATION_STATUS_LABEL[status];
  }

  protected statusTone(status: SalesQuotationStatus): Tone {
    return SALES_QUOTATION_STATUS_TONE[status];
  }

  protected openDetail(quotation: SalesQuotation): void {
    this.router.navigate(['/apps/sales/quotations', quotation.id]);
  }
}
