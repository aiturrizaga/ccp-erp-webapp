/** Transversal approval engine — shared across every App's critical documents. */
export type ApprovalProcess =
  | 'supplier'
  | 'purchase_requisition'
  | 'quotation_award'
  | 'purchase_order'
  | 'bom_change';

export const APPROVAL_PROCESS_LABEL: Record<ApprovalProcess, string> = {
  supplier: 'Alta de proveedor',
  purchase_requisition: 'Requerimiento de compra',
  quotation_award: 'Adjudicación de cotización',
  purchase_order: 'Orden de compra',
  bom_change: 'Cambio de BOM',
};

export type ApprovalLevelStatus = 'pending' | 'approved' | 'rejected' | 'observed';

export interface ApprovalLevel {
  order: number;
  role: string;
  approver?: string;
  status: ApprovalLevelStatus;
  date?: string;
  comment?: string;
  slaHours: number;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'observed';

export interface Approval {
  id: string;
  process: ApprovalProcess;
  documentId: string;
  documentNumber: string;
  description: string;
  amount?: number;
  currency?: 'PEN' | 'USD';
  plant: string;
  requestedBy: string;
  createdAt: string;
  status: ApprovalStatus;
  levels: ApprovalLevel[];
}
