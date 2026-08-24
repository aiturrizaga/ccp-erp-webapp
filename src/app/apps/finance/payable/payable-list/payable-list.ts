import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCheckboxImports } from '@ui/checkbox';
import { HlmDialogImports } from '@ui/dialog';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { DataGrid } from '@shared/components/data-grid/data-grid';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { ListPagination } from '@shared/components/list-pagination/list-pagination';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { SelectFilter, SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { ListViewOption, LIST_VIEW_OPTIONS } from '@shared/models/list-view.model';
import { SUPPLIERS } from '@core/mock-data';
import { PurchaseInvoice, Tone } from '@core/models';
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, InvoiceStatus, PAYMENT_METHOD_LABEL, PaymentMethod } from '@core/models/finance.model';
import { InvoicingState } from '../../../invoicing/invoicing-state';

const TODAY = '2026-08-23';

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = (Object.keys(INVOICE_STATUS_LABEL) as InvoiceStatus[]).map((value) => ({
  value,
  label: INVOICE_STATUS_LABEL[value],
}));

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
  { value: 'supplier', label: 'Proveedor' },
];

const PAYMENT_METHOD_OPTIONS: SelectFilterOption[] = (Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((value) => ({
  value,
  label: PAYMENT_METHOD_LABEL[value],
}));

const SETTLED_STATUSES: InvoiceStatus[] = ['paid', 'voided'];

@Component({
  selector: 'app-payable-list',
  imports: [
    NgIcon,
    FormsModule,
    ...HlmButtonImports,
    ...HlmCheckboxImports,
    ...HlmDialogImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    DataTable,
    DataGrid,
    ListToolbar,
    ListPagination,
    StatusBadge,
    StatCard,
    SelectFilter,
    DecimalPipe,
  ],
  templateUrl: './payable-list.html',
})
export class PayableList {
  private readonly router = inject(Router);
  private readonly invoicingState = inject(InvoicingState);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<InvoiceStatus>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly paymentMethodOptions = PAYMENT_METHOD_OPTIONS;

  protected readonly columns: DataTableColumn[] = [
    { key: 'number', header: 'Factura', width: '150px' },
    { key: 'supplierId', header: 'Proveedor' },
    { key: 'dueDate', header: 'Vencimiento', width: '160px' },
    { key: 'currency', header: 'Moneda', width: '90px' },
    { key: 'total', header: 'Total', width: '110px', align: 'end' },
    { key: 'outstandingBalance', header: 'Saldo', width: '110px', align: 'end' },
    { key: 'status', header: 'Estado', width: '140px' },
  ];

  protected readonly paymentAmount = signal(0);
  protected readonly paymentDate = signal(TODAY);
  protected readonly paymentMethod = signal<string>('transfer' satisfies PaymentMethod);

  protected readonly invoices = computed<PurchaseInvoice[]>(() =>
    this.invoicingState.invoices().filter((invoice): invoice is PurchaseInvoice => invoice.documentType === 'purchase'),
  );

  protected readonly totalPending = computed(() => this.invoices().reduce((sum, inv) => (SETTLED_STATUSES.includes(inv.status) ? sum : sum + inv.outstandingBalance), 0));
  protected readonly totalOverdue = computed(() => this.invoices().reduce((sum, inv) => (this.isLate(inv) ? sum + inv.outstandingBalance : sum), 0));
  protected readonly overdueCount = computed(() => this.invoices().filter((inv) => this.isLate(inv)).length);

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    return this.invoices().filter((invoice) => {
      const matchesSearch = !term || invoice.number.toLowerCase().includes(term) || this.supplierName(invoice.supplierId).toLowerCase().includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(invoice.status);
      return matchesSearch && matchesStatus;
    });
  });

  protected readonly filterCount = computed(() => this.statusFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: PurchaseInvoice[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, PurchaseInvoice[]>();
    for (const row of rows) {
      const key = field === 'status' ? this.statusLabel(row.status) : this.supplierName(row.supplierId);
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleStatusFilter(value: InvoiceStatus): void {
    this.statusFilter.update((set) => {
      const next = new Set(set);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.statusFilter.set(new Set());
  }

  protected supplierName(supplierId: string): string {
    return SUPPLIERS.find((s) => s.id === supplierId)?.legalName ?? supplierId;
  }

  protected isLate(invoice: PurchaseInvoice): boolean {
    return !SETTLED_STATUSES.includes(invoice.status) && new Date(invoice.dueDate) < new Date(TODAY);
  }

  protected isSettled(invoice: PurchaseInvoice): boolean {
    return SETTLED_STATUSES.includes(invoice.status);
  }

  protected statusLabel(status: InvoiceStatus): string {
    return INVOICE_STATUS_LABEL[status];
  }

  protected statusTone(status: InvoiceStatus): Tone {
    return INVOICE_STATUS_TONE[status];
  }

  protected openDetail(invoice: PurchaseInvoice): void {
    this.router.navigate(['/apps/purchasing/suppliers', invoice.supplierId]);
  }

  protected openPaymentDraft(invoice: PurchaseInvoice): void {
    this.paymentAmount.set(invoice.outstandingBalance);
    this.paymentDate.set(TODAY);
    this.paymentMethod.set('transfer');
  }

  protected confirmPayment(invoice: PurchaseInvoice): void {
    const amount = this.paymentAmount();
    if (amount <= 0) return;
    this.invoicingState.registerPayment(invoice.id, { amount, date: this.paymentDate(), method: this.paymentMethod() as PaymentMethod });
  }
}
