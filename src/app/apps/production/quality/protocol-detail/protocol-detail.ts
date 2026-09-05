import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { HlmButtonImports } from '@ui/button';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { QualityProtocolStatus, QUALITY_PROTOCOL_STATUS_LABEL, Tone } from '@core/models';
import { ProductionState } from '../../production-state';

const STATUS_TONE: Record<QualityProtocolStatus, Tone> = {
  active: 'success',
  draft: 'warning',
  retired: 'neutral',
};

@Component({
  selector: 'app-protocol-detail',
  imports: [RouterLink, ...HlmCardImports, ...HlmButtonImports, EntityHeader, EmptyState],
  templateUrl: './protocol-detail.html',
})
export class ProtocolDetail {
  private readonly productionState = inject(ProductionState);

  readonly id = input.required<string>();

  protected readonly protocol = computed(() => this.productionState.qualityProtocols().find((p) => p.id === this.id()));

  protected statusLabel(): string {
    const p = this.protocol();
    return p ? QUALITY_PROTOCOL_STATUS_LABEL[p.status] : '';
  }

  protected statusTone(): Tone {
    const p = this.protocol();
    return p ? STATUS_TONE[p.status] : 'neutral';
  }
}
