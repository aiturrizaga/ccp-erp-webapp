import { BillOfMaterials, Product } from '@core/models';

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
];

export const BILLS_OF_MATERIALS: BillOfMaterials[] = [
  {
    id: 'BOM-001', productId: 'PROD-001', version: 'v2.1', effectiveFrom: '2026-05-01', status: 'active',
    operations: ['Armado de jaula de fierro', 'Encofrado en molde', 'Vaciado de concreto', 'Centrifugado', 'Curado', 'Desmolde', 'Acabado y perilla de protección'],
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
    operations: ['Armado de jaula de fierro', 'Encofrado en molde', 'Vaciado de concreto', 'Centrifugado', 'Curado', 'Desmolde'],
    components: [
      { itemId: 'MP00006', quantity: 8.4, unitOfMeasure: 'BOL', wastePct: 3, isSupply: false },
      { itemId: 'MP00001', quantity: 0.36, unitOfMeasure: 'M3', wastePct: 4, isSupply: false },
      { itemId: 'MP00011', quantity: 12, unitOfMeasure: 'UND', wastePct: 1.5, isSupply: false },
    ],
  },
  {
    id: 'BOM-002', productId: 'PROD-002', version: 'v1.3', effectiveFrom: '2026-02-15', status: 'active',
    operations: ['Armado de moldes', 'Vaciado de concreto', 'Curado', 'Desmolde y acabado'],
    components: [
      { itemId: 'MP00008', quantity: 3.5, unitOfMeasure: 'BOL', wastePct: 2, isSupply: false },
      { itemId: 'MP00003', quantity: 0.18, unitOfMeasure: 'M3', wastePct: 3, isSupply: false },
      { itemId: 'MA00031', quantity: 4, unitOfMeasure: 'UND', wastePct: 1, isSupply: false },
    ],
  },
  {
    id: 'BOM-003', productId: 'PROD-003', version: 'v1.2', effectiveFrom: '2026-02-15', status: 'active',
    operations: ['Armado de moldes', 'Vaciado de concreto', 'Curado', 'Desmolde y acabado'],
    components: [
      { itemId: 'MP00008', quantity: 2.2, unitOfMeasure: 'BOL', wastePct: 2, isSupply: false },
      { itemId: 'MP00003', quantity: 0.12, unitOfMeasure: 'M3', wastePct: 3, isSupply: false },
      { itemId: 'MA00032', quantity: 2, unitOfMeasure: 'UND', wastePct: 1, isSupply: false },
    ],
  },
  {
    id: 'BOM-004', productId: 'PROD-004', version: 'v1.4', effectiveFrom: '2026-06-01', status: 'draft',
    operations: ['Armado de molde metálico', 'Vaciado de concreto', 'Curado', 'Instalación de tapa'],
    components: [
      { itemId: 'MP00009', quantity: 2.8, unitOfMeasure: 'BOL', wastePct: 2, isSupply: false },
      { itemId: 'MP00004', quantity: 0.1, unitOfMeasure: 'M3', wastePct: 3, isSupply: false },
      { itemId: 'SU01122', quantity: 1, unitOfMeasure: 'UND', wastePct: 0, isSupply: true },
    ],
  },
  {
    id: 'BOM-005', productId: 'PROD-005', version: 'v1.0', effectiveFrom: '2026-01-10', status: 'active',
    operations: ['Armado de molde circular', 'Vaciado de concreto', 'Curado', 'Instalación de tapa y aro'],
    components: [
      { itemId: 'MP00009', quantity: 2.5, unitOfMeasure: 'BOL', wastePct: 2, isSupply: false },
      { itemId: 'MP00004', quantity: 0.09, unitOfMeasure: 'M3', wastePct: 3, isSupply: false },
    ],
  },
];
