import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { salesOrders } from '@apps/sales/sales-state';
import { InvoicingState } from '../invoicing-state';
import { newestFirst } from '@core/utils/sort';
import { SALES_ORDER_STATUS_LABEL, SALES_ORDER_STATUS_TONE, SalesOrder, Tone } from '@core/models';

@Component({
  selector: 'app-finance-sales-order-list',
  imports: [DecimalPipe, NgIcon, ...HlmButtonImports, ...HlmCardImports, ListToolbar, DataTable, StatusBadge],
  templateUrl: './sales-order-list.html',
})
export class FinanceSalesOrderList {
  private readonly router = inject(Router);
  private readonly state = inject(InvoicingState);

  protected readonly search = signal('');
  protected readonly orders = salesOrders;

  protected readonly columns: DataTableColumn[] = [
    { key: 'number', header: 'Orden de venta', width: '150px' },
    { key: 'customerName', header: 'Cliente' },
    { key: 'customerOrder', header: 'OC cliente', width: '150px' },
    { key: 'guide', header: 'Guía', width: '150px' },
    { key: 'total', header: 'Total', width: '120px', align: 'end' },
    { key: 'status', header: 'Estado', width: '150px' },
    { key: 'action', header: '', width: '130px' },
  ];

  protected readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const list = this.orders().filter((order) => {
      if (!this.isInvoiceable(order)) return false;
      const invoice = this.invoiceFor(order.id);
      if (invoice) return false;
      return !term || [order.number, order.customerName, order.customerOrderDocumentNumber ?? '', order.id]
        .some((v) => v.toLowerCase().includes(term));
    });
    return newestFirst(list);
  });

  protected readonly invoiceableCount = computed(() => this.orders().filter((o) => this.isInvoiceable(o) && !this.invoiceFor(o.id)).length);

  protected isInvoiceable(order: SalesOrder): boolean {
    return ['partially_dispatched', 'dispatched', 'finished'].includes(order.status) || order.lines.some((l) => (l.dispatchedQuantity ?? 0) > 0);
  }

  private invoiceFor(orderId: string) {
    return this.state.invoices().find((i) => i.documentType === 'sales' && i.salesOrderId === orderId && !i.isAdvanceInvoice && i.status !== 'voided');
  }

  protected statusLabel(status: SalesOrder['status']): string { return SALES_ORDER_STATUS_LABEL[status]; }
  protected statusTone(status: SalesOrder['status']): Tone { return SALES_ORDER_STATUS_TONE[status]; }

  protected guideNumber(order: SalesOrder): string {
    const guide = this.state.guides().find((g) => g.salesOrderId === order.id && g.status === 'delivered');
    return guide?.number ?? '—';
  }

  protected customerOrder(order: SalesOrder): string { return order.customerOrderDocumentNumber ?? '—'; }

  protected invoice(order: SalesOrder): void {
    this.router.navigate(['/apps/finance/invoices/new'], { queryParams: { orderId: order.id } });
  }

  protected openOrder(order: SalesOrder): void {
    this.router.navigate(['/apps/sales/orders', order.id]);
  }

  protected clearSearch(): void { this.search.set(''); }
}
