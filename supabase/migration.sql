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

create table if not exists purchase_requisitions (
  id text primary key,
  status text not null,
  area text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists quotations (
  id text primary key,
  status text not null,
  requisition_id text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

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

-- Safe to re-run: skips anything already created instead of erroring.
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'items', 'suppliers', 'purchase_requisitions', 'quotations',
    'purchase_orders', 'goods_receipts', 'stock_issues', 'stock_ledger_entries'
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
