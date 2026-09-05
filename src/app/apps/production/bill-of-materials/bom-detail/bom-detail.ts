import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { HlmButtonImports } from '@ui/button';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { ITEMS } from '@core/mock-data';
import { BomStatus, BOM_STATUS_LABEL, Tone } from '@core/models';
import { ProductionState } from '../../production-state';

const STATUS_TONE: Record<BomStatus, Tone> = {
  active: 'success',
  expired: 'neutral',
  draft: 'warning',
};

@Component({
  selector: 'app-bom-detail',
  imports: [RouterLink, ...HlmCardImports, ...HlmButtonImports, EntityHeader, EmptyState, StatusBadge],
  templateUrl: './bom-detail.html',
})
export class BomDetail {
  private readonly productionState = inject(ProductionState);

  readonly id = input.required<string>();

  protected readonly bom = computed(() => this.productionState.billsOfMaterials().find((b) => b.id === this.id()));
  protected readonly product = computed(() => this.productionState.products().find((p) => p.id === this.bom()?.productId));

  /** Every version of this BOM's product, newest effective date first — including the current one. */
  protected readonly versionHistory = computed(() => {
    const productId = this.bom()?.productId;
    if (!productId) return [];
    return this.productionState
      .billsOfMaterials()
      .filter((b) => b.productId === productId)
      .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1));
  });

  /** Only a `draft` version may still be edited in place — anything else (active/expired) is read-only, you branch a new version instead. */
  protected readonly isEditable = computed(() => this.bom()?.status === 'draft');

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected workCenterLabel(workCenterId?: string): string {
    if (!workCenterId) return '—';
    return this.productionState.workCenters().find((w) => w.id === workCenterId)?.name ?? workCenterId;
  }

  protected statusLabel(status: BomStatus): string {
    return BOM_STATUS_LABEL[status];
  }

  protected statusTone(status: BomStatus): Tone {
    return STATUS_TONE[status];
  }
}
