import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { ApprovalTimeline } from '@shared/components/approval-timeline/approval-timeline';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { PURCHASE_REQUISITIONS, APPROVALS, ITEMS } from '@core/mock-data';
import { PurchaseRequisitionStatus, PURCHASE_REQUISITION_STATUS_LABEL, REQUISITION_PRIORITY_LABEL, Tone } from '@core/models';
import { PurchasingState } from '../../purchasing-state';

const STATUS_TONE: Record<PurchaseRequisitionStatus, Tone> = {
  draft: 'neutral',
  pending_approval: 'warning',
  approved: 'info',
  sourcing: 'info',
  awarded: 'info',
  purchasing: 'info',
  fulfilled: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

@Component({
  selector: 'app-requisition-detail',
  imports: [RouterLink, ...HlmButtonImports, ...HlmCardImports, EntityHeader, ApprovalTimeline, EmptyState],
  templateUrl: './requisition-detail.html',
})
export class RequisitionDetail {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);

  readonly id = input.required<string>();

  protected readonly requisition = computed(() => PURCHASE_REQUISITIONS.find((r) => r.id === this.id()));
  protected readonly approval = computed(() => APPROVALS.find((a) => a.id === this.requisition()?.approvalId));
  protected readonly quotation = computed(() => this.purchasingState.quotations().find((q) => q.requisitionId === this.id()));

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected statusLabel(status: PurchaseRequisitionStatus): string {
    return PURCHASE_REQUISITION_STATUS_LABEL[status];
  }

  protected statusTone(status: PurchaseRequisitionStatus): Tone {
    return STATUS_TONE[status];
  }

  protected priorityLabel(priority: string): string {
    return REQUISITION_PRIORITY_LABEL[priority as keyof typeof REQUISITION_PRIORITY_LABEL] ?? priority;
  }

  protected generateQuotation(): void {
    const requisition = this.requisition();
    if (!requisition) return;
    const quotation = this.purchasingState.createQuotationFromRequisition(requisition);
    this.router.navigate(['/apps/purchasing/sourcing', quotation.id]);
  }
}
