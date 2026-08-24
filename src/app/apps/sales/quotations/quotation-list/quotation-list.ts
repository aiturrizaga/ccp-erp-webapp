import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
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
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, DataKanban, ListToolbar, ListPagination, StatusBadge, DecimalPipe],
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

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    const currencies = this.currencyFilter();
    return salesQuotations().filter((q) => {
      const matchesSearch = !term || q.number.toLowerCase().includes(term) || q.customerName.toLowerCase().includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(q.status);
      const matchesCurrency = currencies.size === 0 || currencies.has(q.currency);
      return matchesSearch && matchesStatus && matchesCurrency;
    });
  });

  protected readonly filterCount = computed(() => this.statusFilter().size + this.currencyFilter().size);

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

  protected clearFilters(): void {
    this.statusFilter.set(new Set());
    this.currencyFilter.set(new Set());
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
