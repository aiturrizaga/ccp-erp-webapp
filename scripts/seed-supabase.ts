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
  APP_USERS,
  CONTACTS,
  CREDIT_AGREEMENTS,
  CUSTOMERS,
  DISPATCH_GUIDES,
  DOCUMENT_DELIVERIES,
  DOC_SERIES,
  GOODS_RECEIPTS,
  INVOICES,
  ITEMS,
  PURCHASE_ORDERS,
  PURCHASE_REQUIREMENTS,
  QUOTATIONS,
  REPLENISHMENT_SUGGESTIONS,
  SALES_CLAIMS,
  SALES_ORDERS,
  SALES_PRODUCTS,
  SALES_QUOTATIONS,
  STOCK_ISSUES,
  STOCK_LEDGER,
  STOCK_LOTS,
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
  await seed('replenishment_suggestions', REPLENISHMENT_SUGGESTIONS, (s) => ({ status: s.status, area: s.area }));
  await seed('purchase_requirements', PURCHASE_REQUIREMENTS, (r) => ({ status: r.status, area: r.area }));
  await seed('quotations', QUOTATIONS, (q) => ({ status: q.status, requirement_id: q.requirementId }));
  await seed('purchase_orders', PURCHASE_ORDERS, (po) => ({ status: po.status, supplier_id: po.supplierId }));
  await seed('goods_receipts', GOODS_RECEIPTS, (r) => ({ status: r.status, purchase_order_id: r.purchaseOrderId }));
  await seed('stock_issues', STOCK_ISSUES, (i) => ({ status: i.status, work_sheet_id: i.workSheetId ?? null }));
  await seed('stock_lots', STOCK_LOTS, (l) => ({ item_id: l.itemId, status: l.status }));
  await seed('stock_ledger_entries', STOCK_LEDGER, (e) => ({ item_id: e.itemId }));

  // --- Ventas + Cobranzas/Facturación ---
  await seed('users', APP_USERS, () => ({}));
  await seed('sales_products', SALES_PRODUCTS, (p) => ({ category: p.category, status: p.status }));
  await seed('customers', CUSTOMERS, (c) => ({ tax_id: c.taxId, payment_mode: c.paymentMode ?? null }));
  await seed('customer_contacts', CONTACTS, (c) => ({ customer_id: c.customerId, type: c.type ?? null }));
  await seed('sales_quotations', SALES_QUOTATIONS, (q) => ({ status: q.status, customer_id: q.customerId }));
  await seed('sales_orders', SALES_ORDERS, (o) => ({ status: o.status, customer_id: o.customerId }));
  await seed('sales_claims', SALES_CLAIMS, (c) => ({ status: c.status, sales_order_id: c.salesOrderId }));
  await seed('invoices', INVOICES, (i) => ({ status: i.status, document_type: i.documentType }));
  await seed('doc_series', DOC_SERIES, (s) => ({ doc_kind: s.docKind, environment: s.environment }));
  await seed('dispatch_guides', DISPATCH_GUIDES, (g) => ({ status: g.status, kind: g.kind }));
  await seed('credit_agreements', CREDIT_AGREEMENTS, (a) => ({ status: a.status, customer_id: a.customerId }));
  await seed('document_deliveries', DOCUMENT_DELIVERIES, (d) => ({ kind: d.kind, customer_id: d.customerId }));

  console.log('Done.');
}

main();
