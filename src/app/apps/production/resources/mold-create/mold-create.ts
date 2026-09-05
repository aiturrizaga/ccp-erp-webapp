import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { HlmCheckboxImports } from '@ui/checkbox';
import { HlmPopoverImports } from '@ui/popover';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { toast } from '@shared/toast';
import { MoldType, MOLD_TYPE_LABEL, ResourceCondition, RESOURCE_CONDITION_LABEL } from '@core/models';
import { ProductionState } from '../../production-state';

const TYPE_OPTIONS = (Object.keys(MOLD_TYPE_LABEL) as MoldType[]).map((value) => ({ value, label: MOLD_TYPE_LABEL[value] }));
const CONDITION_OPTIONS = (Object.keys(RESOURCE_CONDITION_LABEL) as ResourceCondition[]).map((value) => ({ value, label: RESOURCE_CONDITION_LABEL[value] }));

@Component({
  selector: 'app-mold-create',
  imports: [FormsModule, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, ...HlmCheckboxImports, ...HlmPopoverImports, EntityHeader],
  templateUrl: './mold-create.html',
})
export class MoldCreate {
  private readonly router = inject(Router);
  protected readonly productionState = inject(ProductionState);

  /** Present on the `/edit` route; absent on `/new`. */
  readonly id = input<string>();

  protected readonly code = signal('');
  protected readonly tipo = signal<MoldType>('METALICO');
  protected readonly plant = signal('AL01');
  protected readonly location = signal('');
  protected readonly width = signal(0);
  protected readonly height = signal(0);
  protected readonly depth = signal(0);
  protected readonly estado = signal<ResourceCondition>('bueno');
  protected readonly acquiredAt = signal('2026-09-04');
  protected readonly maxUsageCount = signal(800);
  protected readonly compatibleProductIds = signal<Set<string>>(new Set());

  protected readonly typeOptions = TYPE_OPTIONS;
  protected readonly conditionOptions = CONDITION_OPTIONS;
  protected readonly isEdit = computed(() => !!this.id());
  protected readonly canSubmit = computed(() => this.code().trim().length > 0 && this.location().trim().length > 0);

  protected typeToString = (v: string) => MOLD_TYPE_LABEL[v as MoldType] ?? v;
  protected conditionToString = (v: string) => RESOURCE_CONDITION_LABEL[v as ResourceCondition] ?? v;

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      const m = this.productionState.molds().find((x) => x.id === id);
      if (!m) return;
      this.code.set(m.code);
      this.tipo.set(m.tipo);
      this.plant.set(m.plant);
      this.location.set(m.location);
      this.estado.set(m.estado);
      this.maxUsageCount.set(m.maxUsageCount ?? 800);
      this.compatibleProductIds.set(new Set(m.compatibleProductIds));
      this.acquiredAt.set(m.acquiredAt ?? this.acquiredAt());
      const dims = (m.dimensions ?? '').match(/^([\d.]+)\s*x\s*([\d.]+)\s*x\s*([\d.]+)/i);
      if (dims) {
        this.width.set(Number(dims[1]));
        this.height.set(Number(dims[2]));
        this.depth.set(Number(dims[3]));
      }
    });
  }

  protected toggleProduct(productId: string): void {
    this.compatibleProductIds.update((set) => {
      const next = new Set(set);
      next.has(productId) ? next.delete(productId) : next.add(productId);
      return next;
    });
  }
  protected hasProduct(productId: string): boolean {
    return this.compatibleProductIds().has(productId);
  }

  protected readonly submitPopover = signal<'open' | 'closed'>('closed');

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.submitPopover.set('closed');
    const basePayload = {
      code: this.code().trim().toUpperCase(),
      tipo: this.tipo(),
      plant: this.plant().trim(),
      location: this.location().trim(),
      estado: this.estado(),
      maxUsageCount: this.maxUsageCount() || undefined,
      compatibleProductIds: [...this.compatibleProductIds()],
      dimensions: this.width() && this.height() && this.depth() ? `${this.width()} x ${this.height()} x ${this.depth()} cm` : undefined,
      acquiredAt: this.acquiredAt() || undefined,
    };

    const editId = this.id();
    if (editId) {
      this.productionState.updateMold(editId, basePayload);
      toast.success('Molde actualizado', { description: basePayload.code });
      this.router.navigate(['/apps/production/molds', editId]);
    } else {
      const mold = this.productionState.createMold({ ...basePayload, usageCount: 0 });
      toast.success(`Molde ${mold.code} creado`);
      this.router.navigate(['/apps/production/molds', mold.id]);
    }
  }

  protected cancel(): void {
    const editId = this.id();
    this.router.navigate(editId ? ['/apps/production/molds', editId] : ['/apps/production/molds']);
  }
}
