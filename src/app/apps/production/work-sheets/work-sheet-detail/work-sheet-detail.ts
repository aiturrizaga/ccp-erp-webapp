import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmCardImports } from '@ui/card';
import { HlmButtonImports } from '@ui/button';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { WORK_SHEETS, PRODUCTS, ITEMS } from '@core/mock-data';
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
  selector: 'app-work-sheet-detail',
  imports: [RouterLink, NgIcon, ...HlmCardImports, ...HlmButtonImports, EntityHeader, EmptyState],
  templateUrl: './work-sheet-detail.html',
})
export class WorkSheetDetail {
  readonly id = input.required<string>();

  protected readonly workSheet = computed(() => WORK_SHEETS.find((w) => w.id === this.id()));
  protected readonly product = computed(() => PRODUCTS.find((p) => p.id === this.workSheet()?.productId));

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected shortfall(required: number, available: number): boolean {
    return available < required;
  }

  protected statusLabel(status: ProductionOrderStatus): string {
    return PRODUCTION_ORDER_STATUS_LABEL[status];
  }

  protected statusTone(status: ProductionOrderStatus): Tone {
    return STATUS_TONE[status];
  }
}
