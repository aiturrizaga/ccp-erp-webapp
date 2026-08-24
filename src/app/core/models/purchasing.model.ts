import { Currency } from './shared.model';

export type PurchaseRequisitionStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sourcing'
  | 'awarded'
  | 'purchasing'
  | 'fulfilled'
  | 'rejected'
  | 'cancelled';

export const PURCHASE_REQUISITION_STATUS_LABEL: Record<PurchaseRequisitionStatus, string> = {
  draft: 'Borrador',
  pending_approval: 'Pendiente de aprobación',
  approved: 'Aprobado',
  sourcing: 'En cotización',
  awarded: 'Adjudicado',
  purchasing: 'En compra',
  fulfilled: 'Atendido',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
};

export type RequisitionPriority = 'low' | 'medium' | 'high' | 'critical';

export const REQUISITION_PRIORITY_LABEL: Record<RequisitionPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

export interface PurchaseRequisitionLine {
  itemId: string;
  quantity: number;
  unitOfMeasure: string;
  neededBy: string;
  availableStock: number;
  note?: string;
}

export interface PurchaseRequisition {
  id: string;
  number: string;
  origin: 'production' | 'inventory' | 'forecast' | 'other';
  requestedBy: string;
  area: string;
  plant: string;
  priority: RequisitionPriority;
  status: PurchaseRequisitionStatus;
  createdAt: string;
  neededBy: string;
  lines: PurchaseRequisitionLine[];
  workSheetRef?: string;
  approvalId?: string;
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
  requisitionId: string;
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
