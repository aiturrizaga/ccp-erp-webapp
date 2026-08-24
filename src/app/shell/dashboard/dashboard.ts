import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import {
  APPROVALS,
  PURCHASE_ORDERS,
  ITEMS,
  STOCK_LOTS,
  WORK_SHEETS,
} from '@core/mock-data';
import { APPROVAL_PROCESS_LABEL } from '@core/models';
import { CrmState } from '@apps/crm/crm-state';
import { salesQuotations } from '@apps/sales/sales-state';
import { InvoicingState } from '@apps/invoicing/invoicing-state';
import { PurchaseInvoice, SalesInvoice } from '@core/models';
import { InvoiceStatus } from '@core/models/finance.model';

const SETTLED_STATUSES: InvoiceStatus[] = ['paid', 'voided'];

/** Shell's global home — contextual by role in a real build; here it shows a cross-App management view. */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, StatCard, StatusBadge, DecimalPipe],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly crmState = inject(CrmState);
  private readonly invoicingState = inject(InvoicingState);

  protected readonly pendingApprovals = computed(() => APPROVALS.filter((a) => a.status === 'pending'));
  protected readonly pendingPurchaseOrders = computed(() => PURCHASE_ORDERS.filter((po) => po.status === 'pending_approval').length);
  protected readonly worksheetsAtRisk = computed(() => WORK_SHEETS.filter((ws) => ws.atRisk));

  protected readonly criticalStockItems = computed(() => {
    return ITEMS.filter((item) => {
      const available = STOCK_LOTS.filter((lot) => lot.itemId === item.id && lot.status === 'available').reduce((sum, lot) => sum + lot.quantity, 0);
      return item.reorderPoint > 0 && available > 0 && available < item.reorderPoint;
    });
  });

  protected readonly unqualifiedLeads = computed(() => this.crmState.leads().filter((lead) => lead.status !== 'qualified' && lead.status !== 'discarded').length);
  protected readonly openOpportunities = computed(() => this.crmState.opportunities().filter((opp) => opp.stage !== 'won' && opp.stage !== 'lost').length);
  protected readonly pendingQuotations = computed(() => salesQuotations().filter((quotation) => quotation.status === 'sent').length);

  protected readonly overdueInvoices = computed(() => this.invoicingState.invoices().filter((invoice) => invoice.status === 'overdue').length);

  protected readonly totalReceivable = computed(() =>
    this.invoicingState
      .invoices()
      .filter((invoice): invoice is SalesInvoice => invoice.documentType === 'sales')
      .reduce((sum, invoice) => (SETTLED_STATUSES.includes(invoice.status) ? sum : sum + invoice.outstandingBalance), 0),
  );

  protected readonly totalPayable = computed(() =>
    this.invoicingState
      .invoices()
      .filter((invoice): invoice is PurchaseInvoice => invoice.documentType === 'purchase')
      .reduce((sum, invoice) => (SETTLED_STATUSES.includes(invoice.status) ? sum : sum + invoice.outstandingBalance), 0),
  );

  protected processLabel(process: string): string {
    return APPROVAL_PROCESS_LABEL[process as keyof typeof APPROVAL_PROCESS_LABEL] ?? process;
  }
}
