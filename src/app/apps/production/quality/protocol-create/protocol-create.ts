import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { HlmCheckboxImports } from '@ui/checkbox';
import { HlmPopoverImports } from '@ui/popover';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { toast } from '@shared/toast';
import { QualityField, QualityFieldDataType, QualityProtocolStatus, QUALITY_PROTOCOL_STATUS_LABEL } from '@core/models';
import { ProductionState } from '../../production-state';

interface DraftField extends QualityField {
  _uid: number;
}
let uidSeq = 1;

const STATUS_OPTIONS = (Object.keys(QUALITY_PROTOCOL_STATUS_LABEL) as QualityProtocolStatus[]).map((value) => ({ value, label: QUALITY_PROTOCOL_STATUS_LABEL[value] }));
const DATA_TYPE_LABEL: Record<QualityFieldDataType, string> = { number: 'Número', text: 'Texto', boolean: 'Sí/No', select: 'Selección' };
const DATA_TYPE_OPTIONS = (Object.keys(DATA_TYPE_LABEL) as QualityFieldDataType[]).map((value) => ({ value, label: DATA_TYPE_LABEL[value] }));

@Component({
  selector: 'app-protocol-create',
  imports: [FormsModule, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, ...HlmCheckboxImports, ...HlmPopoverImports, EntityHeader],
  templateUrl: './protocol-create.html',
})
export class ProtocolCreate {
  private readonly router = inject(Router);
  private readonly productionState = inject(ProductionState);

  /** Present on the `/edit` route; absent on `/new`. */
  readonly id = input<string>();

  protected readonly name = signal('');
  protected readonly version = signal('v1.0');
  protected readonly status = signal<QualityProtocolStatus>('draft');
  protected readonly appliesToOperations = signal('');
  protected readonly productFamily = signal('');
  protected readonly fields = signal<DraftField[]>([{ _uid: uidSeq++, id: `QF-${uidSeq}`, label: '', dataType: 'number', required: true }]);

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly dataTypeOptions = DATA_TYPE_OPTIONS;
  protected readonly isEdit = computed(() => !!this.id());
  protected readonly canSubmit = computed(() => this.name().trim().length > 0 && this.fields().some((f) => f.label.trim().length > 0));

  protected statusToString = (v: string) => QUALITY_PROTOCOL_STATUS_LABEL[v as QualityProtocolStatus] ?? v;
  protected dataTypeToString = (v: string) => DATA_TYPE_LABEL[v as QualityFieldDataType] ?? v;

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      const p = this.productionState.qualityProtocols().find((x) => x.id === id);
      if (!p) return;
      this.name.set(p.name);
      this.version.set(p.version);
      this.status.set(p.status);
      this.appliesToOperations.set(p.appliesToOperations.join(', '));
      this.productFamily.set(p.productFamily ?? '');
      this.fields.set(p.fields.length ? p.fields.map((f) => ({ ...f, _uid: uidSeq++ })) : [{ _uid: uidSeq++, id: `QF-${uidSeq}`, label: '', dataType: 'number', required: true }]);
    });
  }

  protected setField(i: number, patch: Partial<QualityField>): void {
    this.fields.update((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  protected addField(): void {
    this.fields.update((rows) => [...rows, { _uid: uidSeq++, id: `QF-${uidSeq}`, label: '', dataType: 'number', required: true }]);
  }
  protected removeField(i: number): void {
    this.fields.update((rows) => rows.filter((_, idx) => idx !== i));
  }

  protected readonly submitPopover = signal<'open' | 'closed'>('closed');

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.submitPopover.set('closed');
    const fields: QualityField[] = this.fields()
      .filter((f) => f.label.trim().length > 0)
      .map(({ _uid, ...f }) => f);
    const payload = {
      name: this.name().trim(),
      version: this.version().trim() || 'v1.0',
      status: this.status(),
      appliesToOperations: this.appliesToOperations()
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      productFamily: this.productFamily().trim() || undefined,
      fields,
    };

    const editId = this.id();
    if (editId) {
      this.productionState.updateQualityProtocol(editId, payload);
      toast.success('Protocolo actualizado', { description: payload.name });
      this.router.navigate(['/apps/production/quality/protocols', editId]);
    } else {
      const protocol = this.productionState.createQualityProtocol(payload);
      toast.success(`Protocolo ${protocol.name} creado`);
      this.router.navigate(['/apps/production/quality/protocols', protocol.id]);
    }
  }

  protected cancel(): void {
    const editId = this.id();
    this.router.navigate(editId ? ['/apps/production/quality/protocols', editId] : ['/apps/production/quality/protocols']);
  }
}
