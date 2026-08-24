export type LocationType =
  | 'receiving'
  | 'storage'
  | 'production'
  | 'quarantine'
  | 'claims'
  | 'dispatch'
  | 'transit'
  | 'scrap'
  | 'returns';

export const LOCATION_TYPE_LABEL: Record<LocationType, string> = {
  receiving: 'Recepción',
  storage: 'Almacenamiento',
  production: 'Producción',
  quarantine: 'Cuarentena',
  claims: 'Reclamos',
  dispatch: 'Despacho',
  transit: 'Tránsito',
  scrap: 'Scrap',
  returns: 'Devoluciones',
};

export interface Location {
  id: string;
  code: string;
  name: string;
  type: LocationType;
  warehouseId: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  plant: string;
  locations: Location[];
}
