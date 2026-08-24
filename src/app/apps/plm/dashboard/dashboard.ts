import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { PRODUCTS, BILLS_OF_MATERIALS } from '@core/mock-data';

/** App-level analytics for PLM — product catalog and BOM lifecycle health. */
@Component({
  selector: 'app-plm-dashboard',
  imports: [RouterLink, ...HlmCardImports, StatCard],
  templateUrl: './dashboard.html',
})
export class PlmDashboard {
  private readonly router = inject(Router);

  protected readonly activeProducts = computed(() => PRODUCTS.filter((p) => p.status === 'active').length);

  protected readonly activeBoms = computed(() => BILLS_OF_MATERIALS.filter((b) => b.status === 'active').length);

  protected readonly draftBoms = computed(() => BILLS_OF_MATERIALS.filter((b) => b.status === 'draft'));

  protected readonly expiredBoms = computed(() => BILLS_OF_MATERIALS.filter((b) => b.status === 'expired').length);

  protected productName(productId: string): string {
    return PRODUCTS.find((p) => p.id === productId)?.name ?? productId;
  }

  protected goToBom(id: string): void {
    this.router.navigate(['/apps/plm/bill-of-materials', id]);
  }
}
