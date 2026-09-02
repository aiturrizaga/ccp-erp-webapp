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
import { ListViewOption, LIST_VIEW_OPTIONS } from '@shared/models/list-view.model';
import { salesProducts } from '../../sales-state';
import {
  SalesCategory,
  SalesProduct,
  SalesProductStatus,
  SALES_CATEGORY_LABEL,
  SALES_PRODUCT_STATUS_LABEL,
  SALES_PRODUCT_STATUS_TONE,
  Tone,
  formatSalesProductName,
} from '@core/models';

const CATEGORY_OPTIONS = (Object.keys(SALES_CATEGORY_LABEL) as SalesCategory[]).map((value) => ({ value, label: SALES_CATEGORY_LABEL[value] }));
const STATUS_OPTIONS = (Object.keys(SALES_PRODUCT_STATUS_LABEL) as SalesProductStatus[]).map((value) => ({ value, label: SALES_PRODUCT_STATUS_LABEL[value] }));

@Component({
  selector: 'app-product-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, ListToolbar, ListPagination, StatusBadge, DecimalPipe],
  templateUrl: './product-list.html',
})
export class ProductList {
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid'>('list');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(15);
  protected readonly categoryFilter = signal<Set<SalesCategory>>(new Set());
  protected readonly statusFilter = signal<Set<SalesProductStatus>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid];
  protected readonly categoryOptions = CATEGORY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;

  protected readonly columns: DataTableColumn[] = [
    { key: 'fullName', header: 'Producto' },
    { key: 'category', header: 'Categoría', width: '120px' },
    { key: 'legacyCode', header: 'Código', width: '110px' },
    { key: 'unitOfMeasure', header: 'U.M.', width: '70px' },
    { key: 'costBand', header: 'Banda viable (s/IGV)', width: '170px', align: 'end' },
    { key: 'status', header: 'Estado', width: '120px' },
  ];

  protected readonly rows = computed(() =>
    salesProducts()
      .map((p) => ({ ...p, fullName: formatSalesProductName(p) }))
      .filter((p) => {
        const term = this.search().trim().toLowerCase();
        const cats = this.categoryFilter();
        const statuses = this.statusFilter();
        const matchesSearch = !term || p.fullName.toLowerCase().includes(term) || p.legacyCode.toLowerCase().includes(term);
        return matchesSearch && (cats.size === 0 || cats.has(p.category)) && (statuses.size === 0 || statuses.has(p.status));
      }),
  );

  protected readonly filterCount = computed(() => this.categoryFilter().size + this.statusFilter().size);

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.rows().slice(start, start + this.pageSize());
  });

  protected toggleCategory(value: SalesCategory): void {
    this.categoryFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected toggleStatus(value: SalesProductStatus): void {
    this.statusFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.categoryFilter.set(new Set());
    this.statusFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    return next;
  }

  protected categoryLabel(category: SalesCategory): string {
    return SALES_CATEGORY_LABEL[category];
  }

  protected statusLabel(status: SalesProductStatus): string {
    return SALES_PRODUCT_STATUS_LABEL[status];
  }

  protected statusTone(status: SalesProductStatus): Tone {
    return SALES_PRODUCT_STATUS_TONE[status];
  }

  protected onNew(): void {
    this.router.navigate(['/apps/sales/products/new']);
  }

  protected openDetail(product: SalesProduct): void {
    this.router.navigate(['/apps/sales/products', product.id]);
  }
}
