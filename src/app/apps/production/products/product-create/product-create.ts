import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { HlmPopoverImports } from '@ui/popover';
import { NgIcon } from '@ng-icons/core';
import { FormsModule } from '@angular/forms';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { ItemPicker } from '@shared/components/item-picker/item-picker';
import { toast } from '@shared/toast';
import { ITEMS } from '@core/mock-data';
import { Item, ProductSpecification, ProductStatus, PRODUCT_STATUS_LABEL } from '@core/models';
import { ProductionState } from '../../production-state';

const STATUS_OPTIONS = (Object.keys(PRODUCT_STATUS_LABEL) as ProductStatus[]).map((value) => ({ value, label: PRODUCT_STATUS_LABEL[value] }));

@Component({
  selector: 'app-product-create',
  imports: [FormsModule, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, ...HlmPopoverImports, EntityHeader, ItemPicker],
  templateUrl: './product-create.html',
})
export class ProductCreate {
  private readonly router = inject(Router);
  private readonly productionState = inject(ProductionState);

  /** Present on the `/edit` route; absent on `/new`. */
  readonly id = input<string>();

  protected readonly code = signal('');
  protected readonly name = signal('');
  protected readonly itemId = signal('');
  protected readonly status = signal<ProductStatus>('draft');
  protected readonly version = signal('v1.0');
  protected readonly specifications = signal<ProductSpecification[]>([{ label: '', value: '' }]);

  protected readonly items: Item[] = ITEMS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly isEdit = computed(() => !!this.id());
  protected readonly canSubmit = computed(() => this.code().trim().length > 0 && this.name().trim().length > 0 && this.itemId().trim().length > 0);

  protected statusToString = (v: string) => PRODUCT_STATUS_LABEL[v as ProductStatus] ?? v;

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      const p = this.productionState.products().find((x) => x.id === id);
      if (!p) return;
      this.code.set(p.code);
      this.name.set(p.name);
      this.itemId.set(p.itemId);
      this.status.set(p.status);
      this.version.set(p.version);
      this.specifications.set(p.specifications.length ? [...p.specifications] : [{ label: '', value: '' }]);
    });
  }

  protected onItemPicked(item: Item): void {
    this.itemId.set(item.id);
  }
  protected onItemCleared(): void {
    this.itemId.set('');
  }

  protected addSpec(): void {
    this.specifications.update((rows) => [...rows, { label: '', value: '' }]);
  }
  protected removeSpec(i: number): void {
    this.specifications.update((rows) => rows.filter((_, idx) => idx !== i));
  }
  protected setSpec(i: number, patch: Partial<ProductSpecification>): void {
    this.specifications.update((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  protected readonly submitPopover = signal<'open' | 'closed'>('closed');

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.submitPopover.set('closed');
    const payload = {
      code: this.code().trim().toUpperCase(),
      name: this.name().trim(),
      itemId: this.itemId().trim(),
      status: this.status(),
      version: this.version().trim() || 'v1.0',
      specifications: this.specifications().filter((s) => s.label.trim().length > 0),
    };

    const editId = this.id();
    if (editId) {
      this.productionState.updateProduct(editId, payload);
      toast.success('Producto actualizado', { description: payload.name });
      this.router.navigate(['/apps/production/products', editId]);
    } else {
      const product = this.productionState.createProduct(payload);
      toast.success(`Producto ${product.code} creado`, { description: product.name });
      this.router.navigate(['/apps/production/products', product.id]);
    }
  }

  protected cancel(): void {
    const editId = this.id();
    this.router.navigate(editId ? ['/apps/production/products', editId] : ['/apps/production/products']);
  }
}
