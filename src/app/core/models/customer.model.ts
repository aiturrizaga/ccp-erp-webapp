import { Currency } from './shared.model';

/**
 * Customer/contact master record, owned by Ventas (formerly lived on the now-removed CRM app —
 * CRM's own pipeline entities, Lead/Opportunity, were dropped with it; this master record wasn't).
 */
export type CustomerDocType = 'RUC' | 'DNI';

export type CustomerPaymentMode = 'credit' | 'cash';

export const CUSTOMER_PAYMENT_MODE_LABEL: Record<CustomerPaymentMode, string> = {
  credit: 'Crédito',
  cash: 'Contado',
};

export interface Customer {
  id: string;
  legalName: string;
  tradeName?: string;
  taxId: string;
  docType?: CustomerDocType;
  address: string;
  fiscalAddress?: string;
  isRetentionAgent?: boolean;
  paymentTerms: string;
  currency: Currency;
  commercialTerms?: string;
  /** One or more modalities enabled for this customer — `paymentMode` is kept as the primary/default one for legacy call sites. */
  paymentModes?: CustomerPaymentMode[];
  paymentMode?: CustomerPaymentMode;
  creditLimit?: number;
  creditUsed?: number;
  lastSyncedAt?: string;
}

export type ContactType = 'representante_legal' | 'comercial' | 'facturacion' | 'cobranzas';

export const CONTACT_TYPE_LABEL: Record<ContactType, string> = {
  representante_legal: 'Representante legal',
  comercial: 'Comercial',
  facturacion: 'Facturación',
  cobranzas: 'Cobranzas',
};

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  position?: string;
  email: string;
  phone: string;
  type: ContactType;
  firstName?: string;
  lastName?: string;
  mobile?: string;
}
