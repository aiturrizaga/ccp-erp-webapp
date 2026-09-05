import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { Machine, MachineStatus, MACHINE_STATUS_LABEL, Tone } from '@core/models';
import { ProductionState } from '../../production-state';

const STATUS_TONE: Record<MachineStatus, Tone> = {
  operativa: 'success',
  mantenimiento: 'warning',
  fuera_servicio: 'danger',
};

@Component({
  selector: 'app-machine-list',
  imports: [...HlmButtonImports, DataTable, ListToolbar, StatusBadge],
  templateUrl: './machine-list.html',
})
export class MachineList {
  private readonly router = inject(Router);
  private readonly productionState = inject(ProductionState);

  protected readonly search = signal('');

  protected readonly columns: DataTableColumn[] = [
    { key: 'code', header: 'Código', width: '120px' },
    { key: 'name', header: 'Máquina' },
    { key: 'workCenter', header: 'Centro de trabajo' },
    { key: 'nextMaintenanceAt', header: 'Próx. mantenimiento', width: '160px' },
    { key: 'status', header: 'Estado', width: '150px' },
  ];

  protected readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.productionState.machines().filter((m) => !term || m.name.toLowerCase().includes(term) || m.code.toLowerCase().includes(term));
  });

  protected workCenterName(machine: Machine): string {
    return this.productionState.workCenters().find((w) => w.id === machine.workCenterId)?.name ?? machine.workCenterId;
  }

  protected statusLabel(machine: Machine): string {
    return MACHINE_STATUS_LABEL[machine.status];
  }

  protected statusTone(machine: Machine): Tone {
    return STATUS_TONE[machine.status];
  }

  protected openDetail(machine: Machine): void {
    this.router.navigate(['/apps/production/machines', machine.id]);
  }

  protected onNew(): void {
    this.router.navigate(['/apps/production/machines/new']);
  }
}
