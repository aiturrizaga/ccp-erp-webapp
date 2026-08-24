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
import { GOODS_RECEIPTS, SUPPLIERS } from '@core/mock-data';
import { GoodsReceipt, GoodsReceiptStatus, GOODS_RECEIPT_STATUS_LABEL, Tone } from '@core/models';

const STATUS_TONE: Record<GoodsReceiptStatus, Tone> = {
  scheduled: 'neutral',
  in_progress: 'info',
  partial: 'warning',
  received: 'success',
  with_discrepancies: 'danger',
  in_claim: 'danger',
  closed: 'success',
};

const STATUS_OPTIONS: { value: GoodsReceiptStatus; label: string }[] = (
  Object.entries(GOODS_RECEIPT_STATUS_LABEL) as [GoodsReceiptStatus, string][]
).map(([value, label]) => ({ value, label }));

const SUPPLIER_OPTIONS: { value: string; label: string }[] = Array.from(new Set(GOODS_RECEIPTS.map((r) => r.supplierId))).map((supplierId) => ({
  value: supplierId,
  label: SUPPLIERS.find((s) => s.id === supplierId)?.legalName ?? supplierId,
}));

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
  { value: 'supplier', label: 'Proveedor' },
];

@Component({
  selector: 'app-goods-receipt-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, DataKanban, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './goods-receipt-list.html',
})
export class GoodsReceiptList {
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<GoodsReceiptStatus>>(new Set());
  protected readonly supplierFilter = signal<Set<string>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid, LIST_VIEW_OPTIONS.kanban];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly supplierOptions = SUPPLIER_OPTIONS;

  protected readonly statusColumns: KanbanColumn[] = STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label, tone: STATUS_TONE[o.value] }));
  protected readonly statusKey = (row: GoodsReceipt): string => row.status;

  protected readonly columns: DataTableColumn[] = [
    { key: 'number', header: 'Recepción', width: '150px' },
    { key: 'supplierId', header: 'Proveedor' },
    { key: 'expectedDate', header: 'Fecha esperada', width: '150px' },
    { key: 'receivedBy', header: 'Recibido por', width: '160px' },
    { key: 'status', header: 'Estado', width: '150px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    const suppliers = this.supplierFilter();
    return GOODS_RECEIPTS.filter((r) => {
      const matchesSearch = !term || r.number.toLowerCase().includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(r.status);
      const matchesSupplier = suppliers.size === 0 || suppliers.has(r.supplierId);
      return matchesSearch && matchesStatus && matchesSupplier;
    });
  });

  protected readonly filterCount = computed(() => this.statusFilter().size + this.supplierFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: GoodsReceipt[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, GoodsReceipt[]>();
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

  protected toggleStatusFilter(value: GoodsReceiptStatus): void {
    this.statusFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleSupplierFilter(value: string): void {
    this.supplierFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.statusFilter.set(new Set());
    this.supplierFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected supplierName(supplierId: string): string {
    return SUPPLIERS.find((s) => s.id === supplierId)?.legalName ?? supplierId;
  }

  protected statusLabel(status: GoodsReceiptStatus): string {
    return GOODS_RECEIPT_STATUS_LABEL[status];
  }

  protected statusTone(status: GoodsReceiptStatus): Tone {
    return STATUS_TONE[status];
  }

  protected openDetail(receipt: GoodsReceipt): void {
    this.router.navigate(['/apps/inventory/goods-receipt', receipt.id]);
  }
}
