import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { OUTPUT_BUNDLES, PRODUCTS } from '@core/mock-data';
import { workSheetStatus } from '@core/models';
import { ProductionState } from '../production-state';

const OUTPUT_BUNDLES_PENDING_SIGNATURE = new Set(['preparing', 'lot_selected']);

/** App-level analytics for Producción — HT progress, work sheets en riesgo y bolsas pendientes de firma. */
@Component({
  selector: 'app-production-dashboard',
  imports: [RouterLink, ...HlmCardImports, StatCard],
  templateUrl: './dashboard.html',
})
export class ProductionDashboard {
  private readonly router = inject(Router);
  private readonly productionState = inject(ProductionState);

  protected readonly workSheetsInProgress = computed(() => this.productionState.workSheets().filter((ws) => workSheetStatus(ws) === 'in_progress'));

  protected readonly worksheetsAtRisk = computed(() => this.productionState.workSheets().filter((ws) => ws.atRisk));

  protected readonly workSheetsCompleted = computed(() => this.productionState.workSheets().filter((ws) => workSheetStatus(ws) === 'completed').length);

  protected readonly bundlesPendingSignature = computed(() => OUTPUT_BUNDLES.filter((b) => OUTPUT_BUNDLES_PENDING_SIGNATURE.has(b.status)).length);

  protected productName(productId: string): string {
    return PRODUCTS.find((p) => p.id === productId)?.name ?? productId;
  }

  protected goToWorkSheet(id: string): void {
    this.router.navigate(['/apps/production/work-sheets', id]);
  }
}
