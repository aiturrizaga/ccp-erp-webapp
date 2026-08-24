export interface InventoryMonthlyStat {
  month: string;
  itemId: string;
  supplierId: string;
  /** Valorized goods receipts for the month (soles, no I.G.V.). */
  purchases: number;
  /** Valorized outbound consumption for the month (soles, no I.G.V.). */
  consumption: number;
  /** Month-end valorized stock on hand for this item (soles, no I.G.V.). */
  inventory: number;
}

export const INVENTORY_ANALYTICS_MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'];

/** Same seasonal shape for every item — a dip around Abril (fewer work orders) and a peak in Mayo, mirroring CCP's real production calendar. */
const PURCHASE_FACTOR = [1.05, 0.88, 1.02, 0.58, 1.42, 1.18, 1.0];
const CONSUMPTION_FACTOR = [1.02, 0.9, 0.95, 0.68, 1.15, 1.2, 1.05];

interface ItemBaseline {
  itemId: string;
  supplierId: string;
  basePurchase: number;
  baseConsumption: number;
  openingInventory: number;
}

/**
 * The live Kardex (STOCK_LEDGER) only covers a couple of weeks of real transactions — too sparse
 * for a 7-month trend. This is standalone illustrative mock data (same convention as the rest of
 * the prototype's fixtures) for the 8 highest-turnover raw materials/supplies, each tied to its
 * real primary supplier from suppliers.fixture.ts, so the Inventario dashboard's Proveedor/Material
 * filters have real, distinguishable series to switch between.
 */
const ITEM_BASELINES: ItemBaseline[] = [
  { itemId: 'MP00006', supplierId: 'SUP-011', basePurchase: 178000, baseConsumption: 172000, openingInventory: 48000 },
  { itemId: 'MP00009', supplierId: 'SUP-012', basePurchase: 92000, baseConsumption: 89000, openingInventory: 26000 },
  { itemId: 'MP00010', supplierId: 'SUP-013', basePurchase: 41000, baseConsumption: 39500, openingInventory: 12000 },
  { itemId: 'MP00011', supplierId: 'SUP-013', basePurchase: 132000, baseConsumption: 126000, openingInventory: 34000 },
  { itemId: 'MP00013', supplierId: 'SUP-013', basePurchase: 151000, baseConsumption: 144000, openingInventory: 39000 },
  { itemId: 'MA00001', supplierId: 'SUP-016', basePurchase: 24500, baseConsumption: 23800, openingInventory: 7200 },
  { itemId: 'MA00031', supplierId: 'SUP-006', basePurchase: 15200, baseConsumption: 14600, openingInventory: 4100 },
  { itemId: 'MP00003', supplierId: 'SUP-005', basePurchase: 58000, baseConsumption: 56500, openingInventory: 15800 },
];

const round2 = (n: number): number => Math.round(n * 100) / 100;

function buildSeries(): InventoryMonthlyStat[] {
  const rows: InventoryMonthlyStat[] = [];
  for (const base of ITEM_BASELINES) {
    let runningInventory = base.openingInventory;
    INVENTORY_ANALYTICS_MONTHS.forEach((month, i) => {
      const purchases = round2(base.basePurchase * PURCHASE_FACTOR[i]);
      const consumption = round2(base.baseConsumption * CONSUMPTION_FACTOR[i]);
      runningInventory = Math.max(0, runningInventory + purchases - consumption);
      rows.push({ month, itemId: base.itemId, supplierId: base.supplierId, purchases, consumption, inventory: round2(runningInventory) });
    });
  }
  return rows;
}

export const INVENTORY_MONTHLY_STATS: InventoryMonthlyStat[] = buildSeries();
