import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { PRODUCTION_ORDERS, WORK_SHEETS, OUTPUT_BUNDLES, PRODUCTS } from '@core/mock-data';
import { PRODUCTION_ORDER_STATUS_LABEL } from '@core/models';

const OUTPUT_BUNDLES_PENDING_SIGNATURE = new Set(['preparing', 'lot_selected']);

/** App-level analytics for Producción — order progress, at-risk work sheets and pending signatures. */
@Component({
  selector: 'app-production-dashboard',
  imports: [RouterLink, ...HlmCardImports, StatCard],
  templateUrl: './dashboard.html',
})
export class ProductionDashboard {
  private readonly router = inject(Router);

  protected readonly ordersInProgress = computed(() => PRODUCTION_ORDERS.filter((o) => o.status === 'in_progress').length);

  protected readonly worksheetsAtRisk = computed(() => WORK_SHEETS.filter((ws) => ws.atRisk));

  protected readonly ordersCompleted = computed(() => PRODUCTION_ORDERS.filter((o) => o.status === 'completed').length);

  protected readonly bundlesPendingSignature = computed(() => OUTPUT_BUNDLES.filter((b) => OUTPUT_BUNDLES_PENDING_SIGNATURE.has(b.status)).length);

  protected readonly ordersInCourse = computed(() => PRODUCTION_ORDERS.filter((o) => o.status === 'in_progress' || o.status === 'preparing' || o.status === 'released'));

  protected productName(productId: string): string {
    return PRODUCTS.find((p) => p.id === productId)?.name ?? productId;
  }

  protected statusLabel(status: string): string {
    return PRODUCTION_ORDER_STATUS_LABEL[status as keyof typeof PRODUCTION_ORDER_STATUS_LABEL] ?? status;
  }

  protected goToWorkSheet(id: string): void {
    this.router.navigate(['/apps/production/work-sheets', id]);
  }

  protected goToProductionOrder(id: string): void {
    this.router.navigate(['/apps/production/production-orders', id]);
  }
}
