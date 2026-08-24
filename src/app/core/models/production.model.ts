export type ProductionOrderStatus =
  | 'planned'
  | 'released'
  | 'preparing'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled';

export const PRODUCTION_ORDER_STATUS_LABEL: Record<ProductionOrderStatus, string> = {
  planned: 'Planificada',
  released: 'Liberada',
  preparing: 'En preparación',
  in_progress: 'En producción',
  paused: 'Pausada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export interface ProductionOrder {
  id: string;
  number: string;
  productId: string;
  plannedQuantity: number;
  plant: string;
  bomId: string;
  bomVersion: string;
  scheduledDate: string;
  committedDate: string;
  status: ProductionOrderStatus;
  responsible: string;
}

export interface WorkSheetMaterial {
  itemId: string;
  required: number;
  available: number;
  reserved: number;
  consumed: number;
  unitOfMeasure: string;
  isSupply: boolean;
  exception?: string;
}

export interface WorkSheet {
  id: string;
  number: string;
  productionOrderId: string;
  productId: string;
  plannedQuantity: number;
  plant: string;
  bomId: string;
  bomVersion: string;
  scheduledDate: string;
  committedDate: string;
  status: ProductionOrderStatus;
  materials: WorkSheetMaterial[];
  responsible: string;
  atRisk: boolean;
  riskReason?: string;
}

export type OutputBundleStatus = 'preparing' | 'lot_selected' | 'signed' | 'dispatched';

export const OUTPUT_BUNDLE_STATUS_LABEL: Record<OutputBundleStatus, string> = {
  preparing: 'En preparación',
  lot_selected: 'Lote seleccionado',
  signed: 'Firmada',
  dispatched: 'Despachada',
};

export interface OutputBundleLot {
  itemId: string;
  lotId: string;
  quantity: number;
  recommended: boolean;
}

export interface OutputBundleException {
  itemId: string;
  reason: string;
  authorizedBy?: string;
  status: 'pending' | 'authorized' | 'rejected';
}

export interface OutputBundle {
  id: string;
  number: string;
  plant: string;
  date: string;
  workSheetIds: string[];
  status: OutputBundleStatus;
  selectedLots: OutputBundleLot[];
  exceptions: OutputBundleException[];
  operatorSignature?: string;
  supervisorSignature?: string;
}
