import { Currency, Tone } from './shared.model';

/**
 * Minimal local reference to a CRM customer. The Sales App does not import from CRM
 * (Apps only depend on core/shared) — customerId/customerName are kept as plain fields
 * here and will be reconciled with the real `Customer` model from `core/models/crm.model.ts`
 * once both Apps exist.
 */
export interface CustomerRef {
  id: string;
  legalName: string;
}

export type SalesQuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export const SALES_QUOTATION_STATUS_LABEL: Record<SalesQuotationStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Vencida',
};

export const SALES_QUOTATION_STATUS_TONE: Record<SalesQuotationStatus, Tone> = {
  draft: 'neutral',
  sent: 'info',
  accepted: 'success',
  rejected: 'danger',
  expired: 'warning',
};

export interface SalesQuotationLine {
  productCode: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
}

export interface SalesQuotation {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  status: SalesQuotationStatus;
  currency: Currency;
  issuedAt: string;
  expiresAt: string;
  lines: SalesQuotationLine[];
  total: number;
  /** Future reference to a CRM Opportunity — plain string until CRM exists. */
  opportunityId?: string;
  notes?: string;
}

export type SalesOrderStatus = 'confirmed' | 'preparing' | 'dispatched' | 'invoiced' | 'cancelled';

export const SALES_ORDER_STATUS_LABEL: Record<SalesOrderStatus, string> = {
  confirmed: 'Confirmada',
  preparing: 'En preparación',
  dispatched: 'Despachada',
  invoiced: 'Facturada',
  cancelled: 'Cancelada',
};

export const SALES_ORDER_STATUS_TONE: Record<SalesOrderStatus, Tone> = {
  confirmed: 'info',
  preparing: 'warning',
  dispatched: 'success',
  invoiced: 'success',
  cancelled: 'danger',
};

export interface SalesOrderLine {
  productCode: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
}

export interface SalesOrder {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  quotationId?: string;
  status: SalesOrderStatus;
  currency: Currency;
  confirmedAt: string;
  committedDeliveryDate: string;
  deliveryAddress: string;
  lines: SalesOrderLine[];
  total: number;
  notes?: string;
}
