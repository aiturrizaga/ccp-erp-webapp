import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { toast } from '@shared/toast';
import { HlmPopoverImports } from '@ui/popover';
import { createSalesProduct, salesProducts, updateSalesProduct } from '../../sales-state';
import {
  CCP_BRAND,
  Currency,
  SalesCategory,
  SalesProductStatus,
  SALES_CATEGORY_ACCOUNT,
  SALES_CATEGORY_LABEL,
  SALES_PRODUCT_STATUS_LABEL,
  formatSalesProductName,
  parseDimension,
} from '@core/models';

const CATEGORY_OPTIONS = (Object.keys(SALES_CATEGORY_LABEL) as SalesCategory[]).map((value) => ({ value, label: SALES_CATEGORY_LABEL[value] }));
const STATUS_OPTIONS = (Object.keys(SALES_PRODUCT_STATUS_LABEL) as SalesProductStatus[]).map((value) => ({ value, label: SALES_PRODUCT_STATUS_LABEL[value] }));
const CURRENCY_OPTIONS = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
];
const UOM_OPTIONS = ['UND', 'MT', 'KG', 'M2', 'M3'].map((value) => ({ value, label: value }));

@Component({
  selector: 'app-product-create',
  imports: [FormsModule, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, ...HlmPopoverImports, EntityHeader],
  templateUrl: './product-create.html',
})
export class ProductCreate {
  private readonly router = inject(Router);

  /** Present on the `/edit` route; absent on `/new`. */
  readonly id = input<string>();

  protected readonly name = signal('');
  protected readonly dimension = signal('');
  protected readonly spec = signal('');
  protected readonly category = signal<string>('POSTES');
  protected readonly brand = signal(CCP_BRAND);
  protected readonly unitOfMeasure = signal('UND');
  protected readonly currency = signal<string>('PEN');
  protected readonly status = signal<string>('draft');
  protected readonly legacyCode = signal('');
  protected readonly productionUnitCost = signal(0);
  protected readonly costMin = signal(0);
  protected readonly costMax = signal(0);
  protected readonly notes = signal('');

  protected readonly categoryOptions = CATEGORY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly currencyOptions = CURRENCY_OPTIONS;
  protected readonly uomOptions = UOM_OPTIONS;

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly account = computed(() => SALES_CATEGORY_ACCOUNT[this.category() as SalesCategory]);
  protected readonly preview = computed(() => formatSalesProductName({ name: this.name(), dimension: this.dimension(), spec: this.spec() }));
  protected readonly dimensionSegments = computed(() => parseDimension(this.dimension(), this.category() as SalesCategory));
  protected readonly canSubmit = computed(() => this.name().trim().length > 0 && this.costMin() > 0 && this.costMax() >= this.costMin());

  protected categoryToString = (v: string): string => SALES_CATEGORY_LABEL[v as SalesCategory] ?? v;
  protected statusToString = (v: string): string => SALES_PRODUCT_STATUS_LABEL[v as SalesProductStatus] ?? v;
  protected currencyToString = (v: string): string => this.currencyOptions.find((o) => o.value === v)?.label ?? v;
  protected uomToString = (v: string): string => v;

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      const p = salesProducts().find((x) => x.id === id);
      if (!p) return;
      this.name.set(p.name);
      this.dimension.set(p.dimension);
      this.spec.set(p.spec);
      this.category.set(p.category);
      this.brand.set(p.brand);
      this.unitOfMeasure.set(p.unitOfMeasure);
      this.currency.set(p.currency);
      this.status.set(p.status);
      this.legacyCode.set(p.legacyCode);
      this.productionUnitCost.set(p.productionUnitCost);
      this.costMin.set(p.costBand.min);
      this.costMax.set(p.costBand.max);
      this.notes.set(p.notes ?? '');
    });
  }

  protected readonly submitPopover = signal<'open' | 'closed'>('closed');

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.submitPopover.set('closed');
    const payload = {
      legacyCode: this.legacyCode().trim() || `SP-${Date.now().toString().slice(-6)}`,
      name: this.name().trim().toUpperCase(),
      dimension: this.dimension().trim(),
      spec: this.spec().trim().toUpperCase(),
      category: this.category() as SalesCategory,
      brand: this.brand().trim() || CCP_BRAND,
      unitOfMeasure: this.unitOfMeasure(),
      currency: this.currency() as Currency,
      productionUnitCost: this.productionUnitCost(),
      costBand: { min: this.costMin(), max: this.costMax() },
      status: this.status() as SalesProductStatus,
      notes: this.notes().trim() || undefined,
    };

    const editId = this.id();
    if (editId) {
      updateSalesProduct(editId, payload);
      toast.success('Producto actualizado', { description: formatSalesProductName(payload) });
      this.router.navigate(['/apps/sales/products', editId]);
    } else {
      const product = createSalesProduct(payload);
      toast.success(`Producto ${product.id} creado`, { description: formatSalesProductName(product) });
      this.router.navigate(['/apps/sales/products', product.id]);
    }
  }

  protected cancel(): void {
    const editId = this.id();
    this.router.navigate(editId ? ['/apps/sales/products', editId] : ['/apps/sales/products']);
  }
}
