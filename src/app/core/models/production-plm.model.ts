/**
 * Producción absorbs what used to be the separate "PLM" app: product master data and versioned
 * BOM/Receta, including the routing (secuencia de operaciones) that a Hoja de Trabajo line snapshots
 * when it's created. Producción owns this end-to-end now — there is no separate PLM app anymore.
 */
export type ProductStatus = 'draft' | 'active' | 'under_change' | 'discontinued';

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  draft: 'Borrador',
  active: 'Activo',
  under_change: 'En cambio',
  discontinued: 'Descontinuado',
};

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  itemId: string;
  status: ProductStatus;
  version: string;
  specifications: ProductSpecification[];
  activeBomId?: string;
}

export interface BomComponent {
  itemId: string;
  quantity: number;
  unitOfMeasure: string;
  wastePct: number;
  substituteItemId?: string;
  isSupply: boolean;
}

/** One step of the routing — configurable per product/BOM version, not hardcoded in code. */
export interface RouteOperation {
  id: string;
  sequence: number;
  name: string;
  workCenterId?: string;
  standardDurationMin?: number;
  requiresMold?: boolean;
  /** Secado (and any operation the plant flags) must always capture start/end on the run — hard requirement. */
  requiresStartEnd?: boolean;
  qualityProtocolIds?: string[];
}

export type BomStatus = 'active' | 'expired' | 'draft';

export const BOM_STATUS_LABEL: Record<BomStatus, string> = {
  active: 'Vigente',
  expired: 'Vencida',
  draft: 'Borrador',
};

export interface BillOfMaterials {
  id: string;
  productId: string;
  version: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: BomStatus;
  /** Configurable operation sequence for this BOM version — a run/HT-line snapshots this, never a live reference. */
  routing: RouteOperation[];
  components: BomComponent[];
}
