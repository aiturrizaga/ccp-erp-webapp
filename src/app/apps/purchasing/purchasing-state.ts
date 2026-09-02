import { Injectable, WritableSignal, signal } from '@angular/core';
import { TableStore } from '@core/supabase/table-store';
import { PURCHASE_ORDERS, PURCHASE_REQUIREMENTS, QUOTATIONS, REPLENISHMENT_SUGGESTIONS, SUPPLIERS } from '@core/mock-data';
import {
  Currency,
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderStatus,
  PurchaseRequirement,
  PurchaseRequirementLine,
  Quotation,
  QuotationLine,
  QuotationOffer,
  ReplenishmentSuggestion,
  ReplenishmentSuggestionLine,
  RequisitionPriority,
  Supplier,
  SupplierClass,
} from '@core/models';

const TODAY = '2026-08-23';

/**
 * Mutable store for Compras' documents, backed by Supabase tables (`replenishment_suggestions`,
 * `purchase_requirements`, `quotations`, `purchase_orders`, `suppliers`) — one row per document, so two
 * people editing different documents at once never clobber each other. Falls back to the bundled
 * fixtures when Supabase isn't configured or reachable, so the prototype still works standalone.
 */
@Injectable({ providedIn: 'root' })
export class PurchasingState {
  private readonly suggestionsStore = new TableStore<ReplenishmentSuggestion>('replenishment_suggestions');
  private readonly requirementsStore = new TableStore<PurchaseRequirement>('purchase_requirements');
  private readonly quotationsStore = new TableStore<Quotation>('quotations');
  private readonly purchaseOrdersStore = new TableStore<PurchaseOrder>('purchase_orders');
  private readonly suppliersStore = new TableStore<Supplier>('suppliers');

  readonly suggestions = signal<ReplenishmentSuggestion[]>([...REPLENISHMENT_SUGGESTIONS]);
  readonly requirements = signal<PurchaseRequirement[]>([...PURCHASE_REQUIREMENTS]);
  readonly quotations = signal<Quotation[]>([...QUOTATIONS]);
  readonly purchaseOrders = signal<PurchaseOrder[]>([...PURCHASE_ORDERS]);
  readonly suppliers = signal<Supplier[]>([...SUPPLIERS]);

  private nextQuotationSeq = QUOTATIONS.length + 1;
  private nextPurchaseOrderSeq = PURCHASE_ORDERS.length + 1;
  private nextSupplierSeq = SUPPLIERS.length + 1;

  constructor() {
    this.suggestionsStore.fetchAll().then((rows) => {
      if (!rows?.length) return;
      this.suggestions.set(rows);
    });
    this.requirementsStore.fetchAll().then((rows) => {
      if (!rows?.length) return;
      this.requirements.set(rows);
    });
    this.quotationsStore.fetchAll().then((rows) => {
      if (!rows?.length) return;
      this.quotations.set(rows);
      this.nextQuotationSeq = rows.length + 1;
    });
    this.purchaseOrdersStore.fetchAll().then((rows) => {
      if (!rows?.length) return;
      this.purchaseOrders.set(rows);
      this.nextPurchaseOrderSeq = rows.length + 1;
    });
    this.suppliersStore.fetchAll().then((rows) => {
      if (!rows?.length) return;
      this.suppliers.set(rows);
      this.nextSupplierSeq = rows.length + 1;
    });

    this.suggestionsStore.subscribe((s) => this.mergeRow(this.suggestions, s));
    this.requirementsStore.subscribe((r) => this.mergeRow(this.requirements, r));
    this.quotationsStore.subscribe((q) => this.mergeRow(this.quotations, q));
    this.purchaseOrdersStore.subscribe((po) => this.mergeRow(this.purchaseOrders, po));
    this.suppliersStore.subscribe((s) => this.mergeRow(this.suppliers, s));
  }

  /** Merges a row pushed by Realtime (another tab/user) into a local signal — update in place, or append if it's new to us. */
  private mergeRow<T extends { id: string }>(sig: WritableSignal<T[]>, entity: T): void {
    sig.update((rows) => (rows.some((r) => r.id === entity.id) ? rows.map((r) => (r.id === entity.id ? entity : r)) : [...rows, entity]));
  }

  /** Quick "datos básicos" registration from within a quotation flow — the rest of the supplier profile (tier, credit, performance) is filled in later by Compras from the real Proveedores screen. */
  addSupplier(input: { legalName: string; taxId: string; phone: string; email: string; class: SupplierClass; currency: Currency; createdBy: string }): Supplier {
    const supplier: Supplier = {
      id: `SUP-${String(this.nextSupplierSeq++).padStart(3, '0')}`,
      taxId: input.taxId,
      legalName: input.legalName,
      class: input.class,
      tier: 'C',
      businessLine: null,
      address: '',
      phone: input.phone,
      email: input.email,
      currency: input.currency,
      paymentTerms: '',
      bankAccount: '',
      status: 'draft',
      createdBy: input.createdBy,
      registeredAt: TODAY,
      creditLimit: 0,
      creditUsed: 0,
      performance: { onTimeDeliveryPct: 0, completedOrdersPct: 0, qualityRating: 0 },
    };
    this.suppliers.update((rows) => [...rows, supplier]);
    this.suppliersStore.upsert(supplier, (s) => ({ status: s.status }));
    return supplier;
  }

  // --- Reposición sugerida ---

  private updateSuggestion(id: string, patch: (s: ReplenishmentSuggestion) => ReplenishmentSuggestion): ReplenishmentSuggestion | undefined {
    let patched: ReplenishmentSuggestion | undefined;
    this.suggestions.update((rows) =>
      rows.map((s) => {
        if (s.id !== id) return s;
        patched = patch(s);
        return patched;
      }),
    );
    if (patched) this.suggestionsStore.upsert(patched, (s) => ({ status: s.status, area: s.area }));
    return patched;
  }

  private nextSuggestionNumber(): string {
    let max = 0;
    for (const s of this.suggestions()) {
      const n = parseInt(s.number.replace('SC-2026-', ''), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
    return `SC-2026-${String(max + 1).padStart(4, '0')}`;
  }

  /** Almacén (or another area) manually files a suggestion that isn't tied to a Hoja de Trabajo — starts as a draft, same as an auto-generated one, and is available to group into an RC right away. */
  createSuggestion(input: {
    origin: ReplenishmentSuggestion['origin'];
    requestedBy: string;
    area: string;
    plant: string;
    priority: RequisitionPriority;
    neededBy: string;
    note?: string;
    lines: ReplenishmentSuggestionLine[];
  }): ReplenishmentSuggestion {
    const seq = this.suggestions().length + 1;
    const suggestion: ReplenishmentSuggestion = {
      id: `PR-${String(seq).padStart(3, '0')}`,
      number: this.nextSuggestionNumber(),
      status: 'draft',
      createdAt: TODAY,
      origin: input.origin,
      requestedBy: input.requestedBy,
      area: input.area,
      plant: input.plant,
      priority: input.priority,
      neededBy: input.neededBy,
      note: input.note,
      lines: input.lines,
      history: [{ at: TODAY, action: 'created' }],
    };
    this.suggestions.update((rows) => [...rows, suggestion]);
    this.suggestionsStore.upsert(suggestion, (s) => ({ status: s.status, area: s.area }));
    return suggestion;
  }

  updateLineQuantity(suggestionId: string, lineIndex: number, quantity: number): void {
    this.updateSuggestion(suggestionId, (s) => ({
      ...s,
      lines: s.lines.map((line, i) => (i === lineIndex ? { ...line, quantity } : line)),
    }));
  }

  addLine(suggestionId: string, line: ReplenishmentSuggestionLine): void {
    this.updateSuggestion(suggestionId, (s) => ({ ...s, lines: [...s.lines, { ...line, addedManually: true }] }));
  }

  removeLine(suggestionId: string, lineIndex: number): void {
    this.updateSuggestion(suggestionId, (s) => ({ ...s, lines: s.lines.filter((_, i) => i !== lineIndex) }));
  }

  setLineNotNeeded(suggestionId: string, lineIndex: number, notNeeded: boolean): void {
    this.updateSuggestion(suggestionId, (s) => ({
      ...s,
      lines: s.lines.map((line, i) => (i === lineIndex ? { ...line, notNeeded } : line)),
    }));
  }

  updateNote(suggestionId: string, note: string): void {
    this.updateSuggestion(suggestionId, (s) => ({ ...s, note }));
  }

  // --- Requerimiento de Compra (RC) ---

  private updateRequirement(id: string, patch: (r: PurchaseRequirement) => PurchaseRequirement): PurchaseRequirement | undefined {
    let patched: PurchaseRequirement | undefined;
    this.requirements.update((rows) =>
      rows.map((r) => {
        if (r.id !== id) return r;
        patched = patch(r);
        return patched;
      }),
    );
    if (patched) this.requirementsStore.upsert(patched, (r) => ({ status: r.status, area: r.area }));
    return patched;
  }

  private nextRequirementNumber(): string {
    let max = 0;
    for (const r of this.requirements()) {
      const n = parseInt(r.number.replace('RC-2026-', ''), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
    return `RC-2026-${String(max + 1).padStart(4, '0')}`;
  }

  /**
   * Almacén groups several free (status 'draft') Reposición sugerida rows into one Requerimiento de
   * Compra block. `lines` is the RC's own working copy — the create screen lets Almacén edit
   * quantities or strike an article out before the block even exists, so it's passed in as-is rather
   * than re-derived from the suggestions here.
   */
  createRequirement(input: {
    suggestionIds: string[];
    lines: PurchaseRequirementLine[];
    requestedBy: string;
    area: string;
    plant: string;
    priority: RequisitionPriority;
    neededBy: string;
    note?: string;
  }): PurchaseRequirement {
    const seq = this.requirements().length + 1;

    const requirement: PurchaseRequirement = {
      id: `RC-${String(seq).padStart(3, '0')}`,
      number: this.nextRequirementNumber(),
      status: 'draft',
      suggestionIds: input.suggestionIds,
      requestedBy: input.requestedBy,
      area: input.area,
      plant: input.plant,
      priority: input.priority,
      createdAt: TODAY,
      neededBy: input.neededBy,
      note: input.note,
      history: [{ at: TODAY, action: 'created' }],
      lines: input.lines,
    };
    this.requirements.update((rows) => [...rows, requirement]);
    this.requirementsStore.upsert(requirement, (r) => ({ status: r.status, area: r.area }));

    for (const suggestionId of input.suggestionIds) {
      this.updateSuggestion(suggestionId, (s) => ({
        ...s,
        status: 'grouped',
        requirementId: requirement.id,
        history: [...s.history, { at: TODAY, action: 'grouped', requirementId: requirement.id, requirementNumber: requirement.number }],
      }));
    }

    return requirement;
  }

  updateRequirementNote(requirementId: string, note: string): void {
    this.updateRequirement(requirementId, (r) => ({ ...r, note }));
  }

  updateRequirementLineQuantity(requirementId: string, lineIndex: number, quantity: number): void {
    this.updateRequirement(requirementId, (r) => ({
      ...r,
      lines: r.lines.map((line, i) => (i === lineIndex ? { ...line, quantity } : line)),
    }));
  }

  /** Almacén adds an article directly to the block — not tied to any grouped suggestion's material list. */
  addRequirementLine(requirementId: string, line: PurchaseRequirementLine): void {
    this.updateRequirement(requirementId, (r) => ({ ...r, lines: [...r.lines, { ...line, addedManually: true }] }));
  }

  /** Almacén strikes an article out of the block — kept in `lines` (struck through in the UI) rather than removed, so there's a record it was requested and then decided against. */
  setRequirementLineNotNeeded(requirementId: string, lineIndex: number, notNeeded: boolean): void {
    this.updateRequirement(requirementId, (r) => ({
      ...r,
      lines: r.lines.map((line, i) => (i === lineIndex ? { ...line, notNeeded } : line)),
    }));
  }

  /** Almacén marks the block reviewed before it can be sent to Logística — the required checkpoint between 'draft' and 'pending_approval'. */
  markRequirementReviewed(requirementId: string, by?: string): void {
    this.updateRequirement(requirementId, (r) => ({
      ...r,
      status: 'reviewed' as const,
      history: [...r.history, { at: TODAY, action: 'reviewed', by }],
    }));
  }

  submitRequirementForApproval(requirementId: string): void {
    this.updateRequirement(requirementId, (r) => ({
      ...r,
      status: 'pending_approval' as const,
      history: [...r.history, { at: TODAY, action: 'submitted' }],
    }));
  }

  /** Logística approves the RC — its grouped suggestions stay 'grouped', now ready for Compras to generate the RFQ. */
  approveRequirement(requirementId: string, by?: string): void {
    this.updateRequirement(requirementId, (r) => ({
      ...r,
      status: 'approved' as const,
      history: [...r.history, { at: TODAY, action: 'approved', by }],
    }));
  }

  /**
   * Logística rejects or observes the RC. Either way the whole block is released: every grouped
   * suggestion goes back to 'draft' and loses its `requirementId`, so Almacén can regroup it (alone or
   * with others) into a brand new RC. The rejected/observed RC itself is never deleted or reused — it
   * stays visible with its full history for audit.
   */
  private releaseRequirement(requirementId: string, status: 'rejected' | 'observed', comment: string, by?: string): void {
    const requirement = this.updateRequirement(requirementId, (r) => ({
      ...r,
      status,
      history: [...r.history, { at: TODAY, action: status, by, comment }],
    }));
    if (!requirement) return;

    for (const suggestionId of requirement.suggestionIds) {
      this.updateSuggestion(suggestionId, (s) => ({
        ...s,
        status: 'draft',
        requirementId: undefined,
        history: [...s.history, { at: TODAY, action: 'released', requirementId: requirement.id, requirementNumber: requirement.number, reason: comment }],
      }));
    }
  }

  rejectRequirement(requirementId: string, comment: string, by?: string): void {
    this.releaseRequirement(requirementId, 'rejected', comment, by);
  }

  observeRequirement(requirementId: string, comment: string, by?: string): void {
    this.releaseRequirement(requirementId, 'observed', comment, by);
  }

  /** Compras generates the RFQ from an approved RC — merges the RC's own (possibly edited) lines, summing quantities when the same item was requested by more than one HT/sugerencia, and skipping lines Almacén struck out as "no es necesario". */
  createQuotationFromRequirement(requirement: PurchaseRequirement): Quotation {
    const seq = this.nextQuotationSeq++;

    const mergedLines = new Map<string, QuotationLine>();
    for (const line of requirement.lines) {
      if (line.notNeeded) continue;
      const existing = mergedLines.get(line.itemId);
      if (existing) {
        existing.quantity += line.quantity;
      } else {
        mergedLines.set(line.itemId, { itemId: line.itemId, quantity: line.quantity, unitOfMeasure: line.unitOfMeasure, offers: [] });
      }
    }

    const quotation: Quotation = {
      id: `QT-${String(seq).padStart(3, '0')}`,
      number: `COT-2026-${String(100 + seq).padStart(4, '0')}`,
      requirementId: requirement.id,
      status: 'draft',
      createdAt: TODAY,
      dueDate: TODAY,
      lines: Array.from(mergedLines.values()),
    };
    this.quotations.update((quotations) => [...quotations, quotation]);
    this.quotationsStore.upsert(quotation, (q) => ({ status: q.status, requirement_id: q.requirementId }));
    return quotation;
  }

  /** Conie marks an RFQ as sent once she's requested quotes from suppliers, before any offers come back. */
  markQuotationSent(quotationId: string): void {
    this.updateQuotation(quotationId, (q) => ({ ...q, status: 'sent' as const }));
  }

  private updateQuotation(id: string, patch: (q: Quotation) => Quotation): void {
    let patched: Quotation | undefined;
    this.quotations.update((rows) =>
      rows.map((q) => {
        if (q.id !== id) return q;
        patched = patch(q);
        return patched;
      }),
    );
    if (patched) this.quotationsStore.upsert(patched, (q) => ({ status: q.status, requirement_id: q.requirementId }));
  }

  /** Conie registers a supplier's quotation received by phone/email as a manual offer, attaching the PDF she received as evidence. */
  addOfferToLine(quotationId: string, itemId: string, offer: QuotationOffer): void {
    this.updateQuotation(quotationId, (q) => ({
      ...q,
      status: q.status === 'draft' || q.status === 'sent' ? ('received' as const) : q.status,
      lines: q.lines.map((line) => (line.itemId === itemId ? { ...line, offers: [...line.offers, offer] } : line)),
    }));
  }

  private nextPurchaseOrderNumber(): string {
    let max = 0;
    for (const po of this.purchaseOrders()) {
      const n = parseInt(po.number.replace('OC-2026-', ''), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
    return `OC-2026-${String(max + 1).padStart(4, '0')}`;
  }

  /** Compras files a PO by hand — not tied to any RFQ/adjudicación, e.g. a direct purchase or a repeat order with a known supplier. */
  createPurchaseOrder(input: {
    supplierId: string;
    currency: Currency;
    exchangeRate: number;
    paymentTerms: string;
    committedDeliveryDate: string;
    committedDeliveryTime: string;
    plant: string;
    termsAndConditions?: string;
    penalties?: string;
    warranty?: string;
    notes?: string;
    lines: PurchaseOrderLine[];
  }): PurchaseOrder {
    const seq = this.nextPurchaseOrderSeq++;
    const order: PurchaseOrder = {
      id: `PO-${String(seq).padStart(3, '0')}`,
      number: this.nextPurchaseOrderNumber(),
      supplierId: input.supplierId,
      status: 'draft',
      currency: input.currency,
      exchangeRate: input.exchangeRate,
      paymentTerms: input.paymentTerms,
      issuedAt: TODAY,
      committedDeliveryDate: input.committedDeliveryDate,
      committedDeliveryTime: input.committedDeliveryTime,
      plant: input.plant,
      termsAndConditions: input.termsAndConditions ?? '',
      penalties: input.penalties ?? '',
      warranty: input.warranty ?? '',
      notes: input.notes ?? '',
      lines: input.lines,
    };
    this.purchaseOrders.update((rows) => [...rows, order]);
    this.purchaseOrdersStore.upsert(order, (po) => ({ status: po.status, supplier_id: po.supplierId }));
    return order;
  }

  /**
   * Awards each item to the winning supplier chosen for it — a mixed award across a quotation groups
   * the winning lines by supplier and creates one Purchase Order per distinct supplier, so two
   * different suppliers can win different items from the same RFQ.
   */
  awardQuotationMixed(quotation: Quotation, winners: Record<string, string>): PurchaseOrder[] {
    const linesBySupplier = new Map<string, { orderLine: PurchaseOrderLine; offer: QuotationOffer }[]>();

    for (const line of quotation.lines) {
      const supplierId = winners[line.itemId];
      if (!supplierId) continue;
      const offer = line.offers.find((o) => o.supplierId === supplierId);
      if (!offer) continue;
      const entry = { orderLine: { itemId: line.itemId, quantity: line.quantity, receivedQuantity: 0, unitOfMeasure: line.unitOfMeasure, unitPrice: offer.unitPrice }, offer };
      linesBySupplier.set(supplierId, [...(linesBySupplier.get(supplierId) ?? []), entry]);
    }

    let nextNumber = this.nextPurchaseOrderNumber();
    const orders: PurchaseOrder[] = [];
    for (const [supplierId, entries] of linesBySupplier) {
      const referenceOffer = entries[0].offer;
      const seq = this.nextPurchaseOrderSeq++;
      const number = nextNumber;
      nextNumber = `OC-2026-${String(parseInt(number.replace('OC-2026-', ''), 10) + 1).padStart(4, '0')}`;
      orders.push({
        id: `PO-${String(seq).padStart(3, '0')}`,
        number,
        quotationId: quotation.id,
        supplierId,
        status: 'draft',
        currency: referenceOffer.currency,
        exchangeRate: 1,
        paymentTerms: referenceOffer.paymentTerms,
        issuedAt: TODAY,
        committedDeliveryDate: TODAY,
        committedDeliveryTime: '09:00',
        plant: 'AL01 · Planta 01',
        termsAndConditions: '',
        penalties: '',
        warranty: '',
        notes: `Generada desde adjudicación de ${quotation.number}.`,
        lines: entries.map((e) => e.orderLine),
      });
    }

    this.purchaseOrders.update((orders_) => [...orders_, ...orders]);
    this.purchaseOrdersStore.upsert(orders, (po) => ({ status: po.status, supplier_id: po.supplierId }));

    const distinctSuppliers = [...linesBySupplier.keys()];
    this.updateQuotation(quotation.id, (q) => ({
      ...q,
      status: 'awarded' as const,
      awardedSupplierId: distinctSuppliers.length === 1 ? distinctSuppliers[0] : undefined,
      lines: q.lines.map((line) => ({
        ...line,
        offers: line.offers.map((o) => ({ ...o, selected: winners[line.itemId] === o.supplierId })),
      })),
    }));

    return orders;
  }

  /** Almacén confirmed a goods receipt — rolls the accepted quantities into the PO's cumulative received quantity and updates its status. */
  applyReceivedQuantities(purchaseOrderId: string, acceptedByItem: Record<string, number>): void {
    let patched: PurchaseOrder | undefined;
    this.purchaseOrders.update((orders) =>
      orders.map((po) => {
        if (po.id !== purchaseOrderId) return po;
        const lines = po.lines.map((line) => ({ ...line, receivedQuantity: line.receivedQuantity + (acceptedByItem[line.itemId] ?? 0) }));
        const allReceived = lines.every((line) => line.receivedQuantity >= line.quantity);
        const anyReceived = lines.some((line) => line.receivedQuantity > 0);
        const status: PurchaseOrderStatus = allReceived ? 'received' : anyReceived ? 'partially_received' : po.status;
        patched = { ...po, lines, status };
        return patched;
      }),
    );
    if (patched) this.purchaseOrdersStore.upsert(patched, (po) => ({ status: po.status, supplier_id: po.supplierId }));
  }
}
