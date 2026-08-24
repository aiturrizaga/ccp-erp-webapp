import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * `null` when no credentials are configured — every caller must treat that as "persistence
 * disabled" and fall back to in-memory fixtures, not throw. Keeps the prototype fully usable
 * before anyone has set up a Supabase project.
 */
export const supabase: SupabaseClient | null =
  environment.supabaseUrl && environment.supabaseAnonKey ? createClient(environment.supabaseUrl, environment.supabaseAnonKey) : null;
