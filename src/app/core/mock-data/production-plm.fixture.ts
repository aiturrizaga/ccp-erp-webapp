import { BillOfMaterials, Product, RouteOperation } from '@core/models';

/** Default routing for a poste/accesorio product — configurable per BOM version, not hardcoded elsewhere. */
function defaultRouting(workCenterId: string, opts: { moldSequence?: number } = {}): RouteOperation[] {
  return [
    { id: 'OP-1', sequence: 1, name: 'Preparación', workCenterId, standardDurationMin: 45 },
    { id: 'OP-2', sequence: 2, name: 'Fabricación', workCenterId, standardDurationMin: 120, requiresMold: opts.moldSequence === 2, qualityProtocolIds: ['QP-001'] },
    { id: 'OP-3', sequence: 3, name: 'Secado', workCenterId, standardDurationMin: 480, requiresStartEnd: true },
    { id: 'OP-4', sequence: 4, name: 'Acabado', workCenterId, standardDurationMin: 60 },
    { id: 'OP-5', sequence: 5, name: 'Liberación de calidad', workCenterId, standardDurationMin: 20, qualityProtocolIds: ['QP-002'] },
  ];
}

/** BOM quantities are illustrative — no bill-of-materials data exists in the source CCP spreadsheets. */
export const PRODUCTS: Product[] = [
  {
    id: 'PROD-001', code: 'PT-POSTE-9-200', name: 'Poste CAC 9/200/2/140/275', itemId: 'MP00046', status: 'active', version: 'v2.1',
    specifications: [
      { label: 'Longitud', value: '9 m' },
      { label: 'Carga de rotura', value: '200 kgf' },
      { label: 'Diámetro superior / inferior', value: '140 mm / 275 mm' },
      { label: 'Norma', value: 'ASTM A615 Grado 60' },
      { label: 'Incluye', value: 'Perilla de protección' },
    ],
    activeBomId: 'BOM-001',
  },
  {
    id: 'PROD-002', code: 'PT-DUCTO-4V', name: 'Ducto de concreto 4 vías', itemId: 'MP00047', status: 'active', version: 'v1.3',
    specifications: [
      { label: 'Vías', value: '4' },
      { label: 'Diámetro de hueco', value: '90 mm' },
      { label: 'Longitud', value: '1 m' },
    ],
    activeBomId: 'BOM-002',
  },
  {
    id: 'PROD-003', code: 'PT-DUCTO-2V', name: 'Ducto de concreto 2 vías', itemId: 'MP00048', status: 'active', version: 'v1.2',
    specifications: [
      { label: 'Vías', value: '2' },
      { label: 'Diámetro de hueco', value: '90 mm' },
      { label: 'Longitud', value: '1 m' },
    ],
    activeBomId: 'BOM-003',
  },
  {
    id: 'PROD-004', code: 'PT-CAJA-40', name: 'Caja cuadrada 40x40x30 con tapa CCP', itemId: 'MP00049', status: 'under_change', version: 'v1.4',
    specifications: [
      { label: 'Dimensiones', value: '40 x 40 x 30 cm' },
      { label: 'Tapa', value: 'Con logo CCP SAC' },
    ],
    activeBomId: 'BOM-004',
  },
  {
    id: 'PROD-005', code: 'PT-CAJA-RED-396', name: 'Caja redonda p/puesta a tierra 396mm', itemId: 'MP00050', status: 'active', version: 'v1.0',
    specifications: [
      { label: 'Diámetro', value: '396 mm' },
      { label: 'Uso', value: 'Puesta a tierra' },
      { label: 'Incluye', value: 'Tapa y aro' },
    ],
    activeBomId: 'BOM-005',
  },
  {
    id: 'PROD-006', code: 'PT-POSTE-10-300', name: 'POSTE DE C.A.C DE 10/300/2/150/300', itemId: 'MP00051', status: 'active', version: 'v1.0',
    specifications: [
      { label: 'Longitud', value: '10 m' },
      { label: 'Carga de rotura', value: '300 kgf' },
      { label: 'Diámetro superior / inferior', value: '150 mm / 300 mm' },
      { label: 'Norma', value: 'ASTM A615 Grado 60' },
    ],
    activeBomId: 'BOM-006',
  },
];

export const BILLS_OF_MATERIALS: BillOfMaterials[] = [
  {
    id: 'BOM-001', productId: 'PROD-001', version: 'v2.1', effectiveFrom: '2026-05-01', status: 'active',
    routing: defaultRouting('WC-001', { moldSequence: 2 }),
    components: [
      { itemId: 'MP00006', quantity: 8, unitOfMeasure: 'BOL', wastePct: 2, isSupply: false },
      { itemId: 'MP00001', quantity: 0.35, unitOfMeasure: 'M3', wastePct: 3, isSupply: false },
      { itemId: 'MP00002', quantity: 0.45, unitOfMeasure: 'M3', wastePct: 3, isSupply: false },
      { itemId: 'MP00011', quantity: 12, unitOfMeasure: 'UND', wastePct: 1, isSupply: false },
      { itemId: 'MP00013', quantity: 4, unitOfMeasure: 'UND', wastePct: 1, isSupply: false },
      { itemId: 'MP00016', quantity: 6, unitOfMeasure: 'KG', wastePct: 2, isSupply: false },
      { itemId: 'MA00001', quantity: 0.8, unitOfMeasure: 'KG', wastePct: 5, isSupply: true },
    ],
  },
  {
    id: 'BOM-001-OLD', productId: 'PROD-001', version: 'v2.0', effectiveFrom: '2025-09-01', effectiveTo: '2026-04-30', status: 'expired',
    routing: defaultRouting('WC-001', { moldSequence: 2 }),
    components: [
      { itemId: 'MP00006', quantity: 8.4, unitOfMeasure: 'BOL', wastePct: 3, isSupply: false },
      { itemId: 'MP00001', quantity: 0.36, unitOfMeasure: 'M3', wastePct: 4, isSupply: false },
      { itemId: 'MP00011', quantity: 12, unitOfMeasure: 'UND', wastePct: 1.5, isSupply: false },
    ],
  },
  {
    id: 'BOM-002', productId: 'PROD-002', version: 'v1.3', effectiveFrom: '2026-02-15', status: 'active',
    routing: defaultRouting('WC-002', { moldSequence: 2 }),
    components: [
      { itemId: 'MP00008', quantity: 3.5, unitOfMeasure: 'BOL', wastePct: 2, isSupply: false },
      { itemId: 'MP00003', quantity: 0.18, unitOfMeasure: 'M3', wastePct: 3, isSupply: false },
      { itemId: 'MA00031', quantity: 4, unitOfMeasure: 'UND', wastePct: 1, isSupply: false },
    ],
  },
  {
    id: 'BOM-003', productId: 'PROD-003', version: 'v1.2', effectiveFrom: '2026-02-15', status: 'active',
    routing: defaultRouting('WC-002', { moldSequence: 2 }),
    components: [
      { itemId: 'MP00008', quantity: 2.2, unitOfMeasure: 'BOL', wastePct: 2, isSupply: false },
      { itemId: 'MP00003', quantity: 0.12, unitOfMeasure: 'M3', wastePct: 3, isSupply: false },
      { itemId: 'MA00032', quantity: 2, unitOfMeasure: 'UND', wastePct: 1, isSupply: false },
    ],
  },
  {
    id: 'BOM-004', productId: 'PROD-004', version: 'v1.4', effectiveFrom: '2026-06-01', status: 'draft',
    routing: defaultRouting('WC-003', { moldSequence: 2 }),
    components: [
      { itemId: 'MP00009', quantity: 2.8, unitOfMeasure: 'BOL', wastePct: 2, isSupply: false },
      { itemId: 'MP00004', quantity: 0.1, unitOfMeasure: 'M3', wastePct: 3, isSupply: false },
      { itemId: 'SU01122', quantity: 1, unitOfMeasure: 'UND', wastePct: 0, isSupply: true },
    ],
  },
  {
    id: 'BOM-005', productId: 'PROD-005', version: 'v1.0', effectiveFrom: '2026-01-10', status: 'active',
    routing: defaultRouting('WC-003', { moldSequence: 2 }),
    components: [
      { itemId: 'MP00009', quantity: 2.5, unitOfMeasure: 'BOL', wastePct: 2, isSupply: false },
      { itemId: 'MP00004', quantity: 0.09, unitOfMeasure: 'M3', wastePct: 3, isSupply: false },
    ],
  },
  {
    id: 'BOM-006', productId: 'PROD-006', version: 'v1.0', effectiveFrom: '2026-03-01', status: 'active',
    routing: defaultRouting('WC-001', { moldSequence: 2 }),
    components: [
      { itemId: 'MP00006', quantity: 10, unitOfMeasure: 'BOL', wastePct: 2, isSupply: false },
      { itemId: 'MP00001', quantity: 0.42, unitOfMeasure: 'M3', wastePct: 3, isSupply: false },
      { itemId: 'MP00011', quantity: 14, unitOfMeasure: 'UND', wastePct: 1, isSupply: false },
    ],
  },
];
