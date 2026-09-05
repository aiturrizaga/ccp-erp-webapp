import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { WorkCenter } from '@core/models';
import { ProductionState } from '../../production-state';

@Component({
  selector: 'app-work-center-list',
  imports: [DataTable, ListToolbar],
  templateUrl: './work-center-list.html',
})
export class WorkCenterList {
  private readonly router = inject(Router);
  private readonly productionState = inject(ProductionState);

  protected readonly search = signal('');

  protected readonly columns: DataTableColumn[] = [
    { key: 'code', header: 'Código', width: '120px' },
    { key: 'name', header: 'Centro de trabajo' },
    { key: 'plant', header: 'Planta', width: '100px' },
    { key: 'capacity', header: 'Capacidad/día', width: '140px' },
    { key: 'machineCount', header: 'Máquinas', width: '110px' },
  ];

  protected readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.productionState
      .workCenters()
      .filter((w) => !term || w.name.toLowerCase().includes(term) || w.code.toLowerCase().includes(term))
      .map((w) => ({ ...w, machineCount: this.productionState.machines().filter((m) => m.workCenterId === w.id).length }));
  });

  protected openDetail(row: WorkCenter): void {
    this.router.navigate(['/apps/production/work-centers', row.id]);
  }

  protected onNew(): void {
    this.router.navigate(['/apps/production/work-centers/new']);
  }
}
