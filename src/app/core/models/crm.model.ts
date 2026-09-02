import { Currency, HistoryEvent, Tone } from './shared.model';

/** Master data owned by the CRM app: commercial pipeline (leads, opportunities) and the customer master record. */
export type LeadSource = 'web' | 'referral' | 'trade_show' | 'call' | 'other';

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  web: 'Sitio web',
  referral: 'Referido',
  trade_show: 'Feria comercial',
  call: 'Llamada entrante',
  other: 'Otro',
};

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'discarded';

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  discarded: 'Descartado',
};

export const LEAD_STATUS_TONE: Record<LeadStatus, Tone> = {
  new: 'info',
  contacted: 'warning',
  qualified: 'success',
  discarded: 'danger',
};

export interface Lead {
  id: string;
  contactName: string;
  company: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  createdAt: string;
  notes?: string;
  convertedOpportunityId?: string;
}

export type OpportunityStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export const OPPORTUNITY_STAGE_LABEL: Record<OpportunityStage, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
  won: 'Ganado',
  lost: 'Perdido',
};

export const OPPORTUNITY_STAGE_TONE: Record<OpportunityStage, Tone> = {
  new: 'info',
  contacted: 'info',
  qualified: 'warning',
  proposal: 'warning',
  negotiation: 'warning',
  won: 'success',
  lost: 'danger',
};

export interface Opportunity {
  id: string;
  title: string;
  customerId: string;
  expectedAmount: number;
  currency: Currency;
  stage: OpportunityStage;
  estimatedCloseDate: string;
  salesRep: string;
  activities: HistoryEvent[];
}

export type CustomerDocType = 'RUC' | 'DNI';

/** How CCP sells to this customer. `credit` clients pass straight through while under their limit;
 *  `cash` clients must upload the PO + a 50% advance voucher for Cobranzas to validate first.
 *  A customer can be enabled for one or both (see `Customer.paymentModes`). */
export type CustomerPaymentMode = 'credit' | 'cash';

export const CUSTOMER_PAYMENT_MODE_LABEL: Record<CustomerPaymentMode, string> = {
  credit: 'Línea de crédito',
  cash: 'Contado',
};

export interface Customer {
  id: string;
  legalName: string;
  taxId: string;
  address: string;
  paymentTerms: string;
  currency: Currency;
  commercialTerms: string;
  // --- added for the Sales app's customer master (all optional so CRM keeps working) ---
  docType?: CustomerDocType;
  /** Nombre comercial, when it differs from the razón social. */
  tradeName?: string;
  /** Agente de retención de IGV — pulled from the SUNAT/RUC lookup. */
  isRetentionAgent?: boolean;
  /** Domicilio fiscal from RUC; `address` stays the delivery/reference address. */
  fiscalAddress?: string;
  /** Modalidades de venta habilitadas para el cliente (una o ambas). */
  paymentModes?: CustomerPaymentMode[];
  /** Modalidad principal — derivada de `paymentModes` (credit si está habilitado, si no cash). Se
   *  conserva para el código que decide con un solo valor. */
  paymentMode?: CustomerPaymentMode;
  creditLimit?: number;
  creditUsed?: number;
  /** ISO date of the last successful SUNAT/RENIEC data sync. */
  lastSyncedAt?: string;
}

export type ContactType = 'representante_legal' | 'comercial' | 'sistemas' | 'facturacion' | 'cobranzas' | 'logistica' | 'otro';

export const CONTACT_TYPE_LABEL: Record<ContactType, string> = {
  representante_legal: 'Representante legal',
  comercial: 'Comercial',
  sistemas: 'Sistemas',
  facturacion: 'Facturación',
  cobranzas: 'Cobranzas',
  logistica: 'Logística',
  otro: 'Otro',
};

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  // --- added for the Sales app ---
  type?: ContactType;
  firstName?: string;
  lastName?: string;
  mobile?: string;
}
