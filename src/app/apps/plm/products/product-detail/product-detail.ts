import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { PRODUCTS, BILLS_OF_MATERIALS, ITEMS } from '@core/mock-data';
import { ProductStatus, PRODUCT_STATUS_LABEL, Tone } from '@core/models';

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
  readonly id = input.required<string>();

  protected readonly product = computed(() => PRODUCTS.find((p) => p.id === this.id()));
  protected readonly item = computed(() => ITEMS.find((i) => i.id === this.product()?.itemId));
  protected readonly activeBom = computed(() => BILLS_OF_MATERIALS.find((b) => b.id === this.product()?.activeBomId));
  protected readonly bomHistory = computed(() => BILLS_OF_MATERIALS.filter((b) => b.productId === this.id()));

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
