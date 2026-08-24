/** Owned by PLM — product specification/versioning and the BOM that Production consumes read-only. */
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
  operations: string[];
  components: BomComponent[];
}
