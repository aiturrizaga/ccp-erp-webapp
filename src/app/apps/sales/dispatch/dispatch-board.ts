import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmDialogImports } from '@ui/dialog';
import { HlmInputImports } from '@ui/input';
import { HlmCheckboxImports } from '@ui/checkbox';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { toast } from '@shared/toast';
import { salesCustomers, salesDispatchReleases, salesOrders, createDispatchRelease } from '../sales-state';
import { Customer, SalesOrder, WorkSheet, workSheetStatus, WORK_SHEET_STATUS_LABEL } from '@core/models';
import { ProductionState } from '../../production/production-state';

@Component({
  selector: 'app-dispatch-board',
  imports: [FormsModule, RouterLink, DecimalPipe, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmDialogImports, ...HlmInputImports, ...HlmCheckboxImports, EntityHeader],
  templateUrl: './dispatch-board.html',
})
export class DispatchBoard {
  protected readonly productionState = inject(ProductionState);
  protected readonly dialogOpen = signal<'open' | 'closed'>('closed');
  protected readonly customerQuery = signal('');
  protected readonly customerId = signal('');
  protected readonly orderId = signal('');
  protected readonly selectedWorkSheetIds = signal<Set<string>>(new Set());

  protected readonly customers = salesCustomers;
  protected readonly releases = salesDispatchReleases;
  protected readonly customerOptions = computed(() => {
    const q = this.customerQuery().trim().toLowerCase();
    return this.customers().filter((c) => !q || c.legalName.toLowerCase().includes(q) || c.taxId.toLowerCase().includes(q));
  });
  protected readonly selectedCustomer = computed(() => this.customers().find((c) => c.id === this.customerId()));
  protected readonly customerOrders = computed(() => {
    const id = this.customerId();
    if (!id) return [];
    return salesOrders().filter((o) => o.customerId === id && o.status !== 'cancelled');
  });
  protected readonly selectedOrder = computed(() => this.customerOrders().find((o) => o.id === this.orderId()));
  protected readonly selectedOrderWorkSheets = computed(() => {
    const order = this.selectedOrder();
    if (!order) return [];
    const ids = order.workSheetIds?.length ? order.workSheetIds : order.workSheetId ? [order.workSheetId] : [];
    return ids.map((id) => this.productionState.workSheets().find((ws) => ws.id === id)).filter((ws): ws is WorkSheet => !!ws);
  });
  protected readonly releasedWorkSheetIds = computed(() => new Set(this.releases().flatMap((r) => r.workSheetIds)));
  protected readonly releaseableWorkSheets = computed(() => this.selectedOrderWorkSheets().filter((ws) => this.canReleaseWorkSheet(ws)));

  /** Una HT puede ser liberada si no fue liberada y (está completada O su pedido está en producción lista). */
  protected canReleaseWorkSheet(ws: WorkSheet): boolean {
    if (this.releasedWorkSheetIds().has(ws.id)) return false;
    return workSheetStatus(ws) === 'completed' || this.selectedOrder()?.status === 'production_ready';
  }

  protected readonly releaseRows = computed(() => this.releases().slice().sort((a, b) => b.releasedAt.localeCompare(a.releasedAt)));

  protected workSheetById(id: string): WorkSheet | undefined { return this.productionState.workSheets().find((ws) => ws.id === id); }

  protected openNewRelease(): void {
    this.customerQuery.set('');
    this.customerId.set('');
    this.orderId.set('');
    this.selectedWorkSheetIds.set(new Set());
    this.dialogOpen.set('open');
  }

  protected selectCustomer(customer: Customer): void {
    this.customerId.set(customer.id);
    this.orderId.set('');
    this.selectedWorkSheetIds.set(new Set());
  }

  protected selectOrder(order: SalesOrder): void {
    this.orderId.set(order.id);
    this.selectedWorkSheetIds.set(new Set());
  }

  protected toggleWorkSheet(id: string, checked: boolean): void {
    const next = new Set(this.selectedWorkSheetIds());
    if (checked) next.add(id); else next.delete(id);
    this.selectedWorkSheetIds.set(next);
  }

  protected workSheetStatusLabel(ws: WorkSheet): string {
    return WORK_SHEET_STATUS_LABEL[workSheetStatus(ws)];
  }

  protected workSheetStatus(ws: WorkSheet): import('@core/models').WorkSheetStatus {
    return workSheetStatus(ws);
  }

  protected releaseSelected(): void {
    const customer = this.selectedCustomer();
    const order = this.selectedOrder();
    const ids = [...this.selectedWorkSheetIds()];
    if (!customer || !order || !ids.length) return;
    const validIds = new Set(this.releaseableWorkSheets().map((ws) => ws.id));
    const eligibleIds = ids.filter((id) => validIds.has(id));
    if (!eligibleIds.length) {
      toast.info('Selecciona HT terminadas y aún no liberadas.');
      return;
    }
    const release = createDispatchRelease({
      salesOrderId: order.id,
      salesOrderNumber: order.number,
      customerId: customer.id,
      customerName: customer.legalName,
      workSheetIds: eligibleIds,
      releasedBy: 'Ventas',
    });
    if (!release) return;
    this.dialogOpen.set('closed');
    toast.success('Liberación creada', { description: `${eligibleIds.length} HT${eligibleIds.length === 1 ? '' : 's'} liberadas para despacho.` });
  }
}
