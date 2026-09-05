import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { HlmCheckboxImports } from '@ui/checkbox';
import { HlmPopoverImports } from '@ui/popover';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { ItemPicker } from '@shared/components/item-picker/item-picker';
import { toast } from '@shared/toast';
import { ITEMS } from '@core/mock-data';
import { BomComponent, Item, RouteOperation } from '@core/models';
import { ProductionState } from '../../production-state';

interface DraftComponent extends BomComponent {
  _uid: number;
}
interface DraftOperation extends RouteOperation {
  _uid: number;
}

let uidSeq = 1;

@Component({
  selector: 'app-bom-create',
  imports: [FormsModule, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, ...HlmCheckboxImports, ...HlmPopoverImports, EntityHeader, ItemPicker],
  templateUrl: './bom-create.html',
})
export class BomCreate {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly productionState = inject(ProductionState);

  protected readonly items: Item[] = ITEMS;

  /** Set when arriving from bom-detail's "Nueva versión" action — locks the product and switches submit to `createBomVersion`. */
  protected readonly fromBomId = signal<string | null>(null);
  protected readonly productId = signal('');
  protected readonly version = signal('');
  protected readonly effectiveFrom = signal('2026-09-04');
  protected readonly activateNow = signal(false);
  protected readonly components = signal<DraftComponent[]>([]);
  protected readonly operations = signal<DraftOperation[]>([]);

  protected readonly isNewVersion = computed(() => !!this.fromBomId());
  protected readonly product = computed(() => this.productionState.products().find((p) => p.id === this.productId()));
  protected readonly sourceBom = computed(() => this.productionState.billsOfMaterials().find((b) => b.id === this.fromBomId()));

  protected readonly canSubmit = computed(
    () => !!this.productId() && this.version().trim().length > 0 && !!this.effectiveFrom() && this.components().length > 0 && this.components().every((c) => !!c.itemId && c.quantity > 0),
  );

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    const fromBomId = params.get('fromBomId');
    const productId = params.get('productId');

    if (fromBomId) {
      const bom = this.productionState.billsOfMaterials().find((b) => b.id === fromBomId);
      if (bom) {
        this.fromBomId.set(fromBomId);
        this.productId.set(bom.productId);
        this.components.set(bom.components.map((c) => ({ ...c, _uid: uidSeq++ })));
        this.operations.set(bom.routing.map((o) => ({ ...o, _uid: uidSeq++ })));
        const parts = bom.version.match(/^v?(\d+)\.(\d+)$/i);
        this.version.set(parts ? `v${parts[1]}.${Number(parts[2]) + 1}` : `${bom.version}-nueva`);
      }
    } else {
      if (productId) this.productId.set(productId);
      this.components.set([{ _uid: uidSeq++, itemId: '', quantity: 0, unitOfMeasure: 'UND', wastePct: 0, isSupply: false }]);
      this.operations.set([{ _uid: uidSeq++, id: `OP-${uidSeq}`, sequence: 1, name: '', standardDurationMin: 30 }]);
    }
  }

  // --- Componentes -------------------------------------------------------

  protected onComponentItemPicked(i: number, item: Item): void {
    this.setComponent(i, { itemId: item.id, unitOfMeasure: item.unitOfMeasure });
  }
  protected onComponentItemCleared(i: number): void {
    this.setComponent(i, { itemId: '' });
  }
  protected onSubstituteItemPicked(i: number, item: Item): void {
    this.setComponent(i, { substituteItemId: item.id });
  }
  protected onSubstituteItemCleared(i: number): void {
    this.setComponent(i, { substituteItemId: undefined });
  }
  protected setComponent(i: number, patch: Partial<BomComponent>): void {
    this.components.update((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  protected addComponent(): void {
    this.components.update((rows) => [...rows, { _uid: uidSeq++, itemId: '', quantity: 0, unitOfMeasure: 'UND', wastePct: 0, isSupply: false }]);
  }
  protected removeComponent(i: number): void {
    this.components.update((rows) => rows.filter((_, idx) => idx !== i));
  }

  // --- Ruta de operaciones -------------------------------------------------

  protected setOperation(i: number, patch: Partial<RouteOperation>): void {
    this.operations.update((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  protected addOperation(): void {
    this.operations.update((rows) => [...rows, { _uid: uidSeq++, id: `OP-${uidSeq}`, sequence: rows.length + 1, name: '', standardDurationMin: 30 }]);
  }
  protected removeOperation(i: number): void {
    this.operations.update((rows) => rows.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, sequence: idx + 1 })));
  }
  protected toggleProtocol(i: number, protocolId: string): void {
    this.operations.update((rows) =>
      rows.map((r, idx) => {
        if (idx !== i) return r;
        const ids = new Set(r.qualityProtocolIds ?? []);
        ids.has(protocolId) ? ids.delete(protocolId) : ids.add(protocolId);
        return { ...r, qualityProtocolIds: [...ids] };
      }),
    );
  }
  protected hasProtocol(op: RouteOperation, protocolId: string): boolean {
    return !!op.qualityProtocolIds?.includes(protocolId);
  }

  // --- Guardar -------------------------------------------------------------

  protected readonly submitPopover = signal<'open' | 'closed'>('closed');

  protected submit(): void {
    if (!this.canSubmit()) return;
    this.submitPopover.set('closed');

    const components: BomComponent[] = this.components().map(({ _uid, ...c }) => c);
    const routing: RouteOperation[] = this.operations().map(({ _uid, ...o }) => o);

    if (this.isNewVersion()) {
      const bom = this.productionState.createBomVersion({ productId: this.productId(), version: this.version().trim(), effectiveFrom: this.effectiveFrom(), components, routing });
      toast.success(`Versión ${bom.version} creada`, {
        description: bom.status === 'active' ? 'Ya es la versión vigente del producto.' : 'Vigencia futura — queda como borrador programado hasta esa fecha.',
      });
      this.router.navigate(['/apps/production/bill-of-materials', bom.id]);
    } else {
      const bom = this.productionState.createBom({
        productId: this.productId(),
        version: this.version().trim(),
        effectiveFrom: this.effectiveFrom(),
        status: this.activateNow() ? 'active' : 'draft',
        components,
        routing,
      });
      toast.success(`BOM ${bom.version} creado`, { description: bom.status === 'active' ? 'Guardado como versión vigente.' : 'Guardado como borrador.' });
      this.router.navigate(['/apps/production/bill-of-materials', bom.id]);
    }
  }

  protected cancel(): void {
    const src = this.fromBomId();
    this.router.navigate(src ? ['/apps/production/bill-of-materials', src] : ['/apps/production/bill-of-materials']);
  }
}
