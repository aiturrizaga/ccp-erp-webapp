import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { TableStore } from '@core/supabase/table-store';
import { GOODS_RECEIPTS, ITEMS, STOCK_ISSUES, STOCK_LEDGER, STOCK_LOTS, WAREHOUSES, WORK_SHEETS } from '@core/mock-data';
import { GoodsReceipt, GoodsReceiptLine, GoodsReceiptStatus, PurchaseOrder, StockIssue, StockIssueStatus, StockLedgerEntry, StockLedgerSourceDocument, StockLot } from '@core/models';
import { PurchasingState } from '../purchasing/purchasing-state';

/** One line Almacén is dispatching right now, drawn from a specific lot. */
export interface DispatchAllocation {
  itemId: string;
  quantity: number;
  lotId: string;
}

/**
 * Mutable store for goods receipts, stock issues, stock lots and the Kardex, backed by Supabase
 * tables (`goods_receipts`, `stock_issues`, `stock_lots`, `stock_ledger_entries`) — one row per
 * document. A receipt is scheduled the moment a Purchase Order is awarded (before the supplier even
 * confirms) so Almacén sees it on their agenda; Almacén then edits the expected date/time, counts
 * what actually arrived, and confirms — which rolls the accepted quantities into the PO's cumulative
 * received quantity. A delivery that falls short of the PO line leaves a pending balance that Almacén
 * can schedule a follow-up receipt for. Falls back to the bundled fixtures when Supabase isn't
 * configured or reachable.
 */
@Injectable({ providedIn: 'root' })
export class WarehouseOpsState {
  private readonly purchasingState = inject(PurchasingState);

  private readonly goodsReceiptsStore = new TableStore<GoodsReceipt>('goods_receipts');
  private readonly stockIssuesStore = new TableStore<StockIssue>('stock_issues');
  private readonly stockLotsStore = new TableStore<StockLot>('stock_lots');
  private readonly stockLedgerStore = new TableStore<StockLedgerEntry>('stock_ledger_entries');

  readonly goodsReceipts = signal<GoodsReceipt[]>([...GOODS_RECEIPTS]);
  readonly stockIssues = signal<StockIssue[]>([...STOCK_ISSUES]);
  readonly stockLots = signal<StockLot[]>([...STOCK_LOTS]);
  readonly stockLedger = signal<StockLedgerEntry[]>([...STOCK_LEDGER]);

  private nextReceiptSeq = GOODS_RECEIPTS.length + 1;
  private nextIssueSeq = STOCK_ISSUES.length + 1;
  private nextLedgerSeq = STOCK_LEDGER.length + 1;

  constructor() {
    this.goodsReceiptsStore.fetchAll().then((rows) => {
      if (!rows?.length) return;
      this.goodsReceipts.set(rows);
      this.nextReceiptSeq = rows.length + 1;
    });
    this.stockIssuesStore.fetchAll().then((rows) => {
      if (!rows?.length) return;
      this.stockIssues.set(rows);
      this.nextIssueSeq = rows.length + 1;
    });
    this.stockLotsStore.fetchAll().then((rows) => {
      if (!rows?.length) return;
      this.stockLots.set(rows);
    });
    this.stockLedgerStore.fetchAll().then((rows) => {
      if (!rows?.length) return;
      this.stockLedger.set(rows);
      this.nextLedgerSeq = rows.length + 1;
    });

    this.goodsReceiptsStore.subscribe((r) => this.mergeRow(this.goodsReceipts, r));
    this.stockIssuesStore.subscribe((i) => this.mergeRow(this.stockIssues, i));
    this.stockLotsStore.subscribe((l) => this.mergeRow(this.stockLots, l));
    this.stockLedgerStore.subscribe((e) => this.mergeRow(this.stockLedger, e));
  }

  /** Merges a row pushed by Realtime (another tab/user) into a local signal — update in place, or append if it's new to us. */
  private mergeRow<T extends { id: string }>(sig: WritableSignal<T[]>, entity: T): void {
    sig.update((rows) => (rows.some((r) => r.id === entity.id) ? rows.map((r) => (r.id === entity.id ? entity : r)) : [...rows, entity]));
  }

  private defaultLocationId(): string {
    return WAREHOUSES[0]?.locations[0]?.id ?? '';
  }

  private buildLines(po: PurchaseOrder, itemIds?: Set<string>): GoodsReceiptLine[] {
    return po.lines
      .filter((l) => !itemIds || itemIds.has(l.itemId))
      .map((l) => ({
        itemId: l.itemId,
        expectedQuantity: l.quantity - l.receivedQuantity,
        receivedQuantity: 0,
        acceptedQuantity: 0,
        claimedQuantity: 0,
        locationId: this.defaultLocationId(),
        inspectionResult: 'compliant' as const,
      }));
  }

  private updateGoodsReceipt(id: string, patch: (r: GoodsReceipt) => GoodsReceipt): void {
    let patched: GoodsReceipt | undefined;
    this.goodsReceipts.update((rows) =>
      rows.map((r) => {
        if (r.id !== id) return r;
        patched = patch(r);
        return patched;
      }),
    );
    if (patched) this.goodsReceiptsStore.upsert(patched, (r) => ({ status: r.status, purchase_order_id: r.purchaseOrderId }));
  }

  /** Called right when a PO is awarded, so Almacén sees the delivery coming before the supplier even confirms it. */
  scheduleReceiptForPurchaseOrder(po: PurchaseOrder): GoodsReceipt {
    const seq = this.nextReceiptSeq++;
    const receipt: GoodsReceipt = {
      id: `GR-${String(seq).padStart(3, '0')}`,
      number: `NI-2026-${String(300 + seq).padStart(4, '0')}`,
      purchaseOrderId: po.id,
      supplierId: po.supplierId,
      status: 'scheduled',
      expectedDate: po.committedDeliveryDate,
      expectedTime: po.committedDeliveryTime,
      receivedBy: '—',
      lines: this.buildLines(po),
      photos: [],
    };
    this.goodsReceipts.update((rs) => [...rs, receipt]);
    this.goodsReceiptsStore.upsert(receipt, (r) => ({ status: r.status, purchase_order_id: r.purchaseOrderId }));
    return receipt;
  }

  /** Almacén schedules a second delivery for whatever the last receipt left pending on the PO. */
  scheduleFollowUpReceipt(po: PurchaseOrder, expectedDate: string, expectedTime: string): GoodsReceipt | null {
    const pendingItemIds = new Set(po.lines.filter((l) => l.quantity - l.receivedQuantity > 0).map((l) => l.itemId));
    if (!pendingItemIds.size) return null;

    const seq = this.nextReceiptSeq++;
    const receipt: GoodsReceipt = {
      id: `GR-${String(seq).padStart(3, '0')}`,
      number: `NI-2026-${String(300 + seq).padStart(4, '0')}`,
      purchaseOrderId: po.id,
      supplierId: po.supplierId,
      status: 'scheduled',
      expectedDate,
      expectedTime,
      receivedBy: '—',
      lines: this.buildLines(po, pendingItemIds),
      photos: [],
    };
    this.goodsReceipts.update((rs) => [...rs, receipt]);
    this.goodsReceiptsStore.upsert(receipt, (r) => ({ status: r.status, purchase_order_id: r.purchaseOrderId }));
    return receipt;
  }

  updateExpectedDate(receiptId: string, expectedDate: string): void {
    this.updateGoodsReceipt(receiptId, (r) => ({ ...r, expectedDate }));
  }

  updateExpectedTime(receiptId: string, expectedTime: string): void {
    this.updateGoodsReceipt(receiptId, (r) => ({ ...r, expectedTime }));
  }

  updateLine(receiptId: string, itemId: string, patch: Partial<GoodsReceiptLine>): void {
    this.updateGoodsReceipt(receiptId, (r) => ({ ...r, lines: r.lines.map((l) => (l.itemId === itemId ? { ...l, ...patch } : l)) }));
  }

  private statusFromLines(lines: GoodsReceiptLine[]): GoodsReceiptStatus {
    const hasDiscrepancy = lines.some((l) => l.claimedQuantity > 0 || l.inspectionResult === 'rejected' || l.inspectionResult === 'observed');
    const allExpectedCovered = lines.every((l) => l.receivedQuantity >= l.expectedQuantity);
    if (hasDiscrepancy) return 'with_discrepancies';
    if (allExpectedCovered) return 'received';
    return lines.some((l) => l.receivedQuantity > 0) ? 'partial' : 'scheduled';
  }

  /** Almacén confirms what actually arrived — finalizes this receipt's status and rolls the accepted quantities into the PO. */
  confirmReceipt(receiptId: string, actualDate: string, actualTime: string, receivedBy: string): void {
    const receipt = this.goodsReceipts().find((r) => r.id === receiptId);
    if (!receipt) return;

    const status = this.statusFromLines(receipt.lines);
    this.updateGoodsReceipt(receiptId, (r) => ({ ...r, status, actualDate, actualTime, receivedBy }));

    const deltas: Record<string, number> = {};
    for (const line of receipt.lines) deltas[line.itemId] = (deltas[line.itemId] ?? 0) + line.acceptedQuantity;
    this.purchasingState.applyReceivedQuantities(receipt.purchaseOrderId, deltas);
  }

  // --- Stock lots (lotes) ---

  /** Lots with real stock to draw from for an item, oldest first (FIFO) — what a "de qué lote" picker should offer. */
  availableLotsFor(itemId: string): StockLot[] {
    return this.stockLots()
      .filter((lot) => lot.itemId === itemId && lot.status === 'available' && lot.quantity > 0)
      .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));
  }

  private currentStock(itemId: string): number {
    return this.stockLots()
      .filter((lot) => lot.itemId === itemId && lot.status === 'available')
      .reduce((sum, lot) => sum + lot.quantity, 0);
  }

  /** Draws `quantity` out of a specific lot — the only place `StockLot.quantity` is ever mutated. */
  private decrementLot(lotId: string, quantity: number): void {
    let patched: StockLot | undefined;
    this.stockLots.update((lots) =>
      lots.map((lot) => {
        if (lot.id !== lotId) return lot;
        patched = { ...lot, quantity: Math.max(0, lot.quantity - quantity) };
        return patched;
      }),
    );
    if (patched) this.stockLotsStore.upsert(patched, (l) => ({ item_id: l.itemId, status: l.status }));
  }

  // --- Stock issues (salidas): a HT's outbound order, attended as materials become available ---

  private issueStatusFromLines(lines: StockIssue['lines']): StockIssueStatus {
    const allCovered = lines.every((l) => l.dispatchedQuantity >= l.requiredQuantity);
    if (allCovered) return 'dispatched';
    return lines.some((l) => l.dispatchedQuantity > 0) ? 'partial' : 'pending';
  }

  private appendLedgerEntry(itemId: string, quantity: number, documentNumber: string, documentType: StockLedgerSourceDocument, plant: string, user: string, lot?: string): void {
    const seq = this.nextLedgerSeq++;
    const unitCost = ITEMS.find((i) => i.id === itemId)?.lastCost ?? 0;
    const locationId = WAREHOUSES[0]?.locations.find((l) => plant.includes(l.shortName))?.id ?? this.defaultLocationId();
    const entry: StockLedgerEntry = {
      id: `SL-${String(seq).padStart(3, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      itemId,
      type: 'outbound',
      documentNumber,
      documentType,
      warehouseId: WAREHOUSES[0]?.id ?? '',
      locationId,
      lot,
      inboundQuantity: 0,
      outboundQuantity: quantity,
      balance: Math.max(0, this.currentStock(itemId) - quantity),
      unitCost,
      user,
    };
    this.stockLedger.update((rows) => [...rows, entry]);
    this.stockLedgerStore.upsert(entry, (e) => ({ item_id: e.itemId }));
  }

  /** Applies one dispatch's allocations: bumps each line's dispatched quantity, draws down the chosen lots, and logs the Kardex movement. Shared by single and bulk dispatch. */
  private applyDispatch(issue: StockIssue, dispatchedBy: string, receivedBy: string, allocations: DispatchAllocation[]): void {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 5);
    const quantities = new Map(allocations.map((a) => [a.itemId, a.quantity]));

    let patched: StockIssue | undefined;
    this.stockIssues.update((issues) =>
      issues.map((i) => {
        if (i.id !== issue.id) return i;
        const updatedLines = i.lines.map((line) => {
          const dispatched = quantities.get(line.itemId);
          return dispatched && dispatched > 0 ? { ...line, dispatchedQuantity: line.dispatchedQuantity + dispatched } : line;
        });
        patched = {
          ...i,
          lines: updatedLines,
          status: this.issueStatusFromLines(updatedLines),
          dispatches: [...i.dispatches, { date, time, dispatchedBy, receivedBy, lines: allocations.map((a) => ({ itemId: a.itemId, quantity: a.quantity, lotId: a.lotId })) }],
        };
        return patched;
      }),
    );
    if (patched) this.stockIssuesStore.upsert(patched, (i) => ({ status: i.status, work_sheet_id: i.workSheetId ?? null }));

    for (const { itemId, quantity, lotId } of allocations) {
      const lot = this.stockLots().find((l) => l.id === lotId);
      this.decrementLot(lotId, quantity);
      this.appendLedgerEntry(itemId, quantity, issue.workSheetId ? this.workSheetNumber(issue.workSheetId) : issue.number, 'WorkSheet', issue.plant, dispatchedBy, lot?.lot);
    }
  }

  /** Almacén attends one pending outbound order — can be partial, repeated as more stock becomes available, each time drawing from a chosen lot. */
  dispatchStockIssue(issueId: string, dispatchedBy: string, receivedBy: string, allocations: DispatchAllocation[]): void {
    const issue = this.stockIssues().find((i) => i.id === issueId);
    const valid = allocations.filter((a) => a.quantity > 0 && a.lotId);
    if (!issue || !valid.length) return;
    this.applyDispatch(issue, dispatchedBy, receivedBy, valid);
  }

  /**
   * Almacén attends several pending/parcial outbound orders in one trip — e.g. several HT at once.
   * Each entry in `allocationsByIssue` is dispatched independently against its own StockIssue, but the
   * whole block shares one `dispatchedBy`/`receivedBy` since it's a single delivery event.
   */
  dispatchStockIssuesBulk(issueIds: string[], dispatchedBy: string, receivedBy: string, allocationsByIssue: Record<string, DispatchAllocation[]>): void {
    for (const issueId of issueIds) {
      const allocations = (allocationsByIssue[issueId] ?? []).filter((a) => a.quantity > 0 && a.lotId);
      if (!allocations.length) continue;
      const issue = this.stockIssues().find((i) => i.id === issueId);
      if (!issue) continue;
      this.applyDispatch(issue, dispatchedBy, receivedBy, allocations);
    }
  }

  private workSheetNumber(workSheetId: string): string {
    return WORK_SHEETS.find((ws) => ws.id === workSheetId)?.number ?? workSheetId;
  }

  /** "Otro motivo" issues aren't tied to a HT — Almacén creates and dispatches them in the same step, drawing each line from a chosen lot. */
  createAndDispatchOtherIssue(input: {
    reason: string;
    plant: string;
    dispatchedBy: string;
    receivedBy: string;
    lines: { itemId: string; quantity: number; unitOfMeasure: string; lotId: string }[];
  }): StockIssue {
    const seq = this.nextIssueSeq++;
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 5);

    const issue: StockIssue = {
      id: `SI-${String(seq).padStart(3, '0')}`,
      number: `NS-2026-${String(200 + seq).padStart(4, '0')}`,
      origin: 'other',
      reason: input.reason,
      status: 'dispatched',
      createdAt: date,
      plant: input.plant,
      lines: input.lines.map((l) => ({ itemId: l.itemId, requiredQuantity: l.quantity, dispatchedQuantity: l.quantity, unitOfMeasure: l.unitOfMeasure })),
      dispatches: [
        { date, time, dispatchedBy: input.dispatchedBy, receivedBy: input.receivedBy, lines: input.lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity, lotId: l.lotId })) },
      ],
    };

    this.stockIssues.update((issues) => [...issues, issue]);
    this.stockIssuesStore.upsert(issue, (i) => ({ status: i.status, work_sheet_id: i.workSheetId ?? null }));

    for (const line of input.lines) {
      const lot = this.stockLots().find((l) => l.id === line.lotId);
      this.decrementLot(line.lotId, line.quantity);
      this.appendLedgerEntry(line.itemId, line.quantity, issue.number, 'Adjustment', issue.plant, input.dispatchedBy, lot?.lot);
    }

    return issue;
  }
}
