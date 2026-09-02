import { Component, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { NgIcon } from '@ng-icons/core';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { toast } from '@shared/toast';
import { salesClaims, updateClaim } from '../../sales-state';
import {
  CLAIM_DEFECT_TYPE_LABEL,
  SALES_CLAIM_RESOLUTION_LABEL,
  SALES_CLAIM_STATUS_LABEL,
  SALES_CLAIM_STATUS_TONE,
  SalesClaim,
  SalesClaimResolution,
  Tone,
} from '@core/models';

@Component({
  selector: 'app-claim-detail',
  imports: [DecimalPipe, FormsModule, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, EntityHeader, EmptyState],
  templateUrl: './claim-detail.html',
})
export class ClaimDetail {
  readonly id = input.required<string>();
  protected readonly claim = computed(() => salesClaims().find((c) => c.id === this.id()));
  protected readonly refund = signal(0);

  protected defectLabel = (d: SalesClaim['defectType']) => CLAIM_DEFECT_TYPE_LABEL[d];
  protected resolutionLabel = (r: SalesClaimResolution) => SALES_CLAIM_RESOLUTION_LABEL[r];
  protected statusLabel = (s: SalesClaim['status']) => SALES_CLAIM_STATUS_LABEL[s];
  protected statusTone = (s: SalesClaim['status']): Tone => SALES_CLAIM_STATUS_TONE[s];

  private push(patch: Partial<SalesClaim>, action: string, by: string): void {
    const c = this.claim();
    if (!c) return;
    updateClaim(c.id, { ...patch, history: [...c.history, { at: '2026-09-01', action, by }] });
  }

  protected sendToGerencia(): void {
    this.push({ status: 'pending_gerencia' }, 'Producción evaluó — elevado a Gerencia', 'Producción');
    toast.info('Enviado a Gerencia para visto bueno');
  }

  protected resolve(resolution: SalesClaimResolution): void {
    const c = this.claim();
    if (!c) return;
    const patch: Partial<SalesClaim> = { status: 'resolved', resolution };
    if (resolution === 'devolucion_parcial') patch.refundAmount = this.refund();
    if (resolution === 'reposicion') patch.replacementWorkSheetId = `HT-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    this.push(patch, `Gerencia aprobó: ${SALES_CLAIM_RESOLUTION_LABEL[resolution]}`, 'Gerencia');
    toast.success('Reclamo resuelto');
  }

  protected reject(): void {
    this.push({ status: 'rejected', resolution: 'rechazado' }, 'Reclamo rechazado', 'Gerencia');
    toast.info('Reclamo rechazado');
  }
}
