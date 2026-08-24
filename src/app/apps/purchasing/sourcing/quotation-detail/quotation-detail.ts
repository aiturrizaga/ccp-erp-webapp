import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmDialogImports } from '@ui/dialog';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmComboboxImports } from '@ui/combobox';
import { HlmSelectImports } from '@ui/select';
import { HlmCheckboxImports } from '@ui/checkbox';
import { HlmAlertDialogImports } from '@ui/alert-dialog';
import { toast } from '@shared/toast';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { Currency, QuotationOffer, QuotationStatus, QUOTATION_STATUS_LABEL, SupplierClass, Tone } from '@core/models';
import { AuthState } from '@shell/auth-state';
import { InventoryState } from '../../../inventory/inventory-state';
import { PurchasingState } from '../../purchasing-state';

const STATUS_TONE: Record<QuotationStatus, Tone> = {
  draft: 'neutral',
  sent: 'info',
  received: 'info',
  under_evaluation: 'warning',
  awarded: 'success',
  discarded: 'danger',
};

const CURRENCY_OPTIONS: SelectFilterOption[] = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
];

const SUPPLIER_CLASS_OPTIONS: SelectFilterOption[] = [
  { value: 'PRODUCT', label: 'Producto' },
  { value: 'SERVICE', label: 'Servicio' },
];

/** Sentinel option value rendered at the end of every supplier combobox — intercepted before it ever reaches the underlying value signal. */
const ADD_NEW_SUPPLIER = '__add_new_supplier__';

@Component({
  selector: 'app-quotation-detail',
  imports: [
    FormsModule,
    RouterLink,
    NgIcon,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmDialogImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    ...HlmComboboxImports,
    ...HlmSelectImports,
    ...HlmCheckboxImports,
    ...HlmAlertDialogImports,
    EntityHeader,
    EmptyState,
  ],
  templateUrl: './quotation-detail.html',
})
export class QuotationDetail {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);
  private readonly inventoryState = inject(InventoryState);
  private readonly auth = inject(AuthState);

  readonly id = input.required<string>();

  protected readonly quotation = computed(() => this.purchasingState.quotations().find((q) => q.id === this.id()));

  protected readonly currencyOptions = CURRENCY_OPTIONS;
  protected readonly supplierClassOptions = SUPPLIER_CLASS_OPTIONS;

  private readonly activeLineItemId = signal<string | null>(null);
  protected readonly newSupplierId = signal('');
  protected readonly newSupplierSearch = signal('');
  protected readonly newUnitPrice = signal(0);
  protected readonly newCurrency = signal<string>('PEN');
  protected readonly newDeliveryDays = signal(1);
  protected readonly newPaymentTerms = signal('');
  protected readonly newAttachmentName = signal('');

  private associatedSupplierIdsForItem(itemId: string | null): Set<string> {
    const item = this.inventoryState.items().find((i) => i.id === itemId);
    return new Set(item?.suppliers.map((s) => s.supplierId) ?? []);
  }

  /** Defaults to suppliers already linked to this item; typing a search expands to the full supplier list. An "Agregar nuevo proveedor" entry always closes the list. */
  protected readonly supplierOptionsForActiveLine = computed<SelectFilterOption[]>(() => {
    const line = this.quotation()?.lines.find((l) => l.itemId === this.activeLineItemId());
    const alreadyOffered = new Set(line?.offers.map((o) => o.supplierId));
    const suppliers = this.purchasingState.suppliers();
    const search = this.newSupplierSearch().trim().toLowerCase();
    const associated = this.associatedSupplierIdsForItem(this.activeLineItemId());

    const base = search
      ? suppliers.filter((s) => s.legalName.toLowerCase().includes(search) || s.taxId.includes(search))
      : suppliers.filter((s) => associated.has(s.id));

    const options = base.filter((s) => !alreadyOffered.has(s.id)).map((s) => ({ value: s.id, label: s.legalName }));
    options.push({ value: ADD_NEW_SUPPLIER, label: '+ Agregar nuevo proveedor' });
    return options;
  });

  protected supplierPickerToString = (value: string): string => this.purchasingState.suppliers().find((s) => s.id === value)?.legalName ?? value;
  protected currencyToString = (value: string): string => this.currencyOptions.find((o) => o.value === value)?.label ?? value;
  protected supplierClassToString = (value: string): string => this.supplierClassOptions.find((o) => o.value === value)?.label ?? value;

  protected onSupplierValueChange(value: string | null | undefined): void {
    if (value === ADD_NEW_SUPPLIER) {
      this.openNewSupplierDialog('line');
      return;
    }
    this.newSupplierId.set(value ?? '');
  }

  protected itemLabel(itemId: string): string {
    const item = this.inventoryState.items().find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected supplierName(supplierId: string): string {
    return this.purchasingState.suppliers().find((s) => s.id === supplierId)?.legalName ?? supplierId;
  }

  protected statusLabel(status: QuotationStatus): string {
    return QUOTATION_STATUS_LABEL[status];
  }

  protected statusTone(status: QuotationStatus): Tone {
    return STATUS_TONE[status];
  }

  protected goToComparison(): void {
    const q = this.quotation();
    if (!q) return;
    this.router.navigate(['/apps/purchasing/sourcing/comparison', q.requisitionId]);
  }

  protected markSent(): void {
    this.purchasingState.markQuotationSent(this.id());
    toast.success('Cotización marcada como enviada a proveedores');
  }

  /** Prefills the item's primary supplier and last known price/lead time — Conie usually re-quotes with the same supplier first. Skips the default when that supplier already quoted this line. */
  protected openAddOfferDraft(itemId: string): void {
    this.activeLineItemId.set(itemId);
    const item = this.inventoryState.items().find((i) => i.id === itemId);
    const line = this.quotation()?.lines.find((l) => l.itemId === itemId);
    const alreadyOffered = new Set(line?.offers.map((o) => o.supplierId));
    const primary = item?.suppliers.find((s) => s.isPrimary && !alreadyOffered.has(s.supplierId));
    this.newSupplierSearch.set('');
    this.newSupplierId.set(primary?.supplierId ?? '');
    this.newUnitPrice.set(primary?.price ?? 0);
    this.newCurrency.set(primary?.currency ?? 'PEN');
    this.newDeliveryDays.set(primary?.leadTimeDays ?? 1);
    this.newPaymentTerms.set('');
    this.newAttachmentName.set('');
  }

  protected onAttachmentSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.newAttachmentName.set(file?.name ?? '');
  }

  protected canAddOffer(): boolean {
    return this.newSupplierId().length > 0 && this.newUnitPrice() > 0 && this.newDeliveryDays() > 0 && this.newPaymentTerms().trim().length > 0 && this.newAttachmentName().length > 0;
  }

  protected confirmAddOffer(): void {
    const quotation = this.quotation();
    const itemId = this.activeLineItemId();
    if (!quotation || !itemId || !this.canAddOffer()) return;

    const offer: QuotationOffer = {
      supplierId: this.newSupplierId(),
      unitPrice: this.newUnitPrice(),
      currency: this.newCurrency() as Currency,
      deliveryDays: this.newDeliveryDays(),
      paymentTerms: this.newPaymentTerms(),
      attachmentName: this.newAttachmentName(),
      selected: false,
    };

    this.purchasingState.addOfferToLine(quotation.id, itemId, offer);

    const item = this.inventoryState.items().find((i) => i.id === itemId);
    const alreadyLinked = item?.suppliers.some((s) => s.supplierId === offer.supplierId);
    if (item && !alreadyLinked) {
      this.inventoryState.addSupplierLink(item.id, {
        supplierId: offer.supplierId,
        price: offer.unitPrice,
        currency: offer.currency,
        leadTimeDays: offer.deliveryDays,
        isPrimary: false,
      });
    }

    toast.success(`Cotización de ${this.supplierName(offer.supplierId)} registrada`, { description: this.itemLabel(itemId) });
  }

  // --- Bulk entry: one supplier quoting several items of this RFQ at once ---

  protected readonly bulkSupplierId = signal('');
  protected readonly bulkSupplierSearch = signal('');
  protected readonly bulkCurrency = signal<string>('PEN');
  protected readonly bulkDeliveryDays = signal(1);
  protected readonly bulkPaymentTerms = signal('');
  protected readonly bulkAttachmentName = signal('');
  protected readonly bulkLineChecked = signal<Record<string, boolean>>({});
  protected readonly bulkLinePrice = signal<Record<string, number>>({});

  /** Union of suppliers already linked to any item in this RFQ — the combobox default before the user types a search. */
  private readonly bulkAssociatedSupplierIds = computed(() => {
    const items = this.inventoryState.items();
    const ids = new Set<string>();
    for (const line of this.quotation()?.lines ?? []) {
      const item = items.find((i) => i.id === line.itemId);
      item?.suppliers.forEach((s) => ids.add(s.supplierId));
    }
    return ids;
  });

  protected readonly bulkSupplierOptions = computed<SelectFilterOption[]>(() => {
    const suppliers = this.purchasingState.suppliers();
    const search = this.bulkSupplierSearch().trim().toLowerCase();
    const associated = this.bulkAssociatedSupplierIds();

    const base = search
      ? suppliers.filter((s) => s.legalName.toLowerCase().includes(search) || s.taxId.includes(search))
      : suppliers.filter((s) => associated.has(s.id));

    const options = base.map((s) => ({ value: s.id, label: s.legalName }));
    options.push({ value: ADD_NEW_SUPPLIER, label: '+ Agregar nuevo proveedor' });
    return options;
  });

  protected bulkSupplierPickerToString = (value: string): string => this.purchasingState.suppliers().find((s) => s.id === value)?.legalName ?? value;

  protected onBulkSupplierValueChange(value: string | null | undefined): void {
    if (value === ADD_NEW_SUPPLIER) {
      this.openNewSupplierDialog('bulk');
      return;
    }
    this.bulkSupplierId.set(value ?? '');
  }

  /** Lines the chosen supplier hasn't already quoted — recomputed as she switches suppliers in the dialog. */
  protected readonly bulkAvailableLines = computed(() => {
    const supplierId = this.bulkSupplierId();
    return (this.quotation()?.lines ?? []).filter((line) => !line.offers.some((o) => o.supplierId === supplierId));
  });

  protected openBulkOfferDraft(): void {
    this.bulkSupplierId.set('');
    this.bulkSupplierSearch.set('');
    this.bulkCurrency.set('PEN');
    this.bulkDeliveryDays.set(1);
    this.bulkPaymentTerms.set('');
    this.bulkAttachmentName.set('');
    this.bulkLineChecked.set({});
    this.bulkLinePrice.set({});
  }

  protected onBulkAttachmentSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.bulkAttachmentName.set(file?.name ?? '');
  }

  protected toggleBulkLine(itemId: string, checked: boolean): void {
    this.bulkLineChecked.update((m) => ({ ...m, [itemId]: checked }));
  }

  protected setBulkLinePrice(itemId: string, value: string): void {
    const price = Number(value);
    if (!Number.isFinite(price)) return;
    this.bulkLinePrice.update((m) => ({ ...m, [itemId]: price }));
  }

  private checkedBulkItemIds(): string[] {
    return Object.entries(this.bulkLineChecked())
      .filter(([, checked]) => checked)
      .map(([itemId]) => itemId);
  }

  protected canConfirmBulkOffer(): boolean {
    const checked = this.checkedBulkItemIds();
    return (
      this.bulkSupplierId().length > 0 &&
      this.bulkDeliveryDays() > 0 &&
      this.bulkPaymentTerms().trim().length > 0 &&
      this.bulkAttachmentName().length > 0 &&
      checked.length > 0 &&
      checked.every((itemId) => (this.bulkLinePrice()[itemId] ?? 0) > 0)
    );
  }

  protected confirmBulkOffer(): void {
    const quotation = this.quotation();
    if (!quotation || !this.canConfirmBulkOffer()) return;

    const supplierId = this.bulkSupplierId();
    const currency = this.bulkCurrency() as Currency;
    const deliveryDays = this.bulkDeliveryDays();
    const paymentTerms = this.bulkPaymentTerms();
    const attachmentName = this.bulkAttachmentName();
    const checkedItemIds = this.checkedBulkItemIds();

    for (const itemId of checkedItemIds) {
      const offer: QuotationOffer = {
        supplierId,
        unitPrice: this.bulkLinePrice()[itemId] ?? 0,
        currency,
        deliveryDays,
        paymentTerms,
        attachmentName,
        selected: false,
      };
      this.purchasingState.addOfferToLine(quotation.id, itemId, offer);

      const item = this.inventoryState.items().find((i) => i.id === itemId);
      const alreadyLinked = item?.suppliers.some((s) => s.supplierId === supplierId);
      if (item && !alreadyLinked) {
        this.inventoryState.addSupplierLink(item.id, { supplierId, price: offer.unitPrice, currency, leadTimeDays: deliveryDays, isPrimary: false });
      }
    }

    toast.success(`Se registraron ${checkedItemIds.length} artículo(s) cotizados por ${this.supplierName(supplierId)}`);
  }

  // --- Quick "Agregar nuevo proveedor" registration, opened from either supplier combobox ---

  protected readonly newSupplierDialogState = signal<'open' | 'closed'>('closed');
  private newSupplierTarget: 'line' | 'bulk' | null = null;

  protected readonly newSupplierLegalName = signal('');
  protected readonly newSupplierTaxId = signal('');
  protected readonly newSupplierPhone = signal('');
  protected readonly newSupplierEmail = signal('');
  protected readonly newSupplierClass = signal<SupplierClass>('PRODUCT');
  protected readonly newSupplierCurrency = signal<string>('PEN');

  protected openNewSupplierDialog(target: 'line' | 'bulk'): void {
    this.newSupplierTarget = target;
    this.newSupplierLegalName.set('');
    this.newSupplierTaxId.set('');
    this.newSupplierPhone.set('');
    this.newSupplierEmail.set('');
    this.newSupplierClass.set('PRODUCT');
    this.newSupplierCurrency.set('PEN');
    this.newSupplierDialogState.set('open');
  }

  protected canCreateSupplier(): boolean {
    return this.newSupplierLegalName().trim().length > 0 && this.newSupplierTaxId().trim().length > 0;
  }

  protected confirmCreateSupplier(): void {
    if (!this.canCreateSupplier()) return;

    const supplier = this.purchasingState.addSupplier({
      legalName: this.newSupplierLegalName().trim(),
      taxId: this.newSupplierTaxId().trim(),
      phone: this.newSupplierPhone().trim(),
      email: this.newSupplierEmail().trim(),
      class: this.newSupplierClass(),
      currency: this.newSupplierCurrency() as Currency,
      createdBy: this.auth.currentUser()?.name ?? '',
    });

    if (this.newSupplierTarget === 'bulk') {
      this.bulkSupplierId.set(supplier.id);
    } else {
      this.newSupplierId.set(supplier.id);
    }

    this.newSupplierDialogState.set('closed');
    toast.success(`Proveedor ${supplier.legalName} registrado`, { description: 'Queda en Borrador — Compras debe completar su ficha en Proveedores.' });
  }
}
