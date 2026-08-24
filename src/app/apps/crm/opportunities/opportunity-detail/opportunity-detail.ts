import { Component, computed, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { ActivityTimeline } from '@shared/components/activity-timeline/activity-timeline';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { CrmState } from '@apps/crm/crm-state';
import { CUSTOMERS } from '@core/mock-data/crm.fixture';
import { Tone } from '@core/models';
import { OpportunityStage, OPPORTUNITY_STAGE_LABEL, OPPORTUNITY_STAGE_TONE } from '@core/models/crm.model';
import { createQuotationFromOpportunity } from '../../../sales/sales-state';

@Component({
  selector: 'app-opportunity-detail',
  imports: [...HlmButtonImports, ...HlmCardImports, EntityHeader, ActivityTimeline, EmptyState, DecimalPipe, RouterLink],
  templateUrl: './opportunity-detail.html',
})
export class OpportunityDetail {
  readonly id = input.required<string>();

  private readonly crmState = inject(CrmState);
  private readonly router = inject(Router);

  protected readonly opportunity = computed(() => this.crmState.opportunities().find((o) => o.id === this.id()));
  protected readonly customer = computed(() => {
    const o = this.opportunity();
    return o ? CUSTOMERS.find((c) => c.id === o.customerId) : undefined;
  });

  protected stageLabel(stage: OpportunityStage): string {
    return OPPORTUNITY_STAGE_LABEL[stage];
  }

  protected stageTone(stage: OpportunityStage): Tone {
    return OPPORTUNITY_STAGE_TONE[stage];
  }

  protected generateQuote(): void {
    const opportunity = this.opportunity();
    if (!opportunity) return;
    const customerName = CUSTOMERS.find((c) => c.id === opportunity.customerId)?.legalName ?? opportunity.customerId;
    const quotation = createQuotationFromOpportunity({
      id: opportunity.id,
      customerId: opportunity.customerId,
      customerName,
      expectedAmount: opportunity.expectedAmount,
      currency: opportunity.currency,
    });
    this.router.navigate(['/apps/sales/quotations', quotation.id]);
  }
}
