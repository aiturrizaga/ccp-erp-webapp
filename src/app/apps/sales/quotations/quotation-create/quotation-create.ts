import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { HlmPopoverImports } from '@ui/popover';
import { HlmCalendarImports } from '@ui/calendar';
import { ProductPicker } from '@shared/components/product-picker/product-picker';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { toast } from '@shared/toast';
import { createQuotation, salesContacts, salesCustomers, salesProducts } from '../../sales-state';
import { Customer, SalesProduct, formatSalesProductName } from '@core/models';

interface DraftLine {
  salesProductId: string;
  productCode: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitCost?: number;
  unitPrice: number;
  shippingCost?: number;
  materials?: string;
}

function defaultExpiryDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 15);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-quotation-create',
  imports: [
    FormsModule,
    DecimalPipe,
    NgIcon,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    ...HlmSelectImports,
    ...HlmPopoverImports,
    ...HlmCalendarImports,
    ProductPicker,
    EntityHeader,
  ],
  templateUrl: './quotation-create.html',
  host: { '(document:click)': 'onDocumentClick($event)' },
})
export class QuotationCreate {
  private readonly router = inject(Router);
  private readonly customerField = viewChild<ElementRef<HTMLElement>>('customerField');
  protected readonly customers = salesCustomers;
  protected readonly products = salesProducts;
  protected readonly contacts = salesContacts;
  protected readonly customerId = signal('');
  protected readonly customerSearch = signal('');
  protected readonly customerOpen = signal(false);
  protected readonly contactId = signal('');
  protected readonly expiresAt = signal(defaultExpiryDate());
  protected readonly expiryCalendarState = signal('closed');
  protected readonly paymentTerms = signal('');
  protected readonly includesShipping = signal(false);
  protected readonly shippingAddress = signal('');
  protected readonly notes = signal('');
  protected readonly lines = signal<DraftLine[]>([]);

  protected readonly customer = computed(() =>
    this.customers().find((c) => c.id === this.customerId()),
  );
  protected readonly customerOptions = computed(() => {
    const q = this.customerSearch().trim().toLowerCase();
    return this.customers()
      .filter((c) => !q || `${c.legalName} ${c.taxId}`.toLowerCase().includes(q))
      .slice(0, 10);
  });
  protected readonly customerContacts = computed(() =>
    this.contacts().filter((c) => c.customerId === this.customerId()),
  );
  protected readonly currency = computed(() => this.customer()?.currency ?? 'PEN');
  protected readonly productsTotal = computed(() =>
    this.lines().reduce((s, l) => s + l.quantity * l.unitPrice, 0),
  );
  protected readonly shippingTotal = computed(() =>
    this.includesShipping() ? this.lines().reduce((s, l) => s + (l.shippingCost ?? 0), 0) : 0,
  );
  protected readonly total = computed(() => this.productsTotal() + this.shippingTotal());
  protected readonly expiryDate = computed(() => {
    const [year, month, day] = this.expiresAt().split('-').map(Number);
    return new Date(year, month - 1, day);
  });
  protected readonly formattedExpiryDate = computed(() => {
    const [year, month, day] = this.expiresAt().split('-');
    return `${day}/${month}/${year}`;
  });
  protected readonly canSubmit = computed(
    () =>
      !!this.customerId() &&
      !!this.contactId() &&
      this.lines().length > 0 &&
      this.lines().every(
        (l) =>
          l.quantity > 0 &&
          l.unitPrice >= 0 &&
          (!this.includesShipping() || (l.shippingCost ?? 0) >= 0),
      ) &&
      (!this.includesShipping() || !!this.shippingAddress().trim()),
  );

  protected chooseCustomer(c: Customer): void {
    this.customerId.set(c.id);
    this.customerSearch.set(c.legalName);
    this.customerOpen.set(false);
    const first = this.customerContacts()[0];
    this.contactId.set(first?.id ?? '');
  }
  protected onCustomerSearch(v: string): void {
    this.customerSearch.set(v);
    this.customerOpen.set(true);
    if (this.customerId() && !v.startsWith(this.customer()?.legalName ?? '')) {
      this.customerId.set('');
      this.contactId.set('');
    }
  }
  protected onCustomerFocus(): void {
    this.customerOpen.set(true);
  }
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.customerField()?.nativeElement.contains(event.target as Node))
      this.customerOpen.set(false);
  }
  protected contactToString = (id: string): string => {
    const contact = this.customerContacts().find((c) => c.id === id);
    return contact ? `${contact.name} · ${contact.type}` : '';
  };
  protected changeContact(id: string | null | undefined): void {
    this.contactId.set(id ?? '');
  }
  protected onProductPicked(p: SalesProduct): void {
    this.lines.update((rows) => {
      const i = rows.findIndex((r) => r.salesProductId === p.id);
      if (i >= 0) return rows.map((r, j) => (j === i ? { ...r, quantity: r.quantity + 1 } : r));
      return [
        ...rows,
        {
          salesProductId: p.id,
          productCode: p.legacyCode,
          description: formatSalesProductName(p),
          quantity: 1,
          unitOfMeasure: p.unitOfMeasure,
          unitCost: p.productionUnitCost ?? undefined,
          unitPrice: p.costBand?.max ?? 0,
          shippingCost: 0,
          materials: '',
        },
      ];
    });
  }
  protected setLine(i: number, patch: Partial<DraftLine>): void {
    this.lines.update((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }
  protected removeLine(i: number): void {
    this.lines.update((rows) => rows.filter((_, j) => j !== i));
  }
  protected onShippingChange(includesShipping: boolean): void {
    this.includesShipping.set(includesShipping);
  }
  protected setExpiryDate(date: Date | undefined): void {
    if (!date) return;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    this.expiresAt.set(`${year}-${month}-${day}`);
    this.expiryCalendarState.set('closed');
  }
  protected submit(): void {
    const c = this.customer();
    if (!c || !this.canSubmit()) return;
    const q = createQuotation({
      customerId: c.id,
      customerName: c.legalName,
      contactId: this.contactId(),
      currency: c.currency,
      expiresAt: this.expiresAt(),
      lines: this.lines(),
      deliveries: this.includesShipping()
        ? [
            {
              id: `DEL-${Date.now()}`,
              address: this.shippingAddress().trim(),
              cost: this.shippingTotal(),
            },
          ]
        : undefined,
      paymentTerms: this.paymentTerms().trim() || undefined,
      notes: this.notes().trim() || undefined,
    });
    toast.success(`Cotización ${q.number} creada`);
    this.router.navigate(['/apps/sales/quotations', q.id]);
  }
  protected cancel(): void {
    this.router.navigate(['/apps/sales/quotations']);
  }
}
