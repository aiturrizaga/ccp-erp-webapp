import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmSelectImports } from '@ui/select';
import { HlmPopoverImports } from '@ui/popover';
import { NgIcon } from '@ng-icons/core';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { toast } from '@shared/toast';
import { salesClaims, salesContacts, salesCustomers, salesOrders, salesQuotations } from '@apps/sales/sales-state';
import { InvoicingState } from '@apps/invoicing/invoicing-state';

@Component({
  selector: 'app-customer-file',
  imports: [DecimalPipe, RouterLink, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmSelectImports, ...HlmPopoverImports, EntityHeader, StatusBadge],
  templateUrl: './customer-file.html',
})
export class CustomerFile {
  private readonly state = inject(InvoicingState);

  protected readonly customers = salesCustomers;
  protected readonly customerId = signal(salesCustomers()[0]?.id ?? '');

  protected readonly customer = computed(() => salesCustomers().find((c) => c.id === this.customerId()));
  protected readonly quotations = computed(() => salesQuotations().filter((q) => q.customerId === this.customerId()));
  protected readonly orders = computed(() => salesOrders().filter((o) => o.customerId === this.customerId()));
  protected readonly invoices = computed(() =>
    this.state.invoices().filter((i) => i.documentType === 'sales' && (i.customerId === this.customerId() || i.customerName === this.customer()?.legalName)),
  );
  protected readonly guides = computed(() => {
    const orderIds = new Set(this.orders().map((o) => o.id));
    return this.state.guides().filter((g) => g.salesOrderId && orderIds.has(g.salesOrderId));
  });
  protected readonly claims = computed(() => salesClaims().filter((c) => c.customerId === this.customerId()));
  protected readonly agreements = computed(() => this.state.agreements().filter((a) => a.customerId === this.customerId()));
  protected readonly deliveries = computed(() => this.state.deliveries().filter((d) => d.customerId === this.customerId()));

  protected readonly docCount = computed(
    () => this.quotations().length + this.orders().length + this.invoices().length + this.guides().length + this.claims().length + this.agreements().length,
  );

  protected customerToString = (v: string) => salesCustomers().find((c) => c.id === v)?.legalName ?? v;

  protected readonly sendPopover = signal<'open' | 'closed'>('closed');

  /** Email the expediente would go to (billing/collections contact, else first contact). */
  protected readonly sendTo = computed(() => {
    const c = this.customer();
    if (!c) return '';
    const billing = salesContacts().find((x) => x.customerId === c.id && (x.type === 'facturacion' || x.type === 'cobranzas'));
    return billing?.email || salesContacts().find((x) => x.customerId === c.id)?.email || 'cliente@correo.pe';
  });

  protected sendExpediente(): void {
    const c = this.customer();
    if (!c) return;
    this.sendPopover.set('closed');
    const to = this.sendTo();
    const docs = [
      ...this.quotations().map((q) => q.number),
      ...this.orders().map((o) => o.number),
      ...this.invoices().map((i) => i.number),
      ...this.guides().map((g) => g.number),
    ];
    this.state.recordDelivery({ customerId: c.id, customerName: c.legalName, documents: docs, channel: 'email', to, sentAt: '2026-09-01', kind: 'expediente', status: 'sent' });
    toast.success('Expediente enviado', { description: `${docs.length} documentos → ${to}` });
  }
}
