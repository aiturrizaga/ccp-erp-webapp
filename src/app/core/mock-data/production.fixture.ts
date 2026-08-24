import { OutputBundle, ProductionOrder, WorkSheet } from '@core/models';

export const PRODUCTION_ORDERS: ProductionOrder[] = [
  { id: 'MO-001', number: 'OF-2026-0211', productId: 'PROD-001', plannedQuantity: 30, plant: 'Planta Lima — P2', bomId: 'BOM-001', bomVersion: 'v2.1', scheduledDate: '2026-08-07', committedDate: '2026-08-12', status: 'in_progress', responsible: 'Alex Vasquez' },
  { id: 'MO-002', number: 'OF-2026-0212', productId: 'PROD-002', plannedQuantity: 60, plant: 'Planta Lima — P3', bomId: 'BOM-002', bomVersion: 'v1.3', scheduledDate: '2026-08-05', committedDate: '2026-08-09', status: 'completed', responsible: 'Cristian Espinoza' },
  { id: 'MO-003', number: 'OF-2026-0213', productId: 'PROD-004', plannedQuantity: 40, plant: 'Planta Accesorios', bomId: 'BOM-004', bomVersion: 'v1.4', scheduledDate: '2026-08-06', committedDate: '2026-08-11', status: 'preparing', responsible: 'Haldeer Vasquez' },
  { id: 'MO-004', number: 'OF-2026-0214', productId: 'PROD-001', plannedQuantity: 20, plant: 'Planta Lima — P2', bomId: 'BOM-001', bomVersion: 'v2.1', scheduledDate: '2026-08-14', committedDate: '2026-08-20', status: 'planned', responsible: 'Alex Vasquez' },
  { id: 'MO-005', number: 'OF-2026-0209', productId: 'PROD-005', plannedQuantity: 25, plant: 'Planta Accesorios', bomId: 'BOM-005', bomVersion: 'v1.0', scheduledDate: '2026-07-30', committedDate: '2026-08-06', status: 'completed', responsible: 'Cristian Espinoza' },
];

export const WORK_SHEETS: WorkSheet[] = [
  {
    id: 'WS-001', number: 'HT-2026-0311', productionOrderId: 'MO-001', productId: 'PROD-001', plannedQuantity: 30, plant: 'Planta Lima — P2',
    bomId: 'BOM-001', bomVersion: 'v2.1', scheduledDate: '2026-08-07', committedDate: '2026-08-12', status: 'in_progress',
    materials: [
      { itemId: 'MP00006', required: 240, available: 850, reserved: 240, consumed: 160, unitOfMeasure: 'BOL', isSupply: false },
      { itemId: 'MP00001', required: 10.5, available: 22, reserved: 10.5, consumed: 7, unitOfMeasure: 'M3', isSupply: false },
      { itemId: 'MP00002', required: 13.5, available: 31, reserved: 13.5, consumed: 9, unitOfMeasure: 'M3', isSupply: false },
      { itemId: 'MP00011', required: 360, available: 920, reserved: 360, consumed: 240, unitOfMeasure: 'UND', isSupply: false },
      { itemId: 'MP00013', required: 120, available: 1740, reserved: 120, consumed: 80, unitOfMeasure: 'UND', isSupply: false },
      { itemId: 'MA00001', required: 24, available: 34, reserved: 24, consumed: 16, unitOfMeasure: 'KG', isSupply: true },
    ],
    responsible: 'Alex Vasquez', atRisk: false,
  },
  {
    id: 'WS-002', number: 'HT-2026-0298', productionOrderId: 'MO-002', productId: 'PROD-002', plannedQuantity: 60, plant: 'Planta Lima — P3',
    bomId: 'BOM-002', bomVersion: 'v1.3', scheduledDate: '2026-08-05', committedDate: '2026-08-09', status: 'completed',
    materials: [
      { itemId: 'MP00008', required: 210, available: 900, reserved: 0, consumed: 210, unitOfMeasure: 'BOL', isSupply: false },
      { itemId: 'MP00003', required: 10.8, available: 18, reserved: 0, consumed: 10.8, unitOfMeasure: 'M3', isSupply: false },
      { itemId: 'MA00031', required: 240, available: 45, reserved: 0, consumed: 240, unitOfMeasure: 'UND', isSupply: false, exception: 'Se completó con stock adicional transferido de Planta Accesorios.' },
    ],
    responsible: 'Cristian Espinoza', atRisk: false,
  },
  {
    id: 'WS-003', number: 'HT-2026-0303', productionOrderId: 'MO-001', productId: 'PROD-001', plannedQuantity: 30, plant: 'Planta Lima — P2',
    bomId: 'BOM-001', bomVersion: 'v2.1', scheduledDate: '2026-08-07', committedDate: '2026-08-12', status: 'in_progress',
    materials: [
      { itemId: 'MP00010', required: 1182, available: 318, reserved: 318, consumed: 1182, unitOfMeasure: 'UND', isSupply: false },
    ],
    responsible: 'Alex Vasquez', atRisk: true, riskReason: 'Stock de BA-CO 6MM insuficiente para la siguiente hoja de trabajo — requerimiento SC-2026-0145 en cotización.',
  },
  {
    id: 'WS-004', number: 'HT-2026-0305', productionOrderId: 'MO-003', productId: 'PROD-004', plannedQuantity: 40, plant: 'Planta Accesorios',
    bomId: 'BOM-004', bomVersion: 'v1.4', scheduledDate: '2026-08-06', committedDate: '2026-08-11', status: 'preparing',
    materials: [
      { itemId: 'MP00009', required: 112, available: 60, reserved: 60, consumed: 0, unitOfMeasure: 'BOL', isSupply: false, exception: 'Faltan 52 bolsas — cubierto por OC-2026-0514 pendiente de aprobación.' },
      { itemId: 'MP00004', required: 4, available: 18, reserved: 4, consumed: 0, unitOfMeasure: 'M3', isSupply: false },
      { itemId: 'SU01122', required: 40, available: 72, reserved: 40, consumed: 0, unitOfMeasure: 'UND', isSupply: true },
    ],
    responsible: 'Haldeer Vasquez', atRisk: true, riskReason: 'BOM en versión "En cambio" (v1.4 borrador) — pendiente de aprobación de PLM antes de liberar producción.',
  },
  {
    id: 'WS-005', number: 'HT-2026-0291', productionOrderId: 'MO-004', productId: 'PROD-001', plannedQuantity: 20, plant: 'Planta Lima — P2',
    bomId: 'BOM-001', bomVersion: 'v2.1', scheduledDate: '2026-08-14', committedDate: '2026-08-20', status: 'planned',
    materials: [
      { itemId: 'MP00006', required: 160, available: 850, reserved: 0, consumed: 0, unitOfMeasure: 'BOL', isSupply: false },
      { itemId: 'MP00011', required: 240, available: 920, reserved: 0, consumed: 0, unitOfMeasure: 'UND', isSupply: false },
    ],
    responsible: 'Alex Vasquez', atRisk: false,
  },
  {
    id: 'WS-006', number: 'HT-2026-0300', productionOrderId: 'MO-005', productId: 'PROD-005', plannedQuantity: 25, plant: 'Planta Accesorios',
    bomId: 'BOM-005', bomVersion: 'v1.0', scheduledDate: '2026-07-30', committedDate: '2026-08-06', status: 'completed',
    materials: [
      { itemId: 'MP00009', required: 62.5, available: 900, reserved: 0, consumed: 62.5, unitOfMeasure: 'BOL', isSupply: false },
      { itemId: 'MP00004', required: 2.25, available: 18, reserved: 0, consumed: 2.25, unitOfMeasure: 'M3', isSupply: false },
    ],
    responsible: 'Cristian Espinoza', atRisk: false,
  },
  {
    id: 'WS-007', number: 'HT-2026-0330', productionOrderId: 'MO-002', productId: 'PROD-002', plannedQuantity: 45, plant: 'Planta Lima — P3',
    bomId: 'BOM-002', bomVersion: 'v1.3', scheduledDate: '2026-08-25', committedDate: '2026-08-29', status: 'planned',
    materials: [
      { itemId: 'MP00008', required: 160, available: 900, reserved: 0, consumed: 0, unitOfMeasure: 'BOL', isSupply: false },
      { itemId: 'MP00003', required: 8.1, available: 18, reserved: 0, consumed: 0, unitOfMeasure: 'M3', isSupply: false },
      { itemId: 'MA00031', required: 180, available: 45, reserved: 0, consumed: 0, unitOfMeasure: 'UND', isSupply: false, exception: 'Stock insuficiente de tubería PVC — se generó una solicitud de compra automática.' },
    ],
    responsible: 'Cristian Espinoza', atRisk: true, riskReason: 'Faltante de tubería PVC (MA00031) para cubrir la producción — solicitud de compra generada automáticamente (SC-2026-0148).',
  },
  {
    id: 'WS-008', number: 'HT-2026-0332', productionOrderId: 'MO-003', productId: 'PROD-004', plannedQuantity: 35, plant: 'Planta Accesorios',
    bomId: 'BOM-004', bomVersion: 'v1.4', scheduledDate: '2026-08-26', committedDate: '2026-08-30', status: 'planned',
    materials: [
      { itemId: 'MP00009', required: 98, available: 60, reserved: 0, consumed: 0, unitOfMeasure: 'BOL', isSupply: false, exception: 'Faltan 38 bolsas — cubierto con solicitud de compra automática.' },
      { itemId: 'SU01122', required: 35, available: 72, reserved: 0, consumed: 0, unitOfMeasure: 'UND', isSupply: true },
    ],
    responsible: 'Haldeer Vasquez', atRisk: true, riskReason: 'Faltante de cemento (MP00009) para cubrir la producción — solicitud de compra generada automáticamente (SC-2026-0149).',
  },
  {
    id: 'WS-009', number: 'HT-2026-0335', productionOrderId: 'MO-005', productId: 'PROD-005', plannedQuantity: 30, plant: 'Planta Accesorios',
    bomId: 'BOM-005', bomVersion: 'v1.0', scheduledDate: '2026-08-27', committedDate: '2026-08-31', status: 'preparing',
    materials: [
      { itemId: 'MP00009', required: 75, available: 60, reserved: 0, consumed: 0, unitOfMeasure: 'BOL', isSupply: false, exception: 'Faltan 15 bolsas — cubierto con solicitud de compra automática.' },
      { itemId: 'MP00004', required: 2.7, available: 18, reserved: 0, consumed: 0, unitOfMeasure: 'M3', isSupply: false },
    ],
    responsible: 'Cristian Espinoza', atRisk: true, riskReason: 'Faltante de cemento (MP00009) para cubrir la producción — solicitud de compra generada automáticamente (SC-2026-0150).',
  },
  {
    id: 'WS-010', number: 'HT-2026-0340', productionOrderId: 'MO-001', productId: 'PROD-001', plannedQuantity: 25, plant: 'Planta Lima — P2',
    bomId: 'BOM-001', bomVersion: 'v2.1', scheduledDate: '2026-08-28', committedDate: '2026-09-02', status: 'planned',
    materials: [
      { itemId: 'MP00006', required: 200, available: 150, reserved: 0, consumed: 0, unitOfMeasure: 'BOL', isSupply: false, exception: 'Faltan 50 bolsas — cubierto con solicitud de compra automática.' },
      { itemId: 'MP00013', required: 150, available: 1740, reserved: 0, consumed: 0, unitOfMeasure: 'UND', isSupply: false },
    ],
    responsible: 'Alex Vasquez', atRisk: true, riskReason: 'Faltante de cemento (MP00006) para cubrir la producción — solicitud de compra generada automáticamente (SC-2026-0151).',
  },
  {
    id: 'WS-011', number: 'HT-2026-0342', productionOrderId: 'MO-003', productId: 'PROD-004', plannedQuantity: 20, plant: 'Planta Accesorios',
    bomId: 'BOM-004', bomVersion: 'v1.4', scheduledDate: '2026-08-29', committedDate: '2026-09-03', status: 'planned',
    materials: [
      { itemId: 'MP00004', required: 6, available: 4, reserved: 0, consumed: 0, unitOfMeasure: 'M3', isSupply: false, exception: 'Faltan 2 m³ de arena fina — cubierto con solicitud de compra automática.' },
      { itemId: 'SU01122', required: 20, available: 72, reserved: 0, consumed: 0, unitOfMeasure: 'UND', isSupply: true },
    ],
    responsible: 'Haldeer Vasquez', atRisk: true, riskReason: 'Faltante de arena fina (MP00004) para cubrir la producción — solicitud de compra generada automáticamente (SC-2026-0152).',
  },
];

export const OUTPUT_BUNDLES: OutputBundle[] = [
  {
    id: 'OB-001', number: 'B-2026-0045', plant: 'Planta Lima — P2', date: '2026-08-08', workSheetIds: ['WS-001', 'WS-003'], status: 'signed',
    selectedLots: [
      { itemId: 'MP00006', lotId: 'LOT-002', quantity: 240, recommended: true },
      { itemId: 'MP00011', lotId: 'LOT-005', quantity: 360, recommended: true },
      { itemId: 'MP00010', lotId: 'LOT-006', quantity: 318, recommended: true },
    ],
    exceptions: [
      { itemId: 'MA00054', reason: 'Operador solicitó electrodo HYUNDAI adicional no listado en la Hoja de Trabajo HT-2026-0311.', authorizedBy: 'Rosa Injante', status: 'authorized' },
    ],
    operatorSignature: 'Alex Vasquez', supervisorSignature: 'Rosa Injante',
  },
  {
    id: 'OB-002', number: 'B-2026-0046', plant: 'Planta Accesorios', date: '2026-08-09', workSheetIds: ['WS-004'], status: 'lot_selected',
    selectedLots: [{ itemId: 'MP00009', lotId: 'LOT-003', quantity: 60, recommended: true }],
    exceptions: [],
  },
  {
    id: 'OB-003', number: 'B-2026-0038', plant: 'Planta Lima — P3', date: '2026-08-05', workSheetIds: ['WS-002'], status: 'dispatched',
    selectedLots: [{ itemId: 'MP00008', lotId: 'LOT-014', quantity: 210, recommended: false }],
    exceptions: [
      { itemId: 'MA00031', reason: 'Se utilizaron tubos PVC adicionales por rotura de 6 unidades durante el armado.', authorizedBy: 'Jorge Salcedo', status: 'authorized' },
    ],
    operatorSignature: 'Cristian Espinoza', supervisorSignature: 'Jorge Salcedo',
  },
];
