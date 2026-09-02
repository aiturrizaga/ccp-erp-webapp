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
import { HlmPopoverImports } from '@ui/popover';
import { toast } from '@shared/toast';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { ApprovalTimeline } from '@shared/components/approval-timeline/approval-timeline';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { APPROVALS, ITEMS, STOCK_LOTS, WORK_SHEETS } from '@core/mock-data';
import { PurchaseRequirementLine, PurchaseRequirementStatus, PURCHASE_REQUIREMENT_STATUS_LABEL, REPLENISHMENT_SUGGESTION_STATUS_LABEL, REQUISITION_PRIORITY_LABEL, Tone } from '@core/models';
import { AuthState } from '@shell/auth-state';
import { PurchasingState } from '../../purchasing-state';

const STATUS_TONE: Record<PurchaseRequirementStatus, Tone> = {
  draft: 'neutral',
  reviewed: 'info',
  pending_approval: 'warning',
  approved: 'success',
  rejected: 'danger',
  observed: 'warning',
};

interface RequirementLineRow {
  line: PurchaseRequirementLine;
  /** Index into requirement().lines — needed to target the right line when editing/striking it out. */
  index: number;
}

interface ItemGroup {
  itemId: string;
  unitOfMeasure: string;
  /** Sum of every non-struck-out line's quantity for this item — what would actually be requested. */
  total: number;
  rows: RequirementLineRow[];
}

@Component({
  selector: 'app-requirement-detail',
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
    ...HlmPopoverImports,
    EntityHeader,
    ApprovalTimeline,
    EmptyState,
  ],
  templateUrl: './requirement-detail.html',
})
export class RequirementDetail {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);
  protected readonly auth = inject(AuthState);

  readonly id = input.required<string>();

  protected readonly requirement = computed(() => this.purchasingState.requirements().find((r) => r.id === this.id()));
  protected readonly approval = computed(() => APPROVALS.find((a) => a.id === this.requirement()?.approvalId));
  protected readonly quotation = computed(() => this.purchasingState.quotations().find((q) => q.requirementId === this.id()));

  protected readonly groupedSuggestions = computed(() => {
    const ids = this.requirement()?.suggestionIds ?? [];
    return this.purchasingState.suggestions().filter((s) => ids.includes(s.id));
  });

  /**
   * Groups the RC's own working lines by artículo so Almacén can see, per item, both the total that
   * would be requested and exactly how much each contributing HT/sugerencia is asking for — the same
   * breakdown `createQuotationFromRequirement` uses when it merges these lines into the RFQ.
   */
  protected readonly itemGroups = computed<ItemGroup[]>(() => {
    const groups = new Map<string, ItemGroup>();
    (this.requirement()?.lines ?? []).forEach((line, index) => {
      let group = groups.get(line.itemId);
      if (!group) {
        group = { itemId: line.itemId, unitOfMeasure: line.unitOfMeasure, total: 0, rows: [] };
        groups.set(line.itemId, group);
      }
      group.rows.push({ line, index });
      if (!line.notNeeded) group.total += line.quantity;
    });
    return Array.from(groups.values());
  });

  /** Almacén can edit the block — header note, quantities, strike an article out — while it's still a draft or already reviewed but not yet submitted. */
  protected readonly editable = computed(() => {
    const status = this.requirement()?.status;
    return this.auth.isWarehouse() && (status === 'draft' || status === 'reviewed');
  });

  protected readonly noteDraft = computed(() => this.requirement()?.note ?? '');

  protected readonly rejectComment = signal('');
  protected readonly observeComment = signal('');

  /** Popover open/closed state for each stage-change confirmation — a lighter-weight "¿estás seguro?" than a modal, closed imperatively once the action fires. */
  protected readonly reviewPopoverState = signal<'open' | 'closed'>('closed');
  protected readonly submitPopoverState = signal<'open' | 'closed'>('closed');
  protected readonly approvePopoverState = signal<'open' | 'closed'>('closed');
  protected readonly rejectPopoverState = signal<'open' | 'closed'>('closed');
  protected readonly observePopoverState = signal<'open' | 'closed'>('closed');
  protected readonly quotePopoverState = signal<'open' | 'closed'>('closed');

  protected workSheetId(workSheetRef: string | undefined): string | undefined {
    return WORK_SHEETS.find((ws) => ws.number === workSheetRef)?.id;
  }

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  /** Live stock, not the snapshot taken when the line was grouped — the same source Reposición sugerida uses. */
  protected availableStock(itemId: string): number {
    return STOCK_LOTS.filter((lot) => lot.itemId === itemId).reduce((sum, lot) => sum + lot.quantity, 0);
  }

  protected suggestionNumber(suggestionId: string): string {
    return this.purchasingState.suggestions().find((s) => s.id === suggestionId)?.number ?? suggestionId;
  }

  protected statusLabel(status: PurchaseRequirementStatus): string {
    return PURCHASE_REQUIREMENT_STATUS_LABEL[status];
  }

  protected statusTone(status: PurchaseRequirementStatus): Tone {
    return STATUS_TONE[status];
  }

  protected suggestionStatusLabel(status: string): string {
    return REPLENISHMENT_SUGGESTION_STATUS_LABEL[status as keyof typeof REPLENISHMENT_SUGGESTION_STATUS_LABEL] ?? status;
  }

  protected priorityLabel(priority: string): string {
    return REQUISITION_PRIORITY_LABEL[priority as keyof typeof REQUISITION_PRIORITY_LABEL] ?? priority;
  }

  protected setNote(note: string): void {
    this.purchasingState.updateRequirementNote(this.id(), note);
  }

  protected setLineQuantity(lineIndex: number, value: string): void {
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity < 0) return;
    this.purchasingState.updateRequirementLineQuantity(this.id(), lineIndex, quantity);
  }

  /** "Quitar" no borra la línea — la tacha, dejando registro de que el artículo estuvo pedido y se decidió no comprarlo en este bloque. */
  protected setLineNotNeeded(lineIndex: number, notNeeded: boolean): void {
    this.purchasingState.setRequirementLineNotNeeded(this.id(), lineIndex, notNeeded);
  }

  // --- Agregar artículo directamente al bloque, sin pasar por ninguna sugerencia ---

  protected readonly newItemId = signal('');
  protected readonly newQuantity = signal(0);

  protected readonly availableItemOptions = computed<SelectFilterOption[]>(() => {
    const linkedIds = new Set((this.requirement()?.lines ?? []).map((l) => l.itemId));
    return ITEMS.filter((i) => !linkedIds.has(i.id)).map((i) => ({ value: i.id, label: `${i.code} — ${i.description}` }));
  });

  protected itemPickerToString = (value: string): string => this.availableItemOptions().find((o) => o.value === value)?.label ?? value;

  protected openAddLineDraft(): void {
    this.newItemId.set('');
    this.newQuantity.set(0);
  }

  protected canAddLine(): boolean {
    return this.newItemId().length > 0 && this.newQuantity() > 0;
  }

  protected confirmAddLine(): void {
    const item = ITEMS.find((i) => i.id === this.newItemId());
    if (!item || this.newQuantity() <= 0) return;

    this.purchasingState.addRequirementLine(this.id(), {
      itemId: item.id,
      quantity: this.newQuantity(),
      unitOfMeasure: item.unitOfMeasure,
      availableStock: this.availableStock(item.id),
    });
    toast.success(`${item.code} — ${item.description} agregado al bloque`);
  }

  protected markReviewed(): void {
    this.reviewPopoverState.set('closed');
    this.purchasingState.markRequirementReviewed(this.id(), this.auth.currentUser()?.name);
    toast.success('Requerimiento de Compra marcado como revisado', { description: 'Ya puede enviarse a aprobación.' });
  }

  protected submitForApproval(): void {
    this.submitPopoverState.set('closed');
    this.purchasingState.submitRequirementForApproval(this.id());
    toast.success('Requerimiento de Compra enviado a aprobación');
  }

  protected approveRequirement(): void {
    this.approvePopoverState.set('closed');
    this.purchasingState.approveRequirement(this.id(), this.auth.currentUser()?.name);
    toast.success('Requerimiento de Compra aprobado', { description: 'Ya puede generarse la cotización.' });
  }

  protected openRejectDraft(): void {
    this.rejectComment.set('');
  }

  protected canReject(): boolean {
    return this.rejectComment().trim().length > 0;
  }

  protected confirmReject(): void {
    if (!this.canReject()) return;
    this.rejectPopoverState.set('closed');
    const requirement = this.requirement();
    this.purchasingState.rejectRequirement(this.id(), this.rejectComment().trim(), this.auth.currentUser()?.name);
    toast.warning('Requerimiento de Compra rechazado', {
      description: `${requirement?.suggestionIds.length ?? 0} sugerencia(s) quedaron libres para agruparse en un nuevo bloque.`,
    });
  }

  protected openObserveDraft(): void {
    this.observeComment.set('');
  }

  protected canObserve(): boolean {
    return this.observeComment().trim().length > 0;
  }

  protected confirmObserve(): void {
    if (!this.canObserve()) return;
    this.observePopoverState.set('closed');
    const requirement = this.requirement();
    this.purchasingState.observeRequirement(this.id(), this.observeComment().trim(), this.auth.currentUser()?.name);
    toast.warning('Requerimiento de Compra observado', {
      description: `${requirement?.suggestionIds.length ?? 0} sugerencia(s) quedaron libres para agruparse en un nuevo bloque.`,
    });
  }

  protected generateQuotation(): void {
    this.quotePopoverState.set('closed');
    const requirement = this.requirement();
    if (!requirement) return;
    const quotation = this.purchasingState.createQuotationFromRequirement(requirement);
    toast.success(`Cotización ${quotation.number} generada`, { description: `Se creó a partir de ${requirement.number}.` });
    this.router.navigate(['/apps/purchasing/sourcing', quotation.id]);
  }
}
