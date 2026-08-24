import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HlmCardImports } from '@ui/card';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { PurchaseInvoice, SalesInvoice } from '@core/models';
import { InvoiceStatus } from '@core/models/finance.model';
import { InvoicingState } from '@apps/invoicing/invoicing-state';

const TODAY = '2026-08-23';
const SETTLED_STATUSES: InvoiceStatus[] = ['paid', 'voided'];

/** App-level analytics for Finanzas — receivable/payable totals and overdue exposure. */
@Component({
  selector: 'app-finance-dashboard',
  imports: [...HlmCardImports, StatCard, DecimalPipe],
  templateUrl: './dashboard.html',
})
export class FinanceDashboard {
  private readonly invoicingState = inject(InvoicingState);

  private readonly payableInvoices = computed(() => this.invoicingState.invoices().filter((invoice): invoice is PurchaseInvoice => invoice.documentType === 'purchase'));

  private readonly receivableInvoices = computed(() => this.invoicingState.invoices().filter((invoice): invoice is SalesInvoice => invoice.documentType === 'sales'));

  protected readonly totalPayable = computed(() =>
    this.payableInvoices().reduce((sum, invoice) => (SETTLED_STATUSES.includes(invoice.status) ? sum : sum + invoice.outstandingBalance), 0),
  );

  protected readonly totalReceivable = computed(() =>
    this.receivableInvoices().reduce((sum, invoice) => (SETTLED_STATUSES.includes(invoice.status) ? sum : sum + invoice.outstandingBalance), 0),
  );

  protected readonly overduePayableCount = computed(
    () => this.payableInvoices().filter((invoice) => !SETTLED_STATUSES.includes(invoice.status) && new Date(invoice.dueDate) < new Date(TODAY)).length,
  );

  protected readonly overdueReceivableCount = computed(
    () => this.receivableInvoices().filter((invoice) => !SETTLED_STATUSES.includes(invoice.status) && new Date(invoice.dueDate) < new Date(TODAY)).length,
  );
}
