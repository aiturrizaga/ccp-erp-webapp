import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { QualityInspectionResult, QUALITY_INSPECTION_RESULT_LABEL, Tone } from '@core/models';
import { ProductionState } from '../../production-state';

const RESULT_TONE: Record<QualityInspectionResult, Tone> = {
  pass: 'success',
  fail: 'danger',
  pending: 'neutral',
};

@Component({
  selector: 'app-inspection-detail',
  imports: [RouterLink, ...HlmCardImports, EntityHeader, EmptyState],
  templateUrl: './inspection-detail.html',
})
export class InspectionDetail {
  private readonly productionState = inject(ProductionState);

  readonly id = input.required<string>();

  protected readonly inspection = computed(() => this.productionState.qualityInspections().find((i) => i.id === this.id()));
  protected readonly protocol = computed(() => this.productionState.qualityProtocols().find((p) => p.id === this.inspection()?.protocolId));
  protected readonly nonConformity = computed(() => this.productionState.nonConformities().find((n) => n.inspectionId === this.id()));

  protected fieldLabel(fieldId: string): string {
    return this.protocol()?.fields.find((f) => f.id === fieldId)?.label ?? fieldId;
  }

  protected resultLabel(): string {
    const i = this.inspection();
    return i ? QUALITY_INSPECTION_RESULT_LABEL[i.overallResult] : '';
  }

  protected resultTone(): Tone {
    const i = this.inspection();
    return i ? RESULT_TONE[i.overallResult] : 'neutral';
  }
}
