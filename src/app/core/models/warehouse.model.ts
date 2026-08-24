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
  /** Auto-incrementing sequential code assigned when the location is created (e.g. '001'). */
  code: string;
  /** Short abbreviation used day-to-day on the floor (e.g. 'P1'). */
  shortName: string;
  name: string;
  type: LocationType;
  warehouseId: string;
}

export interface Warehouse {
  id: string;
  code: string;
  /** Short abbreviation used day-to-day (e.g. 'AL01'). */
  shortName: string;
  name: string;
  address: string;
  locations: Location[];
}
