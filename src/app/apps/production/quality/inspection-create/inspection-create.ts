import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { HlmCheckboxImports } from '@ui/checkbox';
import { HlmPopoverImports } from '@ui/popover';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { toast } from '@shared/toast';
import { QualityField, QualityFieldResult, QualityInspectionResult } from '@core/models';
import { ProductionState } from '../../production-state';

const TODAY = '2026-09-04';

interface DraftFieldResult {
  field: QualityField;
  value: string;
  passOverride: boolean | null;
}

@Component({
  selector: 'app-inspection-create',
  imports: [FormsModule, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, ...HlmCheckboxImports, ...HlmPopoverImports, EntityHeader],
  templateUrl: './inspection-create.html',
})
export class InspectionCreate {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly productionState = inject(ProductionState);

  protected readonly workSheetId = signal('');
  protected readonly lineId = signal('');
  protected readonly runId = signal('');
  protected readonly protocolId = signal('');
  protected readonly operationName = signal('');
  protected readonly inspectedBy = signal('');
  protected readonly notes = signal('');
  protected readonly evidenceRefs = signal('');
  protected readonly fieldDrafts = signal<DraftFieldResult[]>([]);
  protected readonly generateNonConformity = signal(true);

  protected readonly workSheet = computed(() => this.productionState.workSheets().find((w) => w.id === this.workSheetId()));
  protected readonly lines = computed(() => this.workSheet()?.lines ?? []);
  protected readonly runs = computed(() => this.lines().find((l) => l.id === this.lineId())?.runs ?? []);
  protected readonly protocol = computed(() => this.productionState.qualityProtocols().find((p) => p.id === this.protocolId()));

  protected readonly canSubmit = computed(
    () => !!this.workSheetId() && !!this.lineId() && !!this.runId() && !!this.protocolId() && this.inspectedBy().trim().length > 0 && this.fieldDrafts().length > 0,
  );

  constructor() {
    const presetWorkSheetId = this.route.snapshot.queryParamMap.get('workSheetId');
    if (presetWorkSheetId) this.workSheetId.set(presetWorkSheetId);
  }

  protected workSheetToString = (v: string) => this.productionState.workSheets().find((w) => w.id === v)?.number ?? 'Selecciona una HT…';
  protected lineToString = (v: string) => {
    const line = this.lines().find((l) => l.id === v);
    return line ? this.productionState.products().find((p) => p.id === line.productId)?.name ?? line.productId : 'Selecciona una línea…';
  };
  protected protocolToString = (v: string) => this.productionState.qualityProtocols().find((p) => p.id === v)?.name ?? 'Selecciona un protocolo…';

  protected onWorkSheetChange(id: string): void {
    this.workSheetId.set(id);
    this.lineId.set('');
    this.runId.set('');
  }
  protected onLineChange(id: string): void {
    this.lineId.set(id);
    this.runId.set('');
  }
  protected onProtocolChange(id: string): void {
    this.protocolId.set(id);
    const p = this.productionState.qualityProtocols().find((x) => x.id === id);
    this.operationName.set(p?.appliesToOperations[0] ?? '');
    this.fieldDrafts.set((p?.fields ?? []).map((field) => ({ field, value: '', passOverride: null })));
  }

  protected setFieldValue(i: number, value: string): void {
    this.fieldDrafts.update((rows) => rows.map((r, idx) => (idx === i ? { ...r, value } : r)));
  }
  protected setFieldPassOverride(i: number, pass: boolean): void {
    this.fieldDrafts.update((rows) => rows.map((r, idx) => (idx === i ? { ...r, passOverride: pass } : r)));
  }

  /** Auto-evalúa conformidad por rango/valor esperado — el usuario puede sobrescribirla manualmente. */
  protected computedPass(draft: DraftFieldResult): boolean {
    if (draft.passOverride !== null) return draft.passOverride;
    const { field, value } = draft;
    if (!value.trim()) return !field.required ? true : false;
    if (field.dataType === 'number') {
      const n = Number(value);
      if (Number.isNaN(n)) return false;
      if (field.minRange != null && n < field.minRange) return false;
      if (field.maxRange != null && n > field.maxRange) return false;
      return true;
    }
    if (field.dataType === 'boolean') {
      return field.expectedValue != null ? value === field.expectedValue : true;
    }
    return true;
  }

  protected readonly overallResult = computed<QualityInspectionResult>(() => {
    const drafts = this.fieldDrafts();
    if (!drafts.length) return 'pending';
    return drafts.every((d) => this.computedPass(d)) ? 'pass' : 'fail';
  });

  protected readonly submitPopover = signal<'open' | 'closed'>('closed');

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.submitPopover.set('closed');

    const fieldResults: QualityFieldResult[] = this.fieldDrafts().map((d) => ({ fieldId: d.field.id, value: d.value, pass: this.computedPass(d) }));
    const overallResult = this.overallResult();

    const inspection = this.productionState.addInspection({
      protocolId: this.protocolId(),
      workSheetId: this.workSheetId(),
      lineId: this.lineId(),
      runId: this.runId(),
      operationName: this.operationName().trim() || this.protocol()?.appliesToOperations[0] || '',
      inspectedBy: this.inspectedBy().trim(),
      inspectedAt: TODAY + 'T' + new Date().toISOString().slice(11, 19),
      fieldResults,
      evidenceRefs: this.evidenceRefs()
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      overallResult,
      notes: this.notes().trim() || undefined,
    });

    if (overallResult === 'fail' && this.generateNonConformity()) {
      const failing = fieldResults.filter((r) => !r.pass).map((r) => this.protocol()?.fields.find((f) => f.id === r.fieldId)?.label ?? r.fieldId);
      this.productionState.addNonConformity({
        workSheetId: this.workSheetId(),
        lineId: this.lineId(),
        runId: this.runId(),
        operationName: inspection.operationName,
        inspectionId: inspection.id,
        reason: `Falló inspección "${this.protocol()?.name}" en: ${failing.join(', ')}.`,
        disposition: 'reproceso',
        resolved: false,
        createdAt: inspection.inspectedAt,
      });
    }

    toast.success(`Inspección ${inspection.id} registrada`, { description: overallResult === 'pass' ? 'Conforme' : overallResult === 'fail' ? 'No conforme' : undefined });
    this.router.navigate(['/apps/production/quality/inspections', inspection.id]);
  }

  protected cancel(): void {
    const ws = this.workSheetId();
    this.router.navigate(ws ? ['/apps/production/work-sheets', ws] : ['/apps/production/quality/inspections']);
  }
}
