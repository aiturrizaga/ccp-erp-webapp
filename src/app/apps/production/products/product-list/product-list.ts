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
import { ListViewOption, LIST_VIEW_OPTIONS } from '@shared/models/list-view.model';
import { Product, ProductStatus, PRODUCT_STATUS_LABEL, Tone } from '@core/models';
import { ProductionState } from '../../production-state';

const STATUS_TONE: Record<ProductStatus, Tone> = {
  draft: 'neutral',
  active: 'success',
  under_change: 'warning',
  discontinued: 'danger',
};

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = (Object.keys(PRODUCT_STATUS_LABEL) as ProductStatus[]).map((value) => ({ value, label: PRODUCT_STATUS_LABEL[value] }));

@Component({
  selector: 'app-product-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './product-list.html',
})
export class ProductList {
  private readonly router = inject(Router);
  private readonly productionState = inject(ProductionState);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid'>('list');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly statusFilter = signal<Set<ProductStatus>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid];
  protected readonly statusOptions = STATUS_OPTIONS;

  protected readonly columns: DataTableColumn[] = [
    { key: 'code', header: 'Código', width: '140px' },
    { key: 'name', header: 'Producto' },
    { key: 'version', header: 'Versión', width: '100px' },
    { key: 'status', header: 'Estado', width: '140px' },
    { key: 'actions', header: 'Acciones', width: '270px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    return this.productionState.products().filter((p) => {
      const matchesSearch = !term || p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(p.status);
      return matchesSearch && matchesStatus;
    });
  });

  protected readonly filterCount = computed(() => this.statusFilter().size);

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleStatusFilter(value: ProductStatus): void {
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

  protected statusLabel(status: ProductStatus): string {
    return PRODUCT_STATUS_LABEL[status];
  }

  protected statusTone(status: ProductStatus): Tone {
    return STATUS_TONE[status];
  }

  protected openDetail(product: Product): void {
    this.router.navigate(['/apps/production/products', product.id]);
  }

  protected productBom(product: Product) {
    const versions = this.productionState.billsOfMaterials().filter((b) => b.productId === product.id);
    return versions.find((b) => b.status === 'active') ?? versions.sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1))[0];
  }

  protected openRecipe(event: Event, product: Product): void {
    event.stopPropagation();
    const bom = this.productBom(product);
    if (bom) {
      this.router.navigate(['/apps/production/bill-of-materials', bom.id]);
      return;
    }
    this.router.navigate(['/apps/production/bill-of-materials/new'], { queryParams: { productId: product.id } });
  }

  protected openRouting(event: Event, product: Product): void {
    event.stopPropagation();
    const bom = this.productBom(product);
    if (bom) {
      this.router.navigate(['/apps/production/bill-of-materials', bom.id], { fragment: 'ruta-operaciones' });
      return;
    }
    this.router.navigate(['/apps/production/bill-of-materials/new'], { queryParams: { productId: product.id } });
  }

  protected onNew(): void {
    this.router.navigate(['/apps/production/products/new']);
  }
}
