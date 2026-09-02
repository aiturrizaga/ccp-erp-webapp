export type Currency = 'PEN' | 'USD';

/** Visual tone consumed by the shared StatusBadge component. */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type AttachmentKind = 'image' | 'pdf' | 'document';

export interface Attachment {
  id: string;
  name: string;
  kind: AttachmentKind;
  uploadedBy: string;
  uploadedAt: string;
}

export interface HistoryEvent {
  date: string;
  user: string;
  action: string;
  detail?: string;
}

export interface Signature {
  signedBy: string;
  role: string;
  signedAt: string;
}

/**
 * Document number prefixes, one per document type, kept in a single place so each area's documents
 * stay visually distinct — Ventas' quotations must not be confused with Logística's, and so on.
 * The full number is `${prefix}-${year}-${seq}` (e.g. `CV-2026-0007`), except SUNAT comprobantes,
 * which follow the `serie-correlativo` shape SUNAT imposes (see Facturación).
 */
export type DocPrefixKey =
  | 'sales_quotation'
  | 'logistics_quotation'
  | 'sales_order'
  | 'sales_claim'
  | 'purchase_quotation'
  | 'purchase_requirement';

export const DOC_PREFIX: Record<DocPrefixKey, string> = {
  sales_quotation: 'CV',
  logistics_quotation: 'CL',
  sales_order: 'PV',
  sales_claim: 'REC',
  purchase_quotation: 'COT',
  purchase_requirement: 'RC',
};

export const DOC_PREFIX_LABEL: Record<DocPrefixKey, string> = {
  sales_quotation: 'Cotización de ventas',
  logistics_quotation: 'Cotización de logística',
  sales_order: 'Pedido de venta',
  sales_claim: 'Reclamo de cliente',
  purchase_quotation: 'Cotización de compras',
  purchase_requirement: 'Requerimiento de compra',
};
