export type CostResourceType = 'material' | 'labor' | 'service' | 'equipment';

export interface CostResource {
  id: string; code: string; name: string; type: CostResourceType; unit: string;
  currentCost: number; previousCost: number; effectiveFrom: string;
}
export interface CostLine { resourceId: string; quantity: number; wastePct?: number; }
export interface CostPart { id: string; code: string; name: string; lines: CostLine[]; }
export interface CostTemplate { id: string; code: string; name: string; family: string; partIds: string[]; }
export interface CostProduct {
  id: string; code: string; name: string; templateId: string; version: string; unit: string;
  parameters: Record<string, number>; quantityFactors?: Record<string, number>;
  minMarkupPct: number; targetMarkupPct: number; maxMarkupPct: number;
}
export interface ProductCostSummary {
  product: CostProduct; directCost: number; previousCost: number; minPrice: number;
  targetPrice: number; maxPrice: number; variationPct: number;
}
