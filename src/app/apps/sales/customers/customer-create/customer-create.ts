import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { NgIcon } from '@ng-icons/core';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { toast } from '@shared/toast';
import { addContact, createCustomer } from '../../sales-state';
import { DocLookupService } from '../doc-lookup.service';
import {
  CONTACT_TYPE_LABEL,
  ContactType,
  Currency,
  CustomerDocType,
  CustomerPaymentMode,
  CUSTOMER_PAYMENT_MODE_LABEL,
} from '@core/models';

interface DraftContact {
  type: ContactType;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
}

@Component({
  selector: 'app-customer-create',
  imports: [FormsModule, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, EntityHeader],
  templateUrl: './customer-create.html',
})
export class CustomerCreate {
  private readonly router = inject(Router);
  private readonly lookup = inject(DocLookupService);

  protected readonly docType = signal<CustomerDocType>('RUC');
  protected readonly docNumber = signal('');
  protected readonly legalName = signal('');
  protected readonly tradeName = signal('');
  protected readonly fiscalAddress = signal('');
  protected readonly isRetentionAgent = signal(false);
  protected readonly paymentMode = signal<CustomerPaymentMode>('credit');
  protected readonly currency = signal<Currency>('PEN');
  protected readonly creditLimit = signal(0);

  protected readonly looking = signal(false);
  protected readonly lookupResult = signal<string | null>(null);

  /** Digits we've already looked up, so re-renders / extra keystrokes don't fire the call again. */
  private lastLookedUp = '';

  /** RUC → 11 digits, DNI → 8. The lookup fires automatically once the number is complete. */
  private get expectedLength(): number {
    return this.docType() === 'RUC' ? 11 : 8;
  }

  protected readonly contacts = signal<DraftContact[]>([
    { type: 'representante_legal', firstName: '', lastName: '', email: '', phone: '', mobile: '' },
  ]);

  protected readonly contactTypeOptions = (Object.keys(CONTACT_TYPE_LABEL) as ContactType[]).map((value) => ({ value, label: CONTACT_TYPE_LABEL[value] }));
  protected readonly currencyOptions = [
    { value: 'PEN', label: 'Soles (PEN)' },
    { value: 'USD', label: 'Dólares (USD)' },
  ];
  protected readonly modeOptions = [
    { value: 'credit', label: CUSTOMER_PAYMENT_MODE_LABEL.credit },
    { value: 'cash', label: CUSTOMER_PAYMENT_MODE_LABEL.cash },
  ];

  protected readonly canSubmit = computed(() => this.docNumber().trim().length >= 8 && this.legalName().trim().length > 0);

  protected contactTypeToString = (v: string): string => CONTACT_TYPE_LABEL[v as ContactType] ?? v;
  protected currencyToString = (v: string): string => this.currencyOptions.find((o) => o.value === v)?.label ?? v;
  protected modeToString = (v: string): string => this.modeOptions.find((o) => o.value === v)?.label ?? v;

  /** Called on every keystroke — normalizes to digits, then auto-triggers the lookup when complete. */
  protected onDocNumberChange(raw: string): void {
    const digits = raw.replace(/\D/g, '');
    this.docNumber.set(digits);
    if (digits.length === this.expectedLength && digits !== this.lastLookedUp && !this.looking()) {
      void this.fetchData();
    } else if (digits.length < this.expectedLength) {
      // Editing back below a full number — allow the next complete value to search again.
      this.lastLookedUp = '';
      this.lookupResult.set(null);
    }
  }

  /** Switching RUC ↔ DNI: trim to the new length, reset the lookup, and re-search if now complete. */
  protected onDocTypeChange(value: CustomerDocType): void {
    this.docType.set(value);
    this.lastLookedUp = '';
    this.lookupResult.set(null);
    const digits = this.docNumber().replace(/\D/g, '').slice(0, this.expectedLength);
    this.docNumber.set(digits);
    if (digits.length === this.expectedLength && !this.looking()) void this.fetchData();
  }

  protected async fetchData(): Promise<void> {
    const num = this.docNumber().trim();
    if (!num) return;
    this.lastLookedUp = num;
    this.looking.set(true);
    this.lookupResult.set(null);
    try {
      const data = await this.lookup.lookup(this.docType(), num);
      if (data.legalName) {
        this.legalName.set(data.legalName);
        if (data.tradeName) this.tradeName.set(data.tradeName);
        if (data.fiscalAddress) this.fiscalAddress.set(data.fiscalAddress);
        this.isRetentionAgent.set(!!data.isRetentionAgent);
        this.lookupResult.set(
          data.source === 'apiperu'
            ? `Datos traídos de ${this.docType() === 'RUC' ? 'SUNAT' : 'RENIEC'} vía API PERU.`
            : 'Sin conexión con API PERU — se usaron datos locales de demostración.',
        );
      } else {
        this.lookupResult.set('No se encontraron datos para ese documento. Complétalos manualmente.');
      }
    } finally {
      this.looking.set(false);
    }
  }

  protected addContactRow(): void {
    this.contacts.update((rows) => [...rows, { type: 'comercial', firstName: '', lastName: '', email: '', phone: '', mobile: '' }]);
  }

  protected removeContactRow(index: number): void {
    this.contacts.update((rows) => rows.filter((_, i) => i !== index));
  }

  protected setContact(index: number, patch: Partial<DraftContact>): void {
    this.contacts.update((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  protected submit(): void {
    if (!this.canSubmit()) return;
    const customer = createCustomer({
      legalName: this.legalName().trim().toUpperCase(),
      taxId: this.docNumber().trim(),
      address: this.fiscalAddress().trim(),
      paymentTerms: this.paymentMode() === 'cash' ? 'CONTADO' : `CREDITO A ${30} DIAS`,
      currency: this.currency(),
      commercialTerms: '',
      docType: this.docType(),
      tradeName: this.tradeName().trim() || undefined,
      isRetentionAgent: this.isRetentionAgent(),
      fiscalAddress: this.fiscalAddress().trim() || undefined,
      paymentMode: this.paymentMode(),
      creditLimit: this.paymentMode() === 'credit' ? this.creditLimit() : 0,
      creditUsed: 0,
      lastSyncedAt: '2026-09-01',
    });

    for (const c of this.contacts()) {
      if (!c.firstName.trim() && !c.lastName.trim()) continue;
      addContact({
        customerId: customer.id,
        name: `${c.firstName} ${c.lastName}`.trim(),
        position: CONTACT_TYPE_LABEL[c.type],
        email: c.email.trim(),
        phone: c.phone.trim(),
        type: c.type,
        firstName: c.firstName.trim(),
        lastName: c.lastName.trim(),
        mobile: c.mobile.trim(),
      });
    }

    toast.success(`Cliente ${customer.legalName} registrado`);
    this.router.navigate(['/apps/sales/customers', customer.id]);
  }

  protected cancel(): void {
    this.router.navigate(['/apps/sales/customers']);
  }
}
