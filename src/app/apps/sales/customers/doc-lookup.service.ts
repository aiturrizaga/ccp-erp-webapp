import { Injectable } from '@angular/core';
import { CustomerDocType } from '@core/models';
import { TableStore } from '@core/supabase/table-store';

/**
 * Look up a party's data from its DNI/RUC. This is the ONE external call the prototype makes —
 * API PERU (https://apiperu.dev), using the DEV token the client provided. If the call fails
 * (offline, CORS, rate limit) it falls back to a tiny local table so the demo keeps working.
 *
 * Every successful hit is cached so we don't keep hitting the API for the same document:
 *   1. in-memory Map (fastest, per tab)
 *   2. localStorage (survives reloads on this browser)
 *   3. Supabase table `doc_lookups` when configured (shared across users/devices; also acts as an
 *      "event replay" log — on startup we hydrate the in-memory cache from it).
 * Tiers 2 and 3 are best-effort: if storage is unavailable or the table doesn't exist, lookups
 * still work, just without the extra caching.
 */
const API_PERU_TOKEN = 'e73ee3aae3e090fba4efdfcdb18e2f47570f8639c82ee9ff0e659eaba86349cc';
const API_PERU_BASE = 'https://apiperu.dev/api';

const CACHE_STORAGE_KEY = 'ccp:doc-lookup-cache:v1';
/** SUNAT/RENIEC master data changes rarely — a month-old cached hit is fine for a prototype. */
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export interface PartyData {
  taxId: string;
  legalName: string;
  tradeName?: string;
  fiscalAddress?: string;
  isRetentionAgent?: boolean;
  status?: string;
  condition?: string;
  source: 'apiperu' | 'offline';
  /** True when this result was served from a cache tier instead of a fresh API call. */
  fromCache?: boolean;
}

interface CacheRow {
  id: string;
  party: PartyData;
  cachedAt: number;
}

/** API PERU returns flags as the strings "SI" / "NO" (never booleans) — treat anything that isn't an affirmative as false. */
function parseYesNo(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return false;
  return ['si', 'sí', 'yes', 'true', '1'].includes(value.trim().toLowerCase());
}

const OFFLINE: Record<string, Omit<PartyData, 'source'>> = {
  '20549546626': { taxId: '20549546626', legalName: 'CONCRETO CENTRIFUGADO PERU S.A.C.', fiscalAddress: 'URB. LAS DALMACIAS LOTE 17, PUENTE PIEDRA - LIMA - LIMA', isRetentionAgent: false, status: 'ACTIVO', condition: 'HABIDO' },
  '20259531364': { taxId: '20259531364', legalName: 'ELECTRO SUR ESTE S.A.A.', fiscalAddress: 'AV. CIRCUNVALACION NRO. 1512, WANCHAQ - CUSCO - CUSCO', isRetentionAgent: true, status: 'ACTIVO', condition: 'HABIDO' },
  '20486185296': { taxId: '20486185296', legalName: 'INGENIERIA Y SERVICIOS SAENZ E.I.R.L.', fiscalAddress: 'CAL. TIAHUANACO NRO. 153, SANTA ANITA - LIMA - LIMA', isRetentionAgent: false, status: 'ACTIVO', condition: 'HABIDO' },
  '10456782341': { taxId: '10456782341', legalName: 'MENDOZA CACERES JORGE LUIS', fiscalAddress: '-', isRetentionAgent: false },
};

@Injectable({ providedIn: 'root' })
export class DocLookupService {
  private readonly mem = new Map<string, CacheRow>();
  private readonly store = new TableStore<CacheRow>('doc_lookups');
  private hydrated: Promise<void>;

  constructor() {
    this.loadFromLocalStorage();
    // "Event replay": pull every previously-seen lookup from Supabase into the in-memory cache.
    this.hydrated = this.store
      .fetchAll()
      .then((rows) => {
        for (const row of rows ?? []) {
          if (row?.id && row.party) this.mem.set(row.id, row);
        }
      })
      .catch(() => {});
  }

  async lookup(docType: CustomerDocType, numberValue: string): Promise<PartyData> {
    const clean = numberValue.replace(/\D/g, '');
    const key = `${docType}:${clean}`;

    const cached = this.readCache(key);
    if (cached) return { ...cached.party, fromCache: true };

    // Give the Supabase replay a brief chance to finish before the first real call.
    await Promise.race([this.hydrated, new Promise((r) => setTimeout(r, 800))]);
    const replayed = this.readCache(key);
    if (replayed) return { ...replayed.party, fromCache: true };

    try {
      const party = docType === 'RUC' ? await this.ruc(clean) : await this.dni(clean);
      if (party.legalName) this.writeCache(key, party);
      return party;
    } catch {
      const hit = OFFLINE[clean];
      if (hit) return { ...hit, source: 'offline' };
      return { taxId: clean, legalName: '', source: 'offline' };
    }
  }

  /** Drop every cached lookup (in-memory + localStorage). Supabase rows are left as the replay log. */
  clearCache(): void {
    this.mem.clear();
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }

  // --- cache tiers ---------------------------------------------------------

  private readCache(key: string): CacheRow | null {
    const row = this.mem.get(key);
    if (!row) return null;
    if (Date.now() - row.cachedAt > CACHE_TTL_MS) {
      this.mem.delete(key);
      return null;
    }
    return row;
  }

  private writeCache(key: string, party: PartyData): void {
    const row: CacheRow = { id: key, party: { ...party, fromCache: undefined }, cachedAt: Date.now() };
    this.mem.set(key, row);
    this.saveToLocalStorage();
    this.store.upsert(row, (r) => ({ doc_key: r.id }));
  }

  private loadFromLocalStorage(): void {
    try {
      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, CacheRow>;
      for (const [key, row] of Object.entries(parsed)) {
        if (row?.party && typeof row.cachedAt === 'number') this.mem.set(key, row);
      }
    } catch {
      /* corrupt or unavailable — ignore */
    }
  }

  private saveToLocalStorage(): void {
    try {
      const obj: Record<string, CacheRow> = {};
      for (const [key, row] of this.mem) obj[key] = row;
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(obj));
    } catch {
      /* quota or unavailable — the other tiers still cover us */
    }
  }

  // --- API PERU ----------------------------------------------------------

  private async ruc(ruc: string): Promise<PartyData> {
    const res = await fetch(`${API_PERU_BASE}/ruc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_PERU_TOKEN}` },
      body: JSON.stringify({ ruc }),
    });
    const json = await res.json();
    if (!json?.success || !json?.data) throw new Error('RUC no encontrado');
    const d = json.data;
    return {
      taxId: d.ruc ?? ruc,
      legalName: d.nombre_o_razon_social ?? '',
      tradeName: d.nombre_comercial || undefined,
      fiscalAddress: d.direccion_completa || d.direccion || undefined,
      isRetentionAgent: parseYesNo(d.es_agente_de_retencion),
      status: d.estado,
      condition: d.condicion,
      source: 'apiperu',
    };
  }

  private async dni(dni: string): Promise<PartyData> {
    const res = await fetch(`${API_PERU_BASE}/dni`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_PERU_TOKEN}` },
      body: JSON.stringify({ dni }),
    });
    const json = await res.json();
    if (!json?.success || !json?.data) throw new Error('DNI no encontrado');
    const d = json.data;
    return {
      taxId: dni,
      legalName: d.nombre_completo ?? `${d.apellido_paterno ?? ''} ${d.apellido_materno ?? ''} ${d.nombres ?? ''}`.trim(),
      isRetentionAgent: false,
      source: 'apiperu',
    };
  }
}
