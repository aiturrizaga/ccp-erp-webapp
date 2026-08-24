import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCheckboxImports } from '@ui/checkbox';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { DataGrid } from '@shared/components/data-grid/data-grid';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { ListPagination } from '@shared/components/list-pagination/list-pagination';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { ListViewOption, LIST_VIEW_OPTIONS } from '@shared/models/list-view.model';
import { CUSTOMERS } from '@core/mock-data/crm.fixture';
import { Currency } from '@core/models';
import { Customer } from '@core/models/crm.model';

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
];

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'currency', label: 'Moneda' },
];

@Component({
  selector: 'app-customer-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, ListToolbar, ListPagination],
  templateUrl: './customer-list.html',
})
export class CustomerList {
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly currencyFilter = signal<Set<Currency>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly currencyOptions = CURRENCY_OPTIONS;

  protected readonly columns: DataTableColumn[] = [
    { key: 'legalName', header: 'Razón social' },
    { key: 'taxId', header: 'RUC', width: '120px' },
    { key: 'paymentTerms', header: 'Condición de pago', width: '200px' },
    { key: 'currency', header: 'Moneda', width: '90px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const currencies = this.currencyFilter();
    return CUSTOMERS.filter((c) => {
      const matchesSearch = !term || c.legalName.toLowerCase().includes(term) || c.taxId.includes(term);
      const matchesCurrency = currencies.size === 0 || currencies.has(c.currency);
      return matchesSearch && matchesCurrency;
    });
  });

  protected readonly filterCount = computed(() => this.currencyFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: Customer[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, Customer[]>();
    for (const row of rows) {
      const key = row.currency === 'PEN' ? 'Soles (PEN)' : 'Dólares (USD)';
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleCurrencyFilter(value: Currency): void {
    this.currencyFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.currencyFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected openDetail(customer: Customer): void {
    this.router.navigate(['/apps/crm/customers', customer.id]);
  }
}
