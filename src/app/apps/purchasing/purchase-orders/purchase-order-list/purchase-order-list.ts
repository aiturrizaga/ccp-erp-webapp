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
import { SUPPLIERS } from '@core/mock-data';
import { Currency, PurchaseOrder, PurchaseOrderStatus, PURCHASE_ORDER_STATUS_LABEL, Tone } from '@core/models';
import { PurchasingState } from '../../purchasing-state';

const STATUS_TONE: Record<PurchaseOrderStatus, Tone> = {
  draft: 'neutral',
  pending_approval: 'warning',
  approved: 'info',
  sent: 'info',
  confirmed: 'info',
  partially_received: 'warning',
  received: 'success',
  invoiced: 'success',
  closed: 'success',
  rejected: 'danger',
};

const STATUS_OPTIONS: { value: PurchaseOrderStatus; label: string }[] = (Object.keys(PURCHASE_ORDER_STATUS_LABEL) as PurchaseOrderStatus[]).map((value) => ({
  value,
  label: PURCHASE_ORDER_STATUS_LABEL[value],
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
  selector: 'app-purchase-order-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, DataKanban, ListToolbar, ListPagination, StatusBadge, DecimalPipe],
  templateUrl: './purchase-order-list.html',
})
export class PurchaseOrderList {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<PurchaseOrderStatus>>(new Set());
  protected readonly currencyFilter = signal<Set<Currency>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid, LIST_VIEW_OPTIONS.kanban];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly currencyOptions = CURRENCY_OPTIONS;

  protected readonly statusColumns: KanbanColumn[] = STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label, tone: STATUS_TONE[o.value] }));
  protected readonly statusKey = (row: PurchaseOrder): string => row.status;

  protected readonly columns: DataTableColumn[] = [
    { key: 'number', header: 'Orden de compra', width: '140px' },
    { key: 'supplierId', header: 'Proveedor' },
    { key: 'committedDeliveryDate', header: 'Entrega comprometida', width: '180px' },
    { key: 'currency', header: 'Moneda', width: '90px' },
    { key: 'total', header: 'Total', width: '110px', align: 'end' },
    { key: 'status', header: 'Estado', width: '150px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    const currencies = this.currencyFilter();
    return this.purchasingState.purchaseOrders().filter((po) => {
      const matchesSearch = !term || po.number.toLowerCase().includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(po.status);
      const matchesCurrency = currencies.size === 0 || currencies.has(po.currency);
      return matchesSearch && matchesStatus && matchesCurrency;
    }).reverse();
  });

  protected readonly filterCount = computed(() => this.statusFilter().size + this.currencyFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: PurchaseOrder[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, PurchaseOrder[]>();
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

  protected toggleStatusFilter(value: PurchaseOrderStatus): void {
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

  protected supplierName(supplierId: string): string {
    return SUPPLIERS.find((s) => s.id === supplierId)?.legalName ?? supplierId;
  }

  protected total(po: PurchaseOrder): number {
    return po.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  }

  protected isLate(po: PurchaseOrder): boolean {
    const notDelivered = !['received', 'invoiced', 'closed', 'rejected'].includes(po.status);
    return notDelivered && new Date(po.committedDeliveryDate) < new Date('2026-08-23');
  }

  protected statusLabel(status: PurchaseOrderStatus): string {
    return PURCHASE_ORDER_STATUS_LABEL[status];
  }

  protected statusTone(status: PurchaseOrderStatus): Tone {
    return STATUS_TONE[status];
  }

  protected openDetail(po: PurchaseOrder): void {
    this.router.navigate(['/apps/purchasing/purchase-orders', po.id]);
  }

  protected createOrder(): void {
    this.router.navigate(['/apps/purchasing/purchase-orders/new']);
  }
}
