import { Injectable, signal } from '@angular/core';
import { LEADS, OPPORTUNITIES, CUSTOMERS } from '@core/mock-data/crm.fixture';
import { Lead, Opportunity } from '@core/models/crm.model';

/** In-memory mutable state local to the CRM app — lets Lead conversion append a new Opportunity without a backend. */
@Injectable({ providedIn: 'root' })
export class CrmState {
  readonly leads = signal<Lead[]>(LEADS);
  readonly opportunities = signal<Opportunity[]>(OPPORTUNITIES);

  private nextOpportunitySeq = OPPORTUNITIES.length + 1;

  qualifyLead(leadId: string): void {
    this.leads.update((leads) => leads.map((lead) => (lead.id === leadId ? { ...lead, status: 'qualified' } : lead)));
  }

  /** No account-creation flow exists yet, so conversion matches the lead's company name against the Customer master or falls back to the first customer — good enough for a click-through prototype. */
  convertLeadToOpportunity(leadId: string): Opportunity | undefined {
    const lead = this.leads().find((l) => l.id === leadId);
    if (!lead) return undefined;

    const matchedCustomer = CUSTOMERS.find((c) => c.legalName.toLowerCase().includes(lead.company.toLowerCase()) || lead.company.toLowerCase().includes(c.legalName.toLowerCase()));
    const customerId = matchedCustomer?.id ?? CUSTOMERS[0].id;

    const opportunity: Opportunity = {
      id: `OPP-${String(this.nextOpportunitySeq++).padStart(3, '0')}`,
      title: `Oportunidad ${lead.company}`,
      customerId,
      expectedAmount: 0,
      currency: 'PEN',
      stage: 'new',
      estimatedCloseDate: lead.createdAt,
      salesRep: 'Sin asignar',
      activities: [{ date: lead.createdAt, user: 'Sistema', action: 'Oportunidad creada desde lead', detail: `Convertido desde ${lead.id} (${lead.contactName}).` }],
    };

    this.opportunities.update((opps) => [...opps, opportunity]);
    this.leads.update((leads) => leads.map((l) => (l.id === leadId ? { ...l, convertedOpportunityId: opportunity.id } : l)));
    return opportunity;
  }
}
