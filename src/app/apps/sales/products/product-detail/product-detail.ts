import { Component, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { NgIcon } from '@ng-icons/core';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { salesProducts } from '../../sales-state';
import {
  SalesProductStatus,
  SALES_CATEGORY_ACCOUNT,
  SALES_CATEGORY_LABEL,
  SALES_PRODUCT_STATUS_LABEL,
  SALES_PRODUCT_STATUS_TONE,
  Tone,
  formatSalesProductName,
  parseDimension,
} from '@core/models';

@Component({
  selector: 'app-product-detail',
  imports: [DecimalPipe, PercentPipe, NgIcon, ...HlmButtonImports, ...HlmCardImports, EntityHeader, EmptyState],
  templateUrl: './product-detail.html',
})
export class ProductDetail {
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly product = computed(() => salesProducts().find((p) => p.id === this.id()));
  protected readonly fullName = computed(() => {
    const p = this.product();
    return p ? formatSalesProductName(p) : '';
  });
  protected readonly dimensionSegments = computed(() => {
    const p = this.product();
    return p ? parseDimension(p.dimension, p.category) : [];
  });
  protected readonly account = computed(() => {
    const p = this.product();
    return p ? SALES_CATEGORY_ACCOUNT[p.category] : null;
  });
  /** "Verifica que el dato está correcto" — purely a local demo checkbox, not persisted. */
  protected readonly accountConfirmed = signal(false);

  protected readonly margin = computed(() => {
    const p = this.product();
    if (!p || !p.costBand.min) return null;
    return {
      atMin: (p.costBand.min - p.productionUnitCost) / p.costBand.min,
      atMax: (p.costBand.max - p.productionUnitCost) / p.costBand.max,
    };
  });

  protected categoryLabel(c: keyof typeof SALES_CATEGORY_LABEL): string {
    return SALES_CATEGORY_LABEL[c];
  }
  protected statusLabel(s: SalesProductStatus): string {
    return SALES_PRODUCT_STATUS_LABEL[s];
  }
  protected statusTone(s: SalesProductStatus): Tone {
    return SALES_PRODUCT_STATUS_TONE[s];
  }

  protected edit(): void {
    this.router.navigate(['/apps/sales/products', this.id(), 'edit']);
  }
}
