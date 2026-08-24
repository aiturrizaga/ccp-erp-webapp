import { Component, computed, inject, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCheckboxImports } from '@ui/checkbox';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { ListPagination } from '@shared/components/list-pagination/list-pagination';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { ListViewOption, LIST_VIEW_OPTIONS } from '@shared/models/list-view.model';
import { ITEMS, WAREHOUSES } from '@core/mock-data';
import { STOCK_LEDGER_MOVEMENT_LABEL, StockLedgerMovementType, Tone } from '@core/models';
import { WarehouseOpsState } from '../../warehouse-ops-state';

const TYPE_TONE: Record<StockLedgerMovementType, Tone> = {
  inbound: 'success',
  outbound: 'info',
};

const TYPE_OPTIONS: { value: StockLedgerMovementType; label: string }[] = (
  Object.entries(STOCK_LEDGER_MOVEMENT_LABEL) as [StockLedgerMovementType, string][]
).map(([value, label]) => ({ value, label }));

@Component({
  selector: 'app-stock-ledger-list',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCheckboxImports, DataTable, ListToolbar, ListPagination, StatusBadge],
  templateUrl: './stock-ledger-list.html',
})
export class StockLedgerList {
  private readonly warehouseOpsState = inject(WarehouseOpsState);

  protected readonly search = signal('');
  protected readonly view = signal<'list' | 'grid' | 'kanban'>('list');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly typeFilter = signal<Set<StockLedgerMovementType>>(new Set());

  protected readonly views: ListViewOption[] = [LIST_VIEW_OPTIONS.list];
  protected readonly typeOptions = TYPE_OPTIONS;

  protected readonly columns: DataTableColumn[] = [
    { key: 'date', header: 'Fecha', width: '110px' },
    { key: 'itemId', header: 'Artículo' },
    { key: 'type', header: 'Tipo', width: '130px' },
    { key: 'documentNumber', header: 'Documento', width: '160px' },
    { key: 'locationId', header: 'Ubicación', width: '170px' },
    { key: 'inboundQuantity', header: 'Entrada', align: 'end', width: '90px' },
    { key: 'outboundQuantity', header: 'Salida', align: 'end', width: '90px' },
    { key: 'balance', header: 'Saldo', align: 'end', width: '90px' },
    { key: 'user', header: 'Usuario', width: '140px' },
  ];

  protected readonly filteredRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const types = this.typeFilter();
    return this.warehouseOpsState.stockLedger().filter((m) => {
      const matchesType = types.size === 0 || types.has(m.type);
      const matchesSearch = !term || m.documentNumber.toLowerCase().includes(term) || this.itemLabel(m.itemId).toLowerCase().includes(term);
      return matchesType && matchesSearch;
    }).reverse();
  });

  protected readonly filterCount = computed(() => this.typeFilter().size);

  protected readonly paginatedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  protected toggleTypeFilter(value: StockLedgerMovementType): void {
    this.typeFilter.update((set) => this.toggled(set, value));
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.typeFilter.set(new Set());
  }

  private toggled<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected locationName(locationId: string): string {
    for (const wh of WAREHOUSES) {
      const loc = wh.locations.find((l) => l.id === locationId);
      if (loc) return loc.name;
    }
    return locationId;
  }

  protected typeLabel(type: StockLedgerMovementType): string {
    return STOCK_LEDGER_MOVEMENT_LABEL[type];
  }

  protected typeTone(type: StockLedgerMovementType): Tone {
    return TYPE_TONE[type];
  }
}
