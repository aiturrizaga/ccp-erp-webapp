import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { HlmButtonImports } from '@ui/button';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { MACHINE_STATUS_LABEL, MachineStatus, Tone } from '@core/models';
import { ProductionState } from '../../production-state';

const STATUS_TONE: Record<MachineStatus, Tone> = {
  operativa: 'success',
  mantenimiento: 'warning',
  fuera_servicio: 'danger',
};

@Component({
  selector: 'app-work-center-detail',
  imports: [RouterLink, ...HlmCardImports, ...HlmButtonImports, EntityHeader, EmptyState, StatusBadge],
  templateUrl: './work-center-detail.html',
})
export class WorkCenterDetail {
  private readonly productionState = inject(ProductionState);

  readonly id = input.required<string>();

  protected readonly workCenter = computed(() => this.productionState.workCenters().find((w) => w.id === this.id()));
  protected readonly machines = computed(() => this.productionState.machines().filter((m) => m.workCenterId === this.id()));

  protected statusLabel(status: MachineStatus): string {
    return MACHINE_STATUS_LABEL[status];
  }
  protected statusTone(status: MachineStatus): Tone {
    return STATUS_TONE[status];
  }
}
