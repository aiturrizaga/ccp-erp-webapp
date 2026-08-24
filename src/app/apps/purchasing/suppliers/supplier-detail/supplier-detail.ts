import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HlmTabsImports } from '@ui/tabs';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmProgressImports } from '@ui/progress';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { ApprovalTimeline } from '@shared/components/approval-timeline/approval-timeline';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { SUPPLIERS, APPROVALS, PURCHASE_ORDERS } from '@core/mock-data';
import { SupplierStatus, SUPPLIER_STATUS_LABEL, Tone } from '@core/models';

const STATUS_TONE: Record<SupplierStatus, Tone> = {
  draft: 'neutral',
  under_evaluation: 'info',
  pending_approval: 'warning',
  approved: 'success',
  rejected: 'danger',
  suspended: 'danger',
};

@Component({
  selector: 'app-supplier-detail',
  imports: [...HlmTabsImports, ...HlmButtonImports, ...HlmCardImports, ...HlmProgressImports, EntityHeader, ApprovalTimeline, EmptyState, DecimalPipe, RouterLink],
  templateUrl: './supplier-detail.html',
})
export class SupplierDetail {
  readonly id = input.required<string>();

  protected readonly supplier = computed(() => SUPPLIERS.find((s) => s.id === this.id()));
  protected readonly approval = computed(() => APPROVALS.find((a) => a.process === 'supplier' && a.documentId === this.id()));
  protected readonly purchaseOrders = computed(() => PURCHASE_ORDERS.filter((po) => po.supplierId === this.id()));

  protected statusLabel(status: SupplierStatus): string {
    return SUPPLIER_STATUS_LABEL[status];
  }

  protected statusTone(status: SupplierStatus): Tone {
    return STATUS_TONE[status];
  }

  protected creditPct(): number {
    const s = this.supplier();
    if (!s || s.creditLimit === 0) return 0;
    return Math.round((s.creditUsed / s.creditLimit) * 100);
  }
}
