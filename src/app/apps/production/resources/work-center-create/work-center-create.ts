import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmCheckboxImports } from '@ui/checkbox';
import { HlmPopoverImports } from '@ui/popover';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { toast } from '@shared/toast';
import { ProductionState } from '../../production-state';

@Component({
  selector: 'app-work-center-create',
  imports: [FormsModule, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmCheckboxImports, ...HlmPopoverImports, EntityHeader],
  templateUrl: './work-center-create.html',
})
export class WorkCenterCreate {
  private readonly router = inject(Router);
  protected readonly productionState = inject(ProductionState);

  /** Present on the `/edit` route; absent on `/new`. */
  readonly id = input<string>();

  protected readonly code = signal('');
  protected readonly name = signal('');
  protected readonly plant = signal('AL01');
  protected readonly capacityPerDay = signal(0);
  protected readonly unitOfMeasure = signal('UND');
  protected readonly machineIds = signal<Set<string>>(new Set());

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly canSubmit = computed(() => this.code().trim().length > 0 && this.name().trim().length > 0 && this.capacityPerDay() > 0);

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      const wc = this.productionState.workCenters().find((x) => x.id === id);
      if (!wc) return;
      this.code.set(wc.code);
      this.name.set(wc.name);
      this.plant.set(wc.plant);
      this.capacityPerDay.set(wc.capacityPerDay);
      this.unitOfMeasure.set(wc.unitOfMeasure);
      this.machineIds.set(new Set(this.productionState.machines().filter((m) => m.workCenterId === id).map((m) => m.id)));
    });
  }

  protected toggleMachine(machineId: string): void {
    this.machineIds.update((set) => {
      const next = new Set(set);
      next.has(machineId) ? next.delete(machineId) : next.add(machineId);
      return next;
    });
  }
  protected hasMachine(machineId: string): boolean {
    return this.machineIds().has(machineId);
  }

  protected readonly submitPopover = signal<'open' | 'closed'>('closed');

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.submitPopover.set('closed');
    const payload = {
      code: this.code().trim().toUpperCase(),
      name: this.name().trim(),
      plant: this.plant().trim(),
      capacityPerDay: this.capacityPerDay(),
      unitOfMeasure: this.unitOfMeasure().trim() || 'UND',
    };

    const editId = this.id();
    const workCenterId = editId ?? this.productionState.createWorkCenter(payload).id;
    if (editId) this.productionState.updateWorkCenter(editId, payload);

    // Reasigna cada máquina del catálogo a este centro de trabajo si fue marcada, o la libera si se desmarcó.
    for (const m of this.productionState.machines()) {
      const shouldBeHere = this.machineIds().has(m.id);
      if (shouldBeHere && m.workCenterId !== workCenterId) this.productionState.updateMachine(m.id, { workCenterId });
    }

    toast.success(editId ? 'Centro de trabajo actualizado' : `Centro de trabajo ${payload.code} creado`, { description: payload.name });
    this.router.navigate(['/apps/production/work-centers', workCenterId]);
  }

  protected cancel(): void {
    const editId = this.id();
    this.router.navigate(editId ? ['/apps/production/work-centers', editId] : ['/apps/production/work-centers']);
  }
}
