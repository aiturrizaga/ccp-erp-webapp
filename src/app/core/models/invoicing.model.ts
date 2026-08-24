import { Currency, Tone } from './shared.model';
// Finanzas already defines InvoiceStatus/PaymentMethod (and their labels/tones) as a deliberate
// forward-compatible mirror of Facturación's model — see the comment on finance.model.ts. Reuse
// those exports instead of redeclaring them here to avoid a barrel export collision.
import { InvoiceStatus } from './finance.model';

export type { InvoiceStatus, PaymentMethod } from './finance.model';
export { INVOICE_STATUS_LABEL, INVOICE_STATUS_TONE, PAYMENT_METHOD_LABEL } from './finance.model';

export type InvoiceDocumentType = 'sales' | 'purchase';

export const INVOICE_DOCUMENT_TYPE_LABEL: Record<InvoiceDocumentType, string> = {
  sales: 'Venta',
  purchase: 'Compra',
};

export const INVOICE_DOCUMENT_TYPE_TONE: Record<InvoiceDocumentType, Tone> = {
  sales: 'info',
  purchase: 'neutral',
};

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface InvoiceBase {
  id: string;
  number: string;
  status: InvoiceStatus;
  issuedAt: string;
  dueDate: string;
  currency: Currency;
  lines: InvoiceLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  outstandingBalance: number;
}

export interface PurchaseInvoice extends InvoiceBase {
  documentType: 'purchase';
  supplierId: string;
  purchaseOrderId?: string;
}

export interface SalesInvoice extends InvoiceBase {
  documentType: 'sales';
  customerName: string;
  salesOrderId?: string;
}

export type Invoice = PurchaseInvoice | SalesInvoice;
