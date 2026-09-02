import { AppUser } from '@core/models';

/** The pilot users for the CCP prototype — one per area, so stakeholders can compare what each role sees. */
export const APP_USERS: AppUser[] = [
  { id: 'USR-001', email: 'mvillarreal@ccp.pe', password: 'prueb@s', name: 'M. Villarreal', area: 'Almacén', role: 'warehouse' },
  { id: 'USR-002', email: 'conie@ccp.pe', password: 'prueb@s', name: 'Conie', area: 'Logística', role: 'purchasing' },
  { id: 'USR-003', email: 'ana@ccp.pe', password: 'prueb@s', name: 'Ana', area: 'Ventas', role: 'sales' },
  { id: 'USR-004', email: 'margot@ccp.pe', password: 'prueb@s', name: 'Margot', area: 'Cobranzas y Facturación', role: 'billing' },
];
