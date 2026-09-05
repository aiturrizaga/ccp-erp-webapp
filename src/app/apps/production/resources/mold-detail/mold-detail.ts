import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { HlmButtonImports } from '@ui/button';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { MOLD_TYPE_LABEL, RESOURCE_CONDITION_LABEL, Tone } from '@core/models';
import { ProductionState } from '../../production-state';

@Component({
  selector: 'app-mold-detail',
  imports: [RouterLink, ...HlmCardImports, ...HlmButtonImports, EntityHeader, EmptyState],
  templateUrl: './mold-detail.html',
})
export class MoldDetail {
  private readonly productionState = inject(ProductionState);

  readonly id = input.required<string>();

  protected readonly mold = computed(() => this.productionState.molds().find((m) => m.id === this.id()));

  protected productLabel(productId: string): string {
    return this.productionState.products().find((p) => p.id === productId)?.name ?? productId;
  }

  protected typeLabel(): string {
    const mold = this.mold();
    return mold ? MOLD_TYPE_LABEL[mold.tipo] : '';
  }

  protected conditionLabel(): string {
    const mold = this.mold();
    return mold ? RESOURCE_CONDITION_LABEL[mold.estado] : '';
  }

  protected conditionTone(): Tone {
    return this.mold()?.estado === 'bueno' ? 'success' : 'danger';
  }

  protected usagePct(): number {
    const mold = this.mold();
    if (!mold?.maxUsageCount) return 0;
    return Math.min(100, Math.round((mold.usageCount / mold.maxUsageCount) * 100));
  }
}
