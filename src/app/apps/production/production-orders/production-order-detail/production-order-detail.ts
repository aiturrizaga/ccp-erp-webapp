import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { PRODUCTION_ORDERS, PRODUCTS, WORK_SHEETS } from '@core/mock-data';
import { ProductionOrderStatus, PRODUCTION_ORDER_STATUS_LABEL, Tone } from '@core/models';

const STATUS_TONE: Record<ProductionOrderStatus, Tone> = {
  planned: 'neutral',
  released: 'info',
  preparing: 'info',
  in_progress: 'warning',
  paused: 'danger',
  completed: 'success',
  cancelled: 'danger',
};

@Component({
  selector: 'app-production-order-detail',
  imports: [RouterLink, ...HlmCardImports, EntityHeader, EmptyState],
  templateUrl: './production-order-detail.html',
})
export class ProductionOrderDetail {
  readonly id = input.required<string>();

  protected readonly order = computed(() => PRODUCTION_ORDERS.find((o) => o.id === this.id()));
  protected readonly product = computed(() => PRODUCTS.find((p) => p.id === this.order()?.productId));
  protected readonly workSheets = computed(() => WORK_SHEETS.filter((ws) => ws.productionOrderId === this.id()));

  protected statusLabel(status: ProductionOrderStatus): string {
    return PRODUCTION_ORDER_STATUS_LABEL[status];
  }

  protected statusTone(status: ProductionOrderStatus): Tone {
    return STATUS_TONE[status];
  }
}
