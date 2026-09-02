import { Currency } from './shared.model';

/** Draft = available to group into an RC. Grouped = locked inside an active (not yet rejected/observed) Requerimiento de Compra. Cancelled = discarded manually by Almacén, never grouped. */
export type ReplenishmentSuggestionStatus = 'draft' | 'grouped' | 'cancelled';

export const REPLENISHMENT_SUGGESTION_STATUS_LABEL: Record<ReplenishmentSuggestionStatus, string> = {
  draft: 'Disponible',
  grouped: 'Agrupada en RC',
  cancelled: 'Descartada',
};

export type RequisitionPriority = 'low' | 'medium' | 'high' | 'critical';

export const REQUISITION_PRIORITY_LABEL: Record<RequisitionPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

export interface ReplenishmentSuggestionLine {
  itemId: string;
  quantity: number;
  unitOfMeasure: string;
  neededBy: string;
  availableStock: number;
  note?: string;
  /** True when Almacén added this line by hand — it wasn't part of the Hoja de Trabajo's material list. */
  addedManually?: boolean;
  /** The system-calculated quantity (HT requirement minus available stock) before Almacén edits it, kept for reference. */
  suggestedQuantity?: number;
  /** True when the item was part of the HT's material list but the system determined stock already covers it — kept visible (crossed out) for audit, not requested. */
  notNeeded?: boolean;
}

/** One step in a suggestion's grouping/release trail — never rewritten or removed, only appended to. */
export interface SuggestionHistoryEntry {
  at: string;
  action: 'created' | 'grouped' | 'released';
  requirementId?: string;
  requirementNumber?: string;
  /** Present on 'released' — the rejection/observation comment that freed this suggestion back up. */
  reason?: string;
}

export interface ReplenishmentSuggestion {
  id: string;
  number: string;
  origin: 'production' | 'inventory' | 'forecast' | 'other';
  requestedBy: string;
  area: string;
  plant: string;
  priority: RequisitionPriority;
  status: ReplenishmentSuggestionStatus;
  createdAt: string;
  neededBy: string;
  lines: ReplenishmentSuggestionLine[];
  workSheetRef?: string;
  /** Requerimiento de Compra currently grouping this suggestion — set while status is 'grouped', cleared when that RC is rejected/observed. */
  requirementId?: string;
  /** Free-text remark Almacén can add while reviewing an auto-generated suggestion. */
  note?: string;
  history: SuggestionHistoryEntry[];
}

/** draft → reviewed → pending_approval → approved/rejected/observed — Almacén must mark a block reviewed before it can be submitted to Logística. */
export type PurchaseRequirementStatus = 'draft' | 'reviewed' | 'pending_approval' | 'approved' | 'rejected' | 'observed';

export const PURCHASE_REQUIREMENT_STATUS_LABEL: Record<PurchaseRequirementStatus, string> = {
  draft: 'Borrador',
  reviewed: 'Revisado',
  pending_approval: 'Pendiente de aprobación',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  observed: 'Observado',
};

/** One step in an RC's lifecycle — the permanent audit trail asked for by the business rule: even a rejected RC keeps full history, it's never deleted or reused. */
export interface PurchaseRequirementHistoryEntry {
  at: string;
  action: 'created' | 'reviewed' | 'submitted' | 'approved' | 'rejected' | 'observed';
  by?: string;
  comment?: string;
}

/**
 * One article as requested by one specific grouped suggestion/HT — the RC keeps its own working copy
 * (snapshotted at grouping time) instead of reading the suggestion live, so Almacén can edit quantities
 * or strike an article out at the block level without touching the original suggestion record.
 */
export interface PurchaseRequirementLine {
  /** The Reposición sugerida (HT or manual) this specific quantity came from — lets the RC show "cuánto pide cada HT" per article. Absent for a line Almacén typed in directly at the block level (see `addedManually`). */
  suggestionId?: string;
  itemId: string;
  quantity: number;
  unitOfMeasure: string;
  availableStock: number;
  /** True when Almacén decided this article shouldn't be purchased in this RC — kept in the list (struck through) for audit, never removed. */
  notNeeded?: boolean;
  /** True when Almacén added this article directly to the block — it wasn't part of any grouped suggestion's material list. */
  addedManually?: boolean;
}

/** Requerimiento de Compra (RC) — the document Almacén actually sends to Logística, grouping one or more Reposición sugerida rows (HT-derived or manual) into a single approval block. */
export interface PurchaseRequirement {
  id: string;
  number: string;
  status: PurchaseRequirementStatus;
  suggestionIds: string[];
  requestedBy: string;
  area: string;
  plant: string;
  priority: RequisitionPriority;
  createdAt: string;
  neededBy: string;
  note?: string;
  approvalId?: string;
  history: PurchaseRequirementHistoryEntry[];
  lines: PurchaseRequirementLine[];
}

export type QuotationStatus = 'draft' | 'sent' | 'received' | 'under_evaluation' | 'awarded' | 'discarded';

export const QUOTATION_STATUS_LABEL: Record<QuotationStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviada a proveedor',
  received: 'Recibida',
  under_evaluation: 'En evaluación',
  awarded: 'Adjudicada',
  discarded: 'Descartada',
};

export interface QuotationOffer {
  supplierId: string;
  unitPrice: number;
  currency: Currency;
  deliveryDays: number;
  paymentTerms: string;
  attachmentName?: string;
  selected: boolean;
}

export interface QuotationLine {
  itemId: string;
  quantity: number;
  unitOfMeasure: string;
  offers: QuotationOffer[];
}

export interface Quotation {
  id: string;
  number: string;
  requirementId: string;
  status: QuotationStatus;
  createdAt: string;
  dueDate: string;
  lines: QuotationLine[];
  awardedSupplierId?: string;
  authorizedBy?: string;
  awardReason?: string;
}

export type PurchaseOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'confirmed'
  | 'partially_received'
  | 'received'
  | 'invoiced'
  | 'closed'
  | 'rejected';

export const PURCHASE_ORDER_STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  draft: 'Borrador',
  pending_approval: 'Pendiente de aprobación',
  approved: 'Aprobada',
  sent: 'Enviada',
  confirmed: 'Confirmada',
  partially_received: 'Recepción parcial',
  received: 'Recibida',
  invoiced: 'Facturada',
  closed: 'Cerrada',
  rejected: 'Rechazada',
};

export interface PurchaseOrderLine {
  itemId: string;
  quantity: number;
  receivedQuantity: number;
  unitOfMeasure: string;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  quotationId?: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  currency: Currency;
  exchangeRate: number;
  paymentTerms: string;
  issuedAt: string;
  committedDeliveryDate: string;
  committedDeliveryTime: string;
  plant: string;
  termsAndConditions: string;
  penalties: string;
  warranty: string;
  notes: string;
  lines: PurchaseOrderLine[];
  approvalId?: string;
}
