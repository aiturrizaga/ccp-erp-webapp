import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmPopoverImports } from '@ui/popover';
import { NgIcon } from '@ng-icons/core';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { toast } from '@shared/toast';
import { AuthState } from '@shell/auth-state';
import { salesClaims, salesOrders, saveOrder } from '../sales-state';
import { SalesOrder } from '@core/models';

@Component({
  selector: 'app-dispatch-board',
  imports: [DecimalPipe, RouterLink, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmPopoverImports, EntityHeader, StatusBadge],
  templateUrl: './dispatch-board.html',
})
export class DispatchBoard {
  protected readonly auth = inject(AuthState);

  /** Ventas still has to flag these ready to leave the warehouse. */
  protected readonly toConfirm = computed(() =>
    salesOrders().filter((o) => (o.status === 'preparing' || o.status === 'confirmed') && !o.readyForDispatch),
  );

  /** Despacho's inbox — flagged ready, not yet handed over. */
  protected readonly readyForPickup = computed(() =>
    salesOrders()
      .filter((o) => o.readyForDispatch && !o.dispatchedAt)
      .map((o) => ({ order: o, canDeliver: this.canDeliver(o), blockers: this.blockers(o) })),
  );

  private hasOpenClaim(o: SalesOrder): boolean {
    return salesClaims().some((c) => c.salesOrderId === o.id && c.status !== 'resolved' && c.status !== 'rejected');
  }

  private blockers(o: SalesOrder): string[] {
    const b: string[] = [];
    if (o.paymentGate && o.paymentGate.status !== 'validated' && o.paymentGate.status !== 'not_required') {
      b.push('Adelanto/OC no validados por Cobranzas');
    }
    if (this.hasOpenClaim(o)) b.push('Tiene un reclamo abierto');
    return b;
  }

  private canDeliver(o: SalesOrder): boolean {
    return this.blockers(o).length === 0;
  }

  /** Order id whose "marcar listo" / "entregar" popover is open. */
  protected readonly readyPopover = signal<string | null>(null);
  protected readonly deliverPopover = signal<string | null>(null);

  protected markReady(o: SalesOrder): void {
    this.readyPopover.set(null);
    saveOrder({ ...o, readyForDispatch: true, readyForDispatchAt: '2026-09-01' });
    toast.success(`${o.number} marcado listo para salida`);
  }

  protected markDelivered(o: SalesOrder): void {
    this.deliverPopover.set(null);
    saveOrder({ ...o, dispatchedAt: '2026-09-01', status: o.status === 'invoiced' ? 'invoiced' : 'dispatched' });
    toast.success(`${o.number} entregado al cliente`);
  }
}
