import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { SUPPLIERS } from '@core/mock-data';
import { Invoice } from '@core/models';
import { InvoicingState } from '../invoicing-state';

const SETTLED_STATUSES = new Set(['paid', 'voided']);

/** App-level analytics for Facturación — comprobantes issued, receivable/payable status and overdue exposure. */
@Component({
  selector: 'app-invoicing-dashboard',
  imports: [RouterLink, ...HlmCardImports, StatCard, DecimalPipe],
  templateUrl: './dashboard.html',
})
export class InvoicingDashboard {
  private readonly router = inject(Router);
  private readonly state = inject(InvoicingState);

  protected readonly pendingReceivable = computed(
    () => this.state.invoices().filter((i) => i.documentType === 'sales' && !SETTLED_STATUSES.has(i.status)).length,
  );
  protected readonly pendingPayable = computed(
    () => this.state.invoices().filter((i) => i.documentType === 'purchase' && !SETTLED_STATUSES.has(i.status)).length,
  );
  protected readonly overdueInvoices = computed(() => this.state.invoices().filter((i) => i.status === 'overdue'));
  protected readonly totalInvoiced = computed(() => this.state.invoices().reduce((sum, i) => sum + i.total, 0));

  protected partyName(invoice: Invoice): string {
    if (invoice.documentType === 'purchase') {
      return SUPPLIERS.find((s) => s.id === invoice.supplierId)?.legalName ?? invoice.supplierId;
    }
    return invoice.customerName;
  }

  protected goToInvoice(id: string): void {
    this.router.navigate(['/apps/invoicing/invoices', id]);
  }
}
