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
import { BILLS_OF_MATERIALS, PRODUCTS } from '@core/mock-data';
import { BillOfMaterials, BomStatus, BOM_STATUS_LABEL, Tone } from '@core/models';

const STATUS_TONE: Record<BomStatus, Tone> = {
  active: 'success',
  expired: 'neutral',
  draft: 'warning',
};

const STATUS_OPTIONS: { value: BomStatus; label: string }[] = [
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Vigente' },
  { value: 'expired', label: 'Vencida' },
];

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
];

@Component({
  selector: 'app-bom-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, DataKanban, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './bom-list.html',
})
export class BomList {
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<BomStatus>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid, LIST_VIEW_OPTIONS.kanban];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;

  protected readonly statusColumns: KanbanColumn[] = STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label, tone: STATUS_TONE[o.value] }));
  protected readonly statusKey = (row: BillOfMaterials): string => row.status;

  protected readonly columns: DataTableColumn[] = [
    { key: 'version', header: 'Versión', width: '90px' },
    { key: 'productId', header: 'Producto' },
    { key: 'effectiveFrom', header: 'Vigente desde', width: '130px' },
    { key: 'components', header: 'Componentes', width: '120px', align: 'end' },
    { key: 'status', header: 'Estado', width: '120px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    return BILLS_OF_MATERIALS.filter((b) => {
      const matchesSearch = !term || this.productName(b.productId).toLowerCase().includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(b.status);
      return matchesSearch && matchesStatus;
    }).reverse();
  });

  protected readonly filterCount = computed(() => this.statusFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: BillOfMaterials[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, BillOfMaterials[]>();
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

  protected toggleStatusFilter(value: BomStatus): void {
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

  protected productName(productId: string): string {
    return PRODUCTS.find((p) => p.id === productId)?.name ?? productId;
  }

  protected statusLabel(status: BomStatus): string {
    return BOM_STATUS_LABEL[status];
  }

  protected statusTone(status: BomStatus): Tone {
    return STATUS_TONE[status];
  }

  protected openDetail(bom: BillOfMaterials): void {
    this.router.navigate(['/apps/plm/bill-of-materials', bom.id]);
  }
}
