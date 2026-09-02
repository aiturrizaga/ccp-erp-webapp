import { CCP_BRAND, SalesProduct } from '@core/models';

/**
 * Seeded from the real CCP finished-goods extract (`StockGlobal.xls`, 820 SKU). This is a
 * representative slice (~30) across the three commercial lines, not the whole catalog. `legacyCode`
 * and the descriptive name/dimension/spec split are real; `costBand` and `productionUnitCost` are
 * placeholder figures (sin IGV, PEN) standing in for Producción's costing until that feed is wired.
 */
const P = (
  id: string,
  legacyCode: string,
  name: string,
  dimension: string,
  spec: string,
  category: SalesProduct['category'],
  unitOfMeasure: string,
  productionUnitCost: number,
  bandMin: number,
  bandMax: number,
  status: SalesProduct['status'] = 'active',
): SalesProduct => ({
  id,
  legacyCode,
  name,
  dimension,
  spec,
  category,
  brand: CCP_BRAND,
  unitOfMeasure,
  currency: 'PEN',
  productionUnitCost,
  costBand: { min: bandMin, max: bandMax },
  status,
});

export const SALES_PRODUCTS: SalesProduct[] = [
  // ---- POSTES ----
  P('SP-001', '822151', 'POSTES DE C.A.C', '8/200/2/150/270', 'C/PERILLA', 'POSTES', 'UND', 268, 330, 470),
  P('SP-002', '832151', 'POSTES DE C.A.C', '8/300/2/150/270', 'C/PERILLA', 'POSTES', 'UND', 312, 385, 540),
  P('SP-003', '922151', 'POSTES DE C.A.C', '9/200/2/150/285', 'C/PERILLA', 'POSTES', 'UND', 305, 380, 520),
  P('SP-004', '932151', 'POSTES DE C.A.C', '9/300/2/150/285', 'C/PERILLA', 'POSTES', 'UND', 356, 440, 610),
  P('SP-005', 'PE09000004', 'POSTES DE C.A.C', '9/300/2/150/285', 'TIPO V', 'POSTES', 'UND', 372, 460, 640),
  P('SP-006', '1122151', 'POSTE DE C.A.C.', '11/200/2/150/315', 'C/PERILLA', 'POSTES', 'UND', 418, 520, 720),
  P('SP-007', '1132153', 'POSTES DE C.A.C', '11/300/2/150/315', 'C/PERILLA', 'POSTES', 'UND', 486, 600, 840),
  P('SP-008', '1142105', 'POSTES DE C.A.C', '11/400/2/180/345', 'C/PERILLA', 'POSTES', 'UND', 545, 675, 940),
  P('SP-009', '1232158', 'POSTES DE C.A.C', '12/300/2/150/330', 'C/PERILLA', 'POSTES', 'UND', 528, 655, 910),
  P('SP-010', '1242110', 'POSTES DE C.A.C', '12/400/2/180/360', 'C/PERILLA', 'POSTES', 'UND', 612, 760, 1050),
  P('SP-011', '1332117', 'POSTES DE C.A.C', '13/300/2/180/375', 'C/PERILLA', 'POSTES', 'UND', 690, 855, 1180),
  P('SP-012', '1332115', 'POSTES DE C.A.C', '13/300/2/180/375', 'SECCIONADO', 'POSTES', 'UND', 742, 920, 1270),
  P('SP-013', 'CP13418', 'POSTES DE C.A.C', '13/400/2/180/375', 'SECCIONADO', 'POSTES', 'UND', 815, 1010, 1390),
  P('SP-014', 'PE07000001', 'POSTE DE CAC', '7/200/2/120/225', 'TIPO V', 'POSTES', 'UND', 232, 290, 400),

  // ---- ACCESORIOS ----
  P('SP-020', 'AMC1000009', 'MENSULA DE CAV', 'M/1.00/250-245MMD', '', 'ACCESORIOS', 'UND', 78, 95, 140),
  P('SP-021', 'AMC1200003', 'MENSULA DE CAV', 'M/1.20/250-260MMD', '', 'ACCESORIOS', 'UND', 92, 115, 165),
  P('SP-022', 'ACA1500001', 'CRUCETA ASIMETRICA', 'ZA/1.50/0.90/250-235MMD', '', 'ACCESORIOS', 'UND', 128, 160, 225),
  P('SP-023', 'ACS1200003', 'CRUCETA SIMETRICA', 'Z/1.20/250-275MMD', '', 'ACCESORIOS', 'UND', 112, 140, 195),
  P('SP-024', 'ABC4000003', 'BLOQUE DE CAV', '0.40/0.40/0.20', 'TP PIRAMIDE', 'ACCESORIOS', 'UND', 22, 27, 40),
  P('SP-025', 'ABH19000001', 'BLOQUE DE CONCRETO HUECO', '19/39/19', '', 'ACCESORIOS', 'UND', 3.1, 3.8, 5.5),
  P('SP-026', 'AML1100002', 'MEDIA LOZA DE CAV', 'ML/1.10/750/320MMD', '', 'ACCESORIOS', 'UND', 168, 210, 295),
  P('SP-027', 'AMP1100001', 'MEDIA PALOMILLA DE CAV', 'P/1.10/100-280MMD', '', 'ACCESORIOS', 'UND', 96, 120, 170),
  P('SP-028', 'APD22012', 'PALOMILLA DOBLE DE CAV', 'PD/2.20/100-280MMD', '', 'ACCESORIOS', 'UND', 184, 230, 320),
  P('SP-029', 'ADC4000001', 'DUCTOS DE CV', '4/1/90MMD', '4 VIAS X 1ML', 'ACCESORIOS', 'UND', 58, 72, 105),
  P('SP-030', 'ACC4000001', 'CAJA CUADRADA', '40/40/30', 'C/ TAPA', 'ACCESORIOS', 'UND', 64, 80, 115),
  P('SP-031', 'P150000', 'PERILLA DE C.A. PARA POSTE PUNTA', '150MMD', '', 'ACCESORIOS', 'UND', 34, 42, 60),
  P('SP-032', 'CO25171', 'COLLARIN', '257/173/195', 'TIPO 2', 'ACCESORIOS', 'UND', 41, 51, 74),

  // ---- FIERRO ----
  P('SP-040', 'FA63800001', 'BA-CO ASTM A615 GRADO 60', '3/8', 'X 9 MTS', 'FIERRO', 'UND', 12.4, 15, 20),
  P('SP-041', 'FA61200001', 'BA-CO ASTM A615 GRADO 60', '1/2', 'X 9 MTS', 'FIERRO', 'UND', 17.0, 20, 27),
  P('SP-042', 'FA65800001', 'BA-CO ASTM A615 GRADO 60', '5/8', 'X 9 MTS', 'FIERRO', 'UND', 26.5, 31, 42),
  P('SP-043', 'FA63400001', 'BA-CO ASTM A615 GRADO 60', '3/4', 'X 9 MTS', 'FIERRO', 'UND', 38.0, 45, 60),
];
