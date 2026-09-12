import { Injectable, computed, signal } from '@angular/core';
import { DISPATCH_CANDIDATES, FINISHED_PRODUCT_STOCK, INITIAL_DISPATCH_PLANS } from './dispatch.data';
import { DispatchCandidate, DispatchPlan } from './dispatch.models';

@Injectable({ providedIn: 'root' })
export class DispatchState {
  readonly candidates = signal<DispatchCandidate[]>(DISPATCH_CANDIDATES.map((row) => ({ ...row })));
  readonly plans = signal<DispatchPlan[]>(INITIAL_DISPATCH_PLANS.map((row) => ({ ...row })));
  readonly stock = signal(FINISHED_PRODUCT_STOCK.map((row) => ({ ...row })));

  readonly pendingCandidates = computed(() => this.candidates().filter((row) => this.availableToPlan(row) > 0));

  availableToPlan(row: DispatchCandidate): number {
    const livePlanned = this.plans().filter((plan) => plan.candidateId === row.id && plan.status !== 'reprogramado').reduce((sum, plan) => sum + plan.quantity, 0);
    return Math.max(0, row.producedQuantity - livePlanned);
  }

  schedule(input: Omit<DispatchPlan, 'id' | 'status'>): DispatchPlan {
    const next = Math.max(92, ...this.plans().map((row) => Number(row.id.split('-').pop()) || 0)) + 1;
    const plan: DispatchPlan = { ...input, id: `DES-2026-${String(next).padStart(4, '0')}`, status: 'programado' };
    this.plans.update((rows) => [plan, ...rows]);
    this.stock.update((rows) => rows.map((row) => row.productCode === plan.productCode && row.plant === plan.originPlant ? { ...row, scheduledQuantity: row.scheduledQuantity + plan.quantity } : row));
    return plan;
  }
}
