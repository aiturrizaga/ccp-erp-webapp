import { OutputBundle, RunOperationLog, WorkSheet } from '@core/models';
import { BILLS_OF_MATERIALS } from './production-plm.fixture';

function routingFor(bomId: string) {
  return BILLS_OF_MATERIALS.find((b) => b.id === bomId)?.routing ?? [];
}

/** Builds the per-run operation log from the line's routing snapshot, marking ops up to `doneUpTo` sequence as done. */
function opsLog(bomId: string, doneUpTo: number, start: string): RunOperationLog[] {
  const routing = routingFor(bomId);
  return routing.map((op, i) => ({
    operationId: op.id,
    name: op.name,
    status: op.sequence <= doneUpTo ? 'done' : op.sequence === doneUpTo + 1 ? 'in_progress' : 'pending',
    start: op.sequence <= doneUpTo + 1 ? addHours(start, i * 3) : undefined,
    end: op.sequence <= doneUpTo ? addHours(start, i * 3 + 2) : undefined,
  }));
}

function addHours(iso: string, hours: number): string {
  const d = new Date(iso);
  d.setHours(d.getHours() + hours);
  return d.toISOString().slice(0, 16);
}

export const WORK_SHEETS: WorkSheet[] = [
  {
    id: 'HT-2026-0311', number: 'HT-2026-0311', plant: 'AL01 · Planta 02',
    scheduledDate: '2026-08-07', committedDate: '2026-08-12', responsible: 'Alex Vasquez', atRisk: false,
    lines: [
      {
        id: 'HTL-0311-1', productId: 'PROD-001', bomId: 'BOM-001', bomVersion: 'v2.1', routing: routingFor('BOM-001'),
        plannedQuantity: 30, unitOfMeasure: 'UND',
        materials: [
          { itemId: 'MP00006', required: 240, available: 850, reserved: 240, consumed: 160, unitOfMeasure: 'BOL', isSupply: false },
          { itemId: 'MP00001', required: 10.5, available: 22, reserved: 10.5, consumed: 7, unitOfMeasure: 'M3', isSupply: false },
          { itemId: 'MP00002', required: 13.5, available: 31, reserved: 13.5, consumed: 9, unitOfMeasure: 'M3', isSupply: false },
          { itemId: 'MP00011', required: 360, available: 920, reserved: 360, consumed: 240, unitOfMeasure: 'UND', isSupply: false },
          { itemId: 'MA00001', required: 24, available: 34, reserved: 24, consumed: 16, unitOfMeasure: 'KG', isSupply: true },
        ],
        runs: [
          {
            id: 'RUN-0311-1', sequence: 1, workCenterId: 'WC-001', machineId: 'MCH-001', moldId: 'MLD-001', operatorName: 'Alex Vasquez',
            scheduledStart: '2026-08-07T07:00', scheduledEnd: '2026-08-08T15:00', actualStart: '2026-08-07T07:15', actualEnd: '2026-08-08T16:00',
            plannedQuantity: 20, producedQuantity: 20, rejectedQuantity: 0, reprocessedQuantity: 0,
            materialsConsumed: [{ itemId: 'MP00006', lotId: 'LOT-002', quantity: 160, unitOfMeasure: 'BOL' }],
            operations: opsLog('BOM-001', 5, '2026-08-07T07:15'),
            status: 'completed',
          },
          {
            id: 'RUN-0311-2', sequence: 2, workCenterId: 'WC-001', machineId: 'MCH-001', moldId: 'MLD-001', operatorName: 'Alex Vasquez',
            scheduledStart: '2026-08-09T07:00', scheduledEnd: '2026-08-10T15:00', actualStart: '2026-08-09T07:30',
            plannedQuantity: 10, producedQuantity: 4, rejectedQuantity: 0, reprocessedQuantity: 0,
            materialsConsumed: [],
            operations: opsLog('BOM-001', 2, '2026-08-09T07:30'),
            status: 'in_progress',
          },
        ],
      },
    ],
  },
  {
    id: 'HT-2026-0298', number: 'HT-2026-0298', plant: 'AL01 · Planta 03',
    scheduledDate: '2026-08-05', committedDate: '2026-08-09', responsible: 'Cristian Espinoza', atRisk: false,
    lines: [
      {
        id: 'HTL-0298-1', productId: 'PROD-002', bomId: 'BOM-002', bomVersion: 'v1.3', routing: routingFor('BOM-002'),
        plannedQuantity: 60, unitOfMeasure: 'UND',
        materials: [
          { itemId: 'MP00008', required: 210, available: 900, reserved: 0, consumed: 210, unitOfMeasure: 'BOL', isSupply: false },
          { itemId: 'MP00003', required: 10.8, available: 18, reserved: 0, consumed: 10.8, unitOfMeasure: 'M3', isSupply: false },
          { itemId: 'MA00031', required: 240, available: 45, reserved: 0, consumed: 240, unitOfMeasure: 'UND', isSupply: false, exception: 'Se completó con stock adicional transferido desde Accesorios 01.' },
        ],
        runs: [
          {
            id: 'RUN-0298-1', sequence: 1, workCenterId: 'WC-002', machineId: 'MCH-003', moldId: 'MLD-003', operatorName: 'Cristian Espinoza',
            scheduledStart: '2026-08-05T07:00', scheduledEnd: '2026-08-06T15:00', actualStart: '2026-08-05T07:00', actualEnd: '2026-08-06T14:30',
            plannedQuantity: 60, producedQuantity: 60, rejectedQuantity: 0, reprocessedQuantity: 0,
            materialsConsumed: [{ itemId: 'MP00008', lotId: 'LOT-014', quantity: 210, unitOfMeasure: 'BOL' }],
            operations: opsLog('BOM-002', 4, '2026-08-05T07:00'),
            status: 'completed',
          },
        ],
      },
    ],
  },
  {
    id: 'HT-2026-0303', number: 'HT-2026-0303', plant: 'AL01 · Planta 02',
    scheduledDate: '2026-08-07', committedDate: '2026-08-12', responsible: 'Alex Vasquez', atRisk: true,
    riskReason: 'Stock de BA-CO 6MM insuficiente para la siguiente hoja de trabajo — requerimiento SC-2026-0145 en cotización.',
    lines: [
      {
        id: 'HTL-0303-1', productId: 'PROD-001', bomId: 'BOM-001', bomVersion: 'v2.1', routing: routingFor('BOM-001'),
        plannedQuantity: 30, unitOfMeasure: 'UND',
        materials: [
          { itemId: 'MP00010', required: 1182, available: 318, reserved: 318, consumed: 1182, unitOfMeasure: 'UND', isSupply: false },
        ],
        runs: [
          {
            id: 'RUN-0303-1', sequence: 1, workCenterId: 'WC-001', machineId: 'MCH-002', moldId: 'MLD-002', operatorName: 'Alex Vasquez',
            scheduledStart: '2026-08-07T07:00', scheduledEnd: '2026-08-09T15:00', actualStart: '2026-08-07T07:00', actualEnd: '2026-08-09T15:30',
            plannedQuantity: 30, producedQuantity: 27, rejectedQuantity: 3, reprocessedQuantity: 3,
            materialsConsumed: [{ itemId: 'MP00010', lotId: 'LOT-006', quantity: 1182, unitOfMeasure: 'UND' }],
            operations: opsLog('BOM-001', 5, '2026-08-07T07:00'),
            incidents: 'Molde MOL-POSTE-9-02 en mal estado — fisuras en 3 unidades detectadas en liberación de calidad.',
            status: 'completed',
          },
        ],
      },
    ],
  },
  {
    id: 'HT-2026-0305', number: 'HT-2026-0305', plant: 'AL01 · Accesorios 01',
    scheduledDate: '2026-08-06', committedDate: '2026-08-11', responsible: 'Haldeer Vasquez', atRisk: true,
    riskReason: 'BOM en versión "En cambio" (v1.4 borrador) — pendiente de aprobación antes de liberar producción.',
    lines: [
      {
        id: 'HTL-0305-1', productId: 'PROD-004', bomId: 'BOM-004', bomVersion: 'v1.4', routing: routingFor('BOM-004'),
        plannedQuantity: 40, unitOfMeasure: 'UND',
        materials: [
          { itemId: 'MP00009', required: 112, available: 60, reserved: 60, consumed: 0, unitOfMeasure: 'BOL', isSupply: false, exception: 'Faltan 52 bolsas — cubierto por OC-2026-0514 pendiente de aprobación.' },
          { itemId: 'MP00004', required: 4, available: 18, reserved: 4, consumed: 0, unitOfMeasure: 'M3', isSupply: false },
          { itemId: 'SU01122', required: 40, available: 72, reserved: 40, consumed: 0, unitOfMeasure: 'UND', isSupply: true },
        ],
        runs: [
          {
            id: 'RUN-0305-1', sequence: 1, workCenterId: 'WC-003', machineId: 'MCH-004', moldId: 'MLD-004', operatorName: 'Haldeer Vasquez',
            scheduledStart: '2026-09-02T07:00', scheduledEnd: '2026-09-03T15:00',
            plannedQuantity: 40, producedQuantity: 0, rejectedQuantity: 0, reprocessedQuantity: 0,
            materialsConsumed: [],
            operations: opsLog('BOM-004', 0, '2026-09-02T07:00'),
            status: 'planned',
          },
        ],
      },
    ],
  },
  {
    id: 'HT-2026-0291', number: 'HT-2026-0291', plant: 'AL01 · Planta 02',
    scheduledDate: '2026-08-14', committedDate: '2026-08-20', responsible: 'Alex Vasquez', atRisk: false,
    lines: [
      {
        id: 'HTL-0291-1', productId: 'PROD-001', bomId: 'BOM-001', bomVersion: 'v2.1', routing: routingFor('BOM-001'),
        plannedQuantity: 20, unitOfMeasure: 'UND',
        materials: [
          { itemId: 'MP00006', required: 160, available: 850, reserved: 0, consumed: 0, unitOfMeasure: 'BOL', isSupply: false },
          { itemId: 'MP00011', required: 240, available: 920, reserved: 0, consumed: 0, unitOfMeasure: 'UND', isSupply: false },
        ],
        runs: [],
      },
    ],
  },
  {
    id: 'HT-2026-0330', number: 'HT-2026-0330', plant: 'AL01 · Planta 03',
    scheduledDate: '2026-08-25', committedDate: '2026-08-29', responsible: 'Cristian Espinoza', atRisk: true,
    riskReason: 'Faltante de tubería PVC (MA00031) — requerimiento de compra generado automáticamente (SC-2026-0148).',
    lines: [
      {
        id: 'HTL-0330-1', productId: 'PROD-002', bomId: 'BOM-002', bomVersion: 'v1.3', routing: routingFor('BOM-002'),
        plannedQuantity: 45, unitOfMeasure: 'UND',
        materials: [
          { itemId: 'MP00008', required: 160, available: 900, reserved: 0, consumed: 0, unitOfMeasure: 'BOL', isSupply: false },
          { itemId: 'MA00031', required: 180, available: 45, reserved: 0, consumed: 0, unitOfMeasure: 'UND', isSupply: false, exception: 'Stock insuficiente de tubería PVC — se generó un requerimiento de compra automático.' },
        ],
        runs: [
          {
            id: 'RUN-0330-1', sequence: 1, workCenterId: 'WC-002', machineId: 'MCH-003', moldId: 'MLD-003', operatorName: 'Cristian Espinoza',
            scheduledStart: '2026-09-03T07:00', scheduledEnd: '2026-09-04T15:00',
            plannedQuantity: 45, producedQuantity: 0, rejectedQuantity: 0, reprocessedQuantity: 0,
            materialsConsumed: [],
            operations: opsLog('BOM-002', 0, '2026-09-03T07:00'),
            status: 'planned',
          },
        ],
      },
    ],
  },
  {
    id: 'HT-2026-0320', number: 'HT-2026-0320', plant: 'AL01 · Planta 03',
    scheduledDate: '2026-08-18', committedDate: '2026-08-24', responsible: 'Cristian Espinoza', atRisk: false,
    lines: [
      {
        id: 'HTL-0320-1', productId: 'PROD-002', bomId: 'BOM-002', bomVersion: 'v1.3', routing: routingFor('BOM-002'),
        plannedQuantity: 90, unitOfMeasure: 'UND',
        materials: [
          { itemId: 'MP00008', required: 315, available: 900, reserved: 0, consumed: 315, unitOfMeasure: 'BOL', isSupply: false },
        ],
        runs: [
          {
            id: 'RUN-0320-1', sequence: 1, workCenterId: 'WC-002', machineId: 'MCH-003', moldId: 'MLD-003', operatorName: 'Cristian Espinoza',
            scheduledStart: '2026-08-18T07:00', scheduledEnd: '2026-08-19T15:00', actualStart: '2026-08-18T07:00', actualEnd: '2026-08-19T14:00',
            plannedQuantity: 45, producedQuantity: 44, rejectedQuantity: 1, reprocessedQuantity: 1,
            materialsConsumed: [{ itemId: 'MP00008', lotId: 'LOT-014', quantity: 158, unitOfMeasure: 'BOL' }],
            operations: opsLog('BOM-002', 5, '2026-08-18T07:00'),
            status: 'completed',
          },
          {
            id: 'RUN-0320-2', sequence: 2, workCenterId: 'WC-002', machineId: 'MCH-003', moldId: 'MLD-003', operatorName: 'Cristian Espinoza',
            scheduledStart: '2026-08-20T07:00', scheduledEnd: '2026-08-21T15:00', actualStart: '2026-08-20T07:00', actualEnd: '2026-08-21T13:30',
            plannedQuantity: 45, producedQuantity: 45, rejectedQuantity: 0, reprocessedQuantity: 0,
            materialsConsumed: [{ itemId: 'MP00008', lotId: 'LOT-014', quantity: 157, unitOfMeasure: 'BOL' }],
            operations: opsLog('BOM-002', 5, '2026-08-20T07:00'),
            status: 'completed',
          },
        ],
      },
    ],
  },
  {
    id: 'HT-2026-0335', number: 'HT-2026-0335', plant: 'AL01 · Accesorios 01',
    scheduledDate: '2026-08-24', committedDate: '2026-08-28', responsible: 'Haldeer Vasquez', atRisk: false,
    lines: [
      {
        id: 'HTL-0335-1', productId: 'PROD-005', bomId: 'BOM-005', bomVersion: 'v1.0', routing: routingFor('BOM-005'),
        plannedQuantity: 35, unitOfMeasure: 'UND',
        materials: [
          { itemId: 'MP00009', required: 88, available: 120, reserved: 0, consumed: 88, unitOfMeasure: 'BOL', isSupply: false },
        ],
        runs: [
          {
            id: 'RUN-0335-1', sequence: 1, workCenterId: 'WC-003', machineId: 'MCH-004', moldId: 'MLD-005', operatorName: 'Haldeer Vasquez',
            scheduledStart: '2026-08-24T07:00', scheduledEnd: '2026-08-25T15:00', actualStart: '2026-08-24T07:00', actualEnd: '2026-08-25T15:00',
            plannedQuantity: 35, producedQuantity: 33, rejectedQuantity: 2, reprocessedQuantity: 2,
            materialsConsumed: [{ itemId: 'MP00009', lotId: 'LOT-003', quantity: 88, unitOfMeasure: 'BOL' }],
            operations: opsLog('BOM-005', 5, '2026-08-24T07:00'),
            status: 'completed',
          },
        ],
      },
    ],
  },
  {
    id: 'HT-2026-1010', number: 'HT-2026-1010', plant: 'AL01 · Planta 02',
    scheduledDate: '2026-08-29', committedDate: '2026-09-03', responsible: 'Alex Vasquez', atRisk: false,
    lines: [
      {
        id: 'HTL-1010-1', productId: 'PROD-006', bomId: 'BOM-006', bomVersion: 'v1.0', routing: routingFor('BOM-006'),
        plannedQuantity: 20, unitOfMeasure: 'UND',
        materials: [
          { itemId: 'MP00006', required: 200, available: 850, reserved: 0, consumed: 200, unitOfMeasure: 'BOL', isSupply: false },
        ],
        runs: [
          {
            id: 'RUN-1010-1', sequence: 1, workCenterId: 'WC-001', machineId: 'MCH-001', moldId: 'MLD-006', operatorName: 'Alex Vasquez',
            scheduledStart: '2026-08-29T07:00', scheduledEnd: '2026-08-30T15:00', actualStart: '2026-08-29T07:00', actualEnd: '2026-08-30T14:00',
            plannedQuantity: 20, producedQuantity: 19, rejectedQuantity: 1, reprocessedQuantity: 0,
            materialsConsumed: [{ itemId: 'MP00006', lotId: 'LOT-002', quantity: 200, unitOfMeasure: 'BOL' }],
            operations: opsLog('BOM-006', 5, '2026-08-29T07:00'),
            status: 'completed',
          },
        ],
      },
    ],
  },
  {
    id: 'HT-2026-1001', number: 'HT-2026-1001', plant: 'AL01 · Planta 02',
    salesOrderId: 'SO-001', salesOrderNumber: 'SO-2026-0001', customerName: 'Electro Sur S.A.C.',
    scheduledDate: '2026-09-02', committedDate: '2026-09-10', responsible: 'Alex Vasquez', atRisk: false,
    lines: [
      {
        id: 'HTL-1001-1', productId: 'PROD-006', bomId: 'BOM-006', bomVersion: 'v1.0', routing: routingFor('BOM-006'),
        plannedQuantity: 15, unitOfMeasure: 'UND',
        materials: [
          { itemId: 'MP00006', required: 150, available: 850, reserved: 150, consumed: 0, unitOfMeasure: 'BOL', isSupply: false },
          { itemId: 'MP00001', required: 6.3, available: 22, reserved: 6.3, consumed: 0, unitOfMeasure: 'M3', isSupply: false },
        ],
        runs: [
          {
            id: 'RUN-1001-1', sequence: 1, workCenterId: 'WC-001', machineId: 'MCH-001', moldId: 'MLD-006', operatorName: 'Alex Vasquez',
            scheduledStart: '2026-09-02T07:00', scheduledEnd: '2026-09-03T15:00', actualStart: '2026-09-02T07:10',
            plannedQuantity: 15, producedQuantity: 6, rejectedQuantity: 0, reprocessedQuantity: 0,
            materialsConsumed: [{ itemId: 'MP00006', lotId: 'LOT-002', quantity: 60, unitOfMeasure: 'BOL' }],
            operations: opsLog('BOM-006', 1, '2026-09-02T07:10'),
            status: 'in_progress',
          },
        ],
      },
    ],
  },
];

export const OUTPUT_BUNDLES: OutputBundle[] = [
  {
    id: 'OB-001', number: 'B-2026-0045', plant: 'AL01 · Planta 02', date: '2026-08-08', workSheetIds: ['HT-2026-0311', 'HT-2026-0303'], status: 'signed',
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
    id: 'OB-002', number: 'B-2026-0046', plant: 'AL01 · Accesorios 01', date: '2026-08-09', workSheetIds: ['HT-2026-0305'], status: 'lot_selected',
    selectedLots: [{ itemId: 'MP00009', lotId: 'LOT-003', quantity: 60, recommended: true }],
    exceptions: [],
  },
  {
    id: 'OB-003', number: 'B-2026-0038', plant: 'AL01 · Planta 03', date: '2026-08-05', workSheetIds: ['HT-2026-0298'], status: 'dispatched',
    selectedLots: [{ itemId: 'MP00008', lotId: 'LOT-014', quantity: 210, recommended: false }],
    exceptions: [
      { itemId: 'MA00031', reason: 'Se utilizaron tubos PVC adicionales por rotura de 6 unidades durante el armado.', authorizedBy: 'Jorge Salcedo', status: 'authorized' },
    ],
    operatorSignature: 'Cristian Espinoza', supervisorSignature: 'Jorge Salcedo',
  },
];
