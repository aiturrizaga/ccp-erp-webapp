import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { CUSTOMERS } from '@core/mock-data/crm.fixture';
import { OPPORTUNITY_STAGE_LABEL } from '@core/models/crm.model';
import { CrmState } from '../crm-state';

const OPEN_STAGES = new Set(['new', 'contacted', 'qualified', 'proposal', 'negotiation']);

/** App-level analytics for CRM — pipeline health and lead qualification funnel. */
@Component({
  selector: 'app-crm-dashboard',
  imports: [RouterLink, ...HlmCardImports, StatCard, DecimalPipe],
  templateUrl: './dashboard.html',
})
export class CrmDashboard {
  private readonly router = inject(Router);
  private readonly crmState = inject(CrmState);

  protected readonly unqualifiedLeads = computed(() => this.crmState.leads().filter((lead) => lead.status !== 'qualified' && lead.status !== 'discarded').length);

  protected readonly openOpportunities = computed(() => this.crmState.opportunities().filter((opp) => OPEN_STAGES.has(opp.stage)));

  protected readonly wonOpportunities = computed(() => this.crmState.opportunities().filter((opp) => opp.stage === 'won').length);

  protected readonly openPipelineValue = computed(() => this.openOpportunities().reduce((sum, opp) => sum + opp.expectedAmount, 0));

  protected customerName(customerId: string): string {
    return CUSTOMERS.find((c) => c.id === customerId)?.legalName ?? 'Cliente no encontrado';
  }

  protected stageLabel(stage: string): string {
    return OPPORTUNITY_STAGE_LABEL[stage as keyof typeof OPPORTUNITY_STAGE_LABEL] ?? stage;
  }

  protected goToOpportunity(id: string): void {
    this.router.navigate(['/apps/crm/opportunities', id]);
  }
}
