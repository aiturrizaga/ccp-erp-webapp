import { Injectable } from '@angular/core';
import { CustomerDocType } from '@core/models';

/**
 * Look up a party's data from its DNI/RUC. This is the ONE external call the prototype makes —
 * API PERU (https://apiperu.dev), using the DEV token the client provided. If the call fails
 * (offline, CORS, rate limit) it falls back to a tiny local table so the demo keeps working.
 */
const API_PERU_TOKEN = 'e73ee3aae3e090fba4efdfcdb18e2f47570f8639c82ee9ff0e659eaba86349cc';
const API_PERU_BASE = 'https://apiperu.dev/api';

export interface PartyData {
  taxId: string;
  legalName: string;
  tradeName?: string;
  fiscalAddress?: string;
  isRetentionAgent?: boolean;
  status?: string;
  condition?: string;
  source: 'apiperu' | 'offline';
}

const OFFLINE: Record<string, Omit<PartyData, 'source'>> = {
  '20549546626': { taxId: '20549546626', legalName: 'CONCRETO CENTRIFUGADO PERU S.A.C.', fiscalAddress: 'URB. LAS DALMACIAS LOTE 17, PUENTE PIEDRA - LIMA - LIMA', isRetentionAgent: false, status: 'ACTIVO', condition: 'HABIDO' },
  '20259531364': { taxId: '20259531364', legalName: 'ELECTRO SUR ESTE S.A.A.', fiscalAddress: 'AV. CIRCUNVALACION NRO. 1512, WANCHAQ - CUSCO - CUSCO', isRetentionAgent: true, status: 'ACTIVO', condition: 'HABIDO' },
  '20486185296': { taxId: '20486185296', legalName: 'INGENIERIA Y SERVICIOS SAENZ E.I.R.L.', fiscalAddress: 'CAL. TIAHUANACO NRO. 153, SANTA ANITA - LIMA - LIMA', isRetentionAgent: false, status: 'ACTIVO', condition: 'HABIDO' },
  '10456782341': { taxId: '10456782341', legalName: 'MENDOZA CACERES JORGE LUIS', fiscalAddress: '-', isRetentionAgent: false },
};

@Injectable({ providedIn: 'root' })
export class DocLookupService {
  async lookup(docType: CustomerDocType, numberValue: string): Promise<PartyData> {
    const clean = numberValue.replace(/\D/g, '');
    try {
      if (docType === 'RUC') return await this.ruc(clean);
      return await this.dni(clean);
    } catch {
      const hit = OFFLINE[clean];
      if (hit) return { ...hit, source: 'offline' };
      return { taxId: clean, legalName: '', source: 'offline' };
    }
  }

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
      isRetentionAgent: d.es_agente_de_retencion ?? false,
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
