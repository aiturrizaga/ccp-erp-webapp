import { Warehouse } from '@core/models';

/** Real warehouse name and address from CCP's records ("0001-ALMACEN PRINCIPAL"). Locations trimmed to the three plants actually referenced across the mock kardex/production data (P1/P2/P3). */
export const WAREHOUSES: Warehouse[] = [
  {
    id: 'WH-001',
    code: '0001',
    shortName: 'AL01',
    name: 'ALMACEN PRINCIPAL',
    address: 'Calle Las Dalmacias Lotes 17, 18 y 19, Puente Piedra, Lima',
    locations: [
      { id: 'LOC-P1', code: '001', shortName: 'P1', name: 'Planta 01', type: 'production', warehouseId: 'WH-001' },
      { id: 'LOC-P2', code: '002', shortName: 'P2', name: 'Planta 02', type: 'production', warehouseId: 'WH-001' },
      { id: 'LOC-P3', code: '003', shortName: 'P3', name: 'Planta 03', type: 'production', warehouseId: 'WH-001' },
      { id: 'LOC-ACC1', code: '004', shortName: 'ACC01', name: 'Accesorios 01', type: 'storage', warehouseId: 'WH-001' },
      { id: 'LOC-ACC2', code: '005', shortName: 'ACC02', name: 'Accesorios 02', type: 'storage', warehouseId: 'WH-001' },
      { id: 'LOC-CUAR', code: '006', shortName: 'CUAR', name: 'Cuarentena', type: 'quarantine', warehouseId: 'WH-001' },
    ],
  },
];
