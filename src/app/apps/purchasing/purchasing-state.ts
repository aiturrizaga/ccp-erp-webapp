import { Injectable, signal } from '@angular/core';
import { PURCHASE_ORDERS, QUOTATIONS } from '@core/mock-data';
import { PurchaseOrder, PurchaseOrderLine, PurchaseRequisition, Quotation, QuotationLine } from '@core/models';

const TODAY = '2026-08-23';

/**
 * Mutable in-memory copy of the purchasing fixtures so contextual actions (generate quotation from
 * a requisition, award a quotation into a purchase order) can append new documents without touching
 * the shared fixture arrays. No persistence — resets on reload.
 */
@Injectable({ providedIn: 'root' })
export class PurchasingState {
  readonly quotations = signal<Quotation[]>([...QUOTATIONS]);
  readonly purchaseOrders = signal<PurchaseOrder[]>([...PURCHASE_ORDERS]);

  private nextQuotationSeq = QUOTATIONS.length + 1;
  private nextPurchaseOrderSeq = PURCHASE_ORDERS.length + 1;

  createQuotationFromRequisition(requisition: PurchaseRequisition): Quotation {
    const seq = this.nextQuotationSeq++;
    const quotation: Quotation = {
      id: `QT-${String(seq).padStart(3, '0')}`,
      number: `COT-2026-${String(100 + seq).padStart(4, '0')}`,
      requisitionId: requisition.id,
      status: 'draft',
      createdAt: TODAY,
      dueDate: TODAY,
      lines: requisition.lines.map<QuotationLine>((line) => ({
        itemId: line.itemId,
        quantity: line.quantity,
        unitOfMeasure: line.unitOfMeasure,
        offers: [],
      })),
    };
    this.quotations.update((quotations) => [...quotations, quotation]);
    return quotation;
  }

  awardQuotationToSupplier(quotation: Quotation, supplierId: string): PurchaseOrder {
    const lines = quotation.lines
      .map<PurchaseOrderLine | null>((line) => {
        const offer = line.offers.find((o) => o.supplierId === supplierId);
        if (!offer) return null;
        return { itemId: line.itemId, quantity: line.quantity, receivedQuantity: 0, unitOfMeasure: line.unitOfMeasure, unitPrice: offer.unitPrice };
      })
      .filter((line): line is PurchaseOrderLine => line !== null);

    const referenceOffer = quotation.lines.flatMap((l) => l.offers).find((o) => o.supplierId === supplierId);

    const seq = this.nextPurchaseOrderSeq++;
    const order: PurchaseOrder = {
      id: `PO-${String(seq).padStart(3, '0')}`,
      number: `OC-2026-${String(600 + seq).padStart(4, '0')}`,
      quotationId: quotation.id,
      supplierId,
      status: 'draft',
      currency: referenceOffer?.currency ?? 'PEN',
      exchangeRate: 1,
      paymentTerms: referenceOffer?.paymentTerms ?? '',
      issuedAt: TODAY,
      committedDeliveryDate: TODAY,
      committedDeliveryTime: '09:00',
      plant: 'Planta Lima',
      termsAndConditions: '',
      penalties: '',
      warranty: '',
      notes: `Generada desde adjudicación de ${quotation.number}.`,
      lines,
    };

    this.purchaseOrders.update((orders) => [...orders, order]);

    this.quotations.update((quotations) =>
      quotations.map((q) => (q.id === quotation.id ? { ...q, status: 'awarded' as const, awardedSupplierId: supplierId } : q)),
    );

    return order;
  }
}
