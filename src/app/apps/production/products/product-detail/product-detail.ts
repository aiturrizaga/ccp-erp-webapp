import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ITEMS } from '@core/mock-data';
import { ProductStatus, PRODUCT_STATUS_LABEL, Tone } from '@core/models';
import { ProductionState } from '../../production-state';

const STATUS_TONE: Record<ProductStatus, Tone> = {
  draft: 'neutral',
  active: 'success',
  under_change: 'warning',
  discontinued: 'danger',
};

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, ...HlmButtonImports, ...HlmCardImports, EntityHeader, EmptyState],
  templateUrl: './product-detail.html',
})
export class ProductDetail {
  private readonly productionState = inject(ProductionState);

  readonly id = input.required<string>();

  protected readonly product = computed(() => this.productionState.products().find((p) => p.id === this.id()));
  protected readonly item = computed(() => ITEMS.find((i) => i.id === this.product()?.itemId));
  protected readonly activeBom = computed(() => this.productionState.billsOfMaterials().find((b) => b.id === this.product()?.activeBomId));
  protected readonly bomHistory = computed(() =>
    this.productionState
      .billsOfMaterials()
      .filter((b) => b.productId === this.id())
      .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1)),
  );

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected statusLabel(status: ProductStatus): string {
    return PRODUCT_STATUS_LABEL[status];
  }

  protected statusTone(status: ProductStatus): Tone {
    return STATUS_TONE[status];
  }
}
