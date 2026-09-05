import { RouteOperation } from './production-plm.model';

/**
 * Producción's execution model. There is no standalone "Orden de Fabricación" — the flow is
 * Pedido (Ventas) → Hoja de Trabajo (HT), and Producción executes directly against the HT.
 * A single HT line is rarely fabricated in one continuous run, so it's split into one or more
 * `ManufacturingRun`s ("Corridas de fabricación") for traceability; the HT's overall status and
 * progress are always DERIVED from the aggregate of its runs, never set by hand.
 */

// ---------------------------------------------------------------------------
// Recursos productivos — moldes, máquinas, centros de trabajo
// ---------------------------------------------------------------------------

export type ResourceCondition = 'bueno' | 'malo';

export const RESOURCE_CONDITION_LABEL: Record<ResourceCondition, string> = {
  bueno: 'Bueno',
  malo: 'Malo',
};

export interface WorkCenter {
  id: string;
  code: string;
  name: string;
  plant: string;
  capacityPerDay: number;
  unitOfMeasure: string;
}

export type MachineStatus = 'operativa' | 'mantenimiento' | 'fuera_servicio';

export const MACHINE_STATUS_LABEL: Record<MachineStatus, string> = {
  operativa: 'Operativa',
  mantenimiento: 'En mantenimiento',
  fuera_servicio: 'Fuera de servicio',
};

export interface Machine {
  id: string;
  code: string;
  name: string;
  plant: string;
  workCenterId: string;
  status: MachineStatus;
  lastMaintenanceAt?: string;
  nextMaintenanceAt?: string;
}

export type MoldType = 'METALICO' | 'FIBRA' | 'MADERA';

export const MOLD_TYPE_LABEL: Record<MoldType, string> = {
  METALICO: 'Metálico',
  FIBRA: 'Fibra',
  MADERA: 'Madera',
};

export interface Mold {
  id: string;
  code: string;
  tipo: MoldType;
  plant: string;
  location: string;
  estado: ResourceCondition;
  usageCount: number;
  maxUsageCount?: number;
  compatibleProductIds: string[];
  /** Ancho x alto x profundidad, en cm — texto libre, mockup-simple. */
  dimensions?: string;
  /** Fecha de alta del molde (ISO yyyy-mm-dd). */
  acquiredAt?: string;
}

// ---------------------------------------------------------------------------
// Corrida de fabricación (ManufacturingRun) — sub-registro trazable de una línea de HT
// ---------------------------------------------------------------------------

export type RunStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  planned: 'Planificada',
  in_progress: 'En curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

/** Start/end capture for one routing operation within a run — Secado always requires this. */
export interface RunOperationLog {
  operationId: string;
  name: string;
  start?: string;
  end?: string;
  status: 'pending' | 'in_progress' | 'done';
}

export interface RunMaterialConsumption {
  itemId: string;
  lotId?: string;
  quantity: number;
  unitOfMeasure: string;
}

export interface ManufacturingRun {
  id: string;
  sequence: number;
  workCenterId: string;
  machineId?: string;
  moldId?: string;
  operatorName: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  plannedQuantity: number;
  producedQuantity: number;
  rejectedQuantity: number;
  reprocessedQuantity: number;
  materialsConsumed: RunMaterialConsumption[];
  operations: RunOperationLog[];
  incidents?: string;
  status: RunStatus;
}

// ---------------------------------------------------------------------------
// Hoja de trabajo (HT) — unidad única de ejecución productiva
// ---------------------------------------------------------------------------

export interface WorkSheetMaterial {
  itemId: string;
  required: number;
  available: number;
  reserved: number;
  consumed: number;
  unitOfMeasure: string;
  isSupply: boolean;
  exception?: string;
}

export interface WorkSheetLine {
  id: string;
  productId: string;
  bomId: string;
  bomVersion: string;
  /** Snapshot of the BOM's routing at the moment this line was created — never a live reference. */
  routing: RouteOperation[];
  plannedQuantity: number;
  unitOfMeasure: string;
  materials: WorkSheetMaterial[];
  runs: ManufacturingRun[];
}

export interface WorkSheet {
  id: string;
  number: string;
  /** Ventas generates the HT and keeps this reference; ownership of the record itself moves to Producción. */
  salesOrderId?: string;
  salesOrderNumber?: string;
  customerName?: string;
  plant: string;
  scheduledDate: string;
  committedDate: string;
  responsible: string;
  lines: WorkSheetLine[];
  atRisk: boolean;
  riskReason?: string;
}

export type WorkSheetStatus = 'planned' | 'released' | 'in_progress' | 'completed' | 'cancelled';

export const WORK_SHEET_STATUS_LABEL: Record<WorkSheetStatus, string> = {
  planned: 'Planificada',
  released: 'Liberada',
  in_progress: 'En producción',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

// ---------------------------------------------------------------------------
// Derivaciones — status/avance de la HT SIEMPRE se calculan, nunca se asignan a mano
// ---------------------------------------------------------------------------

/** All runs across every line of the HT, flattened for aggregate calculations. */
export function allRuns(ws: WorkSheet): ManufacturingRun[] {
  return ws.lines.flatMap((l) => l.runs);
}

export function lineProducedQuantity(line: WorkSheetLine): number {
  return line.runs.reduce((sum, r) => sum + r.producedQuantity, 0);
}

export function lineStatus(line: WorkSheetLine): WorkSheetStatus {
  if (line.runs.length === 0) return 'planned';
  if (line.runs.every((r) => r.status === 'cancelled')) return 'cancelled';
  const active = line.runs.filter((r) => r.status !== 'cancelled');
  if (active.length === 0) return 'cancelled';
  if (active.every((r) => r.status === 'completed')) return 'completed';
  if (active.some((r) => r.status === 'in_progress' || r.status === 'completed')) return 'in_progress';
  return 'planned';
}

/** The HT's overall status is the "lowest common denominator" of its lines — derived, never hand-set. */
export function workSheetStatus(ws: WorkSheet): WorkSheetStatus {
  if (ws.lines.length === 0) return 'planned';
  const statuses = ws.lines.map(lineStatus);
  if (statuses.every((s) => s === 'completed')) return 'completed';
  if (statuses.every((s) => s === 'cancelled')) return 'cancelled';
  if (statuses.some((s) => s === 'in_progress' || s === 'completed')) return 'in_progress';
  return 'planned';
}

export function workSheetProgressPct(ws: WorkSheet): number {
  const planned = ws.lines.reduce((s, l) => s + l.plannedQuantity, 0);
  if (planned === 0) return 0;
  const produced = ws.lines.reduce((s, l) => s + lineProducedQuantity(l), 0);
  return Math.min(100, Math.round((produced / planned) * 100));
}

/**
 * Plan vs Real heuristic: if the HT is past its committed date and not completed, find the first
 * operation (in routing order) across its runs that's still open (no `end`) — that's the bottleneck.
 */
export function bottleneckOperation(ws: WorkSheet, today: string): { operationName: string; runId: string } | undefined {
  if (workSheetStatus(ws) === 'completed') return undefined;
  if (today <= ws.committedDate) return undefined;
  for (const line of ws.lines) {
    for (const run of line.runs) {
      const openOp = run.operations.find((o) => o.status !== 'done');
      if (openOp) return { operationName: openOp.name, runId: run.id };
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Bolsa de salida — unchanged downstream packaging of an HT's output for despacho
// ---------------------------------------------------------------------------

export type OutputBundleStatus = 'preparing' | 'lot_selected' | 'signed' | 'dispatched';

export const OUTPUT_BUNDLE_STATUS_LABEL: Record<OutputBundleStatus, string> = {
  preparing: 'En preparación',
  lot_selected: 'Lote seleccionado',
  signed: 'Firmada',
  dispatched: 'Despachada',
};

export interface OutputBundleLot {
  itemId: string;
  lotId: string;
  quantity: number;
  recommended: boolean;
}

export interface OutputBundleException {
  itemId: string;
  reason: string;
  authorizedBy?: string;
  status: 'pending' | 'authorized' | 'rejected';
}

export interface OutputBundle {
  id: string;
  number: string;
  plant: string;
  date: string;
  workSheetIds: string[];
  status: OutputBundleStatus;
  selectedLots: OutputBundleLot[];
  exceptions: OutputBundleException[];
  operatorSignature?: string;
  supervisorSignature?: string;
}
