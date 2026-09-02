import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmTextareaImports } from '@ui/textarea';
import { HlmSelectImports } from '@ui/select';
import { HlmComboboxImports } from '@ui/combobox';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { toast } from '@shared/toast';
import { ITEMS, WAREHOUSES } from '@core/mock-data';
import { Currency, PurchaseOrderLine } from '@core/models';
import { PurchasingState } from '../../purchasing-state';

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
];

/** Real plantas (ubicaciones de tipo producción) del almacén — "AL01 · Planta 02", etc. */
const PLANT_OPTIONS: { value: string; label: string }[] = (WAREHOUSES[0]?.locations ?? [])
  .filter((l) => l.type === 'production')
  .map((l) => ({ value: `${WAREHOUSES[0].shortName} · ${l.name}`, label: `${WAREHOUSES[0].shortName} · ${l.name}` }));

interface DraftLine {
  itemId: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
}

/** Compras registra una Orden de Compra directamente, sin pasar por una cotización/adjudicación — p. ej. una compra directa o un pedido repetido a un proveedor conocido. */
@Component({
  selector: 'app-purchase-order-create',
  imports: [
    FormsModule,
    DecimalPipe,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    ...HlmTextareaImports,
    ...HlmSelectImports,
    ...HlmComboboxImports,
    EntityHeader,
  ],
  templateUrl: './purchase-order-create.html',
})
export class PurchaseOrderCreate {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);

  protected readonly supplierId = signal('');
  protected readonly supplierSearch = signal('');
  protected readonly currency = signal<Currency>('PEN');
  protected readonly exchangeRate = signal(1);
  protected readonly paymentTerms = signal('');
  protected readonly plant = signal(PLANT_OPTIONS[0]?.value ?? '');
  protected readonly committedDeliveryDate = signal('');
  protected readonly committedDeliveryTime = signal('09:00');
  protected readonly termsAndConditions = signal('');
  protected readonly penalties = signal('');
  protected readonly warranty = signal('');
  protected readonly notes = signal('');
  protected readonly lines = signal<DraftLine[]>([]);

  protected readonly newItemId = signal('');
  protected readonly newQuantity = signal(0);
  protected readonly newUnitPrice = signal(0);

  protected readonly currencyOptions = CURRENCY_OPTIONS;
  protected readonly plantOptions = PLANT_OPTIONS;

  protected currencyToString = (value: string): string => CURRENCY_OPTIONS.find((o) => o.value === value)?.label ?? value;
  protected plantToString = (value: string): string => PLANT_OPTIONS.find((o) => o.value === value)?.label ?? value;

  protected readonly supplierOptions = computed<SelectFilterOption[]>(() => {
    const suppliers = this.purchasingState.suppliers();
    const search = this.supplierSearch().trim().toLowerCase();
    const base = search ? suppliers.filter((s) => s.legalName.toLowerCase().includes(search) || s.taxId.includes(search)) : suppliers;
    return base.map((s) => ({ value: s.id, label: s.legalName }));
  });

  protected supplierPickerToString = (value: string): string => this.purchasingState.suppliers().find((s) => s.id === value)?.legalName ?? value;

  protected readonly availableItemOptions = computed<SelectFilterOption[]>(() => {
    const linkedIds = new Set(this.lines().map((l) => l.itemId));
    return ITEMS.filter((i) => !linkedIds.has(i.id)).map((i) => ({ value: i.id, label: `${i.code} — ${i.description}` }));
  });

  protected itemPickerToString = (value: string): string => this.availableItemOptions().find((o) => o.value === value)?.label ?? value;

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected canAddLine(): boolean {
    return this.newItemId().length > 0 && this.newQuantity() > 0 && this.newUnitPrice() > 0;
  }

  protected addLine(): void {
    const item = ITEMS.find((i) => i.id === this.newItemId());
    if (!item || this.newQuantity() <= 0 || this.newUnitPrice() <= 0) return;
    this.lines.update((lines) => [...lines, { itemId: item.id, quantity: this.newQuantity(), unitOfMeasure: item.unitOfMeasure, unitPrice: this.newUnitPrice() }]);
    this.newItemId.set('');
    this.newQuantity.set(0);
    this.newUnitPrice.set(0);
  }

  protected removeLine(itemId: string): void {
    this.lines.update((lines) => lines.filter((l) => l.itemId !== itemId));
  }

  protected subtotal(line: DraftLine): number {
    return line.quantity * line.unitPrice;
  }

  protected readonly total = computed(() => this.lines().reduce((sum, l) => sum + l.quantity * l.unitPrice, 0));

  protected canSubmit(): boolean {
    return (
      this.supplierId().length > 0 &&
      this.plant().trim().length > 0 &&
      this.paymentTerms().trim().length > 0 &&
      this.committedDeliveryDate().length > 0 &&
      this.lines().length > 0
    );
  }

  protected submit(): void {
    if (!this.canSubmit()) return;

    const lines: PurchaseOrderLine[] = this.lines().map((l) => ({
      itemId: l.itemId,
      quantity: l.quantity,
      receivedQuantity: 0,
      unitOfMeasure: l.unitOfMeasure,
      unitPrice: l.unitPrice,
    }));

    const order = this.purchasingState.createPurchaseOrder({
      supplierId: this.supplierId(),
      currency: this.currency(),
      exchangeRate: this.currency() === 'USD' ? this.exchangeRate() : 1,
      paymentTerms: this.paymentTerms().trim(),
      committedDeliveryDate: this.committedDeliveryDate(),
      committedDeliveryTime: this.committedDeliveryTime(),
      plant: this.plant().trim(),
      termsAndConditions: this.termsAndConditions().trim() || undefined,
      penalties: this.penalties().trim() || undefined,
      warranty: this.warranty().trim() || undefined,
      notes: this.notes().trim() || undefined,
      lines,
    });

    toast.success(`Orden de compra ${order.number} creada`, { description: 'Queda en Borrador.' });
    this.router.navigate(['/apps/purchasing/purchase-orders', order.id]);
  }

  protected cancel(): void {
    this.router.navigate(['/apps/purchasing/purchase-orders']);
  }
}
