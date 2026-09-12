import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { toast } from '@shared/toast';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import {
  InspectionCheckOption,
  QualityInspection,
  QualityInspectionResult,
  QUALITY_INSPECTION_RESULT_LABEL,
  Tone,
} from '@core/models';
import { ProductionState } from '../../production-state';

const RESULT_TONE: Record<QualityInspectionResult, Tone> = {
  pass: 'success',
  fail: 'danger',
  pending: 'neutral',
};

@Component({
  selector: 'app-inspection-detail',
  imports: [RouterLink, NgIcon, ...HlmButtonImports, ...HlmCardImports, EntityHeader, EmptyState],
  templateUrl: './inspection-detail.html',
})
export class InspectionDetail {
  private readonly productionState = inject(ProductionState);

  readonly id = input.required<string>();

  protected readonly inspection = computed(() => this.productionState.qualityInspections().find((i) => i.id === this.id()));
  protected readonly protocol = computed(() => this.productionState.qualityProtocols().find((p) => p.id === this.inspection()?.protocolId));
  protected readonly format = computed(() => this.productionState.inspectionFormats().find((f) => f.id === this.inspection()?.formatId));
  protected readonly nonConformity = computed(() => this.productionState.nonConformities().find((n) => n.inspectionId === this.id()));

  protected fieldLabel(fieldId: string): string {
    return this.protocol()?.fields.find((f) => f.id === fieldId)?.label ?? fieldId;
  }

  protected productNames(inspection: QualityInspection): string {
    const ids = inspection.productIds ?? [];
    if (!ids.length) return '—';
    return ids.map((id) => this.productionState.products().find((p) => p.id === id)?.name ?? id).join(', ');
  }

  protected optionLabel(options: InspectionCheckOption[] | undefined, value: string | undefined): string {
    if (!value) return '—';
    return options?.find((o) => o.value === value)?.label ?? value;
  }

  protected optionClass(options: InspectionCheckOption[] | undefined, value: string | undefined): string {
    const opt = options?.find((o) => o.value === value);
    if (!opt || opt.satisfies === undefined) return 'text-muted-foreground';
    return opt.satisfies ? 'text-emerald-600' : 'text-destructive';
  }

  protected resultLabel(): string {
    const i = this.inspection();
    return i ? QUALITY_INSPECTION_RESULT_LABEL[i.overallResult] : '';
  }

  protected resultTone(): Tone {
    const i = this.inspection();
    return i ? RESULT_TONE[i.overallResult] : 'neutral';
  }

  protected signatures(): number[] {
    const n = this.format()?.signatureCount ?? 0;
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  /** Imprimir / Exportar son solo visuales por ahora. */
  protected noop(): void {
    toast.info('Disponible próximamente');
  }
}