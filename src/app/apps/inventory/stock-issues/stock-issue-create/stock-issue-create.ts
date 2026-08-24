import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmTextareaImports } from '@ui/textarea';
import { HlmComboboxImports } from '@ui/combobox';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { toast } from '@shared/toast';
import { ITEMS, WAREHOUSES } from '@core/mock-data';
import { AuthState } from '@shell/auth-state';
import { WarehouseOpsState } from '../../warehouse-ops-state';

interface DraftLine {
  itemId: string;
  quantity: number;
  unitOfMeasure: string;
}

@Component({
  selector: 'app-stock-issue-create',
  imports: [FormsModule, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmTextareaImports, ...HlmComboboxImports, EntityHeader],
  templateUrl: './stock-issue-create.html',
})
export class StockIssueCreate {
  private readonly router = inject(Router);
  private readonly warehouseOpsState = inject(WarehouseOpsState);
  private readonly auth = inject(AuthState);

  protected readonly reason = signal('');
  protected readonly plant = signal(WAREHOUSES[0]?.name ?? '');
  protected readonly receivedBy = signal('');
  protected readonly lines = signal<DraftLine[]>([]);

  protected readonly newItemId = signal('');
  protected readonly newQuantity = signal(0);

  protected readonly availableItemOptions = computed<SelectFilterOption[]>(() => {
    const linkedIds = new Set(this.lines().map((l) => l.itemId));
    return ITEMS.filter((i) => !linkedIds.has(i.id)).map((i) => ({ value: i.id, label: `${i.code} — ${i.description}` }));
  });

  protected itemPickerToString = (value: string): string => this.availableItemOptions().find((o) => o.value === value)?.label ?? value;

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected canAddLine(): boolean {
    return this.newItemId().length > 0 && this.newQuantity() > 0;
  }

  protected addLine(): void {
    const item = ITEMS.find((i) => i.id === this.newItemId());
    if (!item || this.newQuantity() <= 0) return;
    this.lines.update((lines) => [...lines, { itemId: item.id, quantity: this.newQuantity(), unitOfMeasure: item.unitOfMeasure }]);
    this.newItemId.set('');
    this.newQuantity.set(0);
  }

  protected removeLine(itemId: string): void {
    this.lines.update((lines) => lines.filter((l) => l.itemId !== itemId));
  }

  protected canSubmit(): boolean {
    return this.reason().trim().length > 0 && this.plant().trim().length > 0 && this.receivedBy().trim().length > 0 && this.lines().length > 0;
  }

  protected submit(): void {
    if (!this.canSubmit()) return;

    const issue = this.warehouseOpsState.createAndDispatchOtherIssue({
      reason: this.reason().trim(),
      plant: this.plant().trim(),
      dispatchedBy: this.auth.currentUser()?.name ?? '',
      receivedBy: this.receivedBy().trim(),
      lines: this.lines(),
    });

    toast.success(`Salida ${issue.number} registrada`, { description: `Entregado a ${this.receivedBy()}` });
    this.router.navigate(['/apps/inventory/stock-issues', issue.id]);
  }

  protected cancel(): void {
    this.router.navigate(['/apps/inventory/stock-issues']);
  }
}
