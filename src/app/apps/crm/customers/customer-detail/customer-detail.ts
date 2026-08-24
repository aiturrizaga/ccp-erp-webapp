import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { CUSTOMERS, CONTACTS, OPPORTUNITIES } from '@core/mock-data/crm.fixture';
import { Tone } from '@core/models';
import { OpportunityStage, OPPORTUNITY_STAGE_LABEL, OPPORTUNITY_STAGE_TONE } from '@core/models/crm.model';

@Component({
  selector: 'app-customer-detail',
  imports: [...HlmButtonImports, ...HlmCardImports, EntityHeader, EmptyState, StatusBadge, DecimalPipe, RouterLink],
  templateUrl: './customer-detail.html',
})
export class CustomerDetail {
  readonly id = input.required<string>();

  protected readonly customer = computed(() => CUSTOMERS.find((c) => c.id === this.id()));
  protected readonly contacts = computed(() => CONTACTS.filter((c) => c.customerId === this.id()));
  protected readonly opportunities = computed(() => OPPORTUNITIES.filter((o) => o.customerId === this.id()));

  protected stageLabel(stage: OpportunityStage): string {
    return OPPORTUNITY_STAGE_LABEL[stage];
  }

  protected stageTone(stage: OpportunityStage): Tone {
    return OPPORTUNITY_STAGE_TONE[stage];
  }
}
