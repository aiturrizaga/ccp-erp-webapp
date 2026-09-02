import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { salesClaims } from '../../sales-state';
import {
  CLAIM_DEFECT_TYPE_LABEL,
  SALES_CLAIM_RESOLUTION_LABEL,
  SALES_CLAIM_STATUS_LABEL,
  SALES_CLAIM_STATUS_TONE,
  SalesClaim,
  SalesClaimStatus,
  Tone,
} from '@core/models';

@Component({
  selector: 'app-claim-list',
  imports: [...HlmButtonImports, DataTable, ListToolbar, StatusBadge],
  templateUrl: './claim-list.html',
})
export class ClaimList {
  private readonly router = inject(Router);
  protected readonly search = signal('');

  protected readonly columns: DataTableColumn[] = [
    { key: 'number', header: 'Reclamo', width: '130px' },
    { key: 'salesOrderNumber', header: 'Pedido', width: '130px' },
    { key: 'customerName', header: 'Cliente' },
    { key: 'defectType', header: 'Falla', width: '150px' },
    { key: 'resolution', header: 'Resolución', width: '180px' },
    { key: 'status', header: 'Estado', width: '170px' },
  ];

  protected readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    return salesClaims().filter(
      (c) => !term || c.number.toLowerCase().includes(term) || c.customerName.toLowerCase().includes(term) || c.salesOrderNumber.toLowerCase().includes(term),
    );
  });

  protected defectLabel = (d: SalesClaim['defectType']) => CLAIM_DEFECT_TYPE_LABEL[d];
  protected resolutionLabel = (r: SalesClaim['resolution']) => SALES_CLAIM_RESOLUTION_LABEL[r];
  protected statusLabel = (s: SalesClaimStatus) => SALES_CLAIM_STATUS_LABEL[s];
  protected statusTone = (s: SalesClaimStatus): Tone => SALES_CLAIM_STATUS_TONE[s];

  protected onNew(): void {
    this.router.navigate(['/apps/sales/claims/new']);
  }
  protected openDetail(claim: SalesClaim): void {
    this.router.navigate(['/apps/sales/claims', claim.id]);
  }
}
