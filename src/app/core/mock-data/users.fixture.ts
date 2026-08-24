import { AppUser } from '@core/models';

/** The two pilot users for the CCP prototype — one per area, so stakeholders can compare what each role sees. */
export const APP_USERS: AppUser[] = [
  { email: 'mvillarreal@ccp.pe', password: 'prueb@s', name: 'M. Villarreal', area: 'Almacén', role: 'warehouse' },
  { email: 'conie@ccp.pe', password: 'prueb@s', name: 'Conie', area: 'Logística', role: 'purchasing' },
];
