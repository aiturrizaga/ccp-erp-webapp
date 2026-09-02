import { Component, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmPopoverImports } from '@ui/popover';
import { NgIcon } from '@ng-icons/core';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { toast } from '@shared/toast';
import { InvoicingState } from '@apps/invoicing/invoicing-state';
import { CREDIT_AGREEMENT_STATUS_LABEL, CREDIT_AGREEMENT_STATUS_TONE, CreditAgreement, Tone } from '@core/models';

@Component({
  selector: 'app-agreement-detail',
  imports: [DecimalPipe, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmPopoverImports, EntityHeader, EmptyState, StatusBadge],
  templateUrl: './agreement-detail.html',
})
export class AgreementDetail {
  private readonly state = inject(InvoicingState);
  readonly id = input.required<string>();
  protected readonly agreement = computed(() => this.state.agreements().find((a) => a.id === this.id()));

  protected statusLabel = (s: CreditAgreement['status']) => CREDIT_AGREEMENT_STATUS_LABEL[s];
  protected statusTone = (s: CreditAgreement['status']): Tone => CREDIT_AGREEMENT_STATUS_TONE[s];

  /** Which area's approve-popover is open, if any. */
  protected readonly approvePopover = signal<string | null>(null);

  protected approve(area: 'Gerencia' | 'Contabilidad'): void {
    const a = this.agreement();
    if (!a) return;
    this.approvePopover.set(null);
    const approvals = a.approvals.map((ap) => (ap.area === area ? { ...ap, status: 'approved' as const, approvedBy: area, approvedAt: '2026-09-01' } : ap));
    const allApproved = approvals.every((ap) => ap.status === 'approved');
    this.state.saveAgreement({ ...a, approvals, status: allApproved ? 'active' : 'pending_approval' });
    toast.success(`${area} aprobó el convenio`);
  }
}
