import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { toast } from '@shared/toast';
import { salesProducts, updateSalesProduct } from '../../../sales/sales-state';
import { SalesProduct, SALES_CATEGORY_LABEL, formatSalesProductName, parseDimension } from '@core/models';

@Component({
  selector: 'app-pending-product-cost',
  imports: [FormsModule, DecimalPipe, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, EntityHeader, EmptyState],
  templateUrl: './pending-product-cost.html',
})
export class PendingProductCost {
  private readonly router = inject(Router);
  readonly id = input.required<string>();

  protected readonly product = computed(() => salesProducts().find((p) => p.id === this.id()));
  protected readonly productionUnitCost = signal(0);
  protected readonly costMin = signal(0);
  protected readonly costMax = signal(0);
  protected readonly saving = signal(false);

  protected readonly canSave = computed(() => {
    const cost = this.productionUnitCost();
    const min = this.costMin();
    const max = this.costMax();
    return cost > 0 && min > 0 && max >= min;
  });

  protected readonly fullName = computed(() => {
    const p = this.product();
    return p ? formatSalesProductName(p) : '';
  });

  protected readonly dimensionSegments = computed(() => {
    const p = this.product();
    return p ? parseDimension(p.dimension, p.category) : [];
  });

  constructor() {
    effect(() => {
      const p = this.product();
      if (!p) return;
      this.productionUnitCost.set(p.productionUnitCost ?? 0);
      this.costMin.set(p.costBand?.min ?? 0);
      this.costMax.set(p.costBand?.max ?? 0);
    });
  }

  protected categoryLabel(category: SalesProduct['category']): string {
    return SALES_CATEGORY_LABEL[category];
  }

  protected save(): void {
    const p = this.product();
    if (!p || !this.canSave() || this.saving()) return;

    this.saving.set(true);
    updateSalesProduct(p.id, {
      productionUnitCost: this.productionUnitCost(),
      costBand: { min: this.costMin(), max: this.costMax() },
    });
    toast.success('Costos registrados', { description: p.name });
    this.router.navigate(['/apps/production/products']);
  }

  protected cancel(): void {
    this.router.navigate(['/apps/production/products']);
  }
}
