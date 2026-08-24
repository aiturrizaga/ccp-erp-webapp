import { effect } from '@angular/core';
import { supabase } from './supabase-client';

const TABLE = 'app_state';
const DEBOUNCE_MS = 600;

/**
 * Fetches the last-saved JSON snapshot for `key` (e.g. 'purchasing', 'inventory'). Returns `null`
 * when Supabase isn't configured, the row doesn't exist yet, or the request fails — callers should
 * treat that as "keep the fixture-seeded defaults", never as an error to surface to the user.
 */
export async function loadPersistedState<T>(key: string): Promise<T | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(TABLE).select('data').eq('key', key).maybeSingle();
    if (error || !data) return null;
    return data['data'] as T;
  } catch {
    return null;
  }
}

/**
 * Wires a reactive effect that debounced-upserts `getValue()`'s result to Supabase under `key`
 * every time it changes. Must be called from an injection context (e.g. a service constructor).
 * A no-op when Supabase isn't configured — the state service behaves exactly as it did before,
 * in-memory only.
 */
export function persistState<T>(key: string, getValue: () => T): void {
  if (!supabase) return;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let skipFirst = true;

  effect(() => {
    const value = getValue();
    // The effect's first run fires immediately on wiring, before any load has had a chance to
    // apply — skip it so we don't overwrite a real snapshot with the fixture-seeded initial value.
    if (skipFirst) {
      skipFirst = false;
      return;
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      supabase!
        .from(TABLE)
        .upsert({ key, data: value, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.warn(`[supabase] failed to persist "${key}"`, error);
        });
    }, DEBOUNCE_MS);
  });
}
