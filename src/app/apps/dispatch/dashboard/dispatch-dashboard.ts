import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { DispatchState } from '../dispatch-state';
import { FinishedProductStock } from '../dispatch.models';

@Component({
  selector: 'app-dispatch-dashboard',
  imports: [RouterLink, DecimalPipe, ...HlmButtonImports, ...HlmCardImports, StatCard, StatusBadge],
  templateUrl: './dispatch-dashboard.html',
})
export class DispatchDashboard {
  protected readonly state = inject(DispatchState);
  protected readonly programmed = computed(() => this.state.plans().filter((row) => row.status === 'programado' || row.status === 'en_carga'));
  protected readonly dispatched = computed(() => this.state.plans().filter((row) => row.status === 'despachado'));
  protected readonly availableUnits = computed(() => this.state.stock().reduce((sum, row) => sum + Math.max(0, row.producedQuantity - row.scheduledQuantity - row.dispatchedQuantity), 0));
  protected readonly onTimeRate = computed(() => {
    const rows = this.dispatched().filter((row) => !!row.deliveryDate);
    if (!rows.length) return 0;
    const onTime = rows.filter((row) => row.deliveryDate! <= this.state.candidates().find((candidate) => candidate.id === row.candidateId)?.committedDate!).length;
    return Math.round((onTime / rows.length) * 100);
  });
  protected available(row: FinishedProductStock): number {
    return Math.max(0, row.producedQuantity - row.scheduledQuantity - row.dispatchedQuantity);
  }
}
