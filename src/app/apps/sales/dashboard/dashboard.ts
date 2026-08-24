import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { salesOrders, salesQuotations } from '../sales-state';

/** App-level analytics for Ventas — quotation follow-up, order pipeline and invoicing totals. */
@Component({
  selector: 'app-sales-dashboard',
  imports: [RouterLink, ...HlmCardImports, StatCard, DecimalPipe],
  templateUrl: './dashboard.html',
})
export class SalesDashboard {
  private readonly router = inject(Router);

  protected readonly pendingQuotations = computed(() => salesQuotations().filter((q) => q.status === 'sent'));

  protected readonly confirmedOrders = computed(() => salesOrders().filter((o) => o.status === 'confirmed').length);

  protected readonly ordersToDispatch = computed(() => salesOrders().filter((o) => o.status === 'confirmed' || o.status === 'preparing').length);

  protected readonly invoicedTotal = computed(() => salesOrders().filter((o) => o.status === 'invoiced').reduce((sum, o) => sum + o.total, 0));

  protected goToQuotation(id: string): void {
    this.router.navigate(['/apps/sales/quotations', id]);
  }
}
