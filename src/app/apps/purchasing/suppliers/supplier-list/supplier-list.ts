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
import { Supplier, SupplierClass, SupplierStatus, SupplierTier, SUPPLIER_STATUS_LABEL, Tone } from '@core/models';

const STATUS_TONE: Record<SupplierStatus, Tone> = {
  draft: 'neutral',
  under_evaluation: 'info',
  pending_approval: 'warning',
  approved: 'success',
  rejected: 'danger',
  suspended: 'danger',
};

const STATUS_OPTIONS: { value: SupplierStatus; label: string }[] = [
  { value: 'draft', label: 'Borrador' },
  { value: 'under_evaluation', label: 'En evaluación' },
  { value: 'pending_approval', label: 'Pendiente de aprobación' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'rejected', label: 'Rechazado' },
  { value: 'suspended', label: 'Suspendido' },
];

const TIER_OPTIONS: { value: SupplierTier; label: string }[] = [
  { value: 'A', label: 'Tipo A' },
  { value: 'B', label: 'Tipo B' },
  { value: 'C', label: 'Tipo C' },
];

const CLASS_OPTIONS: { value: SupplierClass; label: string }[] = [
  { value: 'PRODUCT', label: 'Producto' },
  { value: 'SERVICE', label: 'Servicio' },
];

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
  { value: 'tier', label: 'Tipo' },
  { value: 'class', label: 'Clase' },
];

@Component({
  selector: 'app-supplier-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, DataKanban, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './supplier-list.html',
})
export class SupplierList {
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<SupplierStatus>>(new Set());
  protected readonly tierFilter = signal<Set<SupplierTier>>(new Set());
  protected readonly classFilter = signal<Set<SupplierClass>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid, LIST_VIEW_OPTIONS.kanban];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly tierOptions = TIER_OPTIONS;
  protected readonly classOptions = CLASS_OPTIONS;

  protected readonly statusColumns: KanbanColumn[] = STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label, tone: STATUS_TONE[o.value] }));
  protected readonly statusKey = (row: Supplier): string => row.status;

  protected readonly columns: DataTableColumn[] = [
    { key: 'legalName', header: 'Razón social', width: '28%' },
    { key: 'taxId', header: 'RUC', width: '120px' },
    { key: 'tier', header: 'Tipo', width: '70px' },
    { key: 'businessLine', header: 'Rubro' },
    { key: 'paymentTerms', header: 'Condición de pago', width: '160px' },
    { key: 'status', header: 'Estado', width: '140px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    const tiers = this.tierFilter();
    const classes = this.classFilter();
    return SUPPLIERS.filter((s) => {
      const matchesSearch = !term || s.legalName.toLowerCase().includes(term) || s.taxId.includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(s.status);
      const matchesTier = tiers.size === 0 || tiers.has(s.tier);
      const matchesClass = classes.size === 0 || classes.has(s.class);
      return matchesSearch && matchesStatus && matchesTier && matchesClass;
    });
  });

  protected readonly filterCount = computed(() => this.statusFilter().size + this.tierFilter().size + this.classFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: Supplier[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, Supplier[]>();
    for (const row of rows) {
      const key = field === 'status' ? this.statusLabel(row.status) : field === 'tier' ? `Tipo ${row.tier}` : row.class === 'PRODUCT' ? 'Producto' : 'Servicio';
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleStatusFilter(value: SupplierStatus): void {
    this.statusFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleTierFilter(value: SupplierTier): void {
    this.tierFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleClassFilter(value: SupplierClass): void {
    this.classFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.statusFilter.set(new Set());
    this.tierFilter.set(new Set());
    this.classFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected statusLabel(status: SupplierStatus): string {
    return SUPPLIER_STATUS_LABEL[status];
  }

  protected statusTone(status: SupplierStatus): Tone {
    return STATUS_TONE[status];
  }

  protected openDetail(supplier: Supplier): void {
    this.router.navigate(['/apps/purchasing/suppliers', supplier.id]);
  }
}
