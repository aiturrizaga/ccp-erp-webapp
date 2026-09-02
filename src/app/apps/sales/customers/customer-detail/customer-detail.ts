import { Component, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmSelectImports } from '@ui/select';
import { NgIcon } from '@ng-icons/core';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { toast } from '@shared/toast';
import { addContact, salesContacts, salesCustomers, salesOrders, updateCustomer } from '../../sales-state';
import { DocLookupService } from '../doc-lookup.service';
import { CONTACT_TYPE_LABEL, ContactType, CUSTOMER_PAYMENT_MODE_LABEL } from '@core/models';

@Component({
  selector: 'app-customer-detail',
  imports: [DecimalPipe, FormsModule, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmSelectImports, EntityHeader, EmptyState, StatusBadge],
  templateUrl: './customer-detail.html',
})
export class CustomerDetail {
  private readonly router = inject(Router);
  private readonly lookup = inject(DocLookupService);

  readonly id = input.required<string>();

  protected readonly customer = computed(() => salesCustomers().find((c) => c.id === this.id()));
  protected readonly contacts = computed(() => salesContacts().filter((c) => c.customerId === this.id()));
  protected readonly orders = computed(() => salesOrders().filter((o) => o.customerId === this.id()));
  protected readonly syncing = signal(false);

  protected readonly showContactForm = signal(false);
  protected readonly draft = signal({ type: 'comercial' as ContactType, firstName: '', lastName: '', email: '', phone: '', mobile: '' });

  protected readonly contactTypeOptions = (Object.keys(CONTACT_TYPE_LABEL) as ContactType[]).map((value) => ({ value, label: CONTACT_TYPE_LABEL[value] }));

  protected readonly creditOver = computed(() => {
    const c = this.customer();
    return !!c && (c.creditUsed ?? 0) > (c.creditLimit ?? 0) && (c.creditLimit ?? 0) > 0;
  });

  protected modeLabel = (m?: keyof typeof CUSTOMER_PAYMENT_MODE_LABEL) => (m ? CUSTOMER_PAYMENT_MODE_LABEL[m] : '—');
  protected contactTypeLabel = (t?: ContactType) => (t ? CONTACT_TYPE_LABEL[t] : '—');
  protected contactTypeToString = (v: string) => CONTACT_TYPE_LABEL[v as ContactType] ?? v;

  protected setDraft(patch: Partial<ReturnType<typeof this.draft>>): void {
    this.draft.update((d) => ({ ...d, ...patch }));
  }

  protected saveContact(): void {
    const d = this.draft();
    if (!d.firstName.trim() && !d.lastName.trim()) return;
    addContact({
      customerId: this.id(),
      name: `${d.firstName} ${d.lastName}`.trim(),
      position: CONTACT_TYPE_LABEL[d.type],
      email: d.email.trim(),
      phone: d.phone.trim(),
      type: d.type,
      firstName: d.firstName.trim(),
      lastName: d.lastName.trim(),
      mobile: d.mobile.trim(),
    });
    toast.success('Contacto agregado');
    this.draft.set({ type: 'comercial', firstName: '', lastName: '', email: '', phone: '', mobile: '' });
    this.showContactForm.set(false);
  }

  protected async sync(): Promise<void> {
    const c = this.customer();
    if (!c || !c.docType) return;
    this.syncing.set(true);
    try {
      const data = await this.lookup.lookup(c.docType, c.taxId);
      updateCustomer(c.id, {
        legalName: data.legalName || c.legalName,
        fiscalAddress: data.fiscalAddress ?? c.fiscalAddress,
        isRetentionAgent: data.isRetentionAgent ?? c.isRetentionAgent,
        lastSyncedAt: '2026-09-01',
      });
      toast.success('Datos sincronizados', { description: data.source === 'apiperu' ? 'Actualizado desde API PERU' : 'Sin conexión — datos locales' });
    } finally {
      this.syncing.set(false);
    }
  }
}
