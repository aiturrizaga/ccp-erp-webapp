import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCheckboxImports } from '@ui/checkbox';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { ListPagination } from '@shared/components/list-pagination/list-pagination';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { salesCustomers } from '../../sales-state';
import { CUSTOMER_PAYMENT_MODE_LABEL, Customer, CustomerPaymentMode } from '@core/models';

@Component({
  selector: 'app-customer-list',
  imports: [NgIcon, DecimalPipe, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './customer-list.html',
})
export class CustomerList {
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(15);
  protected readonly modeFilter = signal<Set<CustomerPaymentMode>>(new Set());

  protected readonly modeOptions: { value: CustomerPaymentMode; label: string }[] = [
    { value: 'credit', label: CUSTOMER_PAYMENT_MODE_LABEL.credit },
    { value: 'cash', label: CUSTOMER_PAYMENT_MODE_LABEL.cash },
  ];

  protected readonly columns: DataTableColumn[] = [
    { key: 'legalName', header: 'Razón social' },
    { key: 'taxId', header: 'RUC / DNI', width: '120px' },
    { key: 'paymentMode', header: 'Modalidad', width: '130px' },
    { key: 'credit', header: 'Crédito usado / límite', width: '190px', align: 'end' },
    { key: 'currency', header: 'Moneda', width: '80px' },
    { key: 'retention', header: 'Retención', width: '100px' },
  ];

  protected readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const modes = this.modeFilter();
    return salesCustomers().filter((c) => {
      const matchesSearch = !term || c.legalName.toLowerCase().includes(term) || c.taxId.includes(term);
      return matchesSearch && (modes.size === 0 || (c.paymentMode && modes.has(c.paymentMode)));
    });
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.rows().slice(start, start + this.pageSize());
  });

  protected readonly filterCount = computed(() => this.modeFilter().size);

  protected toggleMode(value: CustomerPaymentMode): void {
    this.modeFilter.update((set) => {
      const next = new Set(set);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.modeFilter.set(new Set());
  }

  protected modeLabel(mode?: CustomerPaymentMode): string {
    return mode ? CUSTOMER_PAYMENT_MODE_LABEL[mode] : '—';
  }

  protected creditOver(c: Customer): boolean {
    return (c.creditUsed ?? 0) > (c.creditLimit ?? 0) && (c.creditLimit ?? 0) > 0;
  }

  protected onNew(): void {
    this.router.navigate(['/apps/sales/customers/new']);
  }

  protected openDetail(customer: Customer): void {
    this.router.navigate(['/apps/sales/customers', customer.id]);
  }
}
