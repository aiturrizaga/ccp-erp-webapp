import { GoodsReceipt, StockIssue, StockLedgerEntry, StockLot } from '@core/models';

export const GOODS_RECEIPTS: GoodsReceipt[] = [
  {
    id: 'GR-001', number: 'NI-2026-0301', purchaseOrderId: 'PO-001', supplierId: 'SUP-011', status: 'partial',
    expectedDate: '2026-08-09', expectedTime: '08:00', actualDate: '2026-08-08', actualTime: '08:40',
    receivedBy: 'Cristian Espinoza',
    lines: [{ itemId: 'MP00006', expectedQuantity: 600, receivedQuantity: 400, acceptedQuantity: 400, claimedQuantity: 0, lot: 'CEM-20260808-A', locationId: 'LOC-P2', inspectionResult: 'compliant', note: 'Entrega parcial autorizada por disponibilidad de flota del proveedor.' }],
    photos: ['guia-remision-301.jpg', 'bolsas-cemento-301.jpg'], operatorSignature: 'Cristian Espinoza', supervisorSignature: 'Rosa Injante',
  },
  {
    id: 'GR-002', number: 'NI-2026-0298', purchaseOrderId: 'PO-006', supplierId: 'SUP-004', status: 'received',
    expectedDate: '2026-08-03', expectedTime: '07:00', actualDate: '2026-08-03', actualTime: '07:15',
    receivedBy: 'Alex Vasquez',
    lines: [
      { itemId: 'MP00001', expectedQuantity: 40, receivedQuantity: 40, acceptedQuantity: 40, claimedQuantity: 0, locationId: 'LOC-P1', inspectionResult: 'compliant' },
      { itemId: 'MP00002', expectedQuantity: 40, receivedQuantity: 40, acceptedQuantity: 40, claimedQuantity: 0, locationId: 'LOC-P1', inspectionResult: 'compliant' },
    ],
    photos: ['guia-remision-298.jpg'], operatorSignature: 'Alex Vasquez', supervisorSignature: 'Rosa Injante',
  },
  {
    id: 'GR-003', number: 'NI-2026-0285', purchaseOrderId: 'PO-003', supplierId: 'SUP-016', status: 'closed',
    expectedDate: '2026-07-26', expectedTime: '10:00', actualDate: '2026-07-26', actualTime: '10:20',
    receivedBy: 'Haldeer Vasquez',
    lines: [
      { itemId: 'MA00001', expectedQuantity: 60, receivedQuantity: 60, acceptedQuantity: 60, claimedQuantity: 0, locationId: 'LOC-P2', inspectionResult: 'compliant' },
      { itemId: 'MA00024', expectedQuantity: 40, receivedQuantity: 40, acceptedQuantity: 40, claimedQuantity: 0, locationId: 'LOC-P2', inspectionResult: 'compliant' },
    ],
    photos: ['guia-remision-285.jpg', 'firma-285.jpg'], operatorSignature: 'Haldeer Vasquez', supervisorSignature: 'Jorge Salcedo',
  },
  {
    id: 'GR-004', number: 'NI-2026-0290', purchaseOrderId: 'PO-008', supplierId: 'SUP-003', status: 'with_discrepancies',
    expectedDate: '2026-07-16', expectedTime: '09:00', actualDate: '2026-07-16', actualTime: '11:05',
    receivedBy: 'Cristian Espinoza',
    lines: [{ itemId: 'SU01122', expectedQuantity: 80, receivedQuantity: 80, acceptedQuantity: 72, claimedQuantity: 8, locationId: 'LOC-P2', inspectionResult: 'observed', note: '8 unidades con rosca dañada — enviadas a reclamo, no incrementan stock disponible.' }],
    photos: ['evidencia-danio-290-1.jpg', 'evidencia-danio-290-2.jpg'], operatorSignature: 'Cristian Espinoza', supervisorSignature: 'Rosa Injante',
  },
  {
    id: 'GR-005', number: 'NI-2026-0303', purchaseOrderId: 'PO-010', supplierId: 'SUP-013', status: 'received',
    expectedDate: '2026-08-02', expectedTime: '08:30', actualDate: '2026-08-02', actualTime: '08:50',
    receivedBy: 'Alex Vasquez',
    lines: [{ itemId: 'MP00013', expectedQuantity: 1500, receivedQuantity: 1500, acceptedQuantity: 1500, claimedQuantity: 0, lot: 'FIERRO-20260802-P2', locationId: 'LOC-P2', inspectionResult: 'compliant' }],
    photos: ['guia-remision-303.jpg'], operatorSignature: 'Alex Vasquez', supervisorSignature: 'Rosa Injante',
  },
  {
    id: 'GR-006', number: 'NI-2026-0309', purchaseOrderId: 'PO-002', supplierId: 'SUP-013', status: 'scheduled',
    expectedDate: '2026-08-14', expectedTime: '09:30', receivedBy: '—',
    lines: [{ itemId: 'MP00011', expectedQuantity: 3000, receivedQuantity: 0, acceptedQuantity: 0, claimedQuantity: 0, locationId: 'LOC-P1', inspectionResult: 'compliant' }],
    photos: [],
  },
  {
    id: 'GR-007', number: 'NI-2026-0310', purchaseOrderId: 'PO-004', supplierId: 'SUP-006', status: 'scheduled',
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
    id: 'SI-001', number: 'NS-2026-0142', origin: 'work_sheet', workSheetId: 'WS-001', status: 'partial',
    createdAt: '2026-08-07', plant: 'AL01 · Planta 02',
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
    id: 'SI-002', number: 'NS-2026-0148', origin: 'work_sheet', workSheetId: 'WS-004', status: 'pending',
    createdAt: '2026-08-06', plant: 'AL01 · Accesorios 01',
    lines: [
      { itemId: 'MP00009', requiredQuantity: 112, dispatchedQuantity: 0, unitOfMeasure: 'BOL' },
      { itemId: 'MP00004', requiredQuantity: 4, dispatchedQuantity: 0, unitOfMeasure: 'M3' },
      { itemId: 'SU01122', requiredQuantity: 40, dispatchedQuantity: 0, unitOfMeasure: 'UND' },
    ],
    dispatches: [],
  },
  {
    id: 'SI-003', number: 'NS-2026-0151', origin: 'work_sheet', workSheetId: 'WS-005', status: 'pending',
    createdAt: '2026-08-14', plant: 'AL01 · Planta 02',
    lines: [
      { itemId: 'MP00006', requiredQuantity: 160, dispatchedQuantity: 0, unitOfMeasure: 'BOL' },
      { itemId: 'MP00011', requiredQuantity: 240, dispatchedQuantity: 0, unitOfMeasure: 'UND' },
    ],
    dispatches: [],
  },
  {
    id: 'SI-004', number: 'NS-2026-0158', origin: 'work_sheet', workSheetId: 'WS-007', status: 'pending',
    createdAt: '2026-08-25', plant: 'AL01 · Planta 03',
    lines: [
      { itemId: 'MP00008', requiredQuantity: 160, dispatchedQuantity: 0, unitOfMeasure: 'BOL' },
      { itemId: 'MP00003', requiredQuantity: 8.1, dispatchedQuantity: 0, unitOfMeasure: 'M3' },
      { itemId: 'MA00031', requiredQuantity: 180, dispatchedQuantity: 0, unitOfMeasure: 'UND' },
    ],
    dispatches: [],
  },
  {
    id: 'SI-005', number: 'NS-2026-0159', origin: 'work_sheet', workSheetId: 'WS-008', status: 'pending',
    createdAt: '2026-08-26', plant: 'AL01 · Accesorios 01',
    lines: [
      { itemId: 'MP00009', requiredQuantity: 98, dispatchedQuantity: 0, unitOfMeasure: 'BOL' },
      { itemId: 'SU01122', requiredQuantity: 35, dispatchedQuantity: 0, unitOfMeasure: 'UND' },
    ],
    dispatches: [],
  },
  {
    id: 'SI-006', number: 'NS-2026-0160', origin: 'work_sheet', workSheetId: 'WS-009', status: 'pending',
    createdAt: '2026-08-27', plant: 'AL01 · Accesorios 01',
    lines: [
      { itemId: 'MP00009', requiredQuantity: 75, dispatchedQuantity: 0, unitOfMeasure: 'BOL' },
      { itemId: 'MP00004', requiredQuantity: 2.7, dispatchedQuantity: 0, unitOfMeasure: 'M3' },
    ],
    dispatches: [],
  },
  {
    id: 'SI-007', number: 'NS-2026-0130', origin: 'other', reason: 'Entrega de EPP (botas de jebe) para personal de mantenimiento — no asociado a una Hoja de Trabajo.',
    status: 'dispatched', createdAt: '2026-08-05', plant: 'AL01 · Planta 01',
    lines: [{ itemId: 'SU00096', requiredQuantity: 4, dispatchedQuantity: 4, unitOfMeasure: 'PAR' }],
    dispatches: [
      { date: '2026-08-05', time: '11:10', dispatchedBy: 'Cristian Espinoza', receivedBy: 'Jorge Salcedo', lines: [{ itemId: 'SU00096', quantity: 4 }] },
    ],
  },
];

export const STOCK_LEDGER: StockLedgerEntry[] = [
  { id: 'SL-001', date: '2026-07-31', itemId: 'MP00001', type: 'inbound', documentNumber: 'NI-2026-0290-A', documentType: 'GoodsReceipt', warehouseId: 'WH-001', locationId: 'LOC-P3', inboundQuantity: 40, outboundQuantity: 0, balance: 40, unitCost: 52, user: 'Sistema' },
  { id: 'SL-002', date: '2026-08-01', itemId: 'MP00006', type: 'inbound', documentNumber: 'ING-CEM-000123', documentType: 'GoodsReceipt', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 400, outboundQuantity: 0, balance: 400, unitCost: 22, user: 'Cristian Espinoza' },
  { id: 'SL-003', date: '2026-08-01', itemId: 'MP00006', type: 'outbound', documentNumber: 'HT-2026-0298', documentType: 'WorkSheet', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 0, outboundQuantity: 250, balance: 150, unitCost: 22, user: 'Alex Vasquez' },
  { id: 'SL-004', date: '2026-08-01', itemId: 'MP00011', type: 'outbound', documentNumber: 'HT-2026-0298', documentType: 'WorkSheet', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 0, outboundQuantity: 2080, balance: 920, unitCost: 16.1, user: 'Alex Vasquez' },
  { id: 'SL-005', date: '2026-08-02', itemId: 'MP00013', type: 'inbound', documentNumber: 'NI-2026-0303', documentType: 'GoodsReceipt', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 1500, outboundQuantity: 0, balance: 1740, unitCost: 16.9, user: 'Alex Vasquez' },
  { id: 'SL-006', date: '2026-08-04', itemId: 'MP00006', type: 'inbound', documentNumber: 'ING-CEM-000124', documentType: 'GoodsReceipt', warehouseId: 'WH-001', locationId: 'LOC-P3', inboundQuantity: 300, outboundQuantity: 0, balance: 450, unitCost: 22, user: 'Cristian Espinoza' },
  { id: 'SL-007', date: '2026-08-05', itemId: 'MP00010', type: 'outbound', documentNumber: 'HT-2026-0303', documentType: 'WorkSheet', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 0, outboundQuantity: 1182, balance: 318, unitCost: 5.6, user: 'Alex Vasquez' },
  { id: 'SL-008', date: '2026-07-13', itemId: 'SU00284', type: 'outbound', documentNumber: 'SAL-SUM-000045', documentType: 'OutputBundle', warehouseId: 'WH-001', locationId: 'LOC-P1', inboundQuantity: 0, outboundQuantity: 1, balance: 24, unitCost: 22, user: 'Cristian Espinoza' },
  { id: 'SL-009', date: '2026-07-14', itemId: 'MA00054', type: 'outbound', documentNumber: 'SAL-SUM-000052', documentType: 'OutputBundle', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 0, outboundQuantity: 5, balance: 34, unitCost: 12.3, user: 'Haldeer Vasquez' },
  { id: 'SL-010', date: '2026-07-15', itemId: 'SU00130', type: 'outbound', documentNumber: 'SAL-SUM-000061', documentType: 'OutputBundle', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 0, outboundQuantity: 7, balance: 68, unitCost: 1.25, user: 'Haldeer Vasquez' },
  { id: 'SL-011', date: '2026-07-16', itemId: 'SU01122', type: 'inbound', documentNumber: 'NI-2026-0290', documentType: 'GoodsReceipt', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 72, outboundQuantity: 0, balance: 72, unitCost: 19, user: 'Cristian Espinoza' },
  { id: 'SL-012', date: '2026-07-16', itemId: 'SU01122', type: 'outbound', documentNumber: 'NI-2026-0290-CLAIM', documentType: 'Adjustment', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 0, outboundQuantity: 0, balance: 8, unitCost: 19, user: 'Rosa Injante' },
  { id: 'SL-013', date: '2026-07-21', itemId: 'MA00001', type: 'inbound', documentNumber: 'NI-2026-0285', documentType: 'GoodsReceipt', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 60, outboundQuantity: 0, balance: 60, unitCost: 12.8, user: 'Haldeer Vasquez' },
  { id: 'SL-014', date: '2026-07-26', itemId: 'MA00024', type: 'inbound', documentNumber: 'NI-2026-0285', documentType: 'GoodsReceipt', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 40, outboundQuantity: 0, balance: 40, unitCost: 12.1, user: 'Haldeer Vasquez' },
  { id: 'SL-015', date: '2026-08-08', itemId: 'MP00006', type: 'inbound', documentNumber: 'NI-2026-0301', documentType: 'GoodsReceipt', warehouseId: 'WH-001', locationId: 'LOC-P2', inboundQuantity: 400, outboundQuantity: 0, balance: 850, unitCost: 22, user: 'Cristian Espinoza' },
];

export const STOCK_LOTS: StockLot[] = [
  { id: 'LOT-001', itemId: 'MP00006', lot: 'CEM-20260808-A', receivedAt: '2026-08-08', locationId: 'LOC-P2', quantity: 400, status: 'available', unitCost: 22, sourceDocument: 'NI-2026-0301' },
  { id: 'LOT-002', itemId: 'MP00006', lot: 'CEM-20260804-B', receivedAt: '2026-08-04', locationId: 'LOC-P3', quantity: 300, status: 'available', unitCost: 22, sourceDocument: 'NI-2026-0298' },
  { id: 'LOT-003', itemId: 'MP00006', lot: 'CEM-20260801-A', receivedAt: '2026-08-01', locationId: 'LOC-P2', quantity: 150, status: 'available', unitCost: 22, sourceDocument: 'NI-2026-0295' },
  { id: 'LOT-004', itemId: 'MP00013', lot: 'FIERRO-20260802-P2', receivedAt: '2026-08-02', locationId: 'LOC-P2', quantity: 1500, status: 'available', unitCost: 16.9, sourceDocument: 'NI-2026-0303' },
  { id: 'LOT-005', itemId: 'MP00011', lot: 'FIERRO-20260709-P2', receivedAt: '2026-07-09', locationId: 'LOC-P2', quantity: 920, status: 'available', unitCost: 16.1, sourceDocument: 'NI-2026-0270' },
  { id: 'LOT-006', itemId: 'MP00010', lot: 'FIERRO-20260703-P2', receivedAt: '2026-07-03', locationId: 'LOC-P2', quantity: 318, status: 'available', unitCost: 5.6, sourceDocument: 'NI-2026-0261' },
  { id: 'LOT-007', itemId: 'SU01122', lot: 'ACC-20260716', receivedAt: '2026-07-16', locationId: 'LOC-P2', quantity: 72, status: 'available', unitCost: 19, sourceDocument: 'NI-2026-0290' },
  { id: 'LOT-008', itemId: 'SU01122', lot: 'ACC-20260716-RECLAMO', receivedAt: '2026-07-16', locationId: 'LOC-P2', quantity: 8, status: 'claimed', unitCost: 19, sourceDocument: 'NI-2026-0290' },
  { id: 'LOT-009', itemId: 'MP00046', lot: 'POSTE-20260807-P1', receivedAt: '2026-08-07', locationId: 'LOC-P3', quantity: 24, status: 'available', unitCost: 287, sourceDocument: 'HT-2026-0298' },
  { id: 'LOT-010', itemId: 'MP00046', lot: 'POSTE-20260731-P1', receivedAt: '2026-07-31', locationId: 'LOC-P3', quantity: 18, status: 'reserved', unitCost: 287, sourceDocument: 'HT-2026-0291' },
  { id: 'LOT-011', itemId: 'MP00047', lot: 'DUCTO4V-20260805-P3', receivedAt: '2026-08-05', locationId: 'LOC-P3', quantity: 40, status: 'available', unitCost: 170, sourceDocument: 'HT-2026-0300' },
  { id: 'LOT-012', itemId: 'MP00049', lot: 'CAJA-20260806-ACC', receivedAt: '2026-08-06', locationId: 'LOC-P3', quantity: 32, status: 'available', unitCost: 96.5, sourceDocument: 'HT-2026-0305' },
  { id: 'LOT-013', itemId: 'MA00001', lot: 'ELEC-20260721', receivedAt: '2026-07-21', locationId: 'LOC-P2', quantity: 34, status: 'available', unitCost: 12.8, sourceDocument: 'NI-2026-0285' },
  { id: 'LOT-014', itemId: 'MP00006', lot: 'CEM-20260615-VIEJO', receivedAt: '2026-06-15', locationId: 'LOC-P1', quantity: 20, status: 'quarantine', unitCost: 21.5, sourceDocument: 'NI-2026-0250' },

  // Lotes de prueba adicionales — cubren el resto del catálogo (ITEMS) que aún no tenía stock registrado.
  { id: 'LOT-015', itemId: 'MP00001', lot: 'MP00001-20260819', receivedAt: '2026-08-19', locationId: 'LOC-P2', quantity: 115, status: 'available', unitCost: 52, sourceDocument: 'NI-2026-0316' },
  { id: 'LOT-016', itemId: 'MP00002', lot: 'MP00002-20260815', receivedAt: '2026-08-15', locationId: 'LOC-P3', quantity: 125, status: 'available', unitCost: 55, sourceDocument: 'NI-2026-0317' },
  { id: 'LOT-017', itemId: 'MP00003', lot: 'MP00003-20260810', receivedAt: '2026-08-10', locationId: 'LOC-ACC1', quantity: 103, status: 'available', unitCost: 51, sourceDocument: 'NI-2026-0318' },
  { id: 'LOT-018', itemId: 'MP00004', lot: 'MP00004-20260805', receivedAt: '2026-08-05', locationId: 'LOC-P2', quantity: 85, status: 'available', unitCost: 50, sourceDocument: 'NI-2026-0319' },
  { id: 'LOT-019', itemId: 'MP00005', lot: 'MP00005-20260728', receivedAt: '2026-07-28', locationId: 'LOC-P3', quantity: 50, status: 'available', unitCost: 53, sourceDocument: 'NI-2026-0320' },
  { id: 'LOT-020', itemId: 'MP00007', lot: 'MP00007-20260720', receivedAt: '2026-07-20', locationId: 'LOC-ACC1', quantity: 650, status: 'available', unitCost: 23, sourceDocument: 'NI-2026-0321' },
  { id: 'LOT-021', itemId: 'MP00008', lot: 'MP00008-20260819', receivedAt: '2026-08-19', locationId: 'LOC-P2', quantity: 850, status: 'available', unitCost: 21, sourceDocument: 'NI-2026-0322' },
  { id: 'LOT-022', itemId: 'MP00009', lot: 'MP00009-20260815', receivedAt: '2026-08-15', locationId: 'LOC-P3', quantity: 675, status: 'available', unitCost: 22, sourceDocument: 'NI-2026-0323' },
  { id: 'LOT-023', itemId: 'MP00039', lot: 'MP00039-20260810', receivedAt: '2026-08-10', locationId: 'LOC-ACC1', quantity: 490, status: 'available', unitCost: 23.5, sourceDocument: 'NI-2026-0324' },
  { id: 'LOT-024', itemId: 'MP00012', lot: 'MP00012-20260805', receivedAt: '2026-08-05', locationId: 'LOC-P2', quantity: 2200, status: 'available', unitCost: 12.4, sourceDocument: 'NI-2026-0325' },
  { id: 'LOT-025', itemId: 'MP00014', lot: 'MP00014-20260728', receivedAt: '2026-07-28', locationId: 'LOC-P3', quantity: 1350, status: 'available', unitCost: 3150, sourceDocument: 'NI-2026-0326' },
  { id: 'LOT-026', itemId: 'MP00015', lot: 'MP00015-20260720', receivedAt: '2026-07-20', locationId: 'LOC-ACC1', quantity: 1075, status: 'available', unitCost: 3100, sourceDocument: 'NI-2026-0327' },
  { id: 'LOT-027', itemId: 'MP00034', lot: 'MP00034-20260819', receivedAt: '2026-08-19', locationId: 'LOC-P2', quantity: 2750, status: 'available', unitCost: 5.2, sourceDocument: 'NI-2026-0328' },
  { id: 'LOT-028', itemId: 'MP00016', lot: 'MP00016-20260815', receivedAt: '2026-08-15', locationId: 'LOC-P3', quantity: 2250, status: 'available', unitCost: 2.7, sourceDocument: 'NI-2026-0329' },
  { id: 'LOT-029', itemId: 'MP00017', lot: 'MP00017-20260810', receivedAt: '2026-08-10', locationId: 'LOC-ACC1', quantity: 2250, status: 'available', unitCost: 2.15, sourceDocument: 'NI-2026-0330' },
  { id: 'LOT-030', itemId: 'MP00018', lot: 'MP00018-20260805', receivedAt: '2026-08-05', locationId: 'LOC-P2', quantity: 1950, status: 'available', unitCost: 1.9, sourceDocument: 'NI-2026-0331' },
  { id: 'LOT-031', itemId: 'MP00019', lot: 'MP00019-20260728', receivedAt: '2026-07-28', locationId: 'LOC-P3', quantity: 1400, status: 'available', unitCost: 2.45, sourceDocument: 'NI-2026-0332' },
  { id: 'LOT-032', itemId: 'MA00031', lot: 'MA00031-20260720', receivedAt: '2026-07-20', locationId: 'LOC-ACC1', quantity: 350, status: 'available', unitCost: 3.7, sourceDocument: 'NI-2026-0333' },
  { id: 'LOT-033', itemId: 'MA00032', lot: 'MA00032-20260819', receivedAt: '2026-08-19', locationId: 'LOC-P2', quantity: 325, status: 'available', unitCost: 4.3, sourceDocument: 'NI-2026-0334' },
  { id: 'LOT-034', itemId: 'MA00033', lot: 'MA00033-20260815', receivedAt: '2026-08-15', locationId: 'LOC-P3', quantity: 230, status: 'available', unitCost: 8.4, sourceDocument: 'NI-2026-0335' },
  { id: 'LOT-035', itemId: 'MA00024', lot: 'MA00024-20260810', receivedAt: '2026-08-10', locationId: 'LOC-ACC1', quantity: 170, status: 'available', unitCost: 12.1, sourceDocument: 'NI-2026-0336' },
  { id: 'LOT-036', itemId: 'MA00025', lot: 'MA00025-20260805', receivedAt: '2026-08-05', locationId: 'LOC-P2', quantity: 140, status: 'available', unitCost: 13.6, sourceDocument: 'NI-2026-0337' },
  { id: 'LOT-037', itemId: 'MA00054', lot: 'MA00054-20260728', receivedAt: '2026-07-28', locationId: 'LOC-P3', quantity: 110, status: 'available', unitCost: 12.4, sourceDocument: 'NI-2026-0338' },
  { id: 'LOT-038', itemId: 'MA00040', lot: 'MA00040-20260720', receivedAt: '2026-07-20', locationId: 'LOC-ACC1', quantity: 23, status: 'available', unitCost: 18.5, sourceDocument: 'NI-2026-0339' },
  { id: 'LOT-039', itemId: 'MA00002', lot: 'MA00002-20260819', receivedAt: '2026-08-19', locationId: 'LOC-P2', quantity: 45, status: 'available', unitCost: 46, sourceDocument: 'NI-2026-0340' },
  { id: 'LOT-040', itemId: 'MA00003', lot: 'MA00003-20260815', receivedAt: '2026-08-15', locationId: 'LOC-P3', quantity: 34, status: 'available', unitCost: 122, sourceDocument: 'NI-2026-0341' },
  { id: 'LOT-041', itemId: 'SU00256', lot: 'SU00256-20260810', receivedAt: '2026-08-10', locationId: 'LOC-ACC1', quantity: 17, status: 'available', unitCost: 44, sourceDocument: 'NI-2026-0342' },
  { id: 'LOT-042', itemId: 'MA00004', lot: 'MA00004-20260805', receivedAt: '2026-08-05', locationId: 'LOC-P2', quantity: 550, status: 'available', unitCost: 0.36, sourceDocument: 'NI-2026-0343' },
  { id: 'LOT-043', itemId: 'MA00022', lot: 'MA00022-20260728', receivedAt: '2026-07-28', locationId: 'LOC-P3', quantity: 55, status: 'available', unitCost: 12.5, sourceDocument: 'NI-2026-0344' },
  { id: 'LOT-044', itemId: 'SU00065', lot: 'SU00065-20260720', receivedAt: '2026-07-20', locationId: 'LOC-ACC1', quantity: 115, status: 'available', unitCost: 5, sourceDocument: 'NI-2026-0345' },
  { id: 'LOT-045', itemId: 'SU00069', lot: 'SU00069-20260819', receivedAt: '2026-08-19', locationId: 'LOC-P2', quantity: 85, status: 'available', unitCost: 6.5, sourceDocument: 'NI-2026-0346' },
  { id: 'LOT-046', itemId: 'SU00096', lot: 'SU00096-20260815', receivedAt: '2026-08-15', locationId: 'LOC-P3', quantity: 23, status: 'available', unitCost: 39, sourceDocument: 'NI-2026-0347' },
  { id: 'LOT-047', itemId: 'SU00284', lot: 'SU00284-20260810', receivedAt: '2026-08-10', locationId: 'LOC-ACC1', quantity: 35, status: 'available', unitCost: 23, sourceDocument: 'NI-2026-0348' },
  { id: 'LOT-048', itemId: 'SU00786', lot: 'SU00786-20260805', receivedAt: '2026-08-05', locationId: 'LOC-P2', quantity: 11, status: 'available', unitCost: 355, sourceDocument: 'NI-2026-0349' },
  { id: 'LOT-049', itemId: 'SU01064', lot: 'SU01064-20260728', receivedAt: '2026-07-28', locationId: 'LOC-P3', quantity: 14, status: 'available', unitCost: 220, sourceDocument: 'NI-2026-0350' },
  { id: 'LOT-050', itemId: 'SU01427', lot: 'SU01427-20260720', receivedAt: '2026-07-20', locationId: 'LOC-ACC1', quantity: 11, status: 'available', unitCost: 250, sourceDocument: 'NI-2026-0351' },
  { id: 'LOT-051', itemId: 'SU00653', lot: 'SU00653-20260819', receivedAt: '2026-08-19', locationId: 'LOC-P2', quantity: 58, status: 'available', unitCost: 28, sourceDocument: 'NI-2026-0352' },
  { id: 'LOT-052', itemId: 'SU00514', lot: 'SU00514-20260815', receivedAt: '2026-08-15', locationId: 'LOC-P3', quantity: 45, status: 'available', unitCost: 15.5, sourceDocument: 'NI-2026-0353' },
  { id: 'LOT-053', itemId: 'SU00001', lot: 'SU00001-20260810', receivedAt: '2026-08-10', locationId: 'LOC-ACC1', quantity: 45, status: 'available', unitCost: 6.8, sourceDocument: 'NI-2026-0354' },
  { id: 'LOT-054', itemId: 'SU00130', lot: 'SU00130-20260805', receivedAt: '2026-08-05', locationId: 'LOC-P2', quantity: 170, status: 'available', unitCost: 1.3, sourceDocument: 'NI-2026-0355' },
  { id: 'LOT-055', itemId: 'SU00397', lot: 'SU00397-20260728', receivedAt: '2026-07-28', locationId: 'LOC-P3', quantity: 58, status: 'available', unitCost: 3.7, sourceDocument: 'NI-2026-0356' },
  { id: 'LOT-056', itemId: 'SU00285', lot: 'SU00285-20260720', receivedAt: '2026-07-20', locationId: 'LOC-ACC1', quantity: 35, status: 'available', unitCost: 17, sourceDocument: 'NI-2026-0357' },
  { id: 'LOT-057', itemId: 'MP00048', lot: 'MP00048-20260819', receivedAt: '2026-08-19', locationId: 'LOC-P2', quantity: 83, status: 'available', unitCost: 115, sourceDocument: 'NI-2026-0358' },
  { id: 'LOT-058', itemId: 'MP00050', lot: 'MP00050-20260815', receivedAt: '2026-08-15', locationId: 'LOC-P3', quantity: 55, status: 'available', unitCost: 90, sourceDocument: 'NI-2026-0359' },
];
