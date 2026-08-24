import { supabase } from './supabase-client';

/**
 * Thin per-row persistence over a Supabase table shaped `{ id, ...filterColumns, data jsonb }`.
 * Each entity is its own row, addressable by its own `id` — mutations upsert only the row(s) they
 * touched, so two users editing different documents never clobber each other (unlike a single
 * JSON blob for a whole App's state). `data` always holds the full, canonical entity; the extra
 * columns exist purely so SQL can filter/join on them later.
 */
export class TableStore<T extends { id: string }> {
  constructor(private readonly table: string) {}

  /** Returns `null` when Supabase isn't configured or the fetch fails — caller should fall back to fixtures. */
  async fetchAll(): Promise<T[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from(this.table).select('data');
      if (error || !data) return null;
      return data.map((row) => row['data'] as T);
    } catch {
      return null;
    }
  }

  /** Fire-and-forget upsert of one or more rows. `extraColumns` supplies the filterable columns per row (besides `id` and `data`), keyed by entity id. */
  upsert(entities: T | T[], extraColumns: (entity: T) => Record<string, unknown> = () => ({})): void {
    if (!supabase) return;
    const rows = (Array.isArray(entities) ? entities : [entities]).map((entity) => ({
      id: entity.id,
      ...extraColumns(entity),
      data: entity,
      updated_at: new Date().toISOString(),
    }));
    supabase
      .from(this.table)
      .upsert(rows)
      .then(({ error }) => {
        if (error) console.warn(`[supabase] failed to upsert into "${this.table}"`, error);
      });
  }

  /** Live updates from other clients — merges the changed row into the caller's array by id (append if new). Returns an unsubscribe function. */
  subscribe(onChange: (entity: T) => void): () => void {
    if (!supabase) return () => {};
    const channel = supabase
      .channel(`${this.table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table: this.table }, (payload) => {
        const row = payload.new as Record<string, unknown> | undefined;
        if (row && row['data']) onChange(row['data'] as T);
      })
      .subscribe();
    return () => {
      supabase!.removeChannel(channel);
    };
  }
}
