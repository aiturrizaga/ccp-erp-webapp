import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { APPROVALS, PURCHASE_ORDERS, ITEMS, STOCK_LOTS } from '@core/mock-data';
import { ApprovalProcess, APPROVAL_PROCESS_LABEL } from '@core/models';

/** Approval processes owned by Compras — the Shell's home is scoped to Compras + Almacén for now. */
const PURCHASING_PROCESSES = new Set<ApprovalProcess>(['supplier', 'purchase_requirement', 'quotation_award', 'purchase_order']);

/** Shell's global home — scoped to Compras and Almacén, the only two Apps currently exposed in the App Launcher. */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, StatCard, StatusBadge],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly pendingApprovals = computed(() => APPROVALS.filter((a) => a.status === 'pending' && PURCHASING_PROCESSES.has(a.process)));
  protected readonly pendingPurchaseOrders = computed(() => PURCHASE_ORDERS.filter((po) => po.status === 'pending_approval').length);

  protected readonly criticalStockItems = computed(() => {
    return ITEMS.filter((item) => {
      const available = STOCK_LOTS.filter((lot) => lot.itemId === item.id && lot.status === 'available').reduce((sum, lot) => sum + lot.quantity, 0);
      return item.reorderPoint > 0 && available > 0 && available < item.reorderPoint;
    });
  });

  protected processLabel(process: string): string {
    return APPROVAL_PROCESS_LABEL[process as keyof typeof APPROVAL_PROCESS_LABEL] ?? process;
  }
}
