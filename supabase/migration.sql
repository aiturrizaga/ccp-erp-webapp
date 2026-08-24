-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query) for your project.
--
-- Deliberately not a real relational schema: this prototype's backend design isn't finalized yet,
-- so each App's in-memory state (a JS object of arrays) is stored as a single JSON blob per key
-- instead of proper normalized tables. This buys real, shared, cross-device persistence for
-- click-through testing today without locking in a schema we'll likely redo once the backend is
-- actually designed.

create table if not exists app_state (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table app_state enable row level security;

-- Prototype-only: anyone with the anon key can read/write every row. There is no per-user auth
-- wired up yet, so this is intentionally wide open — tighten before this ever holds real data.
create policy "anon read/write" on app_state
  for all
  to anon
  using (true)
  with check (true);
