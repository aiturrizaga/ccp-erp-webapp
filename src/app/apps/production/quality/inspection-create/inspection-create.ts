import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { HlmCheckboxImports } from '@ui/checkbox';
import { HlmPopoverImports } from '@ui/popover';
import { HlmComboboxImports } from '@ui/combobox';
import { toast } from '@shared/toast';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import {
  InspectionFormResponse,
  InspectionFormat,
  InspectionSection,
  InspectionTableColumn,
  QualityInspectionResult,
  QUALITY_INSPECTION_RESULT_LABEL,
  Tone,
  WorkSheet,
} from '@core/models';
import { ProductionState } from '../../production-state';

const TODAY = '2026-09-12';

const RESULT_TONE: Record<QualityInspectionResult, Tone> = {
  pass: 'success',
  fail: 'danger',
  pending: 'neutral',
};

interface DraftRow {
  _uid: number;
  cells: Record<string, string>;
}
let uidSeq = 1;

@Component({
  selector: 'app-inspection-create',
  imports: [
    FormsModule,
    NgIcon,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    ...HlmSelectImports,
    ...HlmCheckboxImports,
    ...HlmPopoverImports,
    ...HlmComboboxImports,
    EntityHeader,
  ],
  templateUrl: './inspection-create.html',
})
export class InspectionCreate {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly productionState = inject(ProductionState);

  /** 1 Hoja de trabajo · 2 Productos · 3 Formato · 4 Llenar. */
  protected readonly step = signal(1);
  protected readonly workSheetId = signal('');
  protected readonly selectedLineIds = signal<string[]>([]);
  protected readonly formatId = signal('');

  protected readonly headerDrafts = signal<Record<string, string>>({});
  protected readonly itemDrafts = signal<Record<string, string>>({});
  protected readonly fieldDrafts = signal<Record<string, string>>({});
  protected readonly tableDrafts = signal<Record<string, DraftRow[]>>({});

  protected readonly inspectedBy = signal('');
  protected readonly inspectedAt = signal(TODAY);
  protected readonly notes = signal('');
  /** Resultado 100% manual — sin auto-evaluación. */
  protected readonly manualResult = signal<QualityInspectionResult>('pending');
  protected readonly generateNonConformity = signal(true);

  protected readonly submitPopover = signal<'open' | 'closed'>('closed');

  protected readonly workSheet = computed(() => this.productionState.workSheets().find((w) => w.id === this.workSheetId()));

  protected readonly productOptions = computed(() =>
    (this.workSheet()?.lines ?? []).map((l) => ({
      lineId: l.id,
      productId: l.productId,
      name: this.productionState.products().find((p) => p.id === l.productId)?.name ?? l.productId,
      quantity: l.plannedQuantity,
      unit: l.unitOfMeasure,
    })),
  );

  protected readonly selectedProductIds = computed(() =>
    this.selectedLineIds().map((lineId) => this.productOptions().find((o) => o.lineId === lineId)?.productId ?? ''),
  );

  protected readonly selectedProductNames = computed(() =>
    this.selectedLineIds().map((lineId) => this.productOptions().find((o) => o.lineId === lineId)?.name ?? lineId),
  );

  protected readonly format = computed(() => this.productionState.inspectionFormats().find((f) => f.id === this.formatId()));

  protected readonly canGoNext = computed(() => {
    if (this.step() === 1) return !!this.workSheetId();
    if (this.step() === 2) return this.selectedLineIds().length > 0;
    if (this.step() === 3) return !!this.formatId();
    return true;
  });

  protected readonly canSubmit = computed(
    () => this.step() === 4 && !!this.workSheetId() && this.selectedLineIds().length > 0 && !!this.formatId() && this.inspectedBy().trim().length > 0,
  );

  constructor() {
    const presetWorkSheetId = this.route.snapshot.queryParamMap.get('workSheetId');
    if (presetWorkSheetId) this.workSheetId.set(presetWorkSheetId);
  }

  protected resultLabel(): string {
    return QUALITY_INSPECTION_RESULT_LABEL[this.manualResult()];
  }
  protected resultTone(): Tone {
    return RESULT_TONE[this.manualResult()];
  }

  // --- Navegación de pasos ---

  protected readonly steps = [1, 2, 3, 4] as const;
  protected readonly stepLabel: Record<number, string> = { 1: 'HT', 2: 'Productos', 3: 'Formato', 4: 'Llenar' };

  protected next(): void {
    if (!this.canGoNext()) return;
    if (this.step() === 3) this.onSelectFormat(this.formatId());
    this.step.update((s) => Math.min(s + 1, 4));
  }
  protected back(): void {
    this.step.update((s) => Math.max(s - 1, 1));
  }
  /** Solo permite retroceder a pasos ya visitados — no se salta selecciones. */
  protected goToStep(n: number): void {
    if (n < this.step()) this.step.set(n);
  }

  // --- Paso 1 · HT ---

  protected workSheetToString = (v: string) => this.productionState.workSheets().find((w) => w.id === v)?.number ?? 'Selecciona una hoja de trabajo…';

  protected onWorkSheetChange(id: string): void {
    this.workSheetId.set(id);
    this.selectedLineIds.set([]);
    this.formatId.set('');
  }

  // --- Paso 2 · Productos ---

  protected toggleLine(lineId: string): void {
    this.selectedLineIds.update((ids) => (ids.includes(lineId) ? ids.filter((i) => i !== lineId) : [...ids, lineId]));
  }

  // --- Paso 3 · Formato ---

  protected onSelectFormat(id: string): void {
    this.formatId.set(id);
    this.buildHeaderDrafts();
    this.buildTableDrafts();
    this.itemDrafts.set({});
    this.fieldDrafts.set({});
  }

  private resolveHeaderValue(auto: string, ws: WorkSheet): string {
    switch (auto) {
      case 'workSheetNumber':
        return ws.number;
      case 'customerName':
        return ws.customerName ?? '';
      case 'plant':
        return ws.plant ?? '';
      case 'currentDate':
        return this.inspectedAt();
      case 'products':
        return this.selectedProductNames().join(', ');
    }
    return '';
  }

  private buildHeaderDrafts(): void {
    const ws = this.workSheet();
    const f = this.format();
    if (!ws || !f) return;
    const drafts: Record<string, string> = {};
    for (const hf of f.headerFields) {
      drafts[hf.id] = hf.auto ? this.resolveHeaderValue(hf.auto, ws) : '';
    }
    this.headerDrafts.set(drafts);
  }

  // --- Drafts de tablas dinámicas ---

  private tableSection(tableId: string): InspectionSection | undefined {
    return this.format()?.sections.find((s) => s.kind === 'table' && s.id === tableId);
  }

  protected isDynamicTable(table: InspectionSection): boolean {
    return table.kind === 'table' && table.table.dynamic;
  }

  private newDraftRow(tableSection: InspectionSection, rowIndex: number): DraftRow {
    if (tableSection.kind !== 'table') return { _uid: uidSeq++, cells: {} };
    const cells: Record<string, string> = {};
    for (const col of tableSection.table.columns) {
      if (col.auto === 'sequence') {
        cells[col.id] = `ITEM ${String(rowIndex + 1).padStart(2, '0')}`;
      } else if (col.auto === 'prefill' && col.prefill) {
        cells[col.id] = col.prefill[rowIndex] ?? '';
      } else {
        cells[col.id] = '';
      }
    }
    return { _uid: uidSeq++, cells };
  }

  private buildTableDrafts(): void {
    const f = this.format();
    if (!f) return;
    const drafts: Record<string, DraftRow[]> = {};
    for (const sec of f.sections) {
      if (sec.kind !== 'table' || !sec.table.dynamic) continue;
      const defaultRows = sec.table.defaultRows ?? 0;
      const prefillCol = sec.table.columns.find((c) => c.auto === 'prefill');
      const n = Math.max(defaultRows, prefillCol?.prefill?.length ?? 0);
      const rows: DraftRow[] = [];
      for (let i = 0; i < n; i++) rows.push(this.newDraftRow(sec, i));
      drafts[sec.id] = rows;
    }
    this.tableDrafts.set(drafts);
  }

  protected tableRows(tableId: string): DraftRow[] {
    return this.tableDrafts()[tableId] ?? [];
  }
  protected addRow(tableId: string): void {
    const sec = this.tableSection(tableId);
    if (!sec) return;
    this.tableDrafts.update((t) => ({ ...t, [tableId]: [...(t[tableId] ?? []), this.newDraftRow(sec, (t[tableId] ?? []).length)] }));
  }
  protected removeRow(tableId: string, i: number): void {
    this.tableDrafts.update((t) => ({ ...t, [tableId]: (t[tableId] ?? []).filter((_, idx) => idx !== i) }));
  }
  protected setCell(tableId: string, i: number, colId: string, value: string): void {
    this.tableDrafts.update((t) => ({
      ...t,
      [tableId]: (t[tableId] ?? []).map((r, idx) => (idx === i ? { ...r, cells: { ...r.cells, [colId]: value } } : r)),
    }));
  }
  protected isAutoCell(col: InspectionTableColumn): boolean {
    return !!col.auto;
  }

  // --- Drafts de ítems / campos / header ---

  protected setItem(itemId: string, value: string): void {
    this.itemDrafts.update((d) => ({ ...d, [itemId]: value }));
  }
  protected setField(fieldId: string, value: string): void {
    this.fieldDrafts.update((d) => ({ ...d, [fieldId]: value }));
  }
  protected setHeader(fieldId: string, value: string): void {
    this.headerDrafts.update((d) => ({ ...d, [fieldId]: value }));
  }
  protected headerValue(id: string): string {
    return this.headerDrafts()[id] ?? '';
  }

  // --- Guardar ---

  protected submit(): void {
    const ws = this.workSheet();
    const f = this.format();
    if (!ws || !f || !this.canSubmit()) return;
    this.submitPopover.set('closed');

    const header: Record<string, string> = {};
    for (const hf of f.headerFields) {
      header[hf.id] = hf.auto ? this.resolveHeaderValue(hf.auto, ws) : this.headerDrafts()[hf.id] ?? '';
    }

    const tables = Object.fromEntries(
      Object.entries(this.tableDrafts()).map(([tid, rows]) => [tid, rows.map((r) => ({ cells: r.cells }))]),
    );

    const formResponse: InspectionFormResponse = {
      header,
      items: { ...this.itemDrafts() },
      fields: { ...this.fieldDrafts() },
      tables,
      notes: this.notes().trim() || undefined,
    };

    const inspection = this.productionState.addInspection({
      protocolId: '',
      workSheetId: ws.id,
      lineId: '',
      runId: '',
      operationName: f.name,
      inspectedBy: this.inspectedBy().trim(),
      inspectedAt: this.inspectedAt() + 'T' + new Date().toISOString().slice(11, 19),
      fieldResults: [],
      overallResult: this.manualResult(),
      formatId: f.id,
      formatCode: f.code,
      formatName: f.name,
      productIds: this.selectedProductIds(),
      formResponse,
      notes: this.notes().trim() || undefined,
    });

    if (inspection.overallResult === 'fail' && this.generateNonConformity()) {
      this.productionState.addNonConformity({
        workSheetId: inspection.workSheetId,
        lineId: '',
        runId: '',
        operationName: inspection.operationName,
        inspectionId: inspection.id,
        reason: `No conforme ${f.code} — ${f.name} para ${this.selectedProductNames().join(', ')}.`,
        disposition: 'reproceso',
        resolved: false,
        createdAt: inspection.inspectedAt,
      });
    }

    const resultText = this.resultLabel();
    toast.success(`Inspección ${inspection.id} registrada`, { description: resultText });
    this.router.navigate(['/apps/production/quality/inspections', inspection.id]);
  }

  protected cancel(): void {
    const ws = this.workSheetId();
    this.router.navigate(ws ? ['/apps/production/work-sheets', ws] : ['/apps/production/quality/inspections']);
  }
}