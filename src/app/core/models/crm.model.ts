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

export interface Customer {
  id: string;
  legalName: string;
  taxId: string;
  address: string;
  paymentTerms: string;
  currency: Currency;
  commercialTerms: string;
}

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  position: string;
  email: string;
  phone: string;
}
