import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmSelectImports } from '@ui/select';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { toast } from '@shared/toast';
import { AuthState } from '@shell/auth-state';
import { createClaim, salesOrders } from '../../sales-state';
import { CLAIM_DEFECT_TYPE_LABEL, ClaimDefectType } from '@core/models';

@Component({
  selector: 'app-claim-create',
  imports: [FormsModule, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmLabelImports, ...HlmSelectImports, EntityHeader],
  templateUrl: './claim-create.html',
})
export class ClaimCreate {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthState);

  protected readonly orderId = signal('');
  protected readonly defectType = signal<ClaimDefectType>('fisura');
  protected readonly description = signal('');
  protected readonly evidenceNames = signal<string[]>([]);
  protected readonly evidenceInput = signal('');

  protected readonly orders = computed(() => salesOrders().filter((o) => o.status !== 'cancelled'));
  protected readonly defectOptions = (Object.keys(CLAIM_DEFECT_TYPE_LABEL) as ClaimDefectType[]).map((value) => ({ value, label: CLAIM_DEFECT_TYPE_LABEL[value] }));
  protected readonly canSubmit = computed(() => this.orderId() && this.description().trim().length > 0);

  protected orderToString = (v: string) => this.orders().find((o) => o.id === v)?.number ?? v;
  protected defectToString = (v: string) => CLAIM_DEFECT_TYPE_LABEL[v as ClaimDefectType] ?? v;

  protected addEvidence(): void {
    const name = this.evidenceInput().trim();
    if (!name) return;
    this.evidenceNames.update((n) => [...n, name]);
    this.evidenceInput.set('');
  }

  protected removeEvidence(i: number): void {
    this.evidenceNames.update((n) => n.filter((_, idx) => idx !== i));
  }

  protected submit(): void {
    const order = this.orders().find((o) => o.id === this.orderId());
    if (!order || !this.canSubmit()) return;
    const claim = createClaim({
      order,
      defectType: this.defectType(),
      description: this.description().trim(),
      evidence: this.evidenceNames().map((name) => ({
        name,
        kind: /\.(jpg|jpeg|png|webp)$/i.test(name) ? 'image' : /\.pdf$/i.test(name) ? 'pdf' : 'document',
        uploadedAt: '2026-09-01',
      })),
      createdBy: this.auth.currentUser()?.name ?? 'Ventas',
    });
    toast.success(`Reclamo ${claim.number} registrado`, { description: 'Notificado a Producción' });
    this.router.navigate(['/apps/sales/claims', claim.id]);
  }

  protected cancel(): void {
    this.router.navigate(['/apps/sales/claims']);
  }
}
