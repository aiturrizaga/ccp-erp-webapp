import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { salesCustomers, salesOrders, salesQuotations } from '../sales-state';
import { SalesOrder } from '@core/models';

const TODAY = new Date('2026-09-01');

/** App-level analytics for Ventas — quotation follow-up, order pipeline, production status and cash-sale collections. */
@Component({
  selector: 'app-sales-dashboard',
  imports: [RouterLink, ...HlmCardImports, StatCard, StatusBadge, DecimalPipe],
  templateUrl: './dashboard.html',
})
export class SalesDashboard {
  private readonly router = inject(Router);

  protected readonly pendingQuotations = computed(() => salesQuotations().filter((q) => q.status === 'sent'));
  protected readonly confirmedOrders = computed(() => salesOrders().filter((o) => o.status === 'confirmed').length);
  protected readonly ordersToDispatch = computed(() => salesOrders().filter((o) => o.status === 'confirmed' || o.status === 'preparing').length);
  protected readonly invoicedTotal = computed(() => salesOrders().filter((o) => o.status === 'invoiced').reduce((sum, o) => sum + o.total, 0));

  /** "Cómo va producción" — HT with a committed delivery date, nearest first, with an alert flag. */
  protected readonly productionRows = computed(() =>
    salesOrders()
      .filter((o) => o.workSheetId && o.committedDeliveryDate && o.status !== 'cancelled' && o.status !== 'invoiced')
      .map((o) => {
        const days = Math.round((new Date(o.committedDeliveryDate).getTime() - TODAY.getTime()) / 86_400_000);
        return { order: o, days, alert: (days < 0 ? 'overdue' : days <= 5 ? 'soon' : 'ok') as 'overdue' | 'soon' | 'ok' };
      })
      .sort((a, b) => a.days - b.days),
  );

  /** Ventas se preocupa por las ventas al contado: pedidos contado sin validar el adelanto. */
  protected readonly cashToCollect = computed(() =>
    salesOrders()
      .filter((o) => o.paymentGate && o.paymentGate.status !== 'validated' && o.paymentGate.status !== 'not_required')
      .map((o) => ({ order: o, gate: o.paymentGate! })),
  );

  protected alertLabel = (a: 'overdue' | 'soon' | 'ok') => (a === 'overdue' ? 'Vencida' : a === 'soon' ? 'Por vencer' : 'En plazo');
  protected alertTone = (a: 'overdue' | 'soon' | 'ok') => (a === 'overdue' ? 'danger' : a === 'soon' ? 'warning' : 'success') as 'danger' | 'warning' | 'success';

  protected customerName = (o: SalesOrder) => salesCustomers().find((c) => c.id === o.customerId)?.legalName ?? o.customerName;

  protected goToQuotation(id: string): void {
    this.router.navigate(['/apps/sales/quotations', id]);
  }
  protected goToOrder(id: string): void {
    this.router.navigate(['/apps/sales/orders', id]);
  }
}
