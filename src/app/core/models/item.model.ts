import { Currency } from './shared.model';

/** Owned by the Inventory app — the common item catalog used by Purchasing, Inventory and PLM/Production. */
export type ItemCategory = 'raw_material' | 'supply' | 'work_in_process' | 'finished_good';

export const ITEM_CATEGORY_LABEL: Record<ItemCategory, string> = {
  raw_material: 'Materia prima',
  supply: 'Suministro',
  work_in_process: 'Producto en proceso',
  finished_good: 'Producto terminado',
};

/** CCP's real unit-of-measure codes (from the legacy system's item master). `Item.unitOfMeasure` stays a free string since not every code CCP uses is necessarily listed here. */
export const UNIT_OF_MEASURE_LABEL: Record<string, string> = {
  SET: 'Grupo/Conjunto',
  UNI: 'Unidad',
  KG: 'Kilogramo',
  GAL: 'Galones',
  BOL: 'Bolsa',
  M3: 'Metro cúbico',
  BID: 'Bidón',
  TN: 'Tonelada',
  PAQ: 'Paquete',
  CJ: 'Caja',
  ROL: 'Rollo',
  MLL: 'Millares',
  PAR: 'Pares',
  MT: 'Metro',
  BR: 'Barriles',
  LT: 'Litros',
  M2: 'Metro cuadrado',
};

/** CCP's real accounting classification for warehouse stock (from the legacy system's item master). */
export type StockTypeCode = '01' | '03' | '05' | '06';

export const STOCK_TYPE_LABEL: Record<StockTypeCode, string> = {
  '01': 'Mercadería',
  '03': 'Materias primas',
  '05': 'Suministros diversos',
  '06': 'Materiales auxiliares',
};

/** CCP's real purchasing/expense group codes (from the legacy system's item master). */
export type ItemGroupCode =
  | '5311'
  | '514'
  | '512'
  | '511'
  | '513'
  | '516'
  | '515'
  | '413'
  | '411'
  | '412'
  | '414'
  | '5213'
  | '5225'
  | '5214'
  | '5215'
  | '5224'
  | '5216'
  | '5217'
  | '5218'
  | '5220'
  | '5219'
  | '5221'
  | '5222'
  | '5223'
  | '5226'
  | '5212'
  | '5211'
  | '5227';

export const ITEM_GROUP_LABEL: Record<ItemGroupCode, string> = {
  '5311': 'Activo fijo',
  '514': 'Soldadura',
  '512': 'Sika-Chema-Sellador-otros',
  '511': 'Pernos-tuercas-remaches-arandelas',
  '513': 'Yeso-cal',
  '516': 'Tubos PVC',
  '515': 'Oxígeno',
  '413': 'Agregados',
  '411': 'Cemento',
  '412': 'Fierro',
  '414': 'Alambres',
  '5213': 'Trapo industrial-wype',
  '5225': 'Conexiones de fierro-galvanizado-PVC',
  '5214': 'Artículos de limpieza',
  '5215': 'Artículos de escritorio y oficina',
  '5224': 'Repuestos manuales-eléctricos',
  '5216': 'Equipos de protección personal',
  '5217': 'Artículos de seguridad-botiquín',
  '5218': 'Tiza-discos-herramientas-otros',
  '5220': 'Materiales de construcción y acabados',
  '5219': 'Uniformes-zapatos y botas',
  '5221': 'Planchas-platinas-ángulos-tubos de fierro-varillas',
  '5222': 'Artículos de ferretería',
  '5223': 'Equipos e instrumentos de medición',
  '5226': 'Pinturas-productos químicos-tratamiento de agua',
  '5212': 'Hidrolina-otros',
  '5211': 'Gasolina-petróleo-GLP',
  '5227': 'Placas y moldes',
};

/** CCP's real cost-center codes (from the legacy system's item master). */
export type CostCenterCode =
  | '336111'
  | '333111'
  | '336911'
  | '251104'
  | '251102'
  | '251101'
  | '251103'
  | '251106'
  | '251105'
  | '241103'
  | '241101'
  | '241102'
  | '241104'
  | '252401'
  | '252406'
  | '252402'
  | '252403'
  | '252404'
  | '252405'
  | '252201'
  | '252101';

export const COST_CENTER_LABEL: Record<CostCenterCode, string> = {
  '336111': 'Equipos de cómputo - costo',
  '333111': 'Maquinarias y equipos de explotación - costo',
  '336911': 'Otros equipos - costo',
  '251104': 'Materiales aux. soldadura',
  '251102': 'Materiales aux. Sika-Chema-sellador-otros',
  '251101': 'Materiales aux. pernos-tuercas-remaches-otros',
  '251103': 'Materiales aux. yeso-cal',
  '251106': 'Materiales aux. tubos PVC',
  '251105': 'Materiales aux. oxígeno',
  '241103': 'Materias primas - costo agregados',
  '241101': 'Materias primas - costo cemento',
  '241102': 'Materias primas - costo fierro',
  '241104': 'Materias primas - costo alambres',
  '252401': 'Otros suministros - trapo industrial',
  '252406': 'Otros suministros - varios',
  '252402': 'Otros suministros - artículos escritorio y oficina',
  '252403': 'Otros suministros - implementos de seguridad y EPP',
  '252404': 'Otros suministros - tiza-discos-herramientas-otros',
  '252405': 'Otros suministros - uniformes y calzados',
  '252201': 'Suministro - hidrolina',
  '252101': 'Suministro - combustible',
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
  /** Real CCP accounting classification (01/03/05/06) — distinct from `category`, which is this prototype's own simplified grouping. */
  stockType: StockTypeCode;
  /** Real CCP purchasing/expense group code. Undefined for manufactured finished goods, which don't carry a purchasing group. */
  itemGroup?: ItemGroupCode;
  /** Real CCP cost-center code. Undefined for manufactured finished goods, which don't carry a purchasing cost center. */
  costCenter?: CostCenterCode;
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
