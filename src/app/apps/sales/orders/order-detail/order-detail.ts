import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmPopoverImports } from '@ui/popover';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { toast } from '@shared/toast';
import { SalesOrderStatus, SALES_ORDER_STATUS_LABEL, SALES_ORDER_STATUS_TONE, SalesInvoice, Tone } from '@core/models';
import { salesOrders } from '../../sales-state';
import { InvoicingState } from '../../../finance/invoicing-state';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, DecimalPipe, ...HlmButtonImports, ...HlmCardImports, ...HlmPopoverImports, EntityHeader, EmptyState],
  templateUrl: './order-detail.html',
})
export class OrderDetail {
  private readonly router = inject(Router);
  private readonly invoicingState = inject(InvoicingState);

  readonly id = input.required<string>();

  protected readonly order = computed(() => salesOrders().find((o) => o.id === this.id()));

  protected readonly canRegisterDispatch = computed(() => {
    const status = this.order()?.status;
    return status === 'confirmed' || status === 'preparing';
  });

  protected readonly canIssueInvoice = computed(() => this.order()?.status === 'dispatched');

  protected statusLabel(status: SalesOrderStatus): string {
    return SALES_ORDER_STATUS_LABEL[status];
  }

  protected statusTone(status: SalesOrderStatus): Tone {
    return SALES_ORDER_STATUS_TONE[status];
  }

  protected readonly dispatchPopover = signal<'open' | 'closed'>('closed');
  protected readonly invoicePopover = signal<'open' | 'closed'>('closed');

  protected registerDispatch(): void {
    const order = this.order();
    if (!order) return;
    this.dispatchPopover.set('closed');
    salesOrders.update((orders) => orders.map((o) => (o.id === order.id ? { ...o, status: 'dispatched' } : o)));
    toast.success(`${order.number} despachado`);
  }

  protected issueInvoice(): void {
    const order = this.order();
    if (!order) return;
    this.invoicePopover.set('closed');

    const taxRate = 0.18;
    const subtotal = order.total;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;
    const invoiceSeq = order.id.replace(/\D/g, '').padStart(5, '0');

    const invoice: SalesInvoice = {
      id: `INV-S-${invoiceSeq}`,
      number: `F002-${invoiceSeq}`,
      documentType: 'sales',
      status: 'issued',
      issuedAt: '2026-08-23',
      dueDate: '2026-09-22',
      currency: order.currency,
      customerName: order.customerName,
      salesOrderId: order.id,
      lines: order.lines.map((line) => ({
        description: `${line.productCode} — ${line.description}`,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        subtotal: line.quantity * line.unitPrice,
      })),
      subtotal,
      taxAmount,
      total,
      paidAmount: 0,
      outstandingBalance: total,
    };

    this.invoicingState.addInvoice(invoice);
    salesOrders.update((orders) => orders.map((o) => (o.id === order.id ? { ...o, status: 'invoiced' } : o)));
    toast.success(`Factura ${invoice.number} emitida`, { description: order.customerName });
    this.router.navigate(['/apps/finance/invoices', invoice.id]);
  }
}
