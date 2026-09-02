import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmDialogImports } from '@ui/dialog';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmTextareaImports } from '@ui/textarea';
import { HlmSelectImports } from '@ui/select';
import { HlmComboboxImports } from '@ui/combobox';
import { HlmCheckboxImports } from '@ui/checkbox';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { toast } from '@shared/toast';
import { ITEMS, STOCK_LOTS, WAREHOUSES } from '@core/mock-data';
import { PurchaseRequirementLine, ReplenishmentSuggestion, REQUISITION_PRIORITY_LABEL, RequisitionPriority } from '@core/models';
import { AuthState } from '@shell/auth-state';
import { PurchasingState } from '../../purchasing-state';

const PRIORITY_OPTIONS: { value: RequisitionPriority; label: string }[] = (
  Object.entries(REQUISITION_PRIORITY_LABEL) as [RequisitionPriority, string][]
).map(([value, label]) => ({ value, label }));

/** Real plantas (ubicaciones de tipo producción) del almacén — "AL01 · Planta 02", etc. */
const PLANT_OPTIONS: { value: string; label: string }[] = (WAREHOUSES[0]?.locations ?? [])
  .filter((l) => l.type === 'production')
  .map((l) => ({ value: `${WAREHOUSES[0].shortName} · ${l.name}`, label: `${WAREHOUSES[0].shortName} · ${l.name}` }));

interface RequirementLineRow {
  line: PurchaseRequirementLine;
  /** Index into draftLines() — needed to target the right line when editing/striking it out. */
  index: number;
}

interface ItemGroup {
  itemId: string;
  unitOfMeasure: string;
  /** Sum of every non-struck-out line's quantity for this item — what would actually be requested. */
  total: number;
  rows: RequirementLineRow[];
}

/** Pantalla de transacción: agrupa varias filas de Reposición sugerida (HT o manuales) en un solo Requerimiento de Compra en bloque. */
@Component({
  selector: 'app-requirement-create',
  imports: [
    FormsModule,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmDialogImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    ...HlmTextareaImports,
    ...HlmSelectImports,
    ...HlmComboboxImports,
    ...HlmCheckboxImports,
    EntityHeader,
  ],
  templateUrl: './requirement-create.html',
})
export class RequirementCreate {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly purchasingState = inject(PurchasingState);
  private readonly auth = inject(AuthState);

  protected readonly area = signal(this.auth.currentUser()?.area ?? 'Almacén');
  protected readonly plant = signal(PLANT_OPTIONS[0]?.value ?? '');
  protected readonly priority = signal<RequisitionPriority>('medium');
  protected readonly neededBy = signal('');
  protected readonly note = signal('');

  protected readonly priorityOptions = PRIORITY_OPTIONS;
  protected readonly plantOptions = PLANT_OPTIONS;

  protected priorityToString = (value: string): string => PRIORITY_OPTIONS.find((o) => o.value === value)?.label ?? value;
  protected plantToString = (value: string): string => PLANT_OPTIONS.find((o) => o.value === value)?.label ?? value;

  /** Sugerencias libres (status 'draft') que Almacén puede sumar o quitar del bloque antes de confirmarlo. */
  protected readonly availableSuggestions = computed(() => this.purchasingState.suggestions().filter((s) => s.status === 'draft'));

  protected readonly selectedIds = signal<Set<string>>(new Set());

  /** Working copy of the block's lines — one row per artículo per contributing sugerencia, editable before the RC even exists. Carried into `createRequirement` as-is. */
  protected readonly draftLines = signal<PurchaseRequirementLine[]>([]);

  constructor() {
    const preselected = this.route.snapshot.queryParamMap.get('suggestionIds')?.split(',').filter(Boolean) ?? [];
    if (!preselected.length) return;

    this.selectedIds.set(new Set(preselected));
    const suggestions = this.purchasingState.suggestions();
    const lines: PurchaseRequirementLine[] = [];
    for (const id of preselected) {
      const suggestion = suggestions.find((s) => s.id === id);
      if (!suggestion) continue;
      for (const line of suggestion.lines) {
        if (line.notNeeded) continue;
        lines.push({ suggestionId: id, itemId: line.itemId, quantity: line.quantity, unitOfMeasure: line.unitOfMeasure, availableStock: line.availableStock });
      }
    }
    this.draftLines.set(lines);
  }

  protected isSelected(suggestion: ReplenishmentSuggestion): boolean {
    return this.selectedIds().has(suggestion.id);
  }

  /** Adding a suggestion snapshots its needed lines into the draft; removing it drops just those lines, leaving edits on the rest of the block untouched. */
  protected toggleSelected(suggestion: ReplenishmentSuggestion, checked: boolean): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (checked) next.add(suggestion.id);
      else next.delete(suggestion.id);
      return next;
    });

    if (checked) {
      const newLines: PurchaseRequirementLine[] = suggestion.lines
        .filter((line) => !line.notNeeded)
        .map((line) => ({ suggestionId: suggestion.id, itemId: line.itemId, quantity: line.quantity, unitOfMeasure: line.unitOfMeasure, availableStock: line.availableStock }));
      this.draftLines.update((lines) => [...lines, ...newLines]);
    } else {
      this.draftLines.update((lines) => lines.filter((line) => line.suggestionId !== suggestion.id));
    }
  }

  protected readonly selectedCount = computed(() => this.selectedIds().size);

  /**
   * Groups the draft lines by artículo so Almacén can see, per item, both the total that would be
   * requested and exactly how much each contributing HT/sugerencia is asking for — same breakdown
   * shown later on the RC detail page and used by `createQuotationFromRequirement`.
   */
  protected readonly itemGroups = computed<ItemGroup[]>(() => {
    const groups = new Map<string, ItemGroup>();
    this.draftLines().forEach((line, index) => {
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

  protected setLineQuantity(lineIndex: number, value: string): void {
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity < 0) return;
    this.draftLines.update((lines) => lines.map((line, i) => (i === lineIndex ? { ...line, quantity } : line)));
  }

  /** "Quitar" no borra la línea — la tacha, dejando registro de que el artículo estuvo pedido y se decidió no comprarlo en este bloque. */
  protected setLineNotNeeded(lineIndex: number, notNeeded: boolean): void {
    this.draftLines.update((lines) => lines.map((line, i) => (i === lineIndex ? { ...line, notNeeded } : line)));
  }

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  /** Live stock, not the snapshot taken when the line was drafted — the same source Reposición sugerida uses. */
  protected availableStock(itemId: string): number {
    return STOCK_LOTS.filter((lot) => lot.itemId === itemId).reduce((sum, lot) => sum + lot.quantity, 0);
  }

  protected suggestionNumber(suggestionId: string): string {
    return this.purchasingState.suggestions().find((s) => s.id === suggestionId)?.number ?? suggestionId;
  }

  // --- Agregar artículo directamente al bloque, sin pasar por ninguna sugerencia ---

  protected readonly newItemId = signal('');
  protected readonly newQuantity = signal(0);

  protected readonly availableItemOptions = computed<SelectFilterOption[]>(() => {
    const linkedIds = new Set(this.draftLines().map((l) => l.itemId));
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

    this.draftLines.update((lines) => [
      ...lines,
      { itemId: item.id, quantity: this.newQuantity(), unitOfMeasure: item.unitOfMeasure, availableStock: this.availableStock(item.id), addedManually: true },
    ]);
    toast.success(`${item.code} — ${item.description} agregado al bloque`);
  }

  protected canSubmit(): boolean {
    return this.draftLines().length > 0 && this.area().trim().length > 0 && this.plant().trim().length > 0 && this.neededBy().length > 0;
  }

  protected submit(): void {
    if (!this.canSubmit()) return;

    const requirement = this.purchasingState.createRequirement({
      suggestionIds: Array.from(this.selectedIds()),
      lines: this.draftLines(),
      requestedBy: this.auth.currentUser()?.name ?? '',
      area: this.area().trim(),
      plant: this.plant().trim(),
      priority: this.priority(),
      neededBy: this.neededBy(),
      note: this.note().trim() || undefined,
    });

    toast.success(`Requerimiento de Compra ${requirement.number} creado`, {
      description: `Agrupa ${requirement.suggestionIds.length} sugerencia(s) — queda en Borrador antes de enviarlo a aprobación.`,
    });
    this.router.navigate(['/apps/purchasing/requirements', requirement.id]);
  }

  protected cancel(): void {
    this.router.navigate(['/apps/purchasing/replenishment-suggestions']);
  }
}
