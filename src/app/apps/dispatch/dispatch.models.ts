export type DispatchPlanStatus = 'programado' | 'en_carga' | 'despachado' | 'reprogramado';

export interface FinishedProductStock {
  id: string;
  productCode: string;
  productName: string;
  category: 'Postes' | 'Accesorios';
  plant: string;
  producedQuantity: number;
  scheduledQuantity: number;
  dispatchedQuantity: number;
  custodyCustomer?: string;
  unitOfMeasure: string;
}

export interface DispatchCandidate {
  id: string;
  salesOrderNumber: string;
  workSheetNumber: string;
  customerOrderNumber: string;
  customerName: string;
  productCode: string;
  productName: string;
  plant: string;
  committedDate: string;
  productionDeliveryDate: string;
  orderedQuantity: number;
  producedQuantity: number;
  alreadyPlannedQuantity: number;
  productionProgress: number;
  allowPartial: boolean;
}

export interface DispatchPlan {
  id: string;
  candidateId: string;
  salesOrderNumber: string;
  workSheetNumber: string;
  customerOrderNumber: string;
  customerName: string;
  productCode: string;
  productName: string;
  quantity: number;
  dispatchDate: string;
  deliveryDate?: string;
  originPlant: string;
  transportType: 'Propio' | 'Tercero' | 'Recojo del cliente';
  carrier: string;
  vehiclePlate?: string;
  driver?: string;
  destination: string;
  status: DispatchPlanStatus;
  comments?: string;
}
