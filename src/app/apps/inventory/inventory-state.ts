import { Injectable, signal } from '@angular/core';
import { TableStore } from '@core/supabase/table-store';
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

/** Mutable store for the item catalog, backed by the Supabase `items` table — one row per article. Falls back to the bundled fixture when Supabase isn't configured or reachable. */
@Injectable({ providedIn: 'root' })
export class InventoryState {
  private readonly itemsStore = new TableStore<Item>('items');

  readonly items = signal<Item[]>([...ITEMS]);

  constructor() {
    this.itemsStore.fetchAll().then((rows) => {
      if (rows?.length) this.items.set(rows);
    });
    this.itemsStore.subscribe((item) => {
      this.items.update((items) => (items.some((i) => i.id === item.id) ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item]));
    });
  }

  addItem(input: NewItemInput): Item {
    const code = this.nextCode(STOCK_TYPE_PREFIX[input.stockType]);
    const item: Item = { ...input, id: code, code };
    this.items.update((items) => [...items, item]);
    this.itemsStore.upsert(item, (i) => ({ code: i.code, active: i.active }));
    return item;
  }

  /** A new primary link demotes any other primary link already on the item — only one supplier can be primary at a time. */
  addSupplierLink(itemId: string, link: ItemSupplierLink): void {
    let patched: Item | undefined;
    this.items.update((items) =>
      items.map((item) => {
        if (item.id !== itemId) return item;
        const suppliers = link.isPrimary ? item.suppliers.map((s) => ({ ...s, isPrimary: false })) : item.suppliers;
        patched = { ...item, suppliers: [...suppliers, link] };
        return patched;
      }),
    );
    if (patched) this.itemsStore.upsert(patched, (i) => ({ code: i.code, active: i.active }));
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
