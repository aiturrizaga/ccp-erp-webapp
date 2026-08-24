/**
 * One-time seed: pushes the app's bundled fixture data into the Supabase tables created by
 * supabase/migration.sql, so testers see the real demo dataset instead of empty tables.
 *
 * Run once, after applying the migration and filling in src/environments/environment.ts:
 *   npx tsx scripts/seed-supabase.ts
 *
 * Safe to re-run — everything is upserted by id, so re-running just refreshes rows to match the
 * fixtures again (useful to reset demo data back to a clean baseline after testers have played
 * with it).
 */
import { createClient } from '@supabase/supabase-js';
import { environment } from '../src/environments/environment';
import {
  GOODS_RECEIPTS,
  ITEMS,
  PURCHASE_ORDERS,
  PURCHASE_REQUISITIONS,
  QUOTATIONS,
  STOCK_ISSUES,
  STOCK_LEDGER,
  SUPPLIERS,
} from '../src/app/core/mock-data';

if (!environment.supabaseUrl || !environment.supabaseAnonKey) {
  console.error('Fill in src/environments/environment.ts (supabaseUrl / supabaseAnonKey) before seeding.');
  process.exit(1);
}

const supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

async function seed<T extends { id: string }>(table: string, rows: T[], extraColumns: (row: T) => Record<string, unknown>) {
  const payload = rows.map((row) => ({ id: row.id, ...extraColumns(row), data: row }));
  const { error } = await supabase.from(table).upsert(payload);
  if (error) {
    console.error(`✗ ${table}:`, error.message);
    process.exitCode = 1;
    return;
  }
  console.log(`✓ ${table} — ${rows.length} rows`);
}

async function main() {
  await seed('items', ITEMS, (i) => ({ code: i.code, active: i.active }));
  await seed('suppliers', SUPPLIERS, (s) => ({ status: s.status }));
  await seed('purchase_requisitions', PURCHASE_REQUISITIONS, (r) => ({ status: r.status, area: r.area }));
  await seed('quotations', QUOTATIONS, (q) => ({ status: q.status, requisition_id: q.requisitionId }));
  await seed('purchase_orders', PURCHASE_ORDERS, (po) => ({ status: po.status, supplier_id: po.supplierId }));
  await seed('goods_receipts', GOODS_RECEIPTS, (r) => ({ status: r.status, purchase_order_id: r.purchaseOrderId }));
  await seed('stock_issues', STOCK_ISSUES, (i) => ({ status: i.status, work_sheet_id: i.workSheetId ?? null }));
  await seed('stock_ledger_entries', STOCK_LEDGER, (e) => ({ item_id: e.itemId }));
  console.log('Done.');
}

main();
