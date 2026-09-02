import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { HlmPopoverImports } from '@ui/popover';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { ProductPicker } from '@shared/components/product-picker/product-picker';
import { toast } from '@shared/toast';
import { createSalesOrder, salesCustomers, salesDecisionRules, salesProducts } from '../../sales-state';
import { CUSTOMER_PAYMENT_MODE_LABEL, SalesProduct, evaluateSalesOrder, formatSalesProductName } from '@core/models';

interface DraftLine {
  salesProductId: string;
  productCode: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitCost: number;
  unitPrice: number;
}


@Component({
  selector: 'app-order-create',
  imports: [FormsModule, DecimalPipe, PercentPipe, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, ...HlmPopoverImports, EntityHeader, StatusBadge, ProductPicker],
  templateUrl: './order-create.html',
})
export class OrderCreate {
  private readonly router = inject(Router);

  protected readonly customerId = signal('');
  protected readonly committedDeliveryDate = signal('2026-09-30');
  protected readonly deliveryAddress = signal('');
  protected readonly glosa = signal('');
  protected readonly notes = signal('');
  protected readonly lines = signal<DraftLine[]>([]);

  protected readonly customers = salesCustomers;
  protected readonly products = salesProducts;

  protected readonly customer = computed(() => salesCustomers().find((c) => c.id === this.customerId()));
  protected readonly currency = computed(() => this.customer()?.currency ?? 'PEN');

  protected readonly total = computed(() => this.lines().reduce((s, l) => s + l.quantity * l.unitPrice, 0));
  protected readonly cost = computed(() => this.lines().reduce((s, l) => s + l.quantity * l.unitCost, 0));
  protected readonly marginPct = computed(() => {
    const rev = this.total();
    return rev > 0 ? (rev - this.cost()) / rev : 0;
  });

  protected readonly evaluation = computed(() => {
    const rule = salesDecisionRules().find((r) => r.active);
    if (!rule) return null;
    const viableMin: Record<string, number> = {};
    for (const p of salesProducts()) viableMin[p.id] = p.costBand.min;
    return evaluateSalesOrder({ total: this.total(), lines: this.lines() }, rule, viableMin);
  });

  protected readonly canSubmit = computed(
    () => !!this.customerId() && this.lines().length > 0 && this.lines().every((l) => l.quantity > 0 && l.unitPrice > 0),
  );

  protected readonly customerToString = (v: string) => salesCustomers().find((c) => c.id === v)?.legalName ?? v;
  protected readonly modeLabel = computed(() => {
    const m = this.customer()?.paymentMode;
    return m ? CUSTOMER_PAYMENT_MODE_LABEL[m] : '—';
  });

  protected onCustomerChange(id: string): void {
    this.customerId.set(id);
    const c = salesCustomers().find((x) => x.id === id);
    if (c && !this.deliveryAddress()) this.deliveryAddress.set(c.address);
  }

  /** Picking a product in the search box appends it as a new line (and the box clears itself). */
  protected onProductPicked(p: SalesProduct): void {
    this.lines.update((rows) => {
      const existing = rows.findIndex((r) => r.salesProductId === p.id);
      if (existing >= 0) {
        return rows.map((r, i) => (i === existing ? { ...r, quantity: r.quantity + 1 } : r));
      }
      return [
        ...rows,
        {
          salesProductId: p.id,
          productCode: p.legacyCode,
          description: formatSalesProductName(p),
          quantity: 1,
          unitOfMeasure: p.unitOfMeasure,
          unitCost: p.productionUnitCost,
          unitPrice: p.costBand.max,
        },
      ];
    });
  }

  protected setLine(index: number, patch: Partial<DraftLine>): void {
    this.lines.update((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  protected removeLine(index: number): void {
    this.lines.update((rows) => rows.filter((_, i) => i !== index));
  }

  protected lineMargin(l: DraftLine): number {
    return l.unitPrice > 0 ? (l.unitPrice - l.unitCost) / l.unitPrice : 0;
  }
  protected belowMin(l: DraftLine): boolean {
    const p = salesProducts().find((x) => x.id === l.salesProductId);
    return !!p && l.unitPrice > 0 && l.unitPrice < p.costBand.min;
  }

  protected readonly submitPopover = signal<'open' | 'closed'>('closed');

  protected submit(): void {
    const c = this.customer();
    if (!c || !this.canSubmit()) return;
    this.submitPopover.set('closed');
    const order = createSalesOrder({
      customerId: c.id,
      customerName: c.legalName,
      currency: c.currency,
      committedDeliveryDate: this.committedDeliveryDate(),
      deliveryAddress: this.deliveryAddress().trim(),
      glosa: this.glosa().trim() || undefined,
      notes: this.notes().trim() || undefined,
      lines: this.lines()
        .filter((l) => l.salesProductId && l.quantity > 0)
        .map((l) => ({
          productCode: l.productCode,
          description: l.description,
          quantity: l.quantity,
          unitOfMeasure: l.unitOfMeasure,
          unitPrice: l.unitPrice,
          unitCost: l.unitCost,
          salesProductId: l.salesProductId,
        })),
    });
    toast.success(`Orden ${order.number} creada`, {
      description: order.priceReview?.outcome === 'needs_gerencia' ? 'Requiere visto bueno de Gerencia' : 'Aprobación automática',
    });
    this.router.navigate(['/apps/sales/orders', order.id]);
  }

  protected cancel(): void {
    this.router.navigate(['/apps/sales/orders']);
  }
}
