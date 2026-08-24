import { Injectable, signal } from '@angular/core';
import { ITEMS } from '@core/mock-data';
import { Item, ItemSupplierLink, StockTypeCode } from '@core/models';

/** CCP assigns each item's code by prefixing its stock-type classification onto a running correlative. */
const STOCK_TYPE_PREFIX: Record<StockTypeCode, string> = {
  '01': 'ME',
  '03': 'MP',
  '05': 'SU',
  '06': 'MA',
};

export type NewItemInput = Omit<Item, 'id' | 'code'>;

/** In-memory mutable store for the item catalog, scoped to Inventario. Lets "Nuevo artículo" append a real Item without touching the read-only fixture array. No persistence — resets on reload. */
@Injectable({ providedIn: 'root' })
export class InventoryState {
  readonly items = signal<Item[]>([...ITEMS]);

  addItem(input: NewItemInput): Item {
    const code = this.nextCode(STOCK_TYPE_PREFIX[input.stockType]);
    const item: Item = { ...input, id: code, code };
    this.items.update((items) => [...items, item]);
    return item;
  }

  /** A new primary link demotes any other primary link already on the item — only one supplier can be primary at a time. */
  addSupplierLink(itemId: string, link: ItemSupplierLink): void {
    this.items.update((items) =>
      items.map((item) => {
        if (item.id !== itemId) return item;
        const suppliers = link.isPrimary ? item.suppliers.map((s) => ({ ...s, isPrimary: false })) : item.suppliers;
        return { ...item, suppliers: [...suppliers, link] };
      }),
    );
  }

  private nextCode(prefix: string): string {
    let max = 0;
    for (const item of this.items()) {
      if (!item.code.startsWith(prefix)) continue;
      const n = parseInt(item.code.slice(prefix.length), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
    return `${prefix}${String(max + 1).padStart(5, '0')}`;
  }
}
