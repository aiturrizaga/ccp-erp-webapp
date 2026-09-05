import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { HlmButtonImports } from '@ui/button';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { MACHINE_STATUS_LABEL, MachineStatus, Tone } from '@core/models';
import { ProductionState } from '../../production-state';

const STATUS_TONE: Record<MachineStatus, Tone> = {
  operativa: 'success',
  mantenimiento: 'warning',
  fuera_servicio: 'danger',
};

@Component({
  selector: 'app-machine-detail',
  imports: [RouterLink, ...HlmCardImports, ...HlmButtonImports, EntityHeader, EmptyState],
  templateUrl: './machine-detail.html',
})
export class MachineDetail {
  private readonly productionState = inject(ProductionState);

  readonly id = input.required<string>();

  protected readonly machine = computed(() => this.productionState.machines().find((m) => m.id === this.id()));
  protected readonly workCenter = computed(() => this.productionState.workCenters().find((w) => w.id === this.machine()?.workCenterId));

  protected statusLabel(): string {
    const m = this.machine();
    return m ? MACHINE_STATUS_LABEL[m.status] : '';
  }

  protected statusTone(): Tone {
    const m = this.machine();
    return m ? STATUS_TONE[m.status] : 'neutral';
  }
}
