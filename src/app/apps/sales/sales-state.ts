import { signal } from '@angular/core';
import {
  Contact,
  Currency,
  Customer,
  DOC_PREFIX,
  SalesClaim,
  SalesDecisionRule,
  SalesOrder,
  SalesProduct,
  SalesQuotation,
} from '@core/models';
import {
  CONTACTS,
  CUSTOMERS,
  SALES_CLAIMS,
  SALES_DECISION_RULES,
  SALES_ORDERS,
  SALES_PRODUCTS,
  SALES_QUOTATIONS,
} from '@core/mock-data';
import { TableStore } from '@core/supabase/table-store';

/**
 * Mutable store for the Ventas app. Signals are seeded from the bundled fixtures and, when Supabase
 * is configured, overlaid with (and written back to) real tables — one row per entity, `data` jsonb
 * plus a couple of filter columns, exactly like the Compras app. Everything is prototype-grade: no
 * real transactions, the writes are fire-and-forget upserts.
 */
const TODAY = '2026-09-01';

export const salesOrders = signal<SalesOrder[]>([...SALES_ORDERS]);
export const salesQuotations = signal<SalesQuotation[]>([...SALES_QUOTATIONS]);
export const salesProducts = signal<SalesProduct[]>([...SALES_PRODUCTS]);
export const salesCustomers = signal<Customer[]>([...CUSTOMERS]);
export const salesContacts = signal<Contact[]>([...CONTACTS]);
export const salesClaims = signal<SalesClaim[]>([...SALES_CLAIMS]);
export const salesDecisionRules = signal<SalesDecisionRule[]>([...SALES_DECISION_RULES]);

const productsStore = new TableStore<SalesProduct>('sales_products');
const quotationsStore = new TableStore<SalesQuotation>('sales_quotations');
const ordersStore = new TableStore<SalesOrder>('sales_orders');
const customersStore = new TableStore<Customer>('customers');
const contactsStore = new TableStore<Contact>('customer_contacts');
const claimsStore = new TableStore<SalesClaim>('sales_claims');

let nextOrderSeq = SALES_ORDERS.length + 1;
let nextQuotationSeq = SALES_QUOTATIONS.length + 1;
let nextProductSeq = SALES_PRODUCTS.length + 1;
let nextCustomerSeq = CUSTOMERS.length + 1;
let nextContactSeq = CONTACTS.length + 1;
let nextClaimSeq = SALES_CLAIMS.length + 1;

function hydrate(): void {
  productsStore.fetchAll().then((r) => r?.length && (salesProducts.set(r), (nextProductSeq = r.length + 1)));
  quotationsStore.fetchAll().then((r) => r?.length && (salesQuotations.set(r), (nextQuotationSeq = r.length + 1)));
  ordersStore.fetchAll().then((r) => r?.length && (salesOrders.set(r), (nextOrderSeq = r.length + 1)));
  customersStore.fetchAll().then((r) => r?.length && (salesCustomers.set(r), (nextCustomerSeq = r.length + 1)));
  contactsStore.fetchAll().then((r) => r?.length && (salesContacts.set(r), (nextContactSeq = r.length + 1)));
  claimsStore.fetchAll().then((r) => r?.length && (salesClaims.set(r), (nextClaimSeq = r.length + 1)));
}
hydrate();

function nextNumber(prefixKey: keyof typeof DOC_PREFIX, existing: { number: string }[]): string {
  const prefix = `${DOC_PREFIX[prefixKey]}-2026-`;
  let max = 0;
  for (const row of existing) {
    const n = parseInt(row.number.replace(prefix, ''), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

// --------------------------------------------------------------------------
// Productos
// --------------------------------------------------------------------------

export function createSalesProduct(input: Omit<SalesProduct, 'id'>): SalesProduct {
  const product: SalesProduct = { ...input, id: `SP-${String(nextProductSeq++).padStart(3, '0')}` };
  salesProducts.update((products) => [...products, product]);
  productsStore.upsert(product, (p) => ({ category: p.category, status: p.status }));
  return product;
}

export function updateSalesProduct(id: string, patch: Partial<Omit<SalesProduct, 'id'>>): void {
  let patched: SalesProduct | undefined;
  salesProducts.update((products) => products.map((p) => (p.id === id ? ((patched = { ...p, ...patch }), patched) : p)));
  if (patched) productsStore.upsert(patched, (p) => ({ category: p.category, status: p.status }));
}

// --------------------------------------------------------------------------
// Clientes y contactos
// --------------------------------------------------------------------------

export function createCustomer(input: Omit<Customer, 'id'>): Customer {
  const customer: Customer = { ...input, id: `CUS-${String(nextCustomerSeq++).padStart(3, '0')}` };
  salesCustomers.update((rows) => [...rows, customer]);
  customersStore.upsert(customer, (c) => ({ tax_id: c.taxId, payment_mode: c.paymentMode ?? null }));
  return customer;
}

export function updateCustomer(id: string, patch: Partial<Omit<Customer, 'id'>>): void {
  let patched: Customer | undefined;
  salesCustomers.update((rows) => rows.map((c) => (c.id === id ? ((patched = { ...c, ...patch }), patched) : c)));
  if (patched) customersStore.upsert(patched, (c) => ({ tax_id: c.taxId, payment_mode: c.paymentMode ?? null }));
}

export function addContact(input: Omit<Contact, 'id'>): Contact {
  const contact: Contact = { ...input, id: `CON-${String(nextContactSeq++).padStart(3, '0')}` };
  salesContacts.update((rows) => [...rows, contact]);
  contactsStore.upsert(contact, (c) => ({ customer_id: c.customerId, type: c.type ?? null }));
  return contact;
}

export function updateContact(id: string, patch: Partial<Omit<Contact, 'id'>>): void {
  let patched: Contact | undefined;
  salesContacts.update((rows) => rows.map((c) => (c.id === id ? ((patched = { ...c, ...patch }), patched) : c)));
  if (patched) contactsStore.upsert(patched, (c) => ({ customer_id: c.customerId, type: c.type ?? null }));
}

// --------------------------------------------------------------------------
// Cotizaciones y pedidos
// --------------------------------------------------------------------------

function persistQuotation(q: SalesQuotation): void {
  quotationsStore.upsert(q, (x) => ({ status: x.status, customer_id: x.customerId }));
}
function persistOrder(o: SalesOrder): void {
  ordersStore.upsert(o, (x) => ({ status: x.status, customer_id: x.customerId }));
}

export function saveQuotation(q: SalesQuotation): void {
  salesQuotations.update((rows) => (rows.some((r) => r.id === q.id) ? rows.map((r) => (r.id === q.id ? q : r)) : [...rows, q]));
  persistQuotation(q);
}

export function saveOrder(o: SalesOrder): void {
  salesOrders.update((rows) => (rows.some((r) => r.id === o.id) ? rows.map((r) => (r.id === o.id ? o : r)) : [...rows, o]));
  persistOrder(o);
}

export function createQuotation(input: {
  customerId: string;
  customerName: string;
  currency: Currency;
  lines: SalesQuotation['lines'];
  glosa?: string;
  notes?: string;
}): SalesQuotation {
  const seq = nextQuotationSeq++;
  const total = input.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const quotation: SalesQuotation = {
    id: `SQ-${String(seq).padStart(3, '0')}`,
    number: nextNumber('sales_quotation', salesQuotations()),
    customerId: input.customerId,
    customerName: input.customerName,
    status: 'draft',
    currency: input.currency,
    issuedAt: TODAY,
    expiresAt: TODAY,
    lines: input.lines,
    total,
    notes: input.notes,
  };
  saveQuotation(quotation);
  return quotation;
}

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
    number: nextNumber('sales_quotation', salesQuotations()),
    customerId: opportunity.customerId,
    customerName: opportunity.customerName,
    status: 'draft',
    currency: opportunity.currency,
    issuedAt: TODAY,
    expiresAt: TODAY,
    lines: [{ productCode: 'POR-DEFINIR', description: 'Por definir con el cliente', quantity: 1, unitOfMeasure: 'UND', unitPrice: opportunity.expectedAmount }],
    total: opportunity.expectedAmount,
    opportunityId: opportunity.id,
  };
  saveQuotation(quotation);
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
  const customer = salesCustomers().find((c) => c.id === quotation.customerId);
  const cashSale = customer?.paymentMode === 'cash';
  const order: SalesOrder = {
    id: `SO-${String(seq).padStart(3, '0')}`,
    number: nextNumber('sales_order', salesOrders()),
    customerId: quotation.customerId,
    customerName: quotation.customerName,
    quotationId: quotation.id,
    status: 'confirmed',
    currency: quotation.currency,
    confirmedAt: TODAY,
    committedDeliveryDate: TODAY,
    deliveryAddress: customer?.address ?? 'Por confirmar con el cliente',
    lines: quotation.lines,
    total: quotation.total,
    workSheetId: `HT-2026-${String(1000 + seq).slice(1)}`,
    paymentGate: cashSale
      ? { status: 'pending_docs', advancePct: 50 }
      : { status: 'not_required', advancePct: 0 },
  };
  saveOrder(order);
  return order;
}

// --------------------------------------------------------------------------
// Reclamos
// --------------------------------------------------------------------------

export function createClaim(input: {
  order: SalesOrder;
  defectType: SalesClaim['defectType'];
  description: string;
  evidence: SalesClaim['evidence'];
  createdBy: string;
}): SalesClaim {
  const seq = nextClaimSeq++;
  const claim: SalesClaim = {
    id: `SCL-${String(seq).padStart(3, '0')}`,
    number: nextNumber('sales_claim', salesClaims()),
    salesOrderId: input.order.id,
    salesOrderNumber: input.order.number,
    customerId: input.order.customerId,
    customerName: input.order.customerName,
    defectType: input.defectType,
    description: input.description,
    evidence: input.evidence,
    status: 'open',
    resolution: 'pendiente',
    createdBy: input.createdBy,
    createdAt: TODAY,
    history: [{ at: TODAY, action: 'Reclamo registrado', by: input.createdBy }],
  };
  salesClaims.update((rows) => [...rows, claim]);
  claimsStore.upsert(claim, (c) => ({ status: c.status, sales_order_id: c.salesOrderId }));

  const order = { ...input.order, claimIds: [...(input.order.claimIds ?? []), claim.id] };
  saveOrder(order);
  return claim;
}

export function updateClaim(id: string, patch: Partial<Omit<SalesClaim, 'id'>>): void {
  let patched: SalesClaim | undefined;
  salesClaims.update((rows) => rows.map((c) => (c.id === id ? ((patched = { ...c, ...patch }), patched) : c)));
  if (patched) claimsStore.upsert(patched, (c) => ({ status: c.status, sales_order_id: c.salesOrderId }));
}
