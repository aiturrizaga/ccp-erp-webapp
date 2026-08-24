import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { HlmCardImports } from '@ui/card';
import { HlmSelectImports } from '@ui/select';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { ChartCanvas } from '@shared/components/chart-canvas/chart-canvas';
import { SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { INVENTORY_ANALYTICS_MONTHS, INVENTORY_MONTHLY_STATS, STOCK_LOTS } from '@core/mock-data';
import { GOODS_RECEIPT_STATUS_LABEL, STOCK_ISSUE_STATUS_LABEL, STOCK_STATUS_LABEL, StockStatus } from '@core/models';
import { InventoryState } from '../inventory-state';
import { WarehouseOpsState } from '../warehouse-ops-state';
import { PurchasingState } from '../../purchasing/purchasing-state';

const PENDING_RECEIPT_STATUSES = new Set(['scheduled', 'in_progress', 'partial']);
const PENDING_ISSUE_STATUSES = new Set(['pending', 'partial']);

const STOCK_STATUS_COLOR: Record<StockStatus, string> = {
  available: '#16a34a',
  reserved: '#2563eb',
  in_transit: '#7c3aed',
  quarantine: '#d97706',
  claimed: '#dc2626',
  blocked: '#6b7280',
};

/** Full 12-month header for the Excel-style table — months without fixture data render blank, same as the reference spreadsheet (Agosto–Diciembre still ahead). */
const ALL_MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ALL_FILTER = 'all';

/** App-level analytics for Inventario — at-a-glance stock, purchase and consumption health, filterable by proveedor/material. */
@Component({
  selector: 'app-inventory-dashboard',
  imports: [RouterLink, ...HlmCardImports, ...HlmSelectImports, StatCard, ChartCanvas, DecimalPipe],
  templateUrl: './dashboard.html',
})
export class InventoryDashboard {
  private readonly router = inject(Router);
  private readonly inventoryState = inject(InventoryState);
  private readonly warehouseOpsState = inject(WarehouseOpsState);
  private readonly purchasingState = inject(PurchasingState);

  protected readonly totalItems = computed(() => this.inventoryState.items().filter((i) => i.active).length);

  protected readonly criticalStockItems = computed(() =>
    this.inventoryState.items().filter((item) => item.reorderPoint > 0 && this.availableStock(item.id) > 0 && this.availableStock(item.id) < item.reorderPoint),
  );

  protected readonly inventoryValue = computed(() =>
    STOCK_LOTS.filter((lot) => lot.status === 'available' || lot.status === 'reserved').reduce((sum, lot) => sum + lot.quantity * lot.unitCost, 0),
  );

  protected readonly pendingReceipts = computed(() => this.warehouseOpsState.goodsReceipts().filter((r) => PENDING_RECEIPT_STATUSES.has(r.status)));

  protected readonly pendingIssues = computed(() => this.warehouseOpsState.stockIssues().filter((i) => PENDING_ISSUE_STATUSES.has(i.status)));

  protected readonly stockByStatus = computed(() => {
    const totals = new Map<StockStatus, number>();
    for (const lot of STOCK_LOTS) {
      totals.set(lot.status, (totals.get(lot.status) ?? 0) + lot.quantity * lot.unitCost);
    }
    const grandTotal = Array.from(totals.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(totals.entries())
      .map(([status, value]) => ({ status, label: STOCK_STATUS_LABEL[status], value, pct: (value / grandTotal) * 100, color: STOCK_STATUS_COLOR[status] }))
      .sort((a, b) => b.value - a.value);
  });

  protected readonly topValueItems = computed(() => {
    const byItem = new Map<string, number>();
    for (const lot of STOCK_LOTS) {
      if (lot.status !== 'available' && lot.status !== 'reserved') continue;
      byItem.set(lot.itemId, (byItem.get(lot.itemId) ?? 0) + lot.quantity * lot.unitCost);
    }
    return Array.from(byItem.entries())
      .map(([itemId, value]) => ({ itemId, value, label: this.itemLabel(itemId) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  });

  // --- Costos de Almacén: filterable by Proveedor / Material ---

  protected readonly supplierFilter = signal(ALL_FILTER);
  protected readonly materialFilter = signal(ALL_FILTER);

  protected readonly supplierOptions = computed<SelectFilterOption[]>(() => {
    const suppliers = this.purchasingState.suppliers();
    const ids = Array.from(new Set(INVENTORY_MONTHLY_STATS.map((r) => r.supplierId)));
    return [{ value: ALL_FILTER, label: 'Todos los proveedores' }, ...ids.map((id) => ({ value: id, label: suppliers.find((s) => s.id === id)?.legalName ?? id }))];
  });

  protected readonly materialOptions = computed<SelectFilterOption[]>(() => {
    const ids = Array.from(new Set(INVENTORY_MONTHLY_STATS.map((r) => r.itemId)));
    return [{ value: ALL_FILTER, label: 'Todos los materiales' }, ...ids.map((id) => ({ value: id, label: this.itemLabel(id) }))];
  });

  protected supplierOptionToString = (value: string): string => this.supplierOptions().find((o) => o.value === value)?.label ?? value;
  protected materialOptionToString = (value: string): string => this.materialOptions().find((o) => o.value === value)?.label ?? value;

  private readonly filteredMonthlyRows = computed(() => {
    const supplier = this.supplierFilter();
    const material = this.materialFilter();
    return INVENTORY_MONTHLY_STATS.filter((r) => (supplier === ALL_FILTER || r.supplierId === supplier) && (material === ALL_FILTER || r.itemId === material));
  });

  /** Monthly totals for the months with data (Enero–Julio) — feeds the chart. */
  protected readonly monthlyTotals = computed(() => {
    const rows = this.filteredMonthlyRows();
    return INVENTORY_ANALYTICS_MONTHS.map((month) => {
      const monthRows = rows.filter((r) => r.month === month);
      return {
        month,
        purchases: monthRows.reduce((s, r) => s + r.purchases, 0),
        consumption: monthRows.reduce((s, r) => s + r.consumption, 0),
        inventory: monthRows.reduce((s, r) => s + r.inventory, 0),
      };
    });
  });

  /** Full Enero–Diciembre row, with `null` for months that have no data yet — feeds the spreadsheet-style table. */
  protected readonly tableColumns = computed(() => {
    const totals = this.monthlyTotals();
    return ALL_MONTHS_ES.map((month) => totals.find((t) => t.month === month) ?? null);
  });

  protected readonly costsChart = computed<ChartConfiguration>(() => {
    const totals = this.monthlyTotals();
    const currency = (v: unknown) => 'S/ ' + Number(v).toLocaleString('es-PE');
    return {
      type: 'line',
      data: {
        labels: totals.map((t) => t.month),
        datasets: [
          { label: 'Compras', data: totals.map((t) => t.purchases), borderColor: '#2563eb', backgroundColor: '#2563eb', tension: 0.3, pointRadius: 4 },
          { label: 'Consumo', data: totals.map((t) => t.consumption), borderColor: '#dc2626', backgroundColor: '#dc2626', tension: 0.3, pointRadius: 4 },
          { label: 'Inventario', data: totals.map((t) => t.inventory), borderColor: '#111827', backgroundColor: '#111827', tension: 0.3, pointRadius: 4 },
        ],
      },
      options: {
        scales: { y: { beginAtZero: true, ticks: { callback: currency } } },
        plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${currency(ctx.parsed.y)}` } } },
      },
    };
  });

  protected availableStock(itemId: string): number {
    return STOCK_LOTS.filter((lot) => lot.itemId === itemId && lot.status === 'available').reduce((sum, lot) => sum + lot.quantity, 0);
  }

  protected itemLabel(itemId: string): string {
    const item = this.inventoryState.items().find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected receiptStatusLabel(status: string): string {
    return GOODS_RECEIPT_STATUS_LABEL[status as keyof typeof GOODS_RECEIPT_STATUS_LABEL] ?? status;
  }

  protected issueStatusLabel(status: string): string {
    return STOCK_ISSUE_STATUS_LABEL[status as keyof typeof STOCK_ISSUE_STATUS_LABEL] ?? status;
  }

  protected goToItem(itemId: string): void {
    this.router.navigate(['/apps/inventory/items', itemId]);
  }
}
