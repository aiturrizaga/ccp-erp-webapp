import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { DataGrid } from '@shared/components/data-grid/data-grid';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { ListPagination } from '@shared/components/list-pagination/list-pagination';
import { ListViewOption, LIST_VIEW_OPTIONS } from '@shared/models/list-view.model';
import { WAREHOUSES } from '@core/mock-data';
import { Warehouse } from '@core/models';

@Component({
  selector: 'app-warehouse-list',
  imports: [NgIcon, ...HlmButtonImports, DataTable, DataGrid, ListToolbar, ListPagination],
  templateUrl: './warehouse-list.html',
})
export class WarehouseList {
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid];

  protected readonly columns: DataTableColumn[] = [
    { key: 'code', header: 'Código', width: '90px' },
    { key: 'name', header: 'Nombre' },
    { key: 'shortName', header: 'Nombre corto', width: '130px' },
    { key: 'address', header: 'Dirección', width: '260px' },
    { key: 'locationCount', header: 'Ubicaciones', align: 'end', width: '110px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    return WAREHOUSES.filter(
      (w) =>
        !term ||
        w.code.toLowerCase().includes(term) ||
        w.name.toLowerCase().includes(term) ||
        w.shortName.toLowerCase().includes(term),
    ).reverse();
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected locationCount(warehouse: Warehouse): number {
    return warehouse.locations.length;
  }

  protected openDetail(warehouse: Warehouse): void {
    this.router.navigate(['/apps/inventory/warehouses', warehouse.id]);
  }
}
