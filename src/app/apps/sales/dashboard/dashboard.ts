import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { HlmButtonImports } from '@ui/button';
import { HlmInputImports } from '@ui/input';
import { HlmSelectImports } from '@ui/select';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { salesCustomers, salesOrders, salesQuotations } from '../sales-state';
import { SalesOrder } from '@core/models';

const TODAY = new Date('2026-09-01');

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/** App-level analytics for Ventas — quotation follow-up, order pipeline, production status and cash-sale collections. */
@Component({
  selector: 'app-sales-dashboard',
  imports: [RouterLink, FormsModule, ...HlmCardImports, ...HlmButtonImports, ...HlmInputImports, ...HlmSelectImports, StatCard, StatusBadge, DecimalPipe],
  templateUrl: './dashboard.html',
})
export class SalesDashboard {
  private readonly router = inject(Router);

  // --- Filtros -------------------------------------------------------------
  protected readonly month = signal('all'); // '0'..'11' o 'all'
  protected readonly dateFrom = signal('');
  protected readonly dateTo = signal('');
  protected readonly customerName_ = signal('all');
  protected readonly orderNumber = signal('all');

  protected readonly monthOptions = MONTHS.map((label, i) => ({ value: String(i), label }));

  protected readonly customerOptions = computed(() => {
    const names = new Set<string>();
    for (const o of salesOrders()) names.add(this.customerName(o));
    for (const q of salesQuotations()) names.add(q.customerName);
    return [...names].sort((a, b) => a.localeCompare(b)).map((name) => ({ value: name, label: name }));
  });

  protected readonly orderOptions = computed(() =>
    [...salesOrders()].sort((a, b) => b.number.localeCompare(a.number)).map((o) => ({ value: o.number, label: `${o.number} — ${this.customerName(o)}` })),
  );

  protected readonly activeFilters = computed(
    () =>
      (this.month() !== 'all' ? 1 : 0) +
      (this.dateFrom() ? 1 : 0) +
      (this.dateTo() ? 1 : 0) +
      (this.customerName_() !== 'all' ? 1 : 0) +
      (this.orderNumber() !== 'all' ? 1 : 0),
  );

  protected clearFilters(): void {
    this.month.set('all');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.customerName_.set('all');
    this.orderNumber.set('all');
  }

  private inRange(iso?: string): boolean {
    if (!iso) return this.month() === 'all' && !this.dateFrom() && !this.dateTo();
    const d = new Date(iso);
    if (this.month() !== 'all' && d.getMonth() !== Number(this.month())) return false;
    if (this.dateFrom() && iso < this.dateFrom()) return false;
    if (this.dateTo() && iso > this.dateTo()) return false;
    return true;
  }

  private readonly selectedOrder = computed(() =>
    this.orderNumber() === 'all' ? undefined : salesOrders().find((o) => o.number === this.orderNumber()),
  );

  // --- Conjuntos filtrados ----------------------------------------------------
  protected readonly filteredOrders = computed(() =>
    salesOrders().filter(
      (o) =>
        this.inRange(o.confirmedAt) &&
        (this.customerName_() === 'all' || this.customerName(o) === this.customerName_()) &&
        (this.orderNumber() === 'all' || o.number === this.orderNumber()),
    ),
  );

  protected readonly filteredQuotations = computed(() => {
    const so = this.selectedOrder();
    return salesQuotations().filter(
      (q) =>
        this.inRange(q.issuedAt) &&
        (this.customerName_() === 'all' || q.customerName === this.customerName_()) &&
        (this.orderNumber() === 'all' || (!!so && q.id === so.quotationId)),
    );
  });

  // --- KPIs y listas --------------------------------------------------------
  protected readonly pendingQuotations = computed(() => this.filteredQuotations().filter((q) => q.status === 'sent'));
  protected readonly confirmedOrders = computed(() => this.filteredOrders().filter((o) => o.status === 'confirmed').length);
  protected readonly ordersToDispatch = computed(() => this.filteredOrders().filter((o) => o.status === 'confirmed' || o.status === 'preparing').length);
  protected readonly invoicedTotal = computed(() => this.filteredOrders().filter((o) => o.status === 'invoiced').reduce((sum, o) => sum + o.total, 0));

  /** "Cómo va producción" — HT con fecha de entrega comprometida, la más próxima primero. */
  protected readonly productionRows = computed(() =>
    this.filteredOrders()
      .filter((o) => o.workSheetId && o.committedDeliveryDate && o.status !== 'cancelled' && o.status !== 'invoiced')
      .map((o) => {
        const days = Math.round((new Date(o.committedDeliveryDate).getTime() - TODAY.getTime()) / 86_400_000);
        return { order: o, days, alert: (days < 0 ? 'overdue' : days <= 5 ? 'soon' : 'ok') as 'overdue' | 'soon' | 'ok' };
      })
      .sort((a, b) => a.days - b.days),
  );

  /** Ventas se preocupa por las ventas al contado: pedidos contado sin validar el adelanto. */
  protected readonly cashToCollect = computed(() =>
    this.filteredOrders()
      .filter((o) => o.paymentGate && o.paymentGate.status !== 'validated' && o.paymentGate.status !== 'not_required')
      .map((o) => ({ order: o, gate: o.paymentGate! })),
  );

  protected alertLabel = (a: 'overdue' | 'soon' | 'ok') => (a === 'overdue' ? 'Vencida' : a === 'soon' ? 'Por vencer' : 'En plazo');
  protected alertTone = (a: 'overdue' | 'soon' | 'ok') => (a === 'overdue' ? 'danger' : a === 'soon' ? 'warning' : 'success') as 'danger' | 'warning' | 'success';

  protected customerName = (o: SalesOrder) => salesCustomers().find((c) => c.id === o.customerId)?.legalName ?? o.customerName;
  protected customerToString = (v: string) => (v === 'all' ? 'Todos' : this.customerOptions().find((c) => c.value === v)?.label ?? v);
  protected orderToString = (v: string) => (v === 'all' ? 'Todas' : v);
  protected monthToString = (v: string) => (v === 'all' ? 'Todos' : MONTHS[Number(v)]);

  protected goToQuotation(id: string): void {
    this.router.navigate(['/apps/sales/quotations', id]);
  }
  protected goToOrder(id: string): void {
    this.router.navigate(['/apps/sales/orders', id]);
  }
}
