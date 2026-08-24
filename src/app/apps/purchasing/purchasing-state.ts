import { Injectable, signal } from '@angular/core';
import { loadPersistedState, persistState } from '@core/supabase/state-persistence';
import { PURCHASE_ORDERS, PURCHASE_REQUISITIONS, QUOTATIONS, SUPPLIERS } from '@core/mock-data';
import {
  Currency,
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderStatus,
  PurchaseRequisition,
  PurchaseRequisitionLine,
  Quotation,
  QuotationLine,
  QuotationOffer,
  RequisitionPriority,
  Supplier,
  SupplierClass,
} from '@core/models';

const TODAY = '2026-08-23';

interface PurchasingSnapshot {
  requisitions: PurchaseRequisition[];
  quotations: Quotation[];
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
}

/**
 * Mutable in-memory copy of the purchasing fixtures so contextual actions (generate quotation from
 * a requisition, award a quotation into a purchase order, Almacén editing an auto-generated
 * requisition) can append/mutate documents without touching the shared fixture arrays. No
 * persistence — resets on reload.
 */
@Injectable({ providedIn: 'root' })
export class PurchasingState {
  readonly requisitions = signal<PurchaseRequisition[]>([...PURCHASE_REQUISITIONS]);
  readonly quotations = signal<Quotation[]>([...QUOTATIONS]);
  readonly purchaseOrders = signal<PurchaseOrder[]>([...PURCHASE_ORDERS]);
  readonly suppliers = signal<Supplier[]>([...SUPPLIERS]);

  private nextQuotationSeq = QUOTATIONS.length + 1;
  private nextPurchaseOrderSeq = PURCHASE_ORDERS.length + 1;
  private nextSupplierSeq = SUPPLIERS.length + 1;

  constructor() {
    loadPersistedState<PurchasingSnapshot>('purchasing').then((snapshot) => {
      if (!snapshot) return;
      this.requisitions.set(snapshot.requisitions);
      this.quotations.set(snapshot.quotations);
      this.purchaseOrders.set(snapshot.purchaseOrders);
      this.suppliers.set(snapshot.suppliers);
      this.nextQuotationSeq = snapshot.quotations.length + 1;
      this.nextPurchaseOrderSeq = snapshot.purchaseOrders.length + 1;
      this.nextSupplierSeq = snapshot.suppliers.length + 1;
    });
    persistState<PurchasingSnapshot>('purchasing', () => ({
      requisitions: this.requisitions(),
      quotations: this.quotations(),
      purchaseOrders: this.purchaseOrders(),
      suppliers: this.suppliers(),
    }));
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
    return supplier;
  }

  private updateRequisition(id: string, patch: (r: PurchaseRequisition) => PurchaseRequisition): void {
    this.requisitions.update((rows) => rows.map((r) => (r.id === id ? patch(r) : r)));
  }

  private nextRequisitionNumber(): string {
    let max = 0;
    for (const r of this.requisitions()) {
      const n = parseInt(r.number.replace('SC-2026-', ''), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
    return `SC-2026-${String(max + 1).padStart(4, '0')}`;
  }

  /** Almacén (or another area) manually files a requisition that isn't tied to a Hoja de Trabajo — starts as a draft, same as an auto-generated one. */
  createRequisition(input: {
    origin: PurchaseRequisition['origin'];
    requestedBy: string;
    area: string;
    plant: string;
    priority: RequisitionPriority;
    neededBy: string;
    note?: string;
    lines: PurchaseRequisitionLine[];
  }): PurchaseRequisition {
    const seq = this.requisitions().length + 1;
    const requisition: PurchaseRequisition = {
      id: `PR-${String(seq).padStart(3, '0')}`,
      number: this.nextRequisitionNumber(),
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
    };
    this.requisitions.update((rows) => [...rows, requisition]);
    return requisition;
  }

  updateLineQuantity(requisitionId: string, lineIndex: number, quantity: number): void {
    this.updateRequisition(requisitionId, (r) => ({
      ...r,
      lines: r.lines.map((line, i) => (i === lineIndex ? { ...line, quantity } : line)),
    }));
  }

  addLine(requisitionId: string, line: PurchaseRequisitionLine): void {
    this.updateRequisition(requisitionId, (r) => ({ ...r, lines: [...r.lines, { ...line, addedManually: true }] }));
  }

  removeLine(requisitionId: string, lineIndex: number): void {
    this.updateRequisition(requisitionId, (r) => ({ ...r, lines: r.lines.filter((_, i) => i !== lineIndex) }));
  }

  setLineNotNeeded(requisitionId: string, lineIndex: number, notNeeded: boolean): void {
    this.updateRequisition(requisitionId, (r) => ({
      ...r,
      lines: r.lines.map((line, i) => (i === lineIndex ? { ...line, notNeeded } : line)),
    }));
  }

  updateNote(requisitionId: string, note: string): void {
    this.updateRequisition(requisitionId, (r) => ({ ...r, note }));
  }

  submitForApproval(requisitionId: string): void {
    this.updateRequisition(requisitionId, (r) => ({ ...r, status: 'pending_approval' as const }));
  }

  /** Logística approves a requisition Almacén submitted, clearing it for sourcing/quotation. */
  approveRequisition(requisitionId: string): void {
    this.updateRequisition(requisitionId, (r) => ({ ...r, status: 'approved' as const }));
  }

  /** Logística sends a requisition back to Almacén for changes instead of approving it. */
  observeRequisition(requisitionId: string): void {
    this.updateRequisition(requisitionId, (r) => ({ ...r, status: 'draft' as const }));
  }

  createQuotationFromRequisition(requisition: PurchaseRequisition): Quotation {
    const seq = this.nextQuotationSeq++;
    const quotation: Quotation = {
      id: `QT-${String(seq).padStart(3, '0')}`,
      number: `COT-2026-${String(100 + seq).padStart(4, '0')}`,
      requisitionId: requisition.id,
      status: 'draft',
      createdAt: TODAY,
      dueDate: TODAY,
      lines: requisition.lines
        .filter((line) => !line.notNeeded)
        .map<QuotationLine>((line) => ({
          itemId: line.itemId,
          quantity: line.quantity,
          unitOfMeasure: line.unitOfMeasure,
          offers: [],
        })),
    };
    this.quotations.update((quotations) => [...quotations, quotation]);
    return quotation;
  }

  /** Conie marks an RFQ as sent once she's requested quotes from suppliers, before any offers come back. */
  markQuotationSent(quotationId: string): void {
    this.quotations.update((quotations) => quotations.map((q) => (q.id === quotationId ? { ...q, status: 'sent' as const } : q)));
  }

  /** Conie registers a supplier's quotation received by phone/email as a manual offer, attaching the PDF she received as evidence. */
  addOfferToLine(quotationId: string, itemId: string, offer: QuotationOffer): void {
    this.quotations.update((quotations) =>
      quotations.map((q) =>
        q.id !== quotationId
          ? q
          : {
              ...q,
              status: q.status === 'draft' || q.status === 'sent' ? ('received' as const) : q.status,
              lines: q.lines.map((line) => (line.itemId === itemId ? { ...line, offers: [...line.offers, offer] } : line)),
            },
      ),
    );
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

    const orders: PurchaseOrder[] = [];
    for (const [supplierId, entries] of linesBySupplier) {
      const referenceOffer = entries[0].offer;
      const seq = this.nextPurchaseOrderSeq++;
      orders.push({
        id: `PO-${String(seq).padStart(3, '0')}`,
        number: `OC-2026-${String(600 + seq).padStart(4, '0')}`,
        quotationId: quotation.id,
        supplierId,
        status: 'draft',
        currency: referenceOffer.currency,
        exchangeRate: 1,
        paymentTerms: referenceOffer.paymentTerms,
        issuedAt: TODAY,
        committedDeliveryDate: TODAY,
        committedDeliveryTime: '09:00',
        plant: 'Planta Lima',
        termsAndConditions: '',
        penalties: '',
        warranty: '',
        notes: `Generada desde adjudicación de ${quotation.number}.`,
        lines: entries.map((e) => e.orderLine),
      });
    }

    this.purchaseOrders.update((orders_) => [...orders_, ...orders]);

    const distinctSuppliers = [...linesBySupplier.keys()];
    this.quotations.update((quotations) =>
      quotations.map((q) =>
        q.id !== quotation.id
          ? q
          : {
              ...q,
              status: 'awarded' as const,
              awardedSupplierId: distinctSuppliers.length === 1 ? distinctSuppliers[0] : undefined,
              lines: q.lines.map((line) => ({
                ...line,
                offers: line.offers.map((o) => ({ ...o, selected: winners[line.itemId] === o.supplierId })),
              })),
            },
      ),
    );

    return orders;
  }

  /** Almacén confirmed a goods receipt — rolls the accepted quantities into the PO's cumulative received quantity and updates its status. */
  applyReceivedQuantities(purchaseOrderId: string, acceptedByItem: Record<string, number>): void {
    this.purchaseOrders.update((orders) =>
      orders.map((po) => {
        if (po.id !== purchaseOrderId) return po;
        const lines = po.lines.map((line) => ({ ...line, receivedQuantity: line.receivedQuantity + (acceptedByItem[line.itemId] ?? 0) }));
        const allReceived = lines.every((line) => line.receivedQuantity >= line.quantity);
        const anyReceived = lines.some((line) => line.receivedQuantity > 0);
        const status: PurchaseOrderStatus = allReceived ? 'received' : anyReceived ? 'partially_received' : po.status;
        return { ...po, lines, status };
      }),
    );
  }
}
