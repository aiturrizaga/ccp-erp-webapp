import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmTextareaImports } from '@ui/textarea';
import { HlmSelectImports } from '@ui/select';
import { HlmComboboxImports } from '@ui/combobox';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { toast } from '@shared/toast';
import { ITEMS, STOCK_LOTS, WAREHOUSES } from '@core/mock-data';
import { PurchaseRequisition, PurchaseRequisitionLine, REQUISITION_PRIORITY_LABEL, RequisitionPriority } from '@core/models';
import { AuthState } from '@shell/auth-state';
import { PurchasingState } from '../../purchasing-state';

type ManualOrigin = Extract<PurchaseRequisition['origin'], 'inventory' | 'other'>;

const ORIGIN_OPTIONS: { value: ManualOrigin; label: string }[] = [
  { value: 'inventory', label: 'Almacén' },
  { value: 'other', label: 'Otro' },
];

const PRIORITY_OPTIONS: { value: RequisitionPriority; label: string }[] = (
  Object.entries(REQUISITION_PRIORITY_LABEL) as [RequisitionPriority, string][]
).map(([value, label]) => ({ value, label }));

/** Real production locations Almacén dispatches to — same 3 plants used across Inventario/Producción. */
const PLANT_OPTIONS: { value: string; label: string }[] = WAREHOUSES[0]?.locations.map((l) => ({ value: l.name, label: l.name })) ?? [];

interface DraftLine {
  itemId: string;
  quantity: number;
  unitOfMeasure: string;
}

@Component({
  selector: 'app-requisition-create',
  imports: [
    FormsModule,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    ...HlmTextareaImports,
    ...HlmSelectImports,
    ...HlmComboboxImports,
    EntityHeader,
  ],
  templateUrl: './requisition-create.html',
})
export class RequisitionCreate {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);
  private readonly auth = inject(AuthState);

  protected readonly origin = signal<ManualOrigin>('inventory');
  protected readonly area = signal(this.auth.currentUser()?.area ?? 'Almacén');
  protected readonly plant = signal(PLANT_OPTIONS[0]?.value ?? '');
  protected readonly priority = signal<RequisitionPriority>('medium');
  protected readonly neededBy = signal('');
  protected readonly note = signal('');
  protected readonly lines = signal<DraftLine[]>([]);

  protected readonly newItemId = signal('');
  protected readonly newQuantity = signal(0);

  protected readonly originOptions = ORIGIN_OPTIONS;
  protected readonly priorityOptions = PRIORITY_OPTIONS;
  protected readonly plantOptions = PLANT_OPTIONS;

  protected originToString = (value: string): string => ORIGIN_OPTIONS.find((o) => o.value === value)?.label ?? value;
  protected priorityToString = (value: string): string => PRIORITY_OPTIONS.find((o) => o.value === value)?.label ?? value;
  protected plantToString = (value: string): string => PLANT_OPTIONS.find((o) => o.value === value)?.label ?? value;

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

  protected availableStock(itemId: string): number {
    return STOCK_LOTS.filter((lot) => lot.itemId === itemId).reduce((sum, lot) => sum + lot.quantity, 0);
  }

  protected canSubmit(): boolean {
    return this.area().trim().length > 0 && this.plant().trim().length > 0 && this.neededBy().length > 0 && this.lines().length > 0;
  }

  protected submit(): void {
    if (!this.canSubmit()) return;

    const lines: PurchaseRequisitionLine[] = this.lines().map((l) => ({
      itemId: l.itemId,
      quantity: l.quantity,
      unitOfMeasure: l.unitOfMeasure,
      neededBy: this.neededBy(),
      availableStock: this.availableStock(l.itemId),
    }));

    const requisition = this.purchasingState.createRequisition({
      origin: this.origin(),
      requestedBy: this.auth.currentUser()?.name ?? '',
      area: this.area().trim(),
      plant: this.plant().trim(),
      priority: this.priority(),
      neededBy: this.neededBy(),
      note: this.note().trim() || undefined,
      lines,
    });

    toast.success(`Solicitud ${requisition.number} creada`, { description: 'Queda en Borrador — puedes seguir editándola antes de enviarla a aprobación.' });
    this.router.navigate(['/apps/purchasing/requisitions', requisition.id]);
  }

  protected cancel(): void {
    this.router.navigate(['/apps/purchasing/requisitions']);
  }
}
