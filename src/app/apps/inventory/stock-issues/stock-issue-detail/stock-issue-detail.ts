import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { HlmAlertDialogImports } from '@ui/alert-dialog';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { toast } from '@shared/toast';
import { ITEMS, WORK_SHEETS } from '@core/mock-data';
import { StockIssueStatus, STOCK_ISSUE_ORIGIN_LABEL, STOCK_ISSUE_STATUS_LABEL, Tone } from '@core/models';
import { AuthState } from '@shell/auth-state';
import { DispatchAllocation, WarehouseOpsState } from '../../warehouse-ops-state';

const STATUS_TONE: Record<StockIssueStatus, Tone> = {
  pending: 'neutral',
  partial: 'warning',
  dispatched: 'success',
  cancelled: 'danger',
};

@Component({
  selector: 'app-stock-issue-detail',
  imports: [FormsModule, RouterLink, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, ...HlmAlertDialogImports, EntityHeader, EmptyState],
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
  protected readonly dispatchLots = signal<Record<string, string>>({});

  protected readonly canDispatch = computed(() => {
    const quantities = this.dispatchQuantities();
    const lots = this.dispatchLots();
    const hasLine = Object.entries(quantities).some(([itemId, qty]) => qty > 0 && !!lots[itemId]);
    return this.receivedByDraft().trim().length > 0 && hasLine;
  });

  protected openDispatchDraft(): void {
    const issue = this.issue();
    this.receivedByDraft.set('');
    const quantities: Record<string, number> = {};
    const lots: Record<string, string> = {};
    for (const line of issue?.lines ?? []) {
      quantities[line.itemId] = 0;
      lots[line.itemId] = this.availableLots(line.itemId)[0]?.id ?? '';
    }
    this.dispatchQuantities.set(quantities);
    this.dispatchLots.set(lots);
  }

  protected setDispatchQuantity(itemId: string, value: string): void {
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty < 0) return;
    this.dispatchQuantities.update((m) => ({ ...m, [itemId]: qty }));
  }

  protected setDispatchLot(itemId: string, lotId: string): void {
    this.dispatchLots.update((m) => ({ ...m, [itemId]: lotId }));
  }

  protected pending(itemId: string): number {
    const line = this.issue()?.lines.find((l) => l.itemId === itemId);
    return line ? line.requiredQuantity - line.dispatchedQuantity : 0;
  }

  protected availableLots(itemId: string) {
    return this.warehouseOpsState.availableLotsFor(itemId);
  }

  protected lotCode(lotId: string): string {
    return this.warehouseOpsState.stockLots().find((l) => l.id === lotId)?.lot ?? lotId;
  }

  protected availableStock(itemId: string): number {
    return this.availableLots(itemId).reduce((sum, lot) => sum + lot.quantity, 0);
  }

  protected lotToString = (itemId: string) => (lotId: string): string => {
    const lot = this.availableLots(itemId).find((l) => l.id === lotId);
    return lot ? `${lot.lot} · disp. ${lot.quantity}` : lotId;
  };

  protected confirmDispatch(): void {
    const issue = this.issue();
    if (!issue || !this.canDispatch()) return;

    const quantities = this.dispatchQuantities();
    const lots = this.dispatchLots();
    const allocations: DispatchAllocation[] = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, quantity]) => ({ itemId, quantity, lotId: lots[itemId] }));

    const dispatchedBy = this.auth.currentUser()?.name ?? '';
    this.warehouseOpsState.dispatchStockIssue(issue.id, dispatchedBy, this.receivedByDraft().trim(), allocations);

    const updated = this.warehouseOpsState.stockIssues().find((i) => i.id === issue.id);
    if (updated?.status === 'dispatched') {
      toast.success('Nota de salida despachada por completo', { description: `Entregado a ${this.receivedByDraft()}` });
    } else {
      toast.warning('Nota de salida despachada parcialmente', { description: 'Quedan artículos pendientes por entregar.' });
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
