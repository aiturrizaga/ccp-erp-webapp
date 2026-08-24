import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmCardImports } from '@ui/card';
import { HlmButtonImports } from '@ui/button';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { WORK_SHEETS, PRODUCTS, ITEMS } from '@core/mock-data';
import { ProductionOrderStatus, PRODUCTION_ORDER_STATUS_LABEL, StockIssueStatus, STOCK_ISSUE_STATUS_LABEL, Tone } from '@core/models';
import { WarehouseOpsState } from '../../../inventory/warehouse-ops-state';

const ISSUE_STATUS_TONE: Record<StockIssueStatus, Tone> = {
  pending: 'neutral',
  partial: 'warning',
  dispatched: 'success',
  cancelled: 'danger',
};

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
  imports: [RouterLink, NgIcon, ...HlmCardImports, ...HlmButtonImports, EntityHeader, StatusBadge, EmptyState],
  templateUrl: './work-sheet-detail.html',
})
export class WorkSheetDetail {
  private readonly warehouseOpsState = inject(WarehouseOpsState);

  readonly id = input.required<string>();

  protected readonly workSheet = computed(() => WORK_SHEETS.find((w) => w.id === this.id()));
  protected readonly product = computed(() => PRODUCTS.find((p) => p.id === this.workSheet()?.productId));
  protected readonly stockIssue = computed(() => this.warehouseOpsState.stockIssues().find((i) => i.workSheetId === this.id()));

  protected issueStatusLabel(status: StockIssueStatus): string {
    return STOCK_ISSUE_STATUS_LABEL[status];
  }

  protected issueStatusTone(status: StockIssueStatus): Tone {
    return ISSUE_STATUS_TONE[status];
  }

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
