import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmTextareaImports } from '@ui/textarea';
import { HlmSelectImports } from '@ui/select';
import { HlmComboboxImports } from '@ui/combobox';
import { HlmCheckboxImports } from '@ui/checkbox';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { toast } from '@shared/toast';
import { ITEMS, WAREHOUSES, WORK_SHEETS } from '@core/mock-data';
import { StockIssue } from '@core/models';
import { AuthState } from '@shell/auth-state';
import { DispatchAllocation, WarehouseOpsState } from '../../warehouse-ops-state';

interface LineAllocation {
  quantity: number;
  lotId: string;
}

interface OtherLine {
  itemId: string;
  quantity: number;
  unitOfMeasure: string;
  lotId: string;
}

/** Real plantas (ubicaciones de tipo producción) del almacén — "AL01 · Planta 02", etc. */
const PLANT_OPTIONS: { value: string; label: string }[] = (WAREHOUSES[0]?.locations ?? [])
  .filter((l) => l.type === 'production')
  .map((l) => ({ value: `${WAREHOUSES[0].shortName} · ${l.name}`, label: `${WAREHOUSES[0].shortName} · ${l.name}` }));

/** Pantalla de transacción: despacha varias Notas de salida (HT distintas) en un solo viaje, y opcionalmente agrega artículos sin HT en el mismo despacho. */
@Component({
  selector: 'app-stock-issue-dispatch',
  imports: [
    FormsModule,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    ...HlmTextareaImports,
    ...HlmSelectImports,
    ...HlmComboboxImports,
    ...HlmCheckboxImports,
    EntityHeader,
  ],
  templateUrl: './stock-issue-dispatch.html',
})
export class StockIssueDispatch {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly warehouseOpsState = inject(WarehouseOpsState);
  private readonly auth = inject(AuthState);

  protected readonly receivedBy = signal('');

  /** Notas de salida pendientes/parciales que Almacén puede sumar o quitar del bloque antes de despachar. */
  protected readonly availableIssues = computed(() => this.warehouseOpsState.stockIssues().filter((i) => i.status === 'pending' || i.status === 'partial'));

  protected readonly selectedIds = signal<Set<string>>(new Set());

  /** issueId -> itemId -> cantidad/lote a despachar ahora. */
  protected readonly allocations = signal<Record<string, Record<string, LineAllocation>>>({});

  constructor() {
    const preselected = this.route.snapshot.queryParamMap.get('issueIds')?.split(',').filter(Boolean) ?? [];
    for (const issueId of preselected) {
      const issue = this.warehouseOpsState.stockIssues().find((i) => i.id === issueId);
      if (issue && (issue.status === 'pending' || issue.status === 'partial')) this.select(issue);
    }
  }

  protected readonly selectedIssues = computed(() => {
    const ids = this.selectedIds();
    return this.availableIssues().filter((i) => ids.has(i.id));
  });

  protected readonly selectedCount = computed(() => this.selectedIds().size);

  protected isSelected(issue: StockIssue): boolean {
    return this.selectedIds().has(issue.id);
  }

  protected toggleSelected(issue: StockIssue, checked: boolean): void {
    if (checked) this.select(issue);
    else this.deselect(issue);
  }

  private select(issue: StockIssue): void {
    this.selectedIds.update((set) => new Set(set).add(issue.id));
    const lineDefaults: Record<string, LineAllocation> = {};
    for (const line of issue.lines) {
      if (line.requiredQuantity - line.dispatchedQuantity <= 0) continue;
      lineDefaults[line.itemId] = { quantity: 0, lotId: this.warehouseOpsState.availableLotsFor(line.itemId)[0]?.id ?? '' };
    }
    this.allocations.update((m) => ({ ...m, [issue.id]: lineDefaults }));
  }

  private deselect(issue: StockIssue): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      next.delete(issue.id);
      return next;
    });
    this.allocations.update((m) => {
      const { [issue.id]: _removed, ...rest } = m;
      return rest;
    });
  }

  protected pending(issue: StockIssue, itemId: string): number {
    const line = issue.lines.find((l) => l.itemId === itemId);
    return line ? line.requiredQuantity - line.dispatchedQuantity : 0;
  }

  protected quantityFor(issueId: string, itemId: string): number {
    return this.allocations()[issueId]?.[itemId]?.quantity ?? 0;
  }

  protected lotFor(issueId: string, itemId: string): string {
    return this.allocations()[issueId]?.[itemId]?.lotId ?? '';
  }

  protected setQuantity(issueId: string, itemId: string, value: string): void {
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty < 0) return;
    this.allocations.update((m) => ({
      ...m,
      [issueId]: { ...m[issueId], [itemId]: { ...m[issueId]?.[itemId], quantity: qty, lotId: m[issueId]?.[itemId]?.lotId ?? '' } },
    }));
  }

  protected setLot(issueId: string, itemId: string, lotId: string): void {
    this.allocations.update((m) => ({
      ...m,
      [issueId]: { ...m[issueId], [itemId]: { ...m[issueId]?.[itemId], quantity: m[issueId]?.[itemId]?.quantity ?? 0, lotId } },
    }));
  }

  protected availableLots(itemId: string) {
    return this.warehouseOpsState.availableLotsFor(itemId);
  }

  protected availableStock(itemId: string): number {
    return this.availableLots(itemId).reduce((sum, lot) => sum + lot.quantity, 0);
  }

  protected lotToString = (itemId: string) => (lotId: string): string => {
    const lot = this.availableLots(itemId).find((l) => l.id === lotId);
    return lot ? `${lot.lot} · disp. ${lot.quantity}` : lotId;
  };

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected workSheetNumber(workSheetId: string | undefined): string | undefined {
    return WORK_SHEETS.find((ws) => ws.id === workSheetId)?.number;
  }

  // --- Artículos sin HT, agregados directamente a este mismo despacho ---

  protected readonly includeOther = signal(false);
  protected readonly otherReason = signal('');
  protected readonly otherPlant = signal(PLANT_OPTIONS[0]?.value ?? '');
  protected readonly otherLines = signal<OtherLine[]>([]);

  protected readonly plantOptions = PLANT_OPTIONS;
  protected plantToString = (value: string): string => PLANT_OPTIONS.find((o) => o.value === value)?.label ?? value;

  protected readonly newItemId = signal('');
  protected readonly newQuantity = signal(0);
  protected readonly newLotId = signal('');

  protected readonly availableItemOptions = computed<SelectFilterOption[]>(() => {
    const linkedIds = new Set(this.otherLines().map((l) => l.itemId));
    return ITEMS.filter((i) => !linkedIds.has(i.id)).map((i) => ({ value: i.id, label: `${i.code} — ${i.description}` }));
  });

  protected itemPickerToString = (value: string): string => this.availableItemOptions().find((o) => o.value === value)?.label ?? value;

  protected readonly newItemLots = computed(() => this.warehouseOpsState.availableLotsFor(this.newItemId()));

  protected lotPickerToString = (value: string): string => {
    const lot = this.newItemLots().find((l) => l.id === value);
    return lot ? `${lot.lot} · disp. ${lot.quantity}` : value;
  };

  protected onNewItemChange(itemId: string): void {
    this.newItemId.set(itemId);
    this.newLotId.set(this.warehouseOpsState.availableLotsFor(itemId)[0]?.id ?? '');
  }

  protected canAddOtherLine(): boolean {
    return this.newItemId().length > 0 && this.newQuantity() > 0 && this.newLotId().length > 0;
  }

  protected addOtherLine(): void {
    const item = ITEMS.find((i) => i.id === this.newItemId());
    if (!item || this.newQuantity() <= 0 || !this.newLotId()) return;
    this.otherLines.update((lines) => [...lines, { itemId: item.id, quantity: this.newQuantity(), unitOfMeasure: item.unitOfMeasure, lotId: this.newLotId() }]);
    this.newItemId.set('');
    this.newQuantity.set(0);
    this.newLotId.set('');
  }

  protected removeOtherLine(itemId: string): void {
    this.otherLines.update((lines) => lines.filter((l) => l.itemId !== itemId));
  }

  protected lotLabel(lotId: string): string {
    return this.warehouseOpsState.stockLots().find((l) => l.id === lotId)?.lot ?? lotId;
  }

  // --- Envío ---

  protected canSubmit(): boolean {
    if (this.receivedBy().trim().length === 0) return false;
    const hasIssueLines = Object.values(this.allocations()).some((lines) => Object.values(lines).some((a) => a.quantity > 0 && a.lotId));
    const hasOtherLines = this.includeOther() && this.otherReason().trim().length > 0 && this.otherLines().length > 0;
    return hasIssueLines || hasOtherLines;
  }

  protected submit(): void {
    if (!this.canSubmit()) return;

    const dispatchedBy = this.auth.currentUser()?.name ?? '';
    const receivedBy = this.receivedBy().trim();

    const allocationsByIssue: Record<string, DispatchAllocation[]> = {};
    for (const [issueId, lines] of Object.entries(this.allocations())) {
      const list = Object.entries(lines)
        .filter(([, a]) => a.quantity > 0 && a.lotId)
        .map(([itemId, a]) => ({ itemId, quantity: a.quantity, lotId: a.lotId }));
      if (list.length) allocationsByIssue[issueId] = list;
    }

    const dispatchedIssueIds = Object.keys(allocationsByIssue);
    if (dispatchedIssueIds.length) {
      this.warehouseOpsState.dispatchStockIssuesBulk(dispatchedIssueIds, dispatchedBy, receivedBy, allocationsByIssue);
    }

    let otherNumber: string | undefined;
    if (this.includeOther() && this.otherReason().trim().length > 0 && this.otherLines().length > 0) {
      const issue = this.warehouseOpsState.createAndDispatchOtherIssue({
        reason: this.otherReason().trim(),
        plant: this.otherPlant().trim(),
        dispatchedBy,
        receivedBy,
        lines: this.otherLines(),
      });
      otherNumber = issue.number;
    }

    const parts: string[] = [];
    if (dispatchedIssueIds.length) parts.push(`${dispatchedIssueIds.length} nota(s) de salida despachada(s)`);
    if (otherNumber) parts.push(`${otherNumber} registrada y despachada`);
    toast.success('Despacho en bloque registrado', { description: `${parts.join(' · ')} — entregado a ${receivedBy}.` });

    this.router.navigate(['/apps/inventory/stock-issues']);
  }

  protected cancel(): void {
    this.router.navigate(['/apps/inventory/stock-issues']);
  }
}
