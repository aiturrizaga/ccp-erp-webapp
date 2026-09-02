import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { HlmDialogImports } from '@ui/dialog';
import { HlmAlertDialogImports } from '@ui/alert-dialog';
import { toast } from '@shared/toast';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { SUPPLIERS, ITEMS, WAREHOUSES, WORK_SHEETS } from '@core/mock-data';
import { GoodsReceiptLine, GoodsReceiptStatus, GOODS_RECEIPT_STATUS_LABEL, InspectionResult, Tone } from '@core/models';
import { AuthState } from '@shell/auth-state';
import { WarehouseOpsState } from '../../warehouse-ops-state';
import { PurchasingState } from '../../../purchasing/purchasing-state';

const TODAY_DATE = '2026-08-24';

const STATUS_TONE: Record<GoodsReceiptStatus, Tone> = {
  scheduled: 'neutral',
  in_progress: 'info',
  partial: 'warning',
  received: 'success',
  with_discrepancies: 'danger',
  in_claim: 'danger',
  closed: 'success',
};

const INSPECTION_LABEL: Record<InspectionResult, string> = {
  compliant: 'Conforme',
  observed: 'Observado',
  rejected: 'Rechazado',
};

const INSPECTION_TONE: Record<InspectionResult, Tone> = {
  compliant: 'success',
  observed: 'warning',
  rejected: 'danger',
};

const INSPECTION_OPTIONS: { value: InspectionResult; label: string }[] = (Object.entries(INSPECTION_LABEL) as [InspectionResult, string][]).map(
  ([value, label]) => ({ value, label }),
);

/** Designed mobile-first: warehouse staff confirm receipt, photos and signatures from a phone at the loading dock. */
@Component({
  selector: 'app-goods-receipt-detail',
  imports: [
    FormsModule,
    RouterLink,
    NgIcon,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmInputImports,
    ...HlmLabelImports,
    ...HlmSelectImports,
    ...HlmDialogImports,
    ...HlmAlertDialogImports,
    EntityHeader,
    StatusBadge,
    EmptyState,
  ],
  templateUrl: './goods-receipt-detail.html',
})
export class GoodsReceiptDetail {
  private readonly router = inject(Router);
  private readonly warehouseOpsState = inject(WarehouseOpsState);
  private readonly purchasingState = inject(PurchasingState);
  protected readonly auth = inject(AuthState);

  readonly id = input.required<string>();

  protected readonly receipt = computed(() => this.warehouseOpsState.goodsReceipts().find((r) => r.id === this.id()));
  protected readonly purchaseOrder = computed(() => this.purchasingState.purchaseOrders().find((po) => po.id === this.receipt()?.purchaseOrderId));

  // --- Traceability: HT → Sugerencia(s) → RC → Cotización → OC → esta Nota de ingreso ---
  protected readonly quotation = computed(() => this.purchasingState.quotations().find((q) => q.id === this.purchaseOrder()?.quotationId));
  protected readonly requirement = computed(() => this.purchasingState.requirements().find((r) => r.id === this.quotation()?.requirementId));
  /** First HT grouped into the RC, shown as the quick traceability link — the RC itself lists every grouped HT/sugerencia. */
  protected readonly workSheetRef = computed(() => {
    const suggestionIds = this.requirement()?.suggestionIds ?? [];
    return this.purchasingState.suggestions().find((s) => suggestionIds.includes(s.id) && s.workSheetRef)?.workSheetRef;
  });
  protected readonly workSheetId = computed(() => WORK_SHEETS.find((ws) => ws.number === this.workSheetRef())?.id);

  /** Almacén can edit the schedule and count what arrived only while the receipt is still pending confirmation. */
  protected readonly editable = computed(() => this.auth.isWarehouse() && this.receipt()?.status === 'scheduled');

  /** What's still owed on the PO after this (and any other) receipt against it — lets Almacén schedule the next truck right from here. */
  protected readonly pendingLines = computed(() => (this.purchaseOrder()?.lines ?? []).filter((line) => line.quantity - line.receivedQuantity > 0));
  protected readonly canScheduleFollowUpFromReceipt = computed(
    () => this.auth.isWarehouse() && this.receipt()?.status !== 'scheduled' && this.pendingLines().length > 0,
  );

  protected readonly followUpDate = signal('');
  protected readonly followUpTime = signal('09:00');

  protected openFollowUpDraft(): void {
    this.followUpDate.set('');
    this.followUpTime.set('09:00');
  }

  protected canScheduleFollowUp(): boolean {
    return this.followUpDate().length > 0 && this.followUpTime().length > 0;
  }

  protected confirmScheduleFollowUp(): void {
    const po = this.purchaseOrder();
    if (!po || !this.canScheduleFollowUp()) return;
    const receipt = this.warehouseOpsState.scheduleFollowUpReceipt(po, this.followUpDate(), this.followUpTime());
    if (receipt) {
      toast.success(`Nota de ingreso del saldo programada — ${receipt.number}`);
      this.router.navigate(['/apps/inventory/goods-receipt', receipt.id]);
    }
  }

  protected readonly locationOptions = WAREHOUSES.flatMap((wh) => wh.locations.map((l) => ({ value: l.id, label: l.name })));
  protected readonly inspectionOptions = INSPECTION_OPTIONS;

  protected locationToString = (value: string): string => this.locationOptions.find((o) => o.value === value)?.label ?? value;
  protected inspectionToString = (value: string): string => INSPECTION_LABEL[value as InspectionResult] ?? value;

  protected supplierName(supplierId: string): string {
    return SUPPLIERS.find((s) => s.id === supplierId)?.legalName ?? supplierId;
  }

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected itemUnit(itemId: string): string {
    return ITEMS.find((i) => i.id === itemId)?.unitOfMeasure ?? '';
  }

  protected locationName(locationId: string): string {
    for (const wh of WAREHOUSES) {
      const loc = wh.locations.find((l) => l.id === locationId);
      if (loc) return loc.name;
    }
    return locationId;
  }

  protected statusLabel(status: GoodsReceiptStatus): string {
    return GOODS_RECEIPT_STATUS_LABEL[status];
  }

  protected statusTone(status: GoodsReceiptStatus): Tone {
    return STATUS_TONE[status];
  }

  protected inspectionLabel(result: InspectionResult): string {
    return INSPECTION_LABEL[result];
  }

  protected inspectionTone(result: InspectionResult): Tone {
    return INSPECTION_TONE[result];
  }

  protected setExpectedDate(date: string): void {
    this.warehouseOpsState.updateExpectedDate(this.id(), date);
  }

  protected setExpectedTime(time: string): void {
    this.warehouseOpsState.updateExpectedTime(this.id(), time);
  }

  /** Typing the physical count also defaults the accepted quantity to match while the line is still marked conforme — Almacén can still override it. */
  protected setReceivedQuantity(line: GoodsReceiptLine, value: string): void {
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty < 0) return;
    const patch: Partial<GoodsReceiptLine> = { receivedQuantity: qty };
    if (line.inspectionResult === 'compliant') {
      patch.acceptedQuantity = qty;
      patch.claimedQuantity = 0;
    }
    this.warehouseOpsState.updateLine(this.id(), line.itemId, patch);
  }

  protected setAcceptedQuantity(itemId: string, value: string): void {
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty < 0) return;
    this.warehouseOpsState.updateLine(this.id(), itemId, { acceptedQuantity: qty });
  }

  protected setClaimedQuantity(itemId: string, value: string): void {
    const qty = Number(value);
    if (!Number.isFinite(qty) || qty < 0) return;
    this.warehouseOpsState.updateLine(this.id(), itemId, { claimedQuantity: qty });
  }

  protected setLot(itemId: string, value: string): void {
    this.warehouseOpsState.updateLine(this.id(), itemId, { lot: value || undefined });
  }

  protected setLocation(itemId: string, locationId: string): void {
    this.warehouseOpsState.updateLine(this.id(), itemId, { locationId });
  }

  protected setInspectionResult(itemId: string, result: InspectionResult): void {
    this.warehouseOpsState.updateLine(this.id(), itemId, { inspectionResult: result });
  }

  protected setNote(itemId: string, note: string): void {
    this.warehouseOpsState.updateLine(this.id(), itemId, { note: note || undefined });
  }

  protected canConfirm(): boolean {
    return (this.receipt()?.lines ?? []).some((line) => line.receivedQuantity > 0);
  }

  protected confirmReceipt(): void {
    if (!this.canConfirm()) return;
    const receivedBy = this.auth.currentUser()?.name ?? '';
    const actualTime = new Date().toTimeString().slice(0, 5);
    this.warehouseOpsState.confirmReceipt(this.id(), TODAY_DATE, actualTime, receivedBy);

    const status = this.receipt()?.status;
    if (status === 'with_discrepancies') {
      toast.warning('Nota de ingreso confirmada con diferencias', { description: 'Hay artículos observados, rechazados o en reclamo — revisa el detalle.' });
    } else if (status === 'partial') {
      toast.warning('Nota de ingreso confirmada — entrega parcial', { description: 'El proveedor no trajo todo lo pedido. Puedes programar el saldo desde aquí.' });
    } else {
      toast.success('Nota de ingreso confirmada');
    }
  }
}
