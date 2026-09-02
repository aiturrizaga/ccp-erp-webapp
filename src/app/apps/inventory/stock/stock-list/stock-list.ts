import { Component, computed, inject, signal } from '@angular/core';
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
import { ITEMS, WAREHOUSES } from '@core/mock-data';
import { STOCK_STATUS_LABEL, StockLot, StockStatus, Tone } from '@core/models';
import { WarehouseOpsState } from '../../warehouse-ops-state';

const STATUS_TONE: Record<StockStatus, Tone> = {
  available: 'success',
  reserved: 'info',
  in_transit: 'info',
  quarantine: 'warning',
  claimed: 'danger',
  blocked: 'danger',
};

const STATUS_OPTIONS: { value: StockStatus; label: string }[] = (
  Object.entries(STOCK_STATUS_LABEL) as [StockStatus, string][]
).map(([value, label]) => ({ value, label }));

const GROUP_BY_OPTIONS: SelectFilterOption[] = [
  { value: 'none', label: 'Sin agrupar' },
  { value: 'status', label: 'Estado' },
  { value: 'item', label: 'Artículo' },
];

interface StockRow extends StockLot {
  itemLabel: string;
  locationName: string;
  rank: number;
}

@Component({
  selector: 'app-stock-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, DataGrid, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './stock-list.html',
})
export class StockList {
  private readonly warehouseOpsState = inject(WarehouseOpsState);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly groupBy = signal('none');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly statusFilter = signal<Set<StockStatus>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list, LIST_VIEW_OPTIONS.grid];
  protected readonly groupByOptions = GROUP_BY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;

  protected readonly columns: DataTableColumn[] = [
    { key: 'itemLabel', header: 'Artículo' },
    { key: 'lot', header: 'Lote', width: '140px' },
    { key: 'rank', header: 'Prioridad de salida', width: '160px' },
    { key: 'receivedAt', header: 'Ingreso', width: '110px' },
    { key: 'locationName', header: 'Ubicación', width: '170px' },
    { key: 'quantity', header: 'Cantidad', align: 'end', width: '100px' },
    { key: 'status', header: 'Estado', width: '120px' },
  ];

  private readonly enrichedLots = computed<StockRow[]>(() => {
    const byItem = new Map<string, StockLot[]>();
    for (const lot of this.warehouseOpsState.stockLots()) {
      const list = byItem.get(lot.itemId) ?? [];
      list.push(lot);
      byItem.set(lot.itemId, list);
    }
    const rows: StockRow[] = [];
    for (const [itemId, lots] of byItem) {
      const sorted = [...lots].sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));
      const item = ITEMS.find((i) => i.id === itemId);
      sorted.forEach((lot, index) => {
        rows.push({
          ...lot,
          itemLabel: item ? `${item.code} — ${item.description}` : itemId,
          locationName: this.locationName(lot.locationId),
          rank: index + 1,
        });
      });
    }
    return rows.sort((a, b) => a.itemLabel.localeCompare(b.itemLabel) || a.rank - b.rank);
  });

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    return this.enrichedLots().filter((r) => {
      const matchesSearch = !term || r.itemLabel.toLowerCase().includes(term) || r.lot.toLowerCase().includes(term);
      const matchesStatus = statuses.size === 0 || statuses.has(r.status);
      return matchesSearch && matchesStatus;
    }).reverse();
  });

  protected readonly filterCount = computed(() => this.statusFilter().size);

  protected readonly groupedSections = computed<{ label: string; rows: StockRow[] }[] | null>(() => {
    const field = this.groupBy();
    if (field === 'none' || this.view() === 'kanban') return null;
    const rows = this.filteredRows();
    const groups = new Map<string, StockRow[]>();
    for (const row of rows) {
      const key = field === 'status' ? this.statusLabel(row.status) : row.itemLabel;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return Array.from(groups.entries()).map(([label, rows]) => ({ label, rows }));
  });

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleStatusFilter(value: StockStatus): void {
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

  private locationName(locationId: string): string {
    for (const wh of WAREHOUSES) {
      const loc = wh.locations.find((l) => l.id === locationId);
      if (loc) return loc.name;
    }
    return locationId;
  }

  protected statusLabel(status: StockStatus): string {
    return STOCK_STATUS_LABEL[status];
  }

  protected statusTone(status: StockStatus): Tone {
    return STATUS_TONE[status];
  }
}
