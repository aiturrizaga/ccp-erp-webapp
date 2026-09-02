import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { salesCustomers, salesOrders } from '@apps/sales/sales-state';
import { InvoicingState } from '@apps/invoicing/invoicing-state';

/** App-level analytics for Cobranzas — credit control, cash-sale collection and overdue receivables. */
@Component({
  selector: 'app-collections-dashboard',
  imports: [RouterLink, ...HlmCardImports, StatCard, StatusBadge, DecimalPipe],
  templateUrl: './dashboard.html',
})
export class CollectionsDashboard {
  private readonly router = inject(Router);
  private readonly state = inject(InvoicingState);

  protected readonly salesReceivables = computed(() =>
    this.state
      .invoices()
      .filter((i): i is Extract<typeof i, { documentType: 'sales' }> => i.documentType === 'sales' && i.outstandingBalance > 0 && i.status !== 'voided'),
  );
  protected readonly receivableTotal = computed(() => this.salesReceivables().reduce((s, i) => s + i.outstandingBalance, 0));
  protected readonly overdueReceivables = computed(() => this.salesReceivables().filter((i) => i.status === 'overdue'));

  /** Clientes con crédito que ya excedieron su línea. */
  protected readonly creditExceeded = computed(() =>
    salesCustomers()
      .filter((c) => c.paymentMode === 'credit' && (c.creditUsed ?? 0) > (c.creditLimit ?? 0) && (c.creditLimit ?? 0) > 0)
      .map((c) => ({ customer: c, over: (c.creditUsed ?? 0) - (c.creditLimit ?? 0) })),
  );

  /** Ventas al contado con adelanto/OC pendiente de validación por Cobranzas. */
  protected readonly advancesToValidate = computed(() =>
    salesOrders()
      .filter((o) => o.paymentGate && (o.paymentGate.status === 'pending_collections' || o.paymentGate.status === 'pending_docs'))
      .map((o) => ({ order: o, gate: o.paymentGate! })),
  );

  /** Pagos reportados sobre facturas, a la espera de validar el voucher. */
  protected readonly paymentsToValidate = computed(() => this.state.pendingPayments());

  protected goToInvoice(id: string): void {
    this.router.navigate(['/apps/invoicing/invoices', id]);
  }
  protected goToOrder(id: string): void {
    this.router.navigate(['/apps/sales/orders', id]);
  }
}
