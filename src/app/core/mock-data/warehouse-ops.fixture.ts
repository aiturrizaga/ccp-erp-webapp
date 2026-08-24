import { GoodsReceipt, StockIssue, StockLedgerEntry, StockLot } from '@core/models';

export const GOODS_RECEIPTS: GoodsReceipt[] = [
  {
    id: 'GR-001', number: 'REC-2026-0301', purchaseOrderId: 'PO-001', supplierId: 'SUP-011', status: 'partial',
    expectedDate: '2026-08-09', expectedTime: '08:00', actualDate: '2026-08-08', actualTime: '08:40',
    receivedBy: 'Cristian Espinoza',
    lines: [{ itemId: 'MP00006', expectedQuantity: 600, receivedQuantity: 400, acceptedQuantity: 400, claimedQuantity: 0, lot: 'CEM-20260808-A', locationId: 'LOC-P2', inspectionResult: 'compliant', note: 'Entrega parcial autorizada por disponibilidad de flota del proveedor.' }],
    photos: ['guia-remision-301.jpg', 'bolsas-cemento-301.jpg'], operatorSignature: 'Cristian Espinoza', supervisorSignature: 'Rosa Injante',
  },
  {
    id: 'GR-002', number: 'REC-2026-0298', purchaseOrderId: 'PO-006', supplierId: 'SUP-004', status: 'received',
    expectedDate: '2026-08-03', expectedTime: '07:00', actualDate: '2026-08-03', actualTime: '07:15',
    receivedBy: 'Alex Vasquez',
    lines: [
      { itemId: 'MP00001', expectedQuantity: 40, receivedQuantity: 40, acceptedQuantity: 40, claimedQuantity: 0, locationId: 'LOC-P1', inspectionResult: 'compliant' },
      { itemId: 'MP00002', expectedQuantity: 40, receivedQuantity: 40, acceptedQuantity: 40, claimedQuantity: 0, locationId: 'LOC-P1', inspectionResult: 'compliant' },
    ],
    photos: ['guia-remision-298.jpg'], operatorSignature: 'Alex Vasquez', supervisorSignature: 'Rosa Injante',
  },
  {
    id: 'GR-003', number: 'REC-2026-0285', purchaseOrderId: 'PO-003', supplierId: 'SUP-016', status: 'closed',
    expectedDate: '2026-07-26', expectedTime: '10:00', actualDate: '2026-07-26', actualTime: '10:20',
    receivedBy: 'Haldeer Vasquez',
    lines: [
      { itemId: 'MA00001', expectedQuantity: 60, receivedQuantity: 60, acceptedQuantity: 60, claimedQuantity: 0, locationId: 'LOC-P2', inspectionResult: 'compliant' },
      { itemId: 'MA00024', expectedQuantity: 40, receivedQuantity: 40, acceptedQuantity: 40, claimedQuantity: 0, locationId: 'LOC-P2', inspectionResult: 'compliant' },
    ],
    photos: ['guia-remision-285.jpg', 'firma-285.jpg'], operatorSignature: 'Haldeer Vasquez', supervisorSignature: 'Jorge Salcedo',
  },
  {
    id: 'GR-004', number: 'REC-2026-0290', purchaseOrderId: 'PO-008', supplierId: 'SUP-003', status: 'with_discrepancies',
    expectedDate: '2026-07-16', expectedTime: '09:00', actualDate: '2026-07-16', actualTime: '11:05',
    receivedBy: 'Cristian Espinoza',
    lines: [{ itemId: 'SU01122', expectedQuantity: 80, receivedQuantity: 80, acceptedQuantity: 72, claimedQuantity: 8, locationId: 'LOC-P2', inspectionResult: 'observed', note: '8 unidades con rosca dañada — enviadas a reclamo, no incrementan stock disponible.' }],
    photos: ['evidencia-danio-290-1.jpg', 'evidencia-danio-290-2.jpg'], operatorSignature: 'Cristian Espinoza', supervisorSignature: 'Rosa Injante',
  },
  {
    id: 'GR-005', number: 'REC-2026-0303', purchaseOrderId: 'PO-010', supplierId: 'SUP-013', status: 'received',
    expectedDate: '2026-08-02', expectedTime: '08:30', actualDate: '2026-08-02', actualTime: '08:50',
    receivedBy: 'Alex Vasquez',
    lines: [{ itemId: 'MP00013', expectedQuantity: 1500, receivedQuantity: 1500, acceptedQuantity: 1500, claimedQuantity: 0, lot: 'FIERRO-20260802-P2', locationId: 'LOC-P2', inspectionResult: 'compliant' }],
    photos: ['guia-remision-303.jpg'], operatorSignature: 'Alex Vasquez', supervisorSignature: 'Rosa Injante',
  },
  {
    id: 'GR-006', number: 'REC-2026-0309', purchaseOrderId: 'PO-002', supplierId: 'SUP-013', status: 'scheduled',
    expectedDate: '2026-08-14', expectedTime: '09:30', receivedBy: '—',
    lines: [{ itemId: 'MP00011', expectedQuantity: 3000, receivedQuantity: 0, acceptedQuantity: 0, claimedQuantity: 0, locationId: 'LOC-P1', inspectionResult: 'compliant' }],
    photos: [],
  },
  {
    id: 'GR-007', number: 'REC-2026-0310', purchaseOrderId: 'PO-004', supplierId: 'SUP-006', status: 'scheduled',
    expectedDate: '2026-08-19', expectedTime: '14:00', receivedBy: '—',
    lines: [{ itemId: 'MA00031', expectedQuantity: 200, receivedQuantity: 0, acceptedQuantity: 0, claimedQuantity: 0, locationId: 'LOC-P1', inspectionResult: 'compliant' }],
    photos: [],
  },
];

/**
 * A Hoja de Trabajo gets its outbound order the moment it's created, listing everything it needs —
 * Almacén attends it (fully or partially) as materials become available, whether from existing
 * stock or from a Purchase Order that just arrived. "Otro motivo" issues aren't tied to a HT and
 * are dispatched in the same step they're created.
 */
export const STOCK_ISSUES: StockIssue[] = [
  {
    id: 'SI-001', number: 'SAL-2026-0142', origin: 'work_sheet', workSheetId: 'WS-001', status: 'partial',
    createdAt: '2026-08-07', plant: 'Planta Lima — P2',
    lines: [
      { itemId: 'MP00006', requiredQuantity: 240, dispatchedQuantity: 160, unitOfMeasure: 'BOL' },
      { itemId: 'MP00001', requiredQuantity: 10.5, dispatchedQuantity: 7, unitOfMeasure: 'M3' },
      { itemId: 'MP00002', requiredQuantity: 13.5, dispatchedQuantity: 9, unitOfMeasure: 'M3' },
      { itemId: 'MP00011', requiredQuantity: 360, dispatchedQuantity: 240, unitOfMeasure: 'UND' },
      { itemId: 'MP00013', requiredQuantity: 120, dispatchedQuantity: 80, unitOfMeasure: 'UND' },
      { itemId: 'MA00001', requiredQuantity: 24, dispatchedQuantity: 16, unitOfMeasure: 'KG' },
    ],
    dispatches: [
      {
        date: '2026-08-07', time: '09:20', dispatchedBy: 'Rosa Injante', receivedBy: 'Alex Vasquez',
        lines: [
          { itemId: 'MP00006', quantity: 160 },
          { itemId: 'MP00001', quantity: 7 },
          { itemId: 'MP00002', quantity: 9 },
          { itemId: 'MP00011', quantity: 240 },
          { itemId: 'MP00013', quantity: 80 },
          { itemId: 'MA00001', quantity: 16 },
        ],
      },
    ],
  },
  {
    id: 'SI-002', number: 'SAL-2026-0148', origin: 'work_sheet', workSheetId: 'WS-004', status: 'pending',
    createdAt: '2026-08-06', plant: 'Planta Accesorios',
    lines: [
      { itemId: 'MP00009', requiredQuantity: 112, dispatchedQuantity: 0, unitOfMeasure: 'BOL' },
      { itemId: 'MP00004', requiredQuantity: 4, dispatchedQuantity: 0, unitOfMeasure: 'M3' },
      { itemId: 'SU01122', requiredQuantity: 40, dispatchedQuantity: 0, unitOfMeasure: 'UND' },
    ],
    dispatches: [],
  },
  {
    id: 'SI-003', number: 'SAL-2026-0151', origin: 'work_sheet', workSheetId: 'WS-005', status: 'pending',
    createdAt: '2026-08-14', plant: 'Planta Lima — P2',
    lines: [
      { itemId: 'MP00006', requiredQuantity: 160, dispatchedQuantity: 0, unitOfMeasure: 'BOL' },
      { itemId: 'MP00011', requiredQuantity: 240, dispatchedQuantity: 0, unitOfMeasure: 'UND' },
    ],
    dispatches: [],
  },
  {
    id: 'SI-004', number: 'SAL-2026-0158', origin: 'work_sheet', workSheetId: 'WS-007', status: 'pending',
    createdAt: '2026-08-25', plant: 'Planta Lima — P3',
    lines: [
      { itemId: 'MP00008', requiredQuantity: 160, dispatchedQuantity: 0, unitOfMeasure: 'BOL' },
      { itemId: 'MP00003', requiredQuantity: 8.1, dispatchedQuantity: 0, unitOfMeasure: 'M3' },
      { itemId: 'MA00031', requiredQuantity: 180, dispatchedQuantity: 0, unitOfMeasure: 'UND' },
    ],
    dispatches: [],
  },
  {
    id: 'SI-005', number: 'SAL-2026-0159', origin: 'work_sheet', workSheetId: 'WS-008', status: 'pending',
    createdAt: '2026-08-26', plant: 'Planta Accesorios',
    lines: [
      { itemId: 'MP00009', requiredQuantity: 98, dispatchedQuantity: 0, unitOfMeasure: 'BOL' },
      { itemId: 'SU01122', requiredQuantity: 35, dispatchedQuantity: 0, unitOfMeasure: 'UND' },
    ],
    dispatches: [],
  },
  {
    id: 'SI-006', number: 'SAL-2026-0160', origin: 'work_sheet', workSheetId: 'WS-009', status: 'pending',
    createdAt: '2026-08-27', plant: 'Planta Accesorios',
    lines: [
      { itemId: 'MP00009', requiredQuantity: 75, dispatchedQuantity: 0, unitOfMeasure: 'BOL' },
      { itemId: 'MP00004', requiredQuantity: 2.7, dispatchedQuantity: 0, unitOfMeasure: 'M3' },
    ],
    dispatches: [],
  },
  {
    id: 'SI-007', number: 'SAL-2026-0130', origin: 'other', reason: 'Entrega de EPP (botas de jebe) para personal de mantenimiento — no asociado a una Hoja de Trabajo.',
    status: 'dispatched', createdAt: '2026-08-05', plant: 'Planta Lima',
    lines: [{ itemId: 'SU00096', requiredQuantity: 4, dispatchedQuantity: 4, unitOfMeasure: 'PAR' }],
    dispatches: [
      { date: '2026-08-05', time: '11:10', dispatchedBy: 'Cristian Espinoza', receivedBy: 'Jorge Salcedo', lines: [{ itemId: 'SU00096', quantity: 4 }] },
    ],
  },
];

export const STOCK_LEDGER: StockLedgerEntry[] = [
  { id: 'SL-001', date: '2026-07-31', itemId: 'MP00001', type: 'inbound', documentNumber: 'REC-2026-0290-A', documentType: 'GoodsReceipt', warehouseId: 'WH-001', locationId: 'LOC-P3', inboundQuantity: 40, outboundQuantity: 0, balance: 40, unitCost: 52, user: 'Sistema' },
  { id: 'SL-002', date: '2026-08-01', itemId: 'MP00006', type: 'inbound', documentNumber: 'ING-CEM-000123', documentType: 'GoodsReceipt', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 400, outboundQuantity: 0, balance: 400, unitCost: 22, user: 'Cristian Espinoza' },
  { id: 'SL-003', date: '2026-08-01', itemId: 'MP00006', type: 'consumption', documentNumber: 'HT-2026-0298', documentType: 'WorkSheet', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 0, outboundQuantity: 250, balance: 150, unitCost: 22, user: 'Alex Vasquez' },
  { id: 'SL-004', date: '2026-08-01', itemId: 'MP00011', type: 'consumption', documentNumber: 'HT-2026-0298', documentType: 'WorkSheet', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 0, outboundQuantity: 2080, balance: 920, unitCost: 16.1, user: 'Alex Vasquez' },
  { id: 'SL-005', date: '2026-08-02', itemId: 'MP00013', type: 'inbound', documentNumber: 'REC-2026-0303', documentType: 'GoodsReceipt', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 1500, outboundQuantity: 0, balance: 1740, unitCost: 16.9, user: 'Alex Vasquez' },
  { id: 'SL-006', date: '2026-08-04', itemId: 'MP00006', type: 'inbound', documentNumber: 'ING-CEM-000124', documentType: 'GoodsReceipt', warehouseId: 'WH-001', locationId: 'LOC-P3', inboundQuantity: 300, outboundQuantity: 0, balance: 450, unitCost: 22, user: 'Cristian Espinoza' },
  { id: 'SL-007', date: '2026-08-05', itemId: 'MP00010', type: 'consumption', documentNumber: 'HT-2026-0303', documentType: 'WorkSheet', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 0, outboundQuantity: 1182, balance: 318, unitCost: 5.6, user: 'Alex Vasquez' },
  { id: 'SL-008', date: '2026-07-13', itemId: 'SU00284', type: 'outbound', documentNumber: 'SAL-SUM-000045', documentType: 'OutputBundle', warehouseId: 'WH-001', locationId: 'LOC-P1', inboundQuantity: 0, outboundQuantity: 1, balance: 24, unitCost: 22, user: 'Cristian Espinoza' },
  { id: 'SL-009', date: '2026-07-14', itemId: 'MA00054', type: 'outbound', documentNumber: 'SAL-SUM-000052', documentType: 'OutputBundle', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 0, outboundQuantity: 5, balance: 34, unitCost: 12.3, user: 'Haldeer Vasquez' },
  { id: 'SL-010', date: '2026-07-15', itemId: 'SU00130', type: 'outbound', documentNumber: 'SAL-SUM-000061', documentType: 'OutputBundle', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 0, outboundQuantity: 7, balance: 68, unitCost: 1.25, user: 'Haldeer Vasquez' },
  { id: 'SL-011', date: '2026-07-16', itemId: 'SU01122', type: 'inbound', documentNumber: 'REC-2026-0290', documentType: 'GoodsReceipt', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 72, outboundQuantity: 0, balance: 72, unitCost: 19, user: 'Cristian Espinoza' },
  { id: 'SL-012', date: '2026-07-16', itemId: 'SU01122', type: 'adjustment', documentNumber: 'REC-2026-0290-CLAIM', documentType: 'Adjustment', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 0, outboundQuantity: 0, balance: 8, unitCost: 19, user: 'Rosa Injante' },
  { id: 'SL-013', date: '2026-07-21', itemId: 'MA00001', type: 'inbound', documentNumber: 'REC-2026-0285', documentType: 'GoodsReceipt', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 60, outboundQuantity: 0, balance: 60, unitCost: 12.8, user: 'Haldeer Vasquez' },
  { id: 'SL-014', date: '2026-07-26', itemId: 'MA00024', type: 'inbound', documentNumber: 'REC-2026-0285', documentType: 'GoodsReceipt', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 40, outboundQuantity: 0, balance: 40, unitCost: 12.1, user: 'Haldeer Vasquez' },
  { id: 'SL-015', date: '2026-08-08', itemId: 'MP00006', type: 'inbound', documentNumber: 'REC-2026-0301', documentType: 'GoodsReceipt', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 400, outboundQuantity: 0, balance: 850, unitCost: 22, user: 'Cristian Espinoza' },
];

export const STOCK_LOTS: StockLot[] = [
  { id: 'LOT-001', itemId: 'MP00006', lot: 'CEM-20260808-A', receivedAt: '2026-08-08', locationId: 'LOC-P2', quantity: 400, status: 'available', unitCost: 22, sourceDocument: 'REC-2026-0301' },
  { id: 'LOT-002', itemId: 'MP00006', lot: 'CEM-20260804-B', receivedAt: '2026-08-04', locationId: 'LOC-P3', quantity: 300, status: 'available', unitCost: 22, sourceDocument: 'REC-2026-0298' },
  { id: 'LOT-003', itemId: 'MP00006', lot: 'CEM-20260801-A', receivedAt: '2026-08-01', locationId: 'LOC-P2', quantity: 150, status: 'available', unitCost: 22, sourceDocument: 'REC-2026-0295' },
  { id: 'LOT-004', itemId: 'MP00013', lot: 'FIERRO-20260802-P2', receivedAt: '2026-08-02', locationId: 'LOC-P2', quantity: 1500, status: 'available', unitCost: 16.9, sourceDocument: 'REC-2026-0303' },
  { id: 'LOT-005', itemId: 'MP00011', lot: 'FIERRO-20260709-P2', receivedAt: '2026-07-09', locationId: 'LOC-P2', quantity: 920, status: 'available', unitCost: 16.1, sourceDocument: 'REC-2026-0270' },
  { id: 'LOT-006', itemId: 'MP00010', lot: 'FIERRO-20260703-P2', receivedAt: '2026-07-03', locationId: 'LOC-P2', quantity: 318, status: 'available', unitCost: 5.6, sourceDocument: 'REC-2026-0261' },
  { id: 'LOT-007', itemId: 'SU01122', lot: 'ACC-20260716', receivedAt: '2026-07-16', locationId: 'LOC-P2', quantity: 72, status: 'available', unitCost: 19, sourceDocument: 'REC-2026-0290' },
  { id: 'LOT-008', itemId: 'SU01122', lot: 'ACC-20260716-RECLAMO', receivedAt: '2026-07-16', locationId: 'LOC-P2', quantity: 8, status: 'claimed', unitCost: 19, sourceDocument: 'REC-2026-0290' },
  { id: 'LOT-009', itemId: 'MP00046', lot: 'POSTE-20260807-P1', receivedAt: '2026-08-07', locationId: 'LOC-P3', quantity: 24, status: 'available', unitCost: 287, sourceDocument: 'HT-2026-0298' },
  { id: 'LOT-010', itemId: 'MP00046', lot: 'POSTE-20260731-P1', receivedAt: '2026-07-31', locationId: 'LOC-P3', quantity: 18, status: 'reserved', unitCost: 287, sourceDocument: 'HT-2026-0291' },
  { id: 'LOT-011', itemId: 'MP00047', lot: 'DUCTO4V-20260805-P3', receivedAt: '2026-08-05', locationId: 'LOC-P3', quantity: 40, status: 'available', unitCost: 170, sourceDocument: 'HT-2026-0300' },
  { id: 'LOT-012', itemId: 'MP00049', lot: 'CAJA-20260806-ACC', receivedAt: '2026-08-06', locationId: 'LOC-P3', quantity: 32, status: 'available', unitCost: 96.5, sourceDocument: 'HT-2026-0305' },
  { id: 'LOT-013', itemId: 'MA00001', lot: 'ELEC-20260721', receivedAt: '2026-07-21', locationId: 'LOC-P2', quantity: 34, status: 'available', unitCost: 12.8, sourceDocument: 'REC-2026-0285' },
  { id: 'LOT-014', itemId: 'MP00006', lot: 'CEM-20260615-VIEJO', receivedAt: '2026-06-15', locationId: 'LOC-P1', quantity: 20, status: 'quarantine', unitCost: 21.5, sourceDocument: 'REC-2026-0250' },
];
