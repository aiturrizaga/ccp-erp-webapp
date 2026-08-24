import { signal } from '@angular/core';
import { Currency, SalesOrder, SalesQuotation } from '@core/models';
import { SALES_ORDERS, SALES_QUOTATIONS } from '@core/mock-data';

/**
 * In-memory mutable store for sales orders/quotations, scoped to this App only.
 * Lets "Confirmar venta" append a new SalesOrder created from an accepted quotation, and
 * "Generar cotización" (from a CRM Opportunity) append a new SalesQuotation, without touching
 * the read-only fixture arrays. No persistence — resets on reload.
 */
export const salesOrders = signal<SalesOrder[]>([...SALES_ORDERS]);
export const salesQuotations = signal<SalesQuotation[]>([...SALES_QUOTATIONS]);

let nextOrderSeq = SALES_ORDERS.length + 1;
let nextQuotationSeq = SALES_QUOTATIONS.length + 1;

export function createQuotationFromOpportunity(opportunity: {
  id: string;
  customerId: string;
  customerName: string;
  expectedAmount: number;
  currency: Currency;
}): SalesQuotation {
  const seq = nextQuotationSeq++;
  const quotation: SalesQuotation = {
    id: `SQ-${String(seq).padStart(3, '0')}`,
    number: `COT-2026-${String(600 + seq).padStart(4, '0')}`,
    customerId: opportunity.customerId,
    customerName: opportunity.customerName,
    status: 'draft',
    currency: opportunity.currency,
    issuedAt: '2026-08-23',
    expiresAt: '2026-09-22',
    lines: [{ productCode: 'POR-DEFINIR', description: 'Por definir con el cliente', quantity: 1, unitOfMeasure: 'UND', unitPrice: opportunity.expectedAmount }],
    total: opportunity.expectedAmount,
    opportunityId: opportunity.id,
  };
  salesQuotations.update((quotations) => [...quotations, quotation]);
  return quotation;
}

export function createSalesOrderFromQuotation(quotation: {
  id: string;
  customerId: string;
  customerName: string;
  currency: SalesOrder['currency'];
  total: number;
  lines: SalesOrder['lines'];
}): SalesOrder {
  const seq = nextOrderSeq++;
  const order: SalesOrder = {
    id: `SO-${String(seq).padStart(3, '0')}`,
    number: `PV-2026-${String(500 + seq).padStart(4, '0')}`,
    customerId: quotation.customerId,
    customerName: quotation.customerName,
    quotationId: quotation.id,
    status: 'confirmed',
    currency: quotation.currency,
    confirmedAt: '2026-08-23',
    committedDeliveryDate: '2026-09-10',
    deliveryAddress: 'Por confirmar con el cliente',
    lines: quotation.lines,
    total: quotation.total,
  };
  salesOrders.update((orders) => [...orders, order]);
  return order;
}
