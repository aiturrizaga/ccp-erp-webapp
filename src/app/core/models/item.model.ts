import { Currency } from './shared.model';

/** Owned by the Inventory app — the common item catalog used by Purchasing, Inventory and PLM/Production. */
export type ItemCategory = 'raw_material' | 'supply' | 'work_in_process' | 'finished_good';

export const ITEM_CATEGORY_LABEL: Record<ItemCategory, string> = {
  raw_material: 'Materia prima',
  supply: 'Suministro',
  work_in_process: 'Producto en proceso',
  finished_good: 'Producto terminado',
};

export type OutboundStrategy = 'FIFO' | 'FEFO' | 'NONE';

export interface ItemSupplierLink {
  supplierId: string;
  price: number;
  currency: Currency;
  leadTimeDays: number;
  isPrimary: boolean;
}

export interface Item {
  id: string;
  code: string;
  description: string;
  category: ItemCategory;
  group: string;
  unitOfMeasure: string;
  tracksLot: boolean;
  tracksExpiration: boolean;
  outboundStrategy: OutboundStrategy;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  standardCost: number;
  lastCost: number;
  averageCost: number;
  currency: Currency;
  suppliers: ItemSupplierLink[];
  active: boolean;
}
