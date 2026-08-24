import { Warehouse } from '@core/models';

/** Real warehouse name from ReporteStock.xls ("0001-ALMACEN PRINCIPAL"); locations model the RF-spec's minimum location types plus the real plant/area names seen in the kardex extracts (P1/P2/P3, CALDERO, SOLDADOR). */
export const WAREHOUSES: Warehouse[] = [
  {
    id: 'WH-001',
    code: '0001',
    name: 'ALMACEN PRINCIPAL',
    plant: 'Planta Lima',
    locations: [
      { id: 'LOC-REC', code: 'REC-01', name: 'Recepción', type: 'receiving', warehouseId: 'WH-001' },
      { id: 'LOC-ALM-A', code: 'ALM-A', name: 'Almacenamiento — Materias primas', type: 'storage', warehouseId: 'WH-001' },
      { id: 'LOC-ALM-B', code: 'ALM-B', name: 'Almacenamiento — Suministros', type: 'storage', warehouseId: 'WH-001' },
      { id: 'LOC-ALM-C', code: 'ALM-C', name: 'Almacenamiento — Productos terminados', type: 'storage', warehouseId: 'WH-001' },
      { id: 'LOC-P1', code: 'P1', name: 'Planta 1 — Producción', type: 'production', warehouseId: 'WH-001' },
      { id: 'LOC-P2', code: 'P2', name: 'Planta 2 — Producción', type: 'production', warehouseId: 'WH-001' },
      { id: 'LOC-P3', code: 'P3', name: 'Planta 3 — Producción', type: 'production', warehouseId: 'WH-001' },
      { id: 'LOC-ACC', code: 'ACCESORIOS', name: 'Planta Accesorios', type: 'production', warehouseId: 'WH-001' },
      { id: 'LOC-CALDERO', code: 'CALDERO', name: 'Área Caldero / Soldadura', type: 'production', warehouseId: 'WH-001' },
      { id: 'LOC-CUAR', code: 'CUAR-01', name: 'Cuarentena', type: 'quarantine', warehouseId: 'WH-001' },
      { id: 'LOC-RECL', code: 'RECL-01', name: 'Reclamos', type: 'claims', warehouseId: 'WH-001' },
      { id: 'LOC-DESP', code: 'DESP-01', name: 'Despacho', type: 'dispatch', warehouseId: 'WH-001' },
      { id: 'LOC-TRAN', code: 'TRAN-01', name: 'Tránsito', type: 'transit', warehouseId: 'WH-001' },
      { id: 'LOC-SCRAP', code: 'SCRAP-01', name: 'Scrap', type: 'scrap', warehouseId: 'WH-001' },
      { id: 'LOC-DEV', code: 'DEV-01', name: 'Devoluciones', type: 'returns', warehouseId: 'WH-001' },
    ],
  },
];
