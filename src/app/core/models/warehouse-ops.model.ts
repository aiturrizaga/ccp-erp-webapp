export type GoodsReceiptStatus =
  | 'scheduled'
  | 'in_progress'
  | 'partial'
  | 'received'
  | 'with_discrepancies'
  | 'in_claim'
  | 'closed';

export const GOODS_RECEIPT_STATUS_LABEL: Record<GoodsReceiptStatus, string> = {
  scheduled: 'Programada',
  in_progress: 'En recepción',
  partial: 'Parcial',
  received: 'Recibida',
  with_discrepancies: 'Con diferencias',
  in_claim: 'En reclamo',
  closed: 'Cerrada',
};

export type InspectionResult = 'compliant' | 'observed' | 'rejected';

export interface GoodsReceiptLine {
  itemId: string;
  expectedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  claimedQuantity: number;
  lot?: string;
  expirationDate?: string;
  locationId: string;
  inspectionResult: InspectionResult;
  note?: string;
}

export interface GoodsReceipt {
  id: string;
  number: string;
  purchaseOrderId: string;
  supplierId: string;
  status: GoodsReceiptStatus;
  expectedDate: string;
  expectedTime: string;
  actualDate?: string;
  actualTime?: string;
  receivedBy: string;
  lines: GoodsReceiptLine[];
  photos: string[];
  operatorSignature?: string;
  supervisorSignature?: string;
}

export type StockLedgerMovementType = 'inbound' | 'outbound';

export const STOCK_LEDGER_MOVEMENT_LABEL: Record<StockLedgerMovementType, string> = {
  inbound: 'Entrada',
  outbound: 'Salida',
};

export type StockLedgerSourceDocument = 'PurchaseOrder' | 'GoodsReceipt' | 'WorkSheet' | 'OutputBundle' | 'Adjustment';

export interface StockLedgerEntry {
  id: string;
  date: string;
  itemId: string;
  type: StockLedgerMovementType;
  documentNumber: string;
  documentType: StockLedgerSourceDocument;
  warehouseId: string;
  locationId: string;
  lot?: string;
  inboundQuantity: number;
  outboundQuantity: number;
  balance: number;
  unitCost: number;
  user: string;
}

export type StockIssueOrigin = 'work_sheet' | 'other';

export const STOCK_ISSUE_ORIGIN_LABEL: Record<StockIssueOrigin, string> = {
  work_sheet: 'Hoja de trabajo',
  other: 'Otro motivo',
};

export type StockIssueStatus = 'pending' | 'partial' | 'dispatched' | 'cancelled';

export const STOCK_ISSUE_STATUS_LABEL: Record<StockIssueStatus, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  dispatched: 'Despachada',
  cancelled: 'Cancelada',
};

export interface StockIssueLine {
  itemId: string;
  requiredQuantity: number;
  dispatchedQuantity: number;
  unitOfMeasure: string;
}

/** One withdrawal event against a StockIssue — a pending issue can be attended in more than one trip as stock becomes available. */
export interface StockIssueDispatch {
  date: string;
  time: string;
  dispatchedBy: string;
  receivedBy: string;
  lines: { itemId: string; quantity: number; lotId?: string }[];
}

/**
 * A Hoja de Trabajo gets its pending outbound order the moment it's created — Almacén then attends
 * it (fully or partially) as the requested materials arrive. An issue not tied to a HT ("otro
 * motivo") is created and dispatched in the same step instead, since there's no upstream document
 * driving it.
 */
export interface StockIssue {
  id: string;
  number: string;
  origin: StockIssueOrigin;
  workSheetId?: string;
  reason?: string;
  status: StockIssueStatus;
  createdAt: string;
  plant: string;
  lines: StockIssueLine[];
  dispatches: StockIssueDispatch[];
}

export type StockStatus = 'available' | 'reserved' | 'in_transit' | 'quarantine' | 'claimed' | 'blocked';

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  available: 'Disponible',
  reserved: 'Reservado',
  in_transit: 'En tránsito',
  quarantine: 'Cuarentena',
  claimed: 'Reclamado',
  blocked: 'Bloqueado',
};

export interface StockLot {
  id: string;
  itemId: string;
  lot: string;
  receivedAt: string;
  expirationDate?: string;
  locationId: string;
  quantity: number;
  status: StockStatus;
  unitCost: number;
  sourceDocument: string;
}
