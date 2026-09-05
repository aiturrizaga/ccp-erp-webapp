import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmCardImports } from '@ui/card';
import { HlmButtonImports } from '@ui/button';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmPopoverImports } from '@ui/popover';
import { HlmSelectImports } from '@ui/select';
import { toast } from '@shared/toast';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ITEMS } from '@core/mock-data';
import {
  Item,
  ManufacturingRun,
  RunMaterialConsumption,
  RunStatus,
  RUN_STATUS_LABEL,
  Tone,
  WorkSheet,
  WorkSheetLine,
  WORK_SHEET_STATUS_LABEL,
  WorkSheetStatus,
  allRuns,
  bottleneckOperation,
  lineProducedQuantity,
  lineStatus,
  workSheetProgressPct,
  workSheetStatus,
} from '@core/models';
import { ProductionState } from '../../production-state';
import { ItemPicker } from '@shared/components/item-picker/item-picker';

interface DraftMaterial extends RunMaterialConsumption {
  _uid: number;
}
let uidSeq = 1;

const TODAY = '2026-09-04';

const STATUS_TONE: Record<WorkSheetStatus, Tone> = {
  planned: 'neutral',
  released: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

const RUN_STATUS_TONE: Record<RunStatus, Tone> = {
  planned: 'neutral',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

@Component({
  selector: 'app-work-sheet-detail',
  imports: [
    FormsModule,
    RouterLink,
    NgIcon,
    ...HlmCardImports,
    ...HlmButtonImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    ...HlmPopoverImports,
    ...HlmSelectImports,
    EntityHeader,
    StatusBadge,
    EmptyState,
    ItemPicker,
  ],
  templateUrl: './work-sheet-detail.html',
})
export class WorkSheetDetail {
  private readonly productionState = inject(ProductionState);

  readonly id = input.required<string>();

  protected readonly workSheet = computed(() => this.productionState.workSheets().find((w) => w.id === this.id()));

  protected readonly status = computed(() => {
    const ws = this.workSheet();
    return ws ? workSheetStatus(ws) : 'planned';
  });

  protected readonly progress = computed(() => {
    const ws = this.workSheet();
    return ws ? workSheetProgressPct(ws) : 0;
  });

  protected readonly bottleneck = computed(() => {
    const ws = this.workSheet();
    return ws ? bottleneckOperation(ws, TODAY) : undefined;
  });

  protected readonly isDelayed = computed(() => {
    const ws = this.workSheet();
    return !!ws && TODAY > ws.committedDate && this.status() !== 'completed';
  });

  /** "Disponibilidad de materiales" — any material short across any line. */
  protected readonly materialShortfalls = computed(() => {
    const ws = this.workSheet();
    if (!ws) return [];
    return ws.lines.flatMap((line) => line.materials.filter((m) => m.available < m.required).map((m) => ({ line, material: m })));
  });

  /** "Listo para ingresar a almacén" — every run of every line completed with no unresolved non-conformity. */
  protected readonly readyForWarehouse = computed(() => {
    const ws = this.workSheet();
    if (!ws) return false;
    if (this.status() !== 'completed') return false;
    return !this.nonConformities().some((nc) => !nc.resolved);
  });

  protected readonly nonConformities = computed(() => this.productionState.nonConformities().filter((n) => n.workSheetId === this.id()));
  protected readonly inspections = computed(() => this.productionState.qualityInspections().filter((q) => q.workSheetId === this.id()));

  protected readonly items: Item[] = ITEMS;

  protected productName(productId: string): string {
    return this.productionState.products().find((p) => p.id === productId)?.name ?? productId;
  }

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected machineLabel(machineId?: string): string {
    if (!machineId) return '—';
    return this.productionState.machines().find((m) => m.id === machineId)?.name ?? machineId;
  }

  protected moldLabel(moldId?: string): string {
    if (!moldId) return '—';
    return this.productionState.molds().find((m) => m.id === moldId)?.code ?? moldId;
  }

  protected workCenterLabel(workCenterId?: string): string {
    if (!workCenterId) return '—';
    return this.productionState.workCenters().find((w) => w.id === workCenterId)?.name ?? workCenterId;
  }

  protected shortfall(required: number, available: number): boolean {
    return available < required;
  }

  protected lineStatus(line: WorkSheetLine): WorkSheetStatus {
    return lineStatus(line);
  }

  protected lineProduced(line: WorkSheetLine): number {
    return lineProducedQuantity(line);
  }

  protected allRunsFor(ws: WorkSheet): ManufacturingRun[] {
    return allRuns(ws);
  }

  protected statusLabel(status: WorkSheetStatus): string {
    return WORK_SHEET_STATUS_LABEL[status];
  }

  protected statusTone(status: WorkSheetStatus): Tone {
    return STATUS_TONE[status];
  }

  protected runStatusLabel(status: RunStatus): string {
    return RUN_STATUS_LABEL[status];
  }

  protected runStatusTone(status: RunStatus): Tone {
    return RUN_STATUS_TONE[status];
  }

  // --- Registrar nueva corrida ---

  protected readonly newRunLineId = signal('');
  protected readonly newRunOperator = signal('');
  protected readonly newRunPlannedQty = signal(0);
  protected readonly newRunScheduledStart = signal('');
  protected readonly newRunScheduledEnd = signal('');
  protected readonly newRunWorkCenterId = signal('');
  protected readonly newRunMachineId = signal('');
  protected readonly newRunMoldId = signal('');
  protected readonly newRunIncidents = signal('');
  protected readonly newRunMaterials = signal<DraftMaterial[]>([]);

  protected readonly machineOptions = computed(() => this.productionState.machines());
  protected readonly moldOptions = computed(() => this.productionState.molds());
  protected readonly workCenterOptions = computed(() => this.productionState.workCenters());

  protected openNewRunDraft(line: WorkSheetLine): void {
    const bom = this.productionState.billsOfMaterials().find((b) => b.id === line.bomId);
    this.newRunLineId.set(line.id);
    this.newRunOperator.set('');
    this.newRunPlannedQty.set(line.plannedQuantity - lineProducedQuantity(line));
    this.newRunScheduledStart.set('');
    this.newRunScheduledEnd.set('');
    this.newRunWorkCenterId.set(bom?.routing[0]?.workCenterId ?? this.productionState.workCenters()[0]?.id ?? '');
    this.newRunMachineId.set('');
    this.newRunMoldId.set('');
    this.newRunIncidents.set('');
    this.newRunMaterials.set([]);
  }

  protected canAddRun(): boolean {
    return this.newRunOperator().trim().length > 0 && this.newRunPlannedQty() > 0 && !!this.newRunScheduledStart() && !!this.newRunScheduledEnd() && !!this.newRunWorkCenterId();
  }

  protected addNewRunMaterial(): void {
    this.newRunMaterials.update((rows) => [...rows, { _uid: uidSeq++, itemId: '', quantity: 0, unitOfMeasure: 'UND' }]);
  }
  protected removeNewRunMaterial(i: number): void {
    this.newRunMaterials.update((rows) => rows.filter((_, idx) => idx !== i));
  }
  protected setNewRunMaterial(i: number, patch: Partial<RunMaterialConsumption>): void {
    this.newRunMaterials.update((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  protected onNewRunMaterialPicked(i: number, item: Item): void {
    this.setNewRunMaterial(i, { itemId: item.id, unitOfMeasure: item.unitOfMeasure });
  }
  protected onNewRunMaterialCleared(i: number): void {
    this.setNewRunMaterial(i, { itemId: '' });
  }

  protected confirmAddRun(): void {
    const ws = this.workSheet();
    const line = ws?.lines.find((l) => l.id === this.newRunLineId());
    if (!ws || !line || !this.canAddRun()) return;
    this.productionState.addRun(ws.id, line.id, {
      sequence: line.runs.length + 1,
      workCenterId: this.newRunWorkCenterId(),
      machineId: this.newRunMachineId() || undefined,
      moldId: this.newRunMoldId() || undefined,
      operatorName: this.newRunOperator().trim(),
      scheduledStart: this.newRunScheduledStart(),
      scheduledEnd: this.newRunScheduledEnd(),
      plannedQuantity: this.newRunPlannedQty(),
      producedQuantity: 0,
      rejectedQuantity: 0,
      reprocessedQuantity: 0,
      materialsConsumed: this.newRunMaterials()
        .filter((m) => m.itemId && m.quantity > 0)
        .map(({ _uid, ...m }) => m),
      incidents: this.newRunIncidents().trim() || undefined,
      status: 'planned',
    });
    toast.success('Corrida de fabricación registrada', { description: `Se agregó a la línea de ${this.productName(line.productId)}.` });
  }

  // --- Editar corrida existente ---

  protected readonly editRunLineId = signal('');
  protected readonly editRunId = signal('');
  protected readonly editRunStatus = signal<RunStatus>('planned');
  protected readonly editRunActualStart = signal('');
  protected readonly editRunActualEnd = signal('');
  protected readonly editRunProduced = signal(0);
  protected readonly editRunRejected = signal(0);
  protected readonly editRunReprocessed = signal(0);
  protected readonly editRunIncidents = signal('');

  protected readonly runStatusOptions = (Object.keys(RUN_STATUS_LABEL) as RunStatus[]).map((value) => ({ value, label: RUN_STATUS_LABEL[value] }));
  protected runStatusToString = (v: string) => RUN_STATUS_LABEL[v as RunStatus] ?? v;

  protected openEditRunDraft(line: WorkSheetLine, run: ManufacturingRun): void {
    this.editRunLineId.set(line.id);
    this.editRunId.set(run.id);
    this.editRunStatus.set(run.status);
    this.editRunActualStart.set(run.actualStart ?? '');
    this.editRunActualEnd.set(run.actualEnd ?? '');
    this.editRunProduced.set(run.producedQuantity);
    this.editRunRejected.set(run.rejectedQuantity);
    this.editRunReprocessed.set(run.reprocessedQuantity);
    this.editRunIncidents.set(run.incidents ?? '');
  }

  protected confirmEditRun(): void {
    const ws = this.workSheet();
    if (!ws || !this.editRunLineId() || !this.editRunId()) return;
    this.productionState.updateRun(ws.id, this.editRunLineId(), this.editRunId(), {
      status: this.editRunStatus(),
      actualStart: this.editRunActualStart() || undefined,
      actualEnd: this.editRunActualEnd() || undefined,
      producedQuantity: this.editRunProduced(),
      rejectedQuantity: this.editRunRejected(),
      reprocessedQuantity: this.editRunReprocessed(),
      incidents: this.editRunIncidents().trim() || undefined,
    });
    toast.success(`Corrida ${this.editRunId()} actualizada`);
  }
}
