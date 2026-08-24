import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { TableStore } from '@core/supabase/table-store';
import { GOODS_RECEIPTS, ITEMS, STOCK_ISSUES, STOCK_LEDGER, STOCK_LOTS, WAREHOUSES, WORK_SHEETS } from '@core/mock-data';
import { GoodsReceipt, GoodsReceiptLine, GoodsReceiptStatus, PurchaseOrder, StockIssue, StockIssueStatus, StockLedgerEntry, StockLedgerSourceDocument } from '@core/models';
import { PurchasingState } from '../purchasing/purchasing-state';

/**
 * Mutable store for goods receipts, stock issues and the Kardex, backed by Supabase tables
 * (`goods_receipts`, `stock_issues`, `stock_ledger_entries`) — one row per document. A receipt is
 * scheduled the moment a Purchase Order is awarded (before the supplier even confirms) so Almacén
 * sees it on their agenda; Almacén then edits the expected date/time, counts what actually
 * arrived, and confirms — which rolls the accepted quantities into the PO's cumulative received
 * quantity. A delivery that falls short of the PO line leaves a pending balance that Almacén can
 * schedule a follow-up receipt for. Falls back to the bundled fixtures when Supabase isn't
 * configured or reachable.
 */
@Injectable({ providedIn: 'root' })
export class WarehouseOpsState {
  private readonly purchasingState = inject(PurchasingState);

  private readonly goodsReceiptsStore = new TableStore<GoodsReceipt>('goods_receipts');
  private readonly stockIssuesStore = new TableStore<StockIssue>('stock_issues');
  private readonly stockLedgerStore = new TableStore<StockLedgerEntry>('stock_ledger_entries');

  readonly goodsReceipts = signal<GoodsReceipt[]>([...GOODS_RECEIPTS]);
  readonly stockIssues = signal<StockIssue[]>([...STOCK_ISSUES]);
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
    this.stockLedgerStore.fetchAll().then((rows) => {
      if (!rows?.length) return;
      this.stockLedger.set(rows);
      this.nextLedgerSeq = rows.length + 1;
    });

    this.goodsReceiptsStore.subscribe((r) => this.mergeRow(this.goodsReceipts, r));
    this.stockIssuesStore.subscribe((i) => this.mergeRow(this.stockIssues, i));
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
      number: `REC-2026-${String(300 + seq).padStart(4, '0')}`,
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
      number: `REC-2026-${String(300 + seq).padStart(4, '0')}`,
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

  // --- Stock issues (salidas): a HT's outbound order, attended as materials become available ---

  private issueStatusFromLines(lines: StockIssue['lines']): StockIssueStatus {
    const allCovered = lines.every((l) => l.dispatchedQuantity >= l.requiredQuantity);
    if (allCovered) return 'dispatched';
    return lines.some((l) => l.dispatchedQuantity > 0) ? 'partial' : 'pending';
  }

  private currentStock(itemId: string): number {
    return STOCK_LOTS.filter((lot) => lot.itemId === itemId).reduce((sum, lot) => sum + lot.quantity, 0);
  }

  private appendLedgerEntry(itemId: string, quantity: number, documentNumber: string, documentType: StockLedgerSourceDocument, plant: string, user: string): void {
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
      inboundQuantity: 0,
      outboundQuantity: quantity,
      balance: Math.max(0, this.currentStock(itemId) - quantity),
      unitCost,
      user,
    };
    this.stockLedger.update((rows) => [...rows, entry]);
    this.stockLedgerStore.upsert(entry, (e) => ({ item_id: e.itemId }));
  }

  /** Almacén attends a pending outbound order — can be partial, repeated as more stock becomes available. */
  dispatchStockIssue(issueId: string, dispatchedBy: string, receivedBy: string, quantities: Record<string, number>): void {
    const issue = this.stockIssues().find((i) => i.id === issueId);
    if (!issue) return;

    const lines = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity }));
    if (!lines.length) return;

    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 5);

    let patched: StockIssue | undefined;
    this.stockIssues.update((issues) =>
      issues.map((i) => {
        if (i.id !== issueId) return i;
        const updatedLines = i.lines.map((line) => {
          const dispatched = quantities[line.itemId];
          return dispatched > 0 ? { ...line, dispatchedQuantity: line.dispatchedQuantity + dispatched } : line;
        });
        patched = {
          ...i,
          lines: updatedLines,
          status: this.issueStatusFromLines(updatedLines),
          dispatches: [...i.dispatches, { date, time, dispatchedBy, receivedBy, lines }],
        };
        return patched;
      }),
    );
    if (patched) this.stockIssuesStore.upsert(patched, (i) => ({ status: i.status, work_sheet_id: i.workSheetId ?? null }));

    for (const { itemId, quantity } of lines) {
      this.appendLedgerEntry(itemId, quantity, issue.workSheetId ? this.workSheetNumber(issue.workSheetId) : issue.number, 'WorkSheet', issue.plant, dispatchedBy);
    }
  }

  private workSheetNumber(workSheetId: string): string {
    return WORK_SHEETS.find((ws) => ws.id === workSheetId)?.number ?? workSheetId;
  }

  /** "Otro motivo" issues aren't tied to a HT — Almacén creates and dispatches them in the same step. */
  createAndDispatchOtherIssue(input: {
    reason: string;
    plant: string;
    dispatchedBy: string;
    receivedBy: string;
    lines: { itemId: string; quantity: number; unitOfMeasure: string }[];
  }): StockIssue {
    const seq = this.nextIssueSeq++;
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 5);

    const issue: StockIssue = {
      id: `SI-${String(seq).padStart(3, '0')}`,
      number: `SAL-2026-${String(200 + seq).padStart(4, '0')}`,
      origin: 'other',
      reason: input.reason,
      status: 'dispatched',
      createdAt: date,
      plant: input.plant,
      lines: input.lines.map((l) => ({ itemId: l.itemId, requiredQuantity: l.quantity, dispatchedQuantity: l.quantity, unitOfMeasure: l.unitOfMeasure })),
      dispatches: [{ date, time, dispatchedBy: input.dispatchedBy, receivedBy: input.receivedBy, lines: input.lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity })) }],
    };

    this.stockIssues.update((issues) => [...issues, issue]);
    this.stockIssuesStore.upsert(issue, (i) => ({ status: i.status, work_sheet_id: i.workSheetId ?? null }));

    for (const line of input.lines) {
      this.appendLedgerEntry(line.itemId, line.quantity, issue.number, 'Adjustment', issue.plant, input.dispatchedBy);
    }

    return issue;
  }
}
