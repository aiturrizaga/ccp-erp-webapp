/** Multi-tenant company switcher data — CCP is the only tenant today, but the UI is built to support more. */
export interface Company {
  id: string;
  name: string;
  description: string;
}

export const COMPANIES: Company[] = [{ id: 'ccp', name: 'CCP', description: 'Concreto Centrifugado Perú' }];
