import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmAlertDialogImports } from '@ui/alert-dialog';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { toast } from '@shared/toast';
import { ITEMS, STOCK_LOTS, WORK_SHEETS } from '@core/mock-data';
import { StockIssueStatus, STOCK_ISSUE_ORIGIN_LABEL, STOCK_ISSUE_STATUS_LABEL, Tone } from '@core/models';
import { AuthState } from '@shell/auth-state';
import { WarehouseOpsState } from '../../warehouse-ops-state';

const STATUS_TONE: Record<StockIssueStatus, Tone> = {
  pending: 'neutral',
  partial: 'warning',
  dispatched: 'success',
  cancelled: 'danger',
};

@Component({
  selector: 'app-stock-issue-detail',
  imports: [FormsModule, RouterLink, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmAlertDialogImports, EntityHeader, EmptyState],
  templateUrl: './stock-issue-detail.html',
})
export class StockIssueDetail {
  private readonly warehouseOpsState = inject(WarehouseOpsState);
  protected readonly auth = inject(AuthState);

  readonly id = input.required<string>();

  protected readonly issue = computed(() => this.warehouseOpsState.stockIssues().find((i) => i.id === this.id()));
  protected readonly workSheet = computed(() => WORK_SHEETS.find((ws) => ws.id === this.issue()?.workSheetId));

  protected readonly editable = computed(() => this.auth.isWarehouse() && (this.issue()?.status === 'pending' || this.issue()?.status === 'partial'));

  protected readonly receivedByDraft = signal('');
  protected readonly dispatchQuantities = signal<Record<string, number>>({});

  protected readonly canDispatch = computed(() => {
    const values = Object.values(this.dispatchQuantities());
    return this.receivedByDraft().trim().length > 0 && values.some((v) => v > 0);
  });

  protected openDispatchDraft(): void {
    const issue = this.issue();
    this.receivedByDraft.set('');
    const defaults: Record<string, number> = {};
    for (const line of issue?.lines ?? []) defaults[line.itemId] = 0;
    this.dispatchQuantities.set(defaults);
  }

  protected setDispatchQuantity(itemId: string, value: string): void {
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty < 0) return;
    this.dispatchQuantities.update((m) => ({ ...m, [itemId]: qty }));
  }

  protected pending(itemId: string): number {
    const line = this.issue()?.lines.find((l) => l.itemId === itemId);
    return line ? line.requiredQuantity - line.dispatchedQuantity : 0;
  }

  protected availableStock(itemId: string): number {
    return STOCK_LOTS.filter((lot) => lot.itemId === itemId).reduce((sum, lot) => sum + lot.quantity, 0);
  }

  protected confirmDispatch(): void {
    const issue = this.issue();
    if (!issue || !this.canDispatch()) return;

    const dispatchedBy = this.auth.currentUser()?.name ?? '';
    this.warehouseOpsState.dispatchStockIssue(issue.id, dispatchedBy, this.receivedByDraft().trim(), this.dispatchQuantities());

    const updated = this.warehouseOpsState.stockIssues().find((i) => i.id === issue.id);
    if (updated?.status === 'dispatched') {
      toast.success('Salida despachada por completo', { description: `Entregado a ${this.receivedByDraft()}` });
    } else {
      toast.warning('Salida despachada parcialmente', { description: 'Quedan artículos pendientes por entregar.' });
    }
  }

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected originLabel(origin: 'work_sheet' | 'other'): string {
    return STOCK_ISSUE_ORIGIN_LABEL[origin];
  }

  protected statusLabel(status: StockIssueStatus): string {
    return STOCK_ISSUE_STATUS_LABEL[status];
  }

  protected statusTone(status: StockIssueStatus): Tone {
    return STATUS_TONE[status];
  }
}
