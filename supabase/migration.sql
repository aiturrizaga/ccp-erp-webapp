-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
--
-- One real table per entity type, each row individually addressable by its own primary key
-- (the same id already used across the app: 'PR-001', 'QT-003', 'PO-010', etc). Replaces the
-- earlier single app_state(key, data) blob table — that approach saved an entire App's state as
-- one JSON document per save, so two people editing different documents at the same time could
-- silently overwrite each other. Per-row tables mean each save only touches the row it changed.
--
-- Columns are a hybrid: the fields worth filtering/joining on directly (status, foreign keys) get
-- real columns; everything else stays in `data jsonb` as the full entity. Full 3NF normalization
-- of nested line items (requisition lines, quotation offers, PO lines, etc.) is deliberately
-- deferred until the real backend schema is designed — this is still a meaningful upgrade over the
-- blob approach without locking in a schema that will likely be redone.

drop table if exists app_state;

create table if not exists items (
  id text primary key,
  code text not null,
  active boolean not null default true,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists suppliers (
  id text primary key,
  status text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Renamed from `purchase_requisitions`: each row is now a Reposición sugerida entry (one per HT with a
-- shortfall, or a manual request) — it no longer carries its own approval, only whether it's free
-- ('draft') or locked inside an active Requerimiento de Compra ('grouped').
alter table if exists purchase_requisitions rename to replenishment_suggestions;

create table if not exists replenishment_suggestions (
  id text primary key,
  status text not null,
  area text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Requerimiento de Compra (RC) — the block Almacén actually sends to Logística, grouping one or more
-- Reposición sugerida rows. Carries its own approval lifecycle; rejecting/observing it releases every
-- grouped suggestion back to 'draft' without deleting the RC itself (kept forever for trazabilidad).
create table if not exists purchase_requirements (
  id text primary key,
  status text not null,
  area text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists quotations (
  id text primary key,
  status text not null,
  requirement_id text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'quotations' and column_name = 'requisition_id') then
    alter table quotations rename column requisition_id to requirement_id;
  end if;
end $$;

create table if not exists purchase_orders (
  id text primary key,
  status text not null,
  supplier_id text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists goods_receipts (
  id text primary key,
  status text not null,
  purchase_order_id text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists stock_issues (
  id text primary key,
  status text not null,
  work_sheet_id text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists stock_ledger_entries (
  id text primary key,
  item_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- One row per lote — dispatching now draws down a specific lot's `quantity` (see `data.quantity`)
-- instead of just decrementing an aggregate stock number, so Almacén can pick FIFO or a specific lot.
create table if not exists stock_lots (
  id text primary key,
  item_id text not null,
  status text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Safe to re-run: skips anything already created instead of erroring.
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'items', 'suppliers', 'replenishment_suggestions', 'purchase_requirements', 'quotations',
    'purchase_orders', 'goods_receipts', 'stock_issues', 'stock_lots', 'stock_ledger_entries'
  ])
  loop
    execute format('alter table %I enable row level security', t);

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'anon read/write') then
      execute format('create policy "anon read/write" on %I for all to anon using (true) with check (true)', t);
    end if;

    -- Live updates: lets connected clients see each other''s changes without a manual reload.
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;

-- ===========================================================================
-- Ventas + Cobranzas/Facturación (prototype). Same shape as above: `id` PK,
-- a few filterable columns, full entity in `data jsonb`. Safe to re-run.
-- ===========================================================================

create table if not exists users (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists sales_products (
  id text primary key,
  category text,
  status text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id text primary key,
  tax_id text,
  payment_mode text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists customer_contacts (
  id text primary key,
  customer_id text,
  type text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists sales_quotations (
  id text primary key,
  status text,
  customer_id text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists sales_orders (
  id text primary key,
  status text,
  customer_id text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists sales_claims (
  id text primary key,
  status text,
  sales_order_id text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists invoices (
  id text primary key,
  status text,
  document_type text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists doc_series (
  id text primary key,
  doc_kind text,
  environment text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists dispatch_guides (
  id text primary key,
  status text,
  kind text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists credit_agreements (
  id text primary key,
  status text,
  customer_id text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists document_deliveries (
  id text primary key,
  kind text,
  customer_id text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'users', 'sales_products', 'customers', 'customer_contacts', 'sales_quotations', 'sales_orders',
    'sales_claims', 'invoices', 'doc_series', 'dispatch_guides', 'credit_agreements', 'document_deliveries'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'anon read/write') then
      execute format('create policy "anon read/write" on %I for all to anon using (true) with check (true)', t);
    end if;
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;
