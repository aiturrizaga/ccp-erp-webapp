import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { toast } from '@shared/toast';
import { salesCustomers, salesOrders } from '@apps/sales/sales-state';
import { InvoicingState } from '../../invoicing-state';
import { COMPROBANTE_KIND_LABEL, ComprobanteKind, Currency, PAYMENT_CONDITION_LABEL, PaymentCondition } from '@core/models';

interface DraftLine {
  description: string;
  quantity: number;
  unitPrice: number;
}

@Component({
  selector: 'app-invoice-create',
  imports: [FormsModule, DecimalPipe, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, EntityHeader],
  templateUrl: './invoice-create.html',
})
export class InvoiceCreate {
  private readonly router = inject(Router);
  private readonly state = inject(InvoicingState);

  protected readonly docKind = signal<ComprobanteKind>('factura');
  protected readonly orderId = signal('');
  protected readonly customerName = signal('');
  protected readonly customerTaxId = signal('');
  protected readonly currency = signal<Currency>('PEN');
  protected readonly glosa = signal('');
  protected readonly paymentCondition = signal<PaymentCondition>('contado');
  protected readonly earlyPaymentDiscountPct = signal(0);
  protected readonly withInstallments = signal(false);
  protected readonly installmentCount = signal(3);
  protected readonly lines = signal<DraftLine[]>([{ description: '', quantity: 1, unitPrice: 0 }]);

  protected readonly orders = computed(() => salesOrders().filter((o) => o.status !== 'cancelled'));
  protected readonly kindOptions = (['factura', 'boleta'] as ComprobanteKind[]).map((value) => ({ value, label: COMPROBANTE_KIND_LABEL[value] }));

  protected readonly subtotal = computed(() => this.lines().reduce((s, l) => s + l.quantity * l.unitPrice, 0));
  protected readonly discount = computed(() => (this.subtotal() * this.earlyPaymentDiscountPct()) / 100);
  protected readonly taxable = computed(() => this.subtotal() - this.discount());
  protected readonly igv = computed(() => this.taxable() * 0.18);
  protected readonly total = computed(() => this.taxable() + this.igv());
  protected readonly canSubmit = computed(() => this.customerName().trim().length > 0 && this.subtotal() > 0);

  protected kindToString = (v: string) => COMPROBANTE_KIND_LABEL[v as ComprobanteKind] ?? v;
  protected condToString = (v: string) => PAYMENT_CONDITION_LABEL[v as PaymentCondition] ?? v;
  protected currencyToString = (v: string) => (v === 'PEN' ? 'Soles (PEN)' : 'Dólares (USD)');
  protected orderToString = (v: string) => this.orders().find((o) => o.id === v)?.number ?? 'Sin pedido (comprobante libre)';

  protected onOrderChange(id: string): void {
    this.orderId.set(id);
    const order = this.orders().find((o) => o.id === id);
    if (!order) return;
    const cust = salesCustomers().find((c) => c.id === order.customerId);
    this.customerName.set(order.customerName);
    this.customerTaxId.set(cust?.taxId ?? '');
    this.currency.set(order.currency);
    this.glosa.set(order.glosa ?? '');
    this.paymentCondition.set(cust?.paymentMode === 'cash' ? 'contado' : 'credito');
    this.lines.set(order.lines.map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice })));
  }

  protected setLine(i: number, patch: Partial<DraftLine>): void {
    this.lines.update((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  protected addLine(): void {
    this.lines.update((rows) => [...rows, { description: '', quantity: 1, unitPrice: 0 }]);
  }
  protected removeLine(i: number): void {
    this.lines.update((rows) => rows.filter((_, idx) => idx !== i));
  }

  protected submit(): void {
    if (!this.canSubmit()) return;
    const installments =
      this.withInstallments() && !this.orderIsAdvance()
        ? Array.from({ length: this.installmentCount() }, (_, i) => ({ number: i + 1, dueDate: '2026-10-01', amount: this.total() / this.installmentCount(), paid: false }))
        : undefined;

    const invoice = this.state.createFreeInvoice({
      status: 'issued',
      customerName: this.customerName().trim(),
      customerTaxId: this.customerTaxId().trim() || undefined,
      salesOrderId: this.orderId() || undefined,
      issuedAt: '2026-09-01',
      dueDate: '2026-09-30',
      currency: this.currency(),
      lines: this.lines().map((l) => ({ description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, subtotal: l.quantity * l.unitPrice })),
      subtotal: this.taxable(),
      taxAmount: this.igv(),
      total: this.total(),
      paidAmount: 0,
      outstandingBalance: this.total(),
      docKind: this.docKind(),
      glosa: this.glosa().trim() || undefined,
      paymentCondition: this.paymentCondition(),
      earlyPaymentDiscountPct: this.earlyPaymentDiscountPct() || undefined,
      installments,
      sunatTotals: {
        gravado: this.taxable(), inafecto: 0, exonerado: 0, exportacion: 0,
        descuentos: this.discount(), gratuitos: 0, igv: this.igv(), isc: 0, anticipos: 0, importeTotal: this.total(),
      },
    });
    toast.success(`${COMPROBANTE_KIND_LABEL[this.docKind()]} ${invoice.number} emitida`);
    this.router.navigate(['/apps/invoicing/invoices', invoice.id]);
  }

  private orderIsAdvance(): boolean {
    return false;
  }

  protected cancel(): void {
    this.router.navigate(['/apps/invoicing/invoices']);
  }
}
