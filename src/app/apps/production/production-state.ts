import { Injectable, signal } from '@angular/core';
import {
  BillOfMaterials,
  BomStatus,
  Machine,
  ManufacturingRun,
  Mold,
  NonConformity,
  Product,
  QualityInspection,
  QualityProtocol,
  WorkCenter,
  WorkSheet,
} from '@core/models';
import {
  BILLS_OF_MATERIALS,
  MACHINES,
  MOLDS,
  NON_CONFORMITIES,
  PRODUCTS,
  QUALITY_INSPECTIONS,
  QUALITY_PROTOCOLS,
  WORK_CENTERS,
  WORK_SHEETS,
} from '@core/mock-data';
import { TableStore } from '@core/supabase/table-store';

/** Adds/subtracts whole days from an ISO `yyyy-mm-dd` date, returning the same format. */
function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Mutable store for Producción (which now also owns what used to be the separate PLM app: productos
 * y BOM). Signals seed from the bundled fixtures and, when Supabase is configured, overlay/persist
 * through `TableStore` — same prototype-grade pattern as Ventas' `sales-state.ts`. The Hoja de Trabajo
 * (HT) is the only entity that changes often enough in this mockup to warrant real persistence;
 * master data (productos, recursos, protocolos) stays fixture-backed for simplicity.
 */
@Injectable({ providedIn: 'root' })
export class ProductionState {
  private readonly workSheetsStore = new TableStore<WorkSheet>('production_work_sheets');
  private readonly inspectionsStore = new TableStore<QualityInspection>('quality_inspections');
  private readonly nonConformitiesStore = new TableStore<NonConformity>('non_conformities');
  private readonly productsStore = new TableStore<Product>('production_products');
  private readonly bomsStore = new TableStore<BillOfMaterials>('production_boms');
  private readonly machinesStore = new TableStore<Machine>('production_machines');
  private readonly moldsStore = new TableStore<Mold>('production_molds');
  private readonly workCentersStore = new TableStore<WorkCenter>('production_work_centers');
  private readonly protocolsStore = new TableStore<QualityProtocol>('quality_protocols');

  readonly workSheets = signal<WorkSheet[]>([...WORK_SHEETS]);
  readonly products = signal<Product[]>([...PRODUCTS]);
  readonly billsOfMaterials = signal<BillOfMaterials[]>([...BILLS_OF_MATERIALS]);
  readonly workCenters = signal<WorkCenter[]>([...WORK_CENTERS]);
  readonly machines = signal<Machine[]>([...MACHINES]);
  readonly molds = signal<Mold[]>([...MOLDS]);
  readonly qualityProtocols = signal<QualityProtocol[]>([...QUALITY_PROTOCOLS]);
  readonly qualityInspections = signal<QualityInspection[]>([...QUALITY_INSPECTIONS]);
  readonly nonConformities = signal<NonConformity[]>([...NON_CONFORMITIES]);

  private nextRunSeq = 1000;
  private nextInspectionSeq = QUALITY_INSPECTIONS.length + 1;
  private nextNonConformitySeq = NON_CONFORMITIES.length + 1;
  private nextProductSeq = 100;
  private nextBomSeq = 100;
  private nextMachineSeq = 100;
  private nextMoldSeq = 100;
  private nextWorkCenterSeq = 100;
  private nextProtocolSeq = 100;

  constructor() {
    this.workSheetsStore.fetchAll().then((rows) => {
      if (rows?.length) this.workSheets.set(rows);
    });
    this.inspectionsStore.fetchAll().then((rows) => {
      if (rows?.length) (this.qualityInspections.set(rows), (this.nextInspectionSeq = rows.length + 1));
    });
    this.nonConformitiesStore.fetchAll().then((rows) => {
      if (rows?.length) (this.nonConformities.set(rows), (this.nextNonConformitySeq = rows.length + 1));
    });
    this.productsStore.fetchAll().then((rows) => {
      if (rows?.length) this.products.set(rows);
    });
    this.bomsStore.fetchAll().then((rows) => {
      if (rows?.length) this.billsOfMaterials.set(rows);
    });
    this.machinesStore.fetchAll().then((rows) => {
      if (rows?.length) this.machines.set(rows);
    });
    this.moldsStore.fetchAll().then((rows) => {
      if (rows?.length) this.molds.set(rows);
    });
    this.workCentersStore.fetchAll().then((rows) => {
      if (rows?.length) this.workCenters.set(rows);
    });
    this.protocolsStore.fetchAll().then((rows) => {
      if (rows?.length) this.qualityProtocols.set(rows);
    });
  }

  private persistWorkSheet(ws: WorkSheet): void {
    this.workSheetsStore.upsert(ws, (w) => ({ plant: w.plant, at_risk: w.atRisk }));
  }

  private updateWorkSheet(id: string, mutate: (ws: WorkSheet) => WorkSheet): void {
    let patched: WorkSheet | undefined;
    this.workSheets.update((rows) => rows.map((w) => (w.id === id ? ((patched = mutate(w)), patched) : w)));
    if (patched) this.persistWorkSheet(patched);
  }

  /** Registers a new corrida de fabricación under a HT line — the only way progress advances on the HT. */
  addRun(workSheetId: string, lineId: string, input: Omit<ManufacturingRun, 'id' | 'operations'> & { operations?: ManufacturingRun['operations'] }): void {
    const id = `RUN-${this.nextRunSeq++}`;
    this.updateWorkSheet(workSheetId, (ws) => ({
      ...ws,
      lines: ws.lines.map((line) =>
        line.id === lineId
          ? { ...line, runs: [...line.runs, { ...input, id, operations: input.operations ?? line.routing.map((op) => ({ operationId: op.id, name: op.name, status: 'pending' as const })) }] }
          : line,
      ),
    }));
  }

  updateRun(workSheetId: string, lineId: string, runId: string, patch: Partial<ManufacturingRun>): void {
    this.updateWorkSheet(workSheetId, (ws) => ({
      ...ws,
      lines: ws.lines.map((line) =>
        line.id === lineId ? { ...line, runs: line.runs.map((r) => (r.id === runId ? { ...r, ...patch } : r)) } : line,
      ),
    }));
  }

  /** Manual scheduling from the Planificación Gantt/calendario — pure re-assignment, no constraint validation (MVP). */
  rescheduleRun(workSheetId: string, lineId: string, runId: string, patch: { scheduledStart?: string; scheduledEnd?: string; workCenterId?: string; machineId?: string; moldId?: string }): void {
    this.updateRun(workSheetId, lineId, runId, patch);
  }

  addInspection(input: Omit<QualityInspection, 'id'>): QualityInspection {
    const inspection: QualityInspection = { ...input, id: `QI-${String(this.nextInspectionSeq++).padStart(3, '0')}` };
    this.qualityInspections.update((rows) => [...rows, inspection]);
    this.inspectionsStore.upsert(inspection, (i) => ({ work_sheet_id: i.workSheetId, overall_result: i.overallResult }));
    return inspection;
  }

  addNonConformity(input: Omit<NonConformity, 'id'>): NonConformity {
    const nc: NonConformity = { ...input, id: `NC-${String(this.nextNonConformitySeq++).padStart(3, '0')}` };
    this.nonConformities.update((rows) => [...rows, nc]);
    this.nonConformitiesStore.upsert(nc, (n) => ({ work_sheet_id: n.workSheetId, resolved: n.resolved }));
    return nc;
  }

  resolveNonConformity(id: string, resolvedBy: string): void {
    let patched: NonConformity | undefined;
    this.nonConformities.update((rows) =>
      rows.map((n) => (n.id === id ? ((patched = { ...n, resolved: true, resolvedBy, resolvedAt: new Date().toISOString() }), patched) : n)),
    );
    if (patched) this.nonConformitiesStore.upsert(patched, (n) => ({ work_sheet_id: n.workSheetId, resolved: n.resolved }));
  }

  // ---------------------------------------------------------------------------
  // Producto
  // ---------------------------------------------------------------------------

  private persistProduct(p: Product): void {
    this.productsStore.upsert(p, (x) => ({ code: x.code, status: x.status }));
  }

  createProduct(input: Omit<Product, 'id'>): Product {
    const product: Product = { ...input, id: `PROD-${this.nextProductSeq++}` };
    this.products.update((rows) => [...rows, product]);
    this.persistProduct(product);
    return product;
  }

  updateProduct(id: string, patch: Partial<Product>): void {
    let patched: Product | undefined;
    this.products.update((rows) => rows.map((p) => (p.id === id ? ((patched = { ...p, ...patch }), patched) : p)));
    if (patched) this.persistProduct(patched);
  }

  // ---------------------------------------------------------------------------
  // BOM / Receta — versionado
  // ---------------------------------------------------------------------------

  private persistBom(b: BillOfMaterials): void {
    this.bomsStore.upsert(b, (x) => ({ product_id: x.productId, status: x.status }));
  }

  /** Plain create — used for a from-scratch BOM saved as draft, or directly as the active version. */
  createBom(input: Omit<BillOfMaterials, 'id'>): BillOfMaterials {
    const bom: BillOfMaterials = { ...input, id: `BOM-${this.nextBomSeq++}` };
    this.billsOfMaterials.update((rows) => [...rows, bom]);
    this.persistBom(bom);
    if (bom.status === 'active') this.activateBom(bom.id);
    return bom;
  }

  updateBom(id: string, patch: Partial<BillOfMaterials>): void {
    let patched: BillOfMaterials | undefined;
    this.billsOfMaterials.update((rows) => rows.map((b) => (b.id === id ? ((patched = { ...b, ...patch }), patched) : b)));
    if (patched) this.persistBom(patched);
  }

  /**
   * "Nueva versión" workflow, invoked from `bom-detail`: copies over the caller's edited components
   * y routing under a new version label. If `effectiveFrom` is today or in the past, the new version
   * activates immediately and the product's previous active version is expired (effectiveTo = the day
   * before). If it's a future date, the new version is left `draft`/scheduled — no automatic scheduler
   * in this mockup, someone re-opens it later to activate.
   */
  createBomVersion(input: Omit<BillOfMaterials, 'id' | 'status' | 'effectiveTo'>): BillOfMaterials {
    const TODAY = '2026-09-04';
    const status: BomStatus = input.effectiveFrom <= TODAY ? 'active' : 'draft';
    return this.createBom({ ...input, status });
  }

  /** Marks `bomId` as its product's active version, expiring any other active version of the same product. */
  activateBom(bomId: string): void {
    const bom = this.billsOfMaterials().find((b) => b.id === bomId);
    if (!bom) return;
    const dayBefore = addDaysIso(bom.effectiveFrom, -1);
    const prevActive = this.billsOfMaterials().find((b) => b.id !== bomId && b.productId === bom.productId && b.status === 'active');
    if (prevActive) {
      const expired: BillOfMaterials = { ...prevActive, status: 'expired', effectiveTo: dayBefore };
      this.billsOfMaterials.update((rows) => rows.map((b) => (b.id === expired.id ? expired : b)));
      this.persistBom(expired);
    }
    this.billsOfMaterials.update((rows) => rows.map((b) => (b.id === bomId ? { ...b, status: 'active' as const } : b)));
    const activated = this.billsOfMaterials().find((b) => b.id === bomId);
    if (activated) this.persistBom(activated);
    this.updateProduct(bom.productId, { activeBomId: bomId });
  }

  // ---------------------------------------------------------------------------
  // Recursos productivos
  // ---------------------------------------------------------------------------

  private persistMachine(m: Machine): void {
    this.machinesStore.upsert(m, (x) => ({ plant: x.plant, status: x.status }));
  }

  createMachine(input: Omit<Machine, 'id'>): Machine {
    const machine: Machine = { ...input, id: `MCH-${this.nextMachineSeq++}` };
    this.machines.update((rows) => [...rows, machine]);
    this.persistMachine(machine);
    return machine;
  }

  updateMachine(id: string, patch: Partial<Machine>): void {
    let patched: Machine | undefined;
    this.machines.update((rows) => rows.map((m) => (m.id === id ? ((patched = { ...m, ...patch }), patched) : m)));
    if (patched) this.persistMachine(patched);
  }

  private persistMold(m: Mold): void {
    this.moldsStore.upsert(m, (x) => ({ plant: x.plant, estado: x.estado }));
  }

  createMold(input: Omit<Mold, 'id'>): Mold {
    const mold: Mold = { ...input, id: `MLD-${this.nextMoldSeq++}` };
    this.molds.update((rows) => [...rows, mold]);
    this.persistMold(mold);
    return mold;
  }

  updateMold(id: string, patch: Partial<Mold>): void {
    let patched: Mold | undefined;
    this.molds.update((rows) => rows.map((m) => (m.id === id ? ((patched = { ...m, ...patch }), patched) : m)));
    if (patched) this.persistMold(patched);
  }

  private persistWorkCenter(w: WorkCenter): void {
    this.workCentersStore.upsert(w, (x) => ({ plant: x.plant }));
  }

  createWorkCenter(input: Omit<WorkCenter, 'id'>): WorkCenter {
    const workCenter: WorkCenter = { ...input, id: `WC-${this.nextWorkCenterSeq++}` };
    this.workCenters.update((rows) => [...rows, workCenter]);
    this.persistWorkCenter(workCenter);
    return workCenter;
  }

  updateWorkCenter(id: string, patch: Partial<WorkCenter>): void {
    let patched: WorkCenter | undefined;
    this.workCenters.update((rows) => rows.map((w) => (w.id === id ? ((patched = { ...w, ...patch }), patched) : w)));
    if (patched) this.persistWorkCenter(patched);
  }

  // ---------------------------------------------------------------------------
  // Calidad — protocolos
  // ---------------------------------------------------------------------------

  private persistProtocol(p: QualityProtocol): void {
    this.protocolsStore.upsert(p, (x) => ({ status: x.status }));
  }

  createQualityProtocol(input: Omit<QualityProtocol, 'id'>): QualityProtocol {
    const protocol: QualityProtocol = { ...input, id: `QP-${this.nextProtocolSeq++}` };
    this.qualityProtocols.update((rows) => [...rows, protocol]);
    this.persistProtocol(protocol);
    return protocol;
  }

  updateQualityProtocol(id: string, patch: Partial<QualityProtocol>): void {
    let patched: QualityProtocol | undefined;
    this.qualityProtocols.update((rows) => rows.map((p) => (p.id === id ? ((patched = { ...p, ...patch }), patched) : p)));
    if (patched) this.persistProtocol(patched);
  }
}
