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
import { HlmAlertDialogImports } from '@ui/alert-dialog';
import { toast } from '@shared/toast';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { ApprovalTimeline } from '@shared/components/approval-timeline/approval-timeline';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { APPROVALS, ITEMS, STOCK_LOTS, WAREHOUSES, WORK_SHEETS } from '@core/mock-data';
import { PurchaseRequisitionStatus, PURCHASE_REQUISITION_STATUS_LABEL, REQUISITION_PRIORITY_LABEL, Tone } from '@core/models';
import { AuthState } from '@shell/auth-state';
import { PurchasingState } from '../../purchasing-state';

const STATUS_TONE: Record<PurchaseRequisitionStatus, Tone> = {
  draft: 'neutral',
  pending_approval: 'warning',
  approved: 'info',
  sourcing: 'info',
  awarded: 'info',
  purchasing: 'info',
  fulfilled: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

@Component({
  selector: 'app-requisition-detail',
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
    ...HlmAlertDialogImports,
    EntityHeader,
    ApprovalTimeline,
    EmptyState,
  ],
  templateUrl: './requisition-detail.html',
})
export class RequisitionDetail {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);
  protected readonly auth = inject(AuthState);

  readonly id = input.required<string>();

  protected readonly requisition = computed(() => this.purchasingState.requisitions().find((r) => r.id === this.id()));
  protected readonly approval = computed(() => APPROVALS.find((a) => a.id === this.requisition()?.approvalId));
  protected readonly quotation = computed(() => this.purchasingState.quotations().find((q) => q.requisitionId === this.id()));
  protected readonly workSheetId = computed(() => WORK_SHEETS.find((ws) => ws.number === this.requisition()?.workSheetRef)?.id);

  /** Resolves the requisition's free-text `plant` (e.g. "Planta Lima — P3") to the real warehouse + location name. */
  protected readonly plantDisplay = computed(() => {
    const plant = this.requisition()?.plant;
    if (!plant) return '';
    const warehouse = WAREHOUSES[0];
    const shortName = /P\d\s*$/.exec(plant)?.[0].trim();
    const location = shortName ? warehouse.locations.find((l) => l.shortName === shortName) : undefined;
    return location ? `${warehouse.name} · ${location.name}` : `${warehouse.name} · ${plant}`;
  });

  /** Almacén can edit an auto-generated requisition while it's still a draft, before submitting it for approval. */
  protected readonly editable = computed(() => this.auth.isWarehouse() && this.requisition()?.status === 'draft');

  protected readonly noteDraft = computed(() => this.requisition()?.note ?? '');

  protected readonly availableItemOptions = computed<SelectFilterOption[]>(() => {
    const linkedIds = new Set(this.requisition()?.lines.map((l) => l.itemId));
    return ITEMS.filter((i) => !linkedIds.has(i.id)).map((i) => ({ value: i.id, label: `${i.code} — ${i.description}` }));
  });

  protected readonly newItemId = signal('');
  protected readonly newQuantity = signal(0);

  protected itemPickerToString = (value: string): string => this.availableItemOptions().find((o) => o.value === value)?.label ?? value;

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected statusLabel(status: PurchaseRequisitionStatus): string {
    return PURCHASE_REQUISITION_STATUS_LABEL[status];
  }

  protected statusTone(status: PurchaseRequisitionStatus): Tone {
    return STATUS_TONE[status];
  }

  protected priorityLabel(priority: string): string {
    return REQUISITION_PRIORITY_LABEL[priority as keyof typeof REQUISITION_PRIORITY_LABEL] ?? priority;
  }

  protected generateQuotation(): void {
    const requisition = this.requisition();
    if (!requisition) return;
    const quotation = this.purchasingState.createQuotationFromRequisition(requisition);
    toast.success(`Cotización ${quotation.number} generada`, { description: `Se creó a partir de ${requisition.number}.` });
    this.router.navigate(['/apps/purchasing/sourcing', quotation.id]);
  }

  protected setLineQuantity(lineIndex: number, value: string): void {
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity < 0) return;
    this.purchasingState.updateLineQuantity(this.id(), lineIndex, quantity);
  }

  protected removeLine(lineIndex: number): void {
    const line = this.requisition()?.lines[lineIndex];
    this.purchasingState.removeLine(this.id(), lineIndex);
    if (line) toast.success(`${this.itemLabel(line.itemId)} quitado del requerimiento`);
  }

  protected setLineNotNeeded(lineIndex: number, notNeeded: boolean): void {
    this.purchasingState.setLineNotNeeded(this.id(), lineIndex, notNeeded);
  }

  protected setNote(note: string): void {
    this.purchasingState.updateNote(this.id(), note);
  }

  protected submitForApproval(): void {
    this.purchasingState.submitForApproval(this.id());
    toast.success('Requerimiento enviado a aprobación');
  }

  protected approveRequisition(): void {
    this.purchasingState.approveRequisition(this.id());
    toast.success('Requerimiento aprobado', { description: 'Ya puede generarse la cotización.' });
  }

  protected observeRequisition(): void {
    this.purchasingState.observeRequisition(this.id());
    toast.warning('Requerimiento observado', { description: 'Se devolvió a Almacén como borrador para ajustes.' });
  }

  protected openAddLineDraft(): void {
    this.newItemId.set('');
    this.newQuantity.set(0);
  }

  protected canAddLine(): boolean {
    return this.newItemId().length > 0 && this.newQuantity() > 0;
  }

  protected confirmAddLine(): void {
    const requisition = this.requisition();
    const item = ITEMS.find((i) => i.id === this.newItemId());
    if (!requisition || !item || this.newQuantity() <= 0) return;

    const availableStock = STOCK_LOTS.filter((lot) => lot.itemId === item.id).reduce((sum, lot) => sum + lot.quantity, 0);

    this.purchasingState.addLine(requisition.id, {
      itemId: item.id,
      quantity: this.newQuantity(),
      unitOfMeasure: item.unitOfMeasure,
      neededBy: requisition.neededBy,
      availableStock,
    });
    toast.success(`${item.code} — ${item.description} agregado al requerimiento`);
  }
}
