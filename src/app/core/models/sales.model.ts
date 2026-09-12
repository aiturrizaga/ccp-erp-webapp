import { Currency, Tone } from './shared.model';
import { PaymentMethod } from './finance.model';

/**
 * Commercial category of a finished product. CCP sells three lines today, and each line is booked to
 * its own income account — the account is shown (read-only) when the category is picked so whoever
 * registers the product can confirm the mapping is right.
 *
 * Account codes follow the Peruvian Plan Contable General Empresarial (cuenta 70 — Ventas). They are
 * a best guess pending confirmation from Contabilidad; keep them in this one map so a correction is a
 * one-line change.
 */
export type SalesCategory = 'ACCESORIOS' | 'FIERRO' | 'POSTES';

export const SALES_CATEGORY_LABEL: Record<SalesCategory, string> = {
  ACCESORIOS: 'Accesorios',
  FIERRO: 'Fierro',
  POSTES: 'Postes',
};

export interface AccountRef {
  code: string;
  name: string;
}

export const SALES_CATEGORY_ACCOUNT: Record<SalesCategory, AccountRef> = {
  POSTES: { code: '7011101', name: 'Ventas - Productos terminados - Postes CAC' },
  ACCESORIOS: { code: '7011102', name: 'Ventas - Productos terminados - Accesorios CAV' },
  FIERRO: { code: '7011103', name: 'Ventas - Productos terminados - Fierro habilitado' },
};

/** CCP is the manufacturer of everything Ventas registers, so `brand` is pre-filled with this. */
export const CCP_BRAND = 'Concreto Centrifugado Perú S.A.C. (CCP)';

/**
 * A finished product's viable price band, sin IGV, expressed in the product's own currency.
 * `min` is the lowest price the sale can close at without escalating to Gerencia; `max` is the
 * reference ceiling. Fed from Producción's costing (see `ProductCost`).
 */
export interface CostBand {
  min: number;
  max: number;
}

export type SalesProductStatus = 'draft' | 'active' | 'discontinued';

export const SALES_PRODUCT_STATUS_LABEL: Record<SalesProductStatus, string> = {
  draft: 'Borrador',
  active: 'Activo',
  discontinued: 'Descontinuado',
};

export const SALES_PRODUCT_STATUS_TONE: Record<SalesProductStatus, Tone> = {
  draft: 'neutral',
  active: 'success',
  discontinued: 'danger',
};

/**
 * One segment of a product's dimension string. CCP writes a poste's dimension as a `/`-separated
 * code, e.g. `9/300/2/150/285`. The exact meaning of each position is pending confirmation from
 * Ingeniería; `DIMENSION_SEGMENTS` holds the current best guess so the UI can label the parts and
 * still round-trips the raw string untouched.
 */
export interface DimensionSegment {
  label: string;
  value: string;
  unit?: string;
}

export const DIMENSION_SEGMENTS: Record<SalesCategory, { label: string; unit?: string }[]> = {
  POSTES: [
    { label: 'Longitud', unit: 'm' },
    { label: 'Carga de trabajo', unit: 'kgf' },
    { label: 'Coef. de seguridad' },
    { label: 'Diámetro en la cima', unit: 'mm' },
    { label: 'Diámetro en la base', unit: 'mm' },
  ],
  ACCESORIOS: [
    { label: 'Largo', unit: 'm' },
    { label: 'Ancho', unit: 'm' },
    { label: 'Alto', unit: 'm' },
  ],
  FIERRO: [{ label: 'Diámetro', unit: '"' }, { label: 'Longitud', unit: 'm' }],
};

/** Splits `"9/300/2/150/285"` into labelled segments using `DIMENSION_SEGMENTS` for the category. */
export function parseDimension(dimension: string, category: SalesCategory): DimensionSegment[] {
  const raw = dimension.trim();
  if (!raw) return [];
  const parts = raw.split(/[/x×]/i).map((p) => p.trim()).filter(Boolean);
  const spec = DIMENSION_SEGMENTS[category];
  return parts.map((value, i) => ({
    label: spec[i]?.label ?? `Segmento ${i + 1}`,
    unit: spec[i]?.unit,
    value,
  }));
}

/**
 * A product Ventas can sell. Recomposes to CCP's full descriptive name, e.g.
 * `formatSalesProductName({ name: 'POSTES DE C.A.C', dimension: '9/300/2/150/285', spec: 'C/PERILLA' })`
 * → `"POSTES DE C.A.C DE 9/300/2/150/285 C/PERILLA"`.
 *
 * `plmProductId` / `itemId` reference the existing PLM `Product` and Inventory `Item` records rather
 * than duplicating their spec/BOM data — `SalesProduct` only adds the commercial layer.
 */
export interface SalesProduct {
  id: string;
  /** Legacy 7/10-digit code carried over from the old system (also printed on the guía/factura). */
  legacyCode: string;
  /** Product family, e.g. `POSTES DE C.A.C`. */
  name: string;
  /** Raw dimension code, e.g. `9/300/2/150/285`. Round-tripped untouched; parsed for display only. */
  dimension: string;
  /** Unique spec/variant, e.g. `C/PERILLA`, `TIPO V`, `SECCIONADO`. */
  spec: string;
  category: SalesCategory;
  /** Always the manufacturer — pre-filled with `CCP_BRAND`, editable for the rare resale case. */
  brand: string;
  unitOfMeasure: string;
  currency: Currency;
  /** Viable price band sin IGV, from Producción's costing. */
  costBand?: CostBand;
  /** Latest unit cost from Producción (sin IGV), used to compute margin during negotiation. */
  productionUnitCost?: number;
  status: SalesProductStatus;
  plmProductId?: string;
  itemId?: string;
  notes?: string;
}

export function formatSalesProductName(p: Pick<SalesProduct, 'name' | 'dimension' | 'spec'>): string {
  const dim = p.dimension.trim() ? ` DE ${p.dimension.trim()}` : '';
  const spec = p.spec.trim() ? ` ${p.spec.trim()}` : '';
  return `${p.name.trim()}${dim}${spec}`;
}

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
  unitCost?: number;
  salesProductId?: string;
  /** Mock traceability quantities; production/warehouse would own these in the real system. */
  producedQuantity?: number;
  dispatchedQuantity?: number;
  /** Importe de envío asignado a esta línea, cuando la cotización incluye despacho. */
  shippingCost?: number;
  /** Materiales o especificaciones comerciales adicionales de la línea. */
  materials?: string;
}

export interface SalesQuotationDelivery {
  id: string;
  address: string;
  cost: number;
}

export type CustomerOrderDocumentType = 'quotation' | 'purchase_order';

export const CUSTOMER_ORDER_DOCUMENT_TYPE_LABEL: Record<CustomerOrderDocumentType, string> = {
  quotation: 'Cotización del cliente',
  purchase_order: 'Orden de compra del cliente',
};

export interface SalesOrderDocument {
  type: 'customer_quotation' | 'customer_purchase_order' | 'guarantee_letter';
  name: string;
  uploadedAt: string;
  url?: string;
}

export type SalesOrderCustomerDocumentType = 'purchase_order' | 'plan' | 'other';

export const SALES_ORDER_CUSTOMER_DOCUMENT_TYPE_LABEL: Record<SalesOrderCustomerDocumentType, string> = {
  purchase_order: 'Orden de compra',
  plan: 'Plano',
  other: 'Otro documento',
};

export interface SalesOrderCustomerDocument {
  id: string;
  type: SalesOrderCustomerDocumentType;
  /** Código del documento del cliente (ajeno a nuestro sistema), ej. la OC del cliente. */
  reference?: string;
  description?: string;
  file?: {
    name: string;
    uploadedAt: string;
    mimeType?: string;
    url?: string;
  };
  createdAt: string;
}

export interface SalesDispatchRelease {
  id: string;
  salesOrderId: string;
  salesOrderNumber: string;
  customerId: string;
  customerName: string;
  workSheetIds: string[];
  releasedAt: string;
  releasedBy: string;
}

export interface SalesRelatedDocument {
  id: string;
  type: 'cotizacion' | 'hoja_trabajo' | 'guia' | 'factura' | 'voucher' | 'otro';
  label: string;
  number?: string;
  date?: string;
  fileName?: string;
  url?: string;
}

export interface SalesQuotation {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  /** Contacto del cliente asociado a la cotización. */
  contactId?: string;
  status: SalesQuotationStatus;
  currency: Currency;
  issuedAt: string;
  expiresAt: string;
  lines: SalesQuotationLine[];
  total: number;
  deliveries?: SalesQuotationDelivery[];
  shippingTotal?: number;
  /** Condición comercial de pago escrita libremente para esta cotización. */
  paymentTerms?: string;
  /** Future reference to a CRM Opportunity — plain string until CRM exists. */
  opportunityId?: string;
  notes?: string;
}

export type SalesOrderStatus = 'pending' | 'confirmed' | 'pending_payment' | 'preparing' | 'production_ready' | 'ready_for_dispatch' | 'partially_dispatched' | 'dispatched' | 'invoiced' | 'finished' | 'cancelled';

export const SALES_ORDER_STATUS_LABEL: Record<SalesOrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada · HT pendiente de aceptación',
  pending_payment: 'Pendiente de adelanto',
  preparing: 'En producción',
  production_ready: 'Producción lista · por verificar',
  ready_for_dispatch: 'Listo para despacho',
  partially_dispatched: 'Despacho parcial',
  dispatched: 'Despachada',
  invoiced: 'Facturada',
  finished: 'Pedido terminado',
  cancelled: 'Cancelada',
};

export const SALES_ORDER_STATUS_TONE: Record<SalesOrderStatus, Tone> = {
  pending: 'warning',
  confirmed: 'info',
  pending_payment: 'warning',
  preparing: 'warning',
  production_ready: 'info',
  ready_for_dispatch: 'info',
  partially_dispatched: 'warning',
  dispatched: 'success',
  invoiced: 'success',
  finished: 'success',
  cancelled: 'danger',
};

export interface SalesOrderLine {
  productCode: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  /** Unit cost sin IGV brought over from Producción, so the order can show its margin. Optional — legacy fixture rows don't carry it. */
  unitCost?: number;
  salesProductId?: string;
  /** Mock traceability quantities; production/warehouse would own these in the real system. */
  producedQuantity?: number;
  dispatchedQuantity?: number;
}

/**
 * Gate a `cash` customer's order has to clear before Producción starts: the customer's PO and a 50%
 * advance voucher are uploaded here and Cobranzas validates them. `credit` customers skip this
 * entirely (they only get a credit-limit check).
 */
export type PaymentGateStatus = 'not_required' | 'pending_docs' | 'pending_collections' | 'validated' | 'observed';

export const PAYMENT_GATE_STATUS_LABEL: Record<PaymentGateStatus, string> = {
  not_required: 'No aplica (crédito)',
  pending_docs: 'Faltan documentos',
  pending_collections: 'Por validar en Cobranzas',
  validated: 'Validado por Cobranzas',
  observed: 'Observado por Cobranzas',
};

export const PAYMENT_GATE_STATUS_TONE: Record<PaymentGateStatus, Tone> = {
  not_required: 'neutral',
  pending_docs: 'warning',
  pending_collections: 'info',
  validated: 'success',
  observed: 'danger',
};

export interface SalesOrderAdvancePayment {
  id: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  voucher: { name: string; uploadedAt: string; mimeType?: string; url?: string };
  registeredBy: string;
  registeredAt: string;
  validatedBy?: string;
  validatedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comment?: string;
}

export interface PaymentGate {
  status: PaymentGateStatus;
  /** % of the total required upfront for cash sales. */
  advancePct: number;
  purchaseOrderDoc?: { name: string; uploadedAt: string };
  /** Legacy voucher metadata kept for compatibility with existing fixtures. */
  advanceVoucher?: { name: string; uploadedAt: string };
  /** Payment evidence registered by Ventas and validated by Cobranzas. */
  advancePayment?: SalesOrderAdvancePayment;
  validatedBy?: string;
  validatedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comment?: string;
}

export type SalesOrderWorkSheetType = 'regular' | 'replacement' | 'claim';

export const SALES_ORDER_WORK_SHEET_TYPE_LABEL: Record<SalesOrderWorkSheetType, string> = {
  regular: 'HT regular',
  replacement: 'HT x reposición',
  claim: 'HT x reclamo',
};



export interface SalesDispatchRelease {
  id: string;
  salesOrderId: string;
  salesOrderNumber: string;
  customerId: string;
  customerName: string;
  workSheetIds: string[];
  releasedAt: string;
  releasedBy: string;
}

export interface SalesOrder {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  /** Contacto del cliente asociado al pedido. */
  contactId?: string;
  quotationId?: string;
  /** Documento comercial entregado por el cliente y su nomenclatura externa. */
  customerOrderDocumentType?: CustomerOrderDocumentType;
  customerOrderDocumentNumber?: string;
  customerOrderDocument?: SalesOrderDocument;
  /** Carta de garantía adjunta al registrar el pedido. */
  guaranteeLetter?: SalesOrderDocument;
  status: SalesOrderStatus;
  currency: Currency;
  confirmedAt: string;
  committedDeliveryDate: string;
  deliveryAddress: string;
  lines: SalesOrderLine[];
  total: number;
  notes?: string;
  /** Instrucciones internas de Ventas para Producción. No se muestra al cliente. */
  internalNotes?: string;
  /** Todas las HT generadas para el pedido; workSheetId se mantiene como referencia legacy/principal. */
  workSheetIds?: string[];
  // --- added across phases (all optional so the legacy fixture rows still type-check) ---
  /** Glosa shown on the order and carried down to the invoice. */
  glosa?: string;
  /** Legacy/principal HT reference kept for compatibility; new orders can have multiple HTs in workSheetIds. */
  workSheetId?: string;
  paymentGate?: PaymentGate;
  /** Ventas flagged the order ready to leave the warehouse. */
  readyForDispatch?: boolean;
  readyForDispatchAt?: string;
  dispatchedAt?: string;
  /** Commercial evaluation outcome (see SalesDecisionRule). */
  priceReview?: { outcome: 'auto' | 'needs_gerencia'; reasons: string[]; approvalId?: string };
  /** Partial delivery destinations/lines are represented by quantities on each line. */
  relatedDocuments?: SalesRelatedDocument[];
  /** Documentos entregados por el cliente asociados a este pedido (OC, planos u otros). */
  customerDocuments?: SalesOrderCustomerDocument[];
  /** Reclamos filed against this order, for traceability. */
  claimIds?: string[];
  /** True once a refacturación edit has been made in the `invoiced` state. */
  refacturado?: boolean;
}

// ---------------------------------------------------------------------------
// Phase 04 — Reglas de decisión de venta
// ---------------------------------------------------------------------------

/**
 * Thresholds that decide whether a confirmed order is auto-approved or needs Gerencia's sign-off.
 * All figures sin IGV. A single active rule is enough for the prototype.
 */
export interface SalesDecisionRule {
  id: string;
  label: string;
  /** Minimum aggregate margin % for automatic approval. */
  minMarginPct: number;
  /** Orders at or below this total auto-approve if the margin rule passes. */
  autoApproveBelowAmount: number;
  /** Selling below a product's viable minimum cost always needs Gerencia. */
  blockBelowViableMin: boolean;
  active: boolean;
}

export interface SalesDecisionOutcome {
  outcome: 'auto' | 'needs_gerencia';
  reasons: string[];
  marginPct: number;
}

/** Runs `rule` over an order's lines. `viableMinByProduct` maps salesProductId → costBand.min. */
export function evaluateSalesOrder(
  order: Pick<SalesOrder, 'total' | 'lines'>,
  rule: SalesDecisionRule,
  viableMinByProduct: Record<string, number> = {},
): SalesDecisionOutcome {
  const revenue = order.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const cost = order.lines.reduce((s, l) => s + l.quantity * (l.unitCost ?? 0), 0);
  const marginPct = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
  const reasons: string[] = [];

  if (marginPct < rule.minMarginPct) {
    reasons.push(`Margen ${marginPct.toFixed(1)}% por debajo del mínimo ${rule.minMarginPct}%.`);
  }
  if (order.total > rule.autoApproveBelowAmount) {
    reasons.push(`Monto ${order.total.toFixed(2)} supera el tope de aprobación automática (${rule.autoApproveBelowAmount.toFixed(2)}).`);
  }
  if (rule.blockBelowViableMin) {
    for (const line of order.lines) {
      const min = line.salesProductId ? viableMinByProduct[line.salesProductId] : undefined;
      if (min != null && line.unitPrice < min) {
        reasons.push(`${line.description}: precio ${line.unitPrice} por debajo del costo viable mínimo ${min}.`);
      }
    }
  }

  return { outcome: reasons.length ? 'needs_gerencia' : 'auto', reasons, marginPct };
}

// ---------------------------------------------------------------------------
// Phase 08 — Reclamos de clientes
// ---------------------------------------------------------------------------

export type SalesClaimStatus = 'open' | 'in_review' | 'pending_gerencia' | 'resolved' | 'rejected';

export const SALES_CLAIM_STATUS_LABEL: Record<SalesClaimStatus, string> = {
  open: 'Abierto',
  in_review: 'En revisión (Producción)',
  pending_gerencia: 'Pendiente de Gerencia',
  resolved: 'Resuelto',
  rejected: 'Rechazado',
};

export const SALES_CLAIM_STATUS_TONE: Record<SalesClaimStatus, Tone> = {
  open: 'info',
  in_review: 'warning',
  pending_gerencia: 'warning',
  resolved: 'success',
  rejected: 'danger',
};

export type SalesClaimResolution = 'reposicion' | 'devolucion_parcial' | 'acuerdo' | 'rechazado' | 'pendiente';

export const SALES_CLAIM_RESOLUTION_LABEL: Record<SalesClaimResolution, string> = {
  reposicion: 'Reposición de material',
  devolucion_parcial: 'Devolución parcial de dinero',
  acuerdo: 'Acuerdo con el cliente',
  rechazado: 'Rechazado',
  pendiente: 'Por definir',
};

export type ClaimDefectType = 'fisura' | 'rotura' | 'desviacion_dimensional' | 'acabado' | 'otro';

export const CLAIM_DEFECT_TYPE_LABEL: Record<ClaimDefectType, string> = {
  fisura: 'Poste fisurado',
  rotura: 'Elemento roto',
  desviacion_dimensional: 'Desviación dimensional',
  acabado: 'Defecto de acabado',
  otro: 'Otro',
};

export interface SalesClaim {
  id: string;
  number: string;
  salesOrderId: string;
  salesOrderNumber: string;
  customerId: string;
  customerName: string;
  defectType: ClaimDefectType;
  description: string;
  /** File names only — the prototype doesn't store the bytes. */
  evidence: { name: string; kind: 'image' | 'pdf' | 'document'; uploadedAt: string }[];
  status: SalesClaimStatus;
  resolution: SalesClaimResolution;
  resolutionDetail?: string;
  refundAmount?: number;
  replacementWorkSheetId?: string;
  approvalId?: string;
  createdBy: string;
  createdAt: string;
  history: { at: string; action: string; by?: string; detail?: string }[];
}
