import { Component, computed, inject, signal } from '@angular/core';
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
import { ListViewOption, LIST_VIEW_OPTIONS } from '@shared/models/list-view.model';
import { PRODUCTS } from '@core/mock-data';
import { Product, ProductStatus, PRODUCT_STATUS_LABEL, Tone } from '@core/models';

const STATUS_TONE: Record<ProductStatus, Tone> = {
  draft: 'neutral',
  active: 'success',
  under_change: 'warning',
  discontinued: 'danger',
};

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Activo' },
  { value: 'under_change', label: 'En cambio' },
  { value: 'discontinued', label: 'Descontinuado' },
];

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
];

@Component({
  selector: 'app-product-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './product-list.html',
})
export class ProductList {
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<ProductStatus>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;

  protected readonly columns: DataTableColumn[] = [
    { key: 'code', header: 'Código', width: '160px' },
    { key: 'name', header: 'Nombre' },
    { key: 'itemId', header: 'Cód. artículo', width: '120px' },
    { key: 'version', header: 'Versión', width: '90px' },
    { key: 'status', header: 'Estado', width: '140px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    return PRODUCTS.filter((p) => {
      const matchesSearch = !term || p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(p.status);
      return matchesSearch && matchesStatus;
    });
  });

  protected readonly filterCount = computed(() => this.statusFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: Product[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, Product[]>();
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

  protected toggleStatusFilter(value: ProductStatus): void {
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

  protected statusLabel(status: ProductStatus): string {
    return PRODUCT_STATUS_LABEL[status];
  }

  protected statusTone(status: ProductStatus): Tone {
    return STATUS_TONE[status];
  }

  protected openDetail(product: Product): void {
    this.router.navigate(['/apps/plm/products', product.id]);
  }
}
