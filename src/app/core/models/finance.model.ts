import { Tone } from './shared.model';

/** Status union shared by Facturación's `Invoice` and consumed by Finanzas' AP/AR views. */
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partial' | 'overdue' | 'voided';

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: 'Borrador',
  issued: 'Emitida',
  paid: 'Pagada',
  partial: 'Pago parcial',
  overdue: 'Vencida',
  voided: 'Anulada',
};

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, Tone> = {
  draft: 'neutral',
  issued: 'info',
  paid: 'success',
  partial: 'warning',
  overdue: 'danger',
  voided: 'neutral',
};

export type PaymentMethod = 'transfer' | 'cash' | 'check' | 'card';

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  transfer: 'Transferencia',
  cash: 'Efectivo',
  check: 'Cheque',
  card: 'Tarjeta',
};

