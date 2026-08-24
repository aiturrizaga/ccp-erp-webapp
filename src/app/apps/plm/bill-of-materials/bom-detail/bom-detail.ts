import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { ApprovalTimeline } from '@shared/components/approval-timeline/approval-timeline';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { BILLS_OF_MATERIALS, PRODUCTS, ITEMS, APPROVALS } from '@core/mock-data';
import { BomStatus, BOM_STATUS_LABEL, Tone } from '@core/models';

const STATUS_TONE: Record<BomStatus, Tone> = {
  active: 'success',
  expired: 'neutral',
  draft: 'warning',
};

@Component({
  selector: 'app-bom-detail',
  imports: [RouterLink, ...HlmCardImports, EntityHeader, ApprovalTimeline, EmptyState],
  templateUrl: './bom-detail.html',
})
export class BomDetail {
  readonly id = input.required<string>();

  protected readonly bom = computed(() => BILLS_OF_MATERIALS.find((b) => b.id === this.id()));
  protected readonly product = computed(() => PRODUCTS.find((p) => p.id === this.bom()?.productId));
  protected readonly changeApproval = computed(() => APPROVALS.find((a) => a.process === 'bom_change' && a.documentId === this.id()));

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected statusLabel(status: BomStatus): string {
    return BOM_STATUS_LABEL[status];
  }

  protected statusTone(status: BomStatus): Tone {
    return STATUS_TONE[status];
  }
}
