import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCheckboxImports } from '@ui/checkbox';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { DataGrid } from '@shared/components/data-grid/data-grid';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { ListPagination } from '@shared/components/list-pagination/list-pagination';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { ListViewOption, ListViewType, LIST_VIEW_OPTIONS } from '@shared/models/list-view.model';
import { SUPPLIERS } from '@core/mock-data';
import {
  Invoice,
  InvoiceDocumentType,
  InvoiceStatus,
  INVOICE_DOCUMENT_TYPE_LABEL,
  INVOICE_DOCUMENT_TYPE_TONE,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  Tone,
} from '@core/models';
import { InvoicingState } from '../../invoicing-state';

const DOCUMENT_TYPE_OPTIONS: { value: InvoiceDocumentType; label: string }[] = (
  Object.keys(INVOICE_DOCUMENT_TYPE_LABEL) as InvoiceDocumentType[]
).map((value) => ({ value, label: INVOICE_DOCUMENT_TYPE_LABEL[value] }));

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = (Object.keys(INVOICE_STATUS_LABEL) as InvoiceStatus[]).map((value) => ({
  value,
  label: INVOICE_STATUS_LABEL[value],
}));

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
  { value: 'documentType', label: 'Tipo' },
];

@Component({
  selector: 'app-invoice-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, ListToolbar, ListPagination, StatusBadge, DecimalPipe],
  templateUrl: './invoice-list.html',
})
export class InvoiceList {
  private readonly router = inject(Router);
  private readonly state = inject(InvoicingState);

  protected readonly search = signal('');
  protected readonly view = signal<ListViewType>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly documentTypeFilter = signal<Set<InvoiceDocumentType>>(new Set());
  protected readonly statusFilter = signal<Set<InvoiceStatus>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly documentTypeOptions = DOCUMENT_TYPE_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;

  protected readonly columns: DataTableColumn[] = [
    { key: 'number', header: 'Número', width: '140px' },
    { key: 'documentType', header: 'Tipo', width: '90px' },
    { key: 'party', header: 'Cliente / Proveedor' },
    { key: 'dueDate', header: 'Vencimiento', width: '130px' },
    { key: 'total', header: 'Total', width: '120px', align: 'end' },
    { key: 'outstandingBalance', header: 'Saldo pendiente', width: '130px', align: 'end' },
    { key: 'status', header: 'Estado', width: '140px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const types = this.documentTypeFilter();
    const statuses = this.statusFilter();
    return this.state.invoices().filter((invoice) => {
      const matchesSearch =
        !term ||
        invoice.number.toLowerCase().includes(term) ||
        this.partyName(invoice).toLowerCase().includes(term);
      const matchesType = types.size === 0 || types.has(invoice.documentType);
      const matchesStatus = statuses.size === 0 || statuses.has(invoice.status);
      return matchesSearch && matchesType && matchesStatus;
    }).reverse();
  });

  protected readonly filterCount = computed(() => this.documentTypeFilter().size + this.statusFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: Invoice[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, Invoice[]>();
    for (const row of rows) {
      const key = field === 'status' ? this.statusLabel(row.status) : this.documentTypeLabel(row.documentType);
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleDocumentTypeFilter(value: InvoiceDocumentType): void {
    this.documentTypeFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleStatusFilter(value: InvoiceStatus): void {
    this.statusFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.documentTypeFilter.set(new Set());
    this.statusFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected partyName(invoice: Invoice): string {
    if (invoice.documentType === 'purchase') {
      return SUPPLIERS.find((s) => s.id === invoice.supplierId)?.legalName ?? invoice.supplierId;
    }
    return invoice.customerName;
  }

  protected documentTypeLabel(type: InvoiceDocumentType): string {
    return INVOICE_DOCUMENT_TYPE_LABEL[type];
  }

  protected documentTypeTone(type: InvoiceDocumentType): Tone {
    return INVOICE_DOCUMENT_TYPE_TONE[type];
  }

  protected statusLabel(status: InvoiceStatus): string {
    return INVOICE_STATUS_LABEL[status];
  }

  protected statusTone(status: InvoiceStatus): Tone {
    return INVOICE_STATUS_TONE[status];
  }

  protected onNew(): void {
    this.router.navigate(['/apps/invoicing/invoices/new']);
  }

  protected openDetail(invoice: Invoice): void {
    this.router.navigate(['/apps/invoicing/invoices', invoice.id]);
  }
}
