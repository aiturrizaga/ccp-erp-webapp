import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { HlmCardImports } from '@ui/card';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { ChartCanvas } from '@shared/components/chart-canvas/chart-canvas';
import { PurchaseOrder, PurchaseRequirementStatus, PURCHASE_REQUIREMENT_STATUS_LABEL, REQUISITION_PRIORITY_LABEL, Tone } from '@core/models';
import { PurchasingState } from '../purchasing-state';

const STATUS_TONE: Record<PurchaseRequirementStatus, Tone> = {
  draft: 'neutral',
  reviewed: 'info',
  pending_approval: 'warning',
  approved: 'success',
  rejected: 'danger',
  observed: 'warning',
};

const TONE_COLOR: Record<Tone, string> = {
  neutral: '#9ca3af',
  info: '#2563eb',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
};

const MONTH_LABEL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/** Purchase orders not yet committed spend — excluded from the spend trend and top-suppliers charts. */
const UNCOMMITTED_PO_STATUSES = new Set(['draft', 'pending_approval', 'rejected']);

/** App-level analytics for Compras — approvals, sourcing and supplier health at a glance. */
@Component({
  selector: 'app-purchasing-dashboard',
  imports: [RouterLink, ...HlmCardImports, StatCard, ChartCanvas],
  templateUrl: './dashboard.html',
})
export class PurchasingDashboard {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);

  protected readonly pendingRequirements = computed(() => this.purchasingState.requirements().filter((r) => r.status === 'pending_approval'));

  protected readonly quotationsUnderEvaluation = computed(() =>
    this.purchasingState.quotations().filter((q) => q.status === 'under_evaluation' || q.status === 'sent').length,
  );

  protected readonly pendingPurchaseOrders = computed(() => this.purchasingState.purchaseOrders().filter((po) => po.status === 'pending_approval'));

  protected readonly approvedSuppliers = computed(() => this.purchasingState.suppliers().filter((s) => s.status === 'approved').length);

  private poValue(po: PurchaseOrder): number {
    return po.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0) * po.exchangeRate;
  }

  private readonly committedOrders = computed(() => this.purchasingState.purchaseOrders().filter((po) => !UNCOMMITTED_PO_STATUSES.has(po.status)));

  // --- Línea de gasto mensual en OC ---

  protected readonly monthlySpendChart = computed<ChartConfiguration>(() => {
    const months = Array.from(new Set(this.committedOrders().map((po) => po.issuedAt.slice(0, 7)))).sort();
    const labels = months.map((m) => `${MONTH_LABEL[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`);
    const values = months.map((m) => this.committedOrders().filter((po) => po.issuedAt.startsWith(m)).reduce((sum, po) => sum + this.poValue(po), 0));

    return {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Gasto en OC (S/)',
            data: values,
            borderColor: '#2563eb',
            backgroundColor: '#2563eb33',
            tension: 0.3,
            fill: true,
            pointRadius: 4,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => 'S/ ' + Number(v).toLocaleString('es-PE') } } },
      },
    };
  });

  // --- Barras de top proveedores por monto adjudicado ---

  protected readonly topSuppliersChart = computed<ChartConfiguration>(() => {
    const suppliers = this.purchasingState.suppliers();
    const totals = new Map<string, number>();
    for (const po of this.committedOrders()) {
      totals.set(po.supplierId, (totals.get(po.supplierId) ?? 0) + this.poValue(po));
    }
    const top = Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      type: 'bar',
      data: {
        labels: top.map(([id]) => suppliers.find((s) => s.id === id)?.legalName ?? id),
        datasets: [{ label: 'Monto adjudicado (S/)', data: top.map(([, value]) => value), backgroundColor: '#2563eb' }],
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { callback: (v) => 'S/ ' + Number(v).toLocaleString('es-PE') } } },
      },
    };
  });

  // --- Donut de Requerimientos de Compra por estado ---

  protected readonly requirementsByStatusChart = computed<ChartConfiguration>(() => {
    const totals = new Map<PurchaseRequirementStatus, number>();
    for (const r of this.purchasingState.requirements()) {
      totals.set(r.status, (totals.get(r.status) ?? 0) + 1);
    }
    const entries = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);

    return {
      type: 'doughnut',
      data: {
        labels: entries.map(([status]) => PURCHASE_REQUIREMENT_STATUS_LABEL[status]),
        datasets: [{ data: entries.map(([, count]) => count), backgroundColor: entries.map(([status]) => TONE_COLOR[STATUS_TONE[status]]) }],
      },
      options: { plugins: { legend: { position: 'right' } } },
    };
  });

  protected priorityLabel(priority: string): string {
    return REQUISITION_PRIORITY_LABEL[priority as keyof typeof REQUISITION_PRIORITY_LABEL] ?? priority;
  }

  protected supplierName(supplierId: string): string {
    return this.purchasingState.suppliers().find((s) => s.id === supplierId)?.legalName ?? supplierId;
  }

  protected goToRequirement(id: string): void {
    this.router.navigate(['/apps/purchasing/requirements', id]);
  }

  protected goToPurchaseOrder(id: string): void {
    this.router.navigate(['/apps/purchasing/purchase-orders', id]);
  }
}
