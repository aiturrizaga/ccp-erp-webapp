import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { InvoicingState } from '@apps/invoicing/invoicing-state';
import { CREDIT_AGREEMENT_STATUS_LABEL, CREDIT_AGREEMENT_STATUS_TONE, CreditAgreement, CreditAgreementStatus, Tone } from '@core/models';

@Component({
  selector: 'app-agreement-list',
  imports: [DecimalPipe, DataTable, ListToolbar, StatusBadge],
  templateUrl: './agreement-list.html',
})
export class AgreementList {
  private readonly router = inject(Router);
  private readonly state = inject(InvoicingState);
  protected readonly search = signal('');

  protected readonly columns: DataTableColumn[] = [
    { key: 'number', header: 'Convenio', width: '150px' },
    { key: 'customerName', header: 'Cliente' },
    { key: 'limit', header: 'Límite', width: '130px', align: 'end' },
    { key: 'termDays', header: 'Plazo', width: '90px' },
    { key: 'validTo', header: 'Vigencia', width: '120px' },
    { key: 'status', header: 'Estado', width: '140px' },
  ];

  protected readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.state.agreements().filter((a) => !term || a.number.toLowerCase().includes(term) || a.customerName.toLowerCase().includes(term));
  });

  protected statusLabel = (s: CreditAgreementStatus) => CREDIT_AGREEMENT_STATUS_LABEL[s];
  protected statusTone = (s: CreditAgreementStatus): Tone => CREDIT_AGREEMENT_STATUS_TONE[s];

  protected openDetail(a: CreditAgreement): void {
    this.router.navigate(['/apps/invoicing/agreements', a.id]);
  }
}
