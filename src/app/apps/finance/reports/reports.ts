import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { InvoicingState } from '../invoicing-state';
import { salesOrders } from '@apps/sales/sales-state';
import { toast } from '@shared/toast';

@Component({
  selector: 'app-finance-reports',
  imports: [DecimalPipe, RouterLink, ...HlmButtonImports, StatCard, StatusBadge],
  templateUrl: './reports.html',
})
export class FinanceReports {
  private readonly state = inject(InvoicingState);

  protected readonly salesInvoices = computed(() => this.state.invoices().filter((i) => i.documentType === 'sales'));
  protected readonly salesTotal = computed(() => this.salesInvoices().filter((i) => i.status !== 'voided').reduce((s, i) => s + i.total, 0));
  protected readonly receivable = computed(() => this.salesInvoices().reduce((s, i) => s + i.outstandingBalance, 0));
  protected readonly overdue = computed(() => this.salesInvoices().filter((i) => i.status === 'overdue'));
  protected readonly deliveredGuides = computed(() => this.state.guides().filter((g) => g.status === 'delivered'));
  protected readonly unbilledGuides = computed(() => this.state.billingQueue());
  protected readonly billedGuides = computed(() => this.deliveredGuides().filter((g) => !!g.generatedInvoiceId));
  protected readonly cashCredit = computed(() => {
    const rows = this.salesInvoices();
    return { contado: rows.filter((i) => i.paymentCondition === 'contado').length, credito: rows.filter((i) => i.paymentCondition === 'credito').length };
  });
  protected readonly orderControl = computed(() => salesOrders().filter((o) => o.status !== 'cancelled').map((o) => ({ order: o, dispatched: o.lines.reduce((s, l) => s + (l.dispatchedQuantity ?? 0), 0), requested: o.lines.reduce((s, l) => s + l.quantity, 0), invoiced: this.salesInvoices().some((i) => i.salesOrderId === o.id) })));

  protected exportReport(name: string): void {
    toast.success(`Reporte preparado: ${name}`, { description: 'En el ERP real se descargará en Excel/PDF.' });
  }
}
