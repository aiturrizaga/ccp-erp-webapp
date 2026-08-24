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

export type StockLedgerMovementType = 'inbound' | 'outbound' | 'transfer' | 'adjustment' | 'consumption';

export const STOCK_LEDGER_MOVEMENT_LABEL: Record<StockLedgerMovementType, string> = {
  inbound: 'Entrada',
  outbound: 'Salida',
  transfer: 'Transferencia',
  adjustment: 'Ajuste',
  consumption: 'Consumo',
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
