import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PercentPipe } from '@angular/common';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { toast } from '@shared/toast';
import { DispatchState } from '../dispatch-state';
import { DispatchPlan } from '../dispatch.models';

@Component({
  selector: 'app-dispatch-reports',
  imports: [FormsModule, PercentPipe, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, StatCard, StatusBadge],
  templateUrl: './dispatch-reports.html',
})
export class DispatchReports {
  protected readonly state = inject(DispatchState);
  protected readonly tab = signal<'control' | 'indicator' | 'stock'>('control');
  protected readonly search = signal('');
  protected readonly from = signal('2026-01-01');
  protected readonly to = signal('2026-12-31');
  protected readonly historical = [
    { month: 'Enero', onTime: 21, total: 23 }, { month: 'Febrero', onTime: 34, total: 36 }, { month: 'Marzo', onTime: 40, total: 45 },
    { month: 'Abril', onTime: 36, total: 40 }, { month: 'Mayo', onTime: 39, total: 43 }, { month: 'Junio', onTime: 31, total: 36 },
    { month: 'Julio', onTime: 42, total: 48 }, { month: 'Agosto', onTime: 38, total: 44 }, { month: 'Setiembre', onTime: 1, total: 1 },
  ];
  protected readonly filteredPlans = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.state.plans().filter((row) => row.dispatchDate >= this.from() && row.dispatchDate <= this.to() && (!q || `${row.workSheetNumber} ${row.customerOrderNumber} ${row.customerName}`.toLowerCase().includes(q)));
  });
  protected readonly totalDispatched = computed(() => this.historical.reduce((sum, row) => sum + row.total, 0));
  protected readonly totalOnTime = computed(() => this.historical.reduce((sum, row) => sum + row.onTime, 0));
  protected readonly rate = computed(() => this.totalDispatched() ? this.totalOnTime() / this.totalDispatched() : 0);
  protected indicator(row: { onTime: number; total: number }): number { return row.total ? row.onTime / row.total : 0; }
  protected committedDate(row: DispatchPlan): string { return this.state.candidates().find((candidate) => candidate.id === row.candidateId)?.committedDate ?? ''; }
  protected productionDate(row: DispatchPlan): string { return this.state.candidates().find((candidate) => candidate.id === row.candidateId)?.productionDeliveryDate ?? ''; }
  protected isOnTime(row: DispatchPlan): boolean { return !!row.deliveryDate && row.deliveryDate <= this.committedDate(row); }
  protected exportReport(): void { toast.success('Reporte preparado', { description: 'La descarga conservará las columnas del formato operativo de Despacho.' }); }
}
