import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { salesOrders } from '../sales-state';
import { SALES_ORDER_STATUS_LABEL, SALES_ORDER_STATUS_TONE, SalesOrder, Tone } from '@core/models';

const TODAY = new Date('2026-09-01');

/** Mock execution % per order status — Producción's real HT feed would replace this. */
const PROGRESS: Record<SalesOrder['status'], number> = {
  confirmed: 10,
  preparing: 45,
  dispatched: 100,
  invoiced: 100,
  cancelled: 0,
};

@Component({
  selector: 'app-production-board',
  imports: [RouterLink, ...HlmCardImports, StatusBadge, StatCard, EntityHeader],
  templateUrl: './production-board.html',
})
export class ProductionBoard {
  protected readonly rows = computed(() =>
    salesOrders()
      .filter((o) => o.workSheetId && o.status !== 'cancelled')
      .map((o) => {
        const days = Math.round((new Date(o.committedDeliveryDate).getTime() - TODAY.getTime()) / 86_400_000);
        return {
          order: o,
          days,
          alert: (days < 0 ? 'overdue' : days <= 5 ? 'soon' : 'ok') as 'overdue' | 'soon' | 'ok',
          progress: PROGRESS[o.status],
        };
      })
      .sort((a, b) => a.days - b.days),
  );

  protected readonly overdue = computed(() => this.rows().filter((r) => r.alert === 'overdue').length);
  protected readonly soon = computed(() => this.rows().filter((r) => r.alert === 'soon').length);
  protected readonly inProgress = computed(() => this.rows().filter((r) => r.progress > 0 && r.progress < 100).length);

  protected statusLabel = (s: SalesOrder['status']) => SALES_ORDER_STATUS_LABEL[s];
  protected statusTone = (s: SalesOrder['status']): Tone => SALES_ORDER_STATUS_TONE[s];
  protected alertLabel = (a: 'overdue' | 'soon' | 'ok') => (a === 'overdue' ? 'Vencida' : a === 'soon' ? 'Por vencer' : 'En plazo');
  protected alertTone = (a: 'overdue' | 'soon' | 'ok'): Tone => (a === 'overdue' ? 'danger' : a === 'soon' ? 'warning' : 'success');
}
