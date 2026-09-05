import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCheckboxImports } from '@ui/checkbox';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { ListPagination } from '@shared/components/list-pagination/list-pagination';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { BillOfMaterials, BomStatus, BOM_STATUS_LABEL, Tone } from '@core/models';
import { ProductionState } from '../../production-state';

const STATUS_TONE: Record<BomStatus, Tone> = {
  active: 'success',
  expired: 'neutral',
  draft: 'warning',
};

const STATUS_OPTIONS: { value: BomStatus; label: string }[] = (Object.keys(BOM_STATUS_LABEL) as BomStatus[]).map((value) => ({ value, label: BOM_STATUS_LABEL[value] }));

@Component({
  selector: 'app-bom-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './bom-list.html',
})
export class BomList {
  private readonly router = inject(Router);
  private readonly productionState = inject(ProductionState);

  protected readonly search = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly statusFilter = signal<Set<BomStatus>>(new Set());
  protected readonly statusOptions = STATUS_OPTIONS;

  protected readonly columns: DataTableColumn[] = [
    { key: 'productName', header: 'Producto' },
    { key: 'version', header: 'Versión', width: '100px' },
    { key: 'effectiveFrom', header: 'Vigente desde', width: '140px' },
    { key: 'status', header: 'Estado', width: '120px' },
  ];

  private readonly rows = computed(() =>
    this.productionState.billsOfMaterials().map((b) => ({ bom: b, productName: this.productionState.products().find((p) => p.id === b.productId)?.name ?? b.productId })),
  );

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    return this.rows().filter((r) => {
      const matchesSearch = !term || r.productName.toLowerCase().includes(term) || r.bom.version.toLowerCase().includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(r.bom.status);
      return matchesSearch && matchesStatus;
    });
  });

  protected readonly filterCount = computed(() => this.statusFilter().size);

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleStatusFilter(value: BomStatus): void {
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

  protected statusLabel(status: BomStatus): string {
    return BOM_STATUS_LABEL[status];
  }

  protected statusTone(status: BomStatus): Tone {
    return STATUS_TONE[status];
  }

  protected openDetail(row: { bom: BillOfMaterials }): void {
    this.router.navigate(['/apps/production/bill-of-materials', row.bom.id]);
  }

  protected onNew(): void {
    this.router.navigate(['/apps/production/bill-of-materials/new']);
  }
}
