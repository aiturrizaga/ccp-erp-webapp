import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmDialogImports } from '@ui/dialog';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmTextareaImports } from '@ui/textarea';
import { HlmComboboxImports } from '@ui/combobox';
import { HlmCheckboxImports } from '@ui/checkbox';
import { toast } from '@shared/toast';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { ITEMS, STOCK_LOTS, WORK_SHEETS } from '@core/mock-data';
import { ReplenishmentSuggestionStatus, REPLENISHMENT_SUGGESTION_STATUS_LABEL, REQUISITION_PRIORITY_LABEL, Tone } from '@core/models';
import { AuthState } from '@shell/auth-state';
import { PurchasingState } from '../../purchasing-state';

const STATUS_TONE: Record<ReplenishmentSuggestionStatus, Tone> = {
  draft: 'neutral',
  grouped: 'info',
  cancelled: 'danger',
};

@Component({
  selector: 'app-suggestion-detail',
  imports: [
    FormsModule,
    RouterLink,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmDialogImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    ...HlmTextareaImports,
    ...HlmComboboxImports,
    ...HlmCheckboxImports,
    EntityHeader,
    EmptyState,
    StatusBadge,
  ],
  templateUrl: './suggestion-detail.html',
})
export class SuggestionDetail {
  private readonly purchasingState = inject(PurchasingState);
  protected readonly auth = inject(AuthState);

  readonly id = input.required<string>();

  protected readonly suggestion = computed(() => this.purchasingState.suggestions().find((s) => s.id === this.id()));
  protected readonly requirement = computed(() => this.purchasingState.requirements().find((r) => r.id === this.suggestion()?.requirementId));
  protected readonly workSheetId = computed(() => WORK_SHEETS.find((ws) => ws.number === this.suggestion()?.workSheetRef)?.id);

  /** Almacén can edit a suggestion while it's still free (draft) — once it's grouped into an RC, it's locked until that RC is rejected/observed and it's released back. */
  protected readonly editable = computed(() => this.auth.isWarehouse() && this.suggestion()?.status === 'draft');

  protected readonly noteDraft = computed(() => this.suggestion()?.note ?? '');

  protected readonly availableItemOptions = computed<SelectFilterOption[]>(() => {
    const linkedIds = new Set(this.suggestion()?.lines.map((l) => l.itemId));
    return ITEMS.filter((i) => !linkedIds.has(i.id)).map((i) => ({ value: i.id, label: `${i.code} — ${i.description}` }));
  });

  protected readonly newItemId = signal('');
  protected readonly newQuantity = signal(0);

  protected itemPickerToString = (value: string): string => this.availableItemOptions().find((o) => o.value === value)?.label ?? value;

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected statusLabel(status: ReplenishmentSuggestionStatus): string {
    return REPLENISHMENT_SUGGESTION_STATUS_LABEL[status];
  }

  protected statusTone(status: ReplenishmentSuggestionStatus): Tone {
    return STATUS_TONE[status];
  }

  protected priorityLabel(priority: string): string {
    return REQUISITION_PRIORITY_LABEL[priority as keyof typeof REQUISITION_PRIORITY_LABEL] ?? priority;
  }

  protected setLineQuantity(lineIndex: number, value: string): void {
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity < 0) return;
    this.purchasingState.updateLineQuantity(this.id(), lineIndex, quantity);
  }

  protected removeLine(lineIndex: number): void {
    const line = this.suggestion()?.lines[lineIndex];
    this.purchasingState.removeLine(this.id(), lineIndex);
    if (line) toast.success(`${this.itemLabel(line.itemId)} quitado de la sugerencia`);
  }

  protected setLineNotNeeded(lineIndex: number, notNeeded: boolean): void {
    this.purchasingState.setLineNotNeeded(this.id(), lineIndex, notNeeded);
  }

  protected setNote(note: string): void {
    this.purchasingState.updateNote(this.id(), note);
  }

  protected openAddLineDraft(): void {
    this.newItemId.set('');
    this.newQuantity.set(0);
  }

  protected canAddLine(): boolean {
    return this.newItemId().length > 0 && this.newQuantity() > 0;
  }

  protected confirmAddLine(): void {
    const suggestion = this.suggestion();
    const item = ITEMS.find((i) => i.id === this.newItemId());
    if (!suggestion || !item || this.newQuantity() <= 0) return;

    const availableStock = STOCK_LOTS.filter((lot) => lot.itemId === item.id).reduce((sum, lot) => sum + lot.quantity, 0);

    this.purchasingState.addLine(suggestion.id, {
      itemId: item.id,
      quantity: this.newQuantity(),
      unitOfMeasure: item.unitOfMeasure,
      neededBy: suggestion.neededBy,
      availableStock,
    });
    toast.success(`${item.code} — ${item.description} agregado a la sugerencia`);
  }
}
