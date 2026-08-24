import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ITEMS, SUPPLIERS } from '@core/mock-data';
import { QuotationStatus, QUOTATION_STATUS_LABEL, Tone } from '@core/models';
import { PurchasingState } from '../../purchasing-state';

const STATUS_TONE: Record<QuotationStatus, Tone> = {
  draft: 'neutral',
  sent: 'info',
  received: 'info',
  under_evaluation: 'warning',
  awarded: 'success',
  discarded: 'danger',
};

@Component({
  selector: 'app-quotation-detail',
  imports: [RouterLink, NgIcon, ...HlmButtonImports, ...HlmCardImports, EntityHeader, EmptyState],
  templateUrl: './quotation-detail.html',
})
export class QuotationDetail {
  private readonly router = inject(Router);
  private readonly purchasingState = inject(PurchasingState);

  readonly id = input.required<string>();

  protected readonly quotation = computed(() => this.purchasingState.quotations().find((q) => q.id === this.id()));

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected supplierName(supplierId: string): string {
    return SUPPLIERS.find((s) => s.id === supplierId)?.legalName ?? supplierId;
  }

  protected statusLabel(status: QuotationStatus): string {
    return QUOTATION_STATUS_LABEL[status];
  }

  protected statusTone(status: QuotationStatus): Tone {
    return STATUS_TONE[status];
  }

  protected goToComparison(): void {
    const q = this.quotation();
    if (!q) return;
    this.router.navigate(['/apps/purchasing/sourcing/comparison', q.requisitionId]);
  }
}
