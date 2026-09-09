import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { salesContacts, salesOrders } from '@apps/sales/sales-state';
import { InvoicingState } from '../invoicing-state';
import { DISPATCH_GUIDE_STATUS_LABEL, DispatchGuide, Tone } from '@core/models';
import { toast } from '@shared/toast';

@Component({
  selector: 'app-billing-workbench',
  imports: [NgIcon, ...HlmButtonImports, ...HlmCardImports, StatCard, StatusBadge],
  templateUrl: './billing-workbench.html',
})
export class BillingWorkbench {
  private readonly state = inject(InvoicingState);
  private readonly router = inject(Router);
  protected readonly selectedGuideId = signal<string | null>(null);

  protected readonly queue = computed(() => this.state.billingQueue());
  protected readonly pending = computed(() => this.queue().length);
  protected readonly delivered = computed(() => this.state.guides().filter((g) => g.status === 'delivered').length);
  protected readonly invoiced = computed(() => this.state.guides().filter((g) => !!g.generatedInvoiceId).length);
  protected readonly selectedGuide = computed(() => this.queue().find((g) => g.id === this.selectedGuideId()) ?? null);
  protected readonly selectedOrder = computed(() => {
    const g = this.selectedGuide();
    return g ? salesOrders().find((o) => o.id === g.salesOrderId) : null;
  });
  protected readonly selectedContact = computed(() => {
    const o = this.selectedOrder();
    return o ? salesContacts().find((c) => c.id === o.contactId) ?? salesContacts().find((c) => c.customerId === o.customerId) : null;
  });

  protected statusLabel = (s: DispatchGuide['status']) => DISPATCH_GUIDE_STATUS_LABEL[s];
  protected statusTone = (s: DispatchGuide['status']): Tone => s === 'delivered' ? 'success' : s === 'in_transit' ? 'warning' : 'info';

  protected selectGuide(g: DispatchGuide): void { this.selectedGuideId.set(g.id); }

  protected validateRuc(): void {
    const g = this.selectedGuide();
    if (!g) return;
    const result = this.state.validateCustomerTaxId(g.customerTaxId);
    if (result.status === 'valid') toast.success('RUC validado', { description: `${g.customerName} · ${g.customerTaxId}` });
    else toast.warning('Revisar RUC', { description: result.message });
  }

  protected prepareInvoice(): void {
    const g = this.selectedGuide();
    if (!g) return;
    const result = this.state.validateCustomerTaxId(g.customerTaxId);
    if (result.status !== 'valid') { toast.warning('No se puede preparar la factura', { description: result.message }); return; }
    this.router.navigate(['/apps/finance/invoices/new'], { queryParams: { guideId: g.id } });
  }

  protected goToReports(): void { this.router.navigate(['/apps/finance/reports']); }
}
