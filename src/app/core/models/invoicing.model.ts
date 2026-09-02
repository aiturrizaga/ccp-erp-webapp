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

export type ComprobanteKind = 'factura' | 'boleta' | 'nota_credito' | 'nota_debito';

export const COMPROBANTE_KIND_LABEL: Record<ComprobanteKind, string> = {
  factura: 'Factura',
  boleta: 'Boleta de venta',
  nota_credito: 'Nota de crédito',
  nota_debito: 'Nota de débito',
};

export type PaymentCondition = 'contado' | 'credito';

export const PAYMENT_CONDITION_LABEL: Record<PaymentCondition, string> = {
  contado: 'Contado',
  credito: 'Crédito',
};

/** An anticipo already invoiced that is being applied against this comprobante. */
export interface AppliedAdvance {
  invoiceNumber: string;
  amount: number;
}

export interface InvoiceInstallment {
  number: number;
  dueDate: string;
  amount: number;
  paid: boolean;
}

/** SUNAT's comprobante totals block (matches the printed layout in invoice_ccp_old). */
export interface SunatTotals {
  gravado: number;
  inafecto: number;
  exonerado: number;
  exportacion: number;
  descuentos: number;
  gratuitos: number;
  igv: number;
  isc: number;
  anticipos: number;
  importeTotal: number;
}

export interface SalesInvoice extends InvoiceBase {
  documentType: 'sales';
  customerName: string;
  salesOrderId?: string;
  // --- Phase 09 additions (optional so legacy fixture rows still type-check) ---
  docKind?: ComprobanteKind;
  series?: string;
  correlativo?: string;
  customerId?: string;
  customerTaxId?: string;
  /** Cotización code, when the sale started from a quotation. */
  quotationCode?: string;
  /** Customer's OC reference, when the sale started from / carries a purchase order. */
  purchaseOrderRef?: string;
  glosa?: string;
  paymentCondition?: PaymentCondition;
  advances?: AppliedAdvance[];
  earlyPaymentDiscountPct?: number;
  installments?: InvoiceInstallment[];
  sunatTotals?: SunatTotals;
  /** Guía de remisión that generated this invoice, if any. */
  dispatchGuideId?: string;
  /** A free comprobante isn't tied to any pedido/cotización — the general e-invoicing use case. */
  isFreeDocument?: boolean;
  /** Set on a nota_credito / refacturación. */
  correctsInvoiceId?: string;
  sunatStatus?: 'pending' | 'accepted' | 'rejected' | 'internal';
  sentToCustomerAt?: string;
}

export type Invoice = PurchaseInvoice | SalesInvoice;

// ---------------------------------------------------------------------------
// Phase 09 — Series y correlativos por emisor
// ---------------------------------------------------------------------------

export type SeriesEnvironment = 'sunat' | 'interna';

export const SERIES_ENVIRONMENT_LABEL: Record<SeriesEnvironment, string> = {
  sunat: 'SUNAT (electrónica)',
  interna: 'Uso interno',
};

export type SeriesDocKind = ComprobanteKind | 'guia_remision';

export const SERIES_DOC_KIND_LABEL: Record<SeriesDocKind, string> = {
  factura: 'Factura',
  boleta: 'Boleta de venta',
  nota_credito: 'Nota de crédito',
  nota_debito: 'Nota de débito',
  guia_remision: 'Guía de remisión',
};

export interface DocSeries {
  id: string;
  emisorRuc: string;
  emisorName: string;
  docKind: SeriesDocKind;
  series: string;
  lastCorrelativo: number;
  environment: SeriesEnvironment;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Phase 10 — Guías de remisión
// ---------------------------------------------------------------------------

export type GuideGlosa = 'guia_custodia' | 'traslado' | 'entrega_parcial';

export const GUIDE_GLOSA_LABEL: Record<GuideGlosa, string> = {
  guia_custodia: 'Guía custodia',
  traslado: 'Traslado',
  entrega_parcial: 'Entrega parcial',
};

export type GuideKind = 'sunat' | 'interna';

export type DispatchGuideStatus = 'draft' | 'issued' | 'in_transit' | 'delivered' | 'voided';

export const DISPATCH_GUIDE_STATUS_LABEL: Record<DispatchGuideStatus, string> = {
  draft: 'Borrador',
  issued: 'Emitida',
  in_transit: 'En tránsito',
  delivered: 'Entregada',
  voided: 'Anulada',
};

export const DISPATCH_GUIDE_STATUS_TONE: Record<DispatchGuideStatus, Tone> = {
  draft: 'neutral',
  issued: 'info',
  in_transit: 'warning',
  delivered: 'success',
  voided: 'danger',
};

export interface DispatchGuideLine {
  description: string;
  quantity: number;
  unitOfMeasure: string;
}

export interface DispatchGuide {
  id: string;
  kind: GuideKind;
  series: string;
  correlativo: string;
  number: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  customerName: string;
  customerTaxId: string;
  glosa: GuideGlosa;
  motivoTraslado: string;
  transportista: string;
  originAddress: string;
  destinationAddress: string;
  issuedAt: string;
  status: DispatchGuideStatus;
  lines: DispatchGuideLine[];
  /** Invoice this guía generated, if any. */
  generatedInvoiceId?: string;
}

// ---------------------------------------------------------------------------
// Phase 11 — Convenios de crédito
// ---------------------------------------------------------------------------

export type CreditAgreementStatus = 'draft' | 'pending_approval' | 'active' | 'expired' | 'rejected';

export const CREDIT_AGREEMENT_STATUS_LABEL: Record<CreditAgreementStatus, string> = {
  draft: 'Borrador',
  pending_approval: 'En aprobación',
  active: 'Vigente',
  expired: 'Vencido',
  rejected: 'Rechazado',
};

export const CREDIT_AGREEMENT_STATUS_TONE: Record<CreditAgreementStatus, Tone> = {
  draft: 'neutral',
  pending_approval: 'warning',
  active: 'success',
  expired: 'danger',
  rejected: 'danger',
};

export interface CreditAgreementApproval {
  area: 'Ventas' | 'Gerencia' | 'Contabilidad';
  approvedBy?: string;
  approvedAt?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CreditAgreement {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  limit: number;
  currency: Currency;
  termDays: number;
  validFrom: string;
  validTo: string;
  status: CreditAgreementStatus;
  approvals: CreditAgreementApproval[];
  notes?: string;
}

// ---------------------------------------------------------------------------
// Phase 09/11 — Envío de documentos al cliente
// ---------------------------------------------------------------------------

export interface DocumentDelivery {
  id: string;
  customerId: string;
  customerName: string;
  /** Comprobante numbers / doc names included in this send. */
  documents: string[];
  channel: 'email';
  to: string;
  sentAt: string;
  kind: 'single' | 'expediente';
  status: 'queued' | 'sent' | 'failed';
}
