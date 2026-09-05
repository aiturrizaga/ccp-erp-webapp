import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { HlmPopoverImports } from '@ui/popover';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { toast } from '@shared/toast';
import { MachineStatus, MACHINE_STATUS_LABEL } from '@core/models';
import { ProductionState } from '../../production-state';

const STATUS_OPTIONS = (Object.keys(MACHINE_STATUS_LABEL) as MachineStatus[]).map((value) => ({ value, label: MACHINE_STATUS_LABEL[value] }));

@Component({
  selector: 'app-machine-create',
  imports: [FormsModule, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, ...HlmPopoverImports, EntityHeader],
  templateUrl: './machine-create.html',
})
export class MachineCreate {
  private readonly router = inject(Router);
  protected readonly productionState = inject(ProductionState);

  /** Present on the `/edit` route; absent on `/new`. */
  readonly id = input<string>();

  protected readonly code = signal('');
  protected readonly name = signal('');
  protected readonly plant = signal('AL01');
  protected readonly workCenterId = signal('');
  protected readonly status = signal<MachineStatus>('operativa');
  protected readonly lastMaintenanceAt = signal('');
  protected readonly nextMaintenanceAt = signal('');

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly isEdit = computed(() => !!this.id());
  protected readonly canSubmit = computed(() => this.code().trim().length > 0 && this.name().trim().length > 0 && !!this.workCenterId());

  protected statusToString = (v: string) => MACHINE_STATUS_LABEL[v as MachineStatus] ?? v;
  protected workCenterToString = (v: string) => this.productionState.workCenters().find((w) => w.id === v)?.name ?? 'Selecciona un centro de trabajo…';

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      const m = this.productionState.machines().find((x) => x.id === id);
      if (!m) return;
      this.code.set(m.code);
      this.name.set(m.name);
      this.plant.set(m.plant);
      this.workCenterId.set(m.workCenterId);
      this.status.set(m.status);
      this.lastMaintenanceAt.set(m.lastMaintenanceAt ?? '');
      this.nextMaintenanceAt.set(m.nextMaintenanceAt ?? '');
    });
  }

  protected readonly submitPopover = signal<'open' | 'closed'>('closed');

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.submitPopover.set('closed');
    const payload = {
      code: this.code().trim().toUpperCase(),
      name: this.name().trim(),
      plant: this.plant().trim(),
      workCenterId: this.workCenterId(),
      status: this.status(),
      lastMaintenanceAt: this.lastMaintenanceAt() || undefined,
      nextMaintenanceAt: this.nextMaintenanceAt() || undefined,
    };

    const editId = this.id();
    if (editId) {
      this.productionState.updateMachine(editId, payload);
      toast.success('Máquina actualizada', { description: payload.name });
      this.router.navigate(['/apps/production/machines', editId]);
    } else {
      const machine = this.productionState.createMachine(payload);
      toast.success(`Máquina ${machine.name} creada`);
      this.router.navigate(['/apps/production/machines', machine.id]);
    }
  }

  protected cancel(): void {
    const editId = this.id();
    this.router.navigate(editId ? ['/apps/production/machines', editId] : ['/apps/production/machines']);
  }
}
