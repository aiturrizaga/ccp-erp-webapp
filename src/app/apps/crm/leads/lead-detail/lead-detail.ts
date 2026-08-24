import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { CrmState } from '@apps/crm/crm-state';
import { Tone } from '@core/models';
import { LeadSource, LeadStatus, LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from '@core/models/crm.model';

@Component({
  selector: 'app-lead-detail',
  imports: [...HlmButtonImports, ...HlmCardImports, EntityHeader, EmptyState],
  templateUrl: './lead-detail.html',
})
export class LeadDetail {
  readonly id = input.required<string>();

  private readonly router = inject(Router);
  private readonly crmState = inject(CrmState);

  protected readonly lead = computed(() => this.crmState.leads().find((l) => l.id === this.id()));

  protected statusLabel(status: LeadStatus): string {
    return LEAD_STATUS_LABEL[status];
  }

  protected statusTone(status: LeadStatus): Tone {
    return LEAD_STATUS_TONE[status];
  }

  protected sourceLabel(source: LeadSource): string {
    return LEAD_SOURCE_LABEL[source];
  }

  protected qualify(): void {
    this.crmState.qualifyLead(this.id());
  }

  protected convertToOpportunity(): void {
    const opportunity = this.crmState.convertLeadToOpportunity(this.id());
    if (opportunity) this.router.navigate(['/apps/crm/opportunities', opportunity.id]);
  }
}
