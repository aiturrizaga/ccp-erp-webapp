import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { InvoicingState } from '../../invoicing-state';
import {
  DISPATCH_GUIDE_STATUS_LABEL,
  DISPATCH_GUIDE_STATUS_TONE,
  DispatchGuide,
  DispatchGuideStatus,
  GUIDE_GLOSA_LABEL,
  Tone,
} from '@core/models';

@Component({
  selector: 'app-guide-list',
  imports: [...HlmButtonImports, DataTable, ListToolbar, StatusBadge],
  templateUrl: './guide-list.html',
})
export class GuideList {
  private readonly router = inject(Router);
  private readonly state = inject(InvoicingState);
  protected readonly search = signal('');

  protected readonly columns: DataTableColumn[] = [
    { key: 'number', header: 'Guía', width: '140px' },
    { key: 'kind', header: 'Serie', width: '90px' },
    { key: 'customerName', header: 'Cliente' },
    { key: 'glosa', header: 'Glosa', width: '150px' },
    { key: 'issuedAt', header: 'Emisión', width: '110px' },
    { key: 'status', header: 'Estado', width: '120px' },
  ];

  protected readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.state.guides().filter((g) => !term || g.number.toLowerCase().includes(term) || g.customerName.toLowerCase().includes(term));
  });

  protected glosaLabel = (g: DispatchGuide['glosa']) => GUIDE_GLOSA_LABEL[g];
  protected statusLabel = (s: DispatchGuideStatus) => DISPATCH_GUIDE_STATUS_LABEL[s];
  protected statusTone = (s: DispatchGuideStatus): Tone => DISPATCH_GUIDE_STATUS_TONE[s];

  protected onNew(): void {
    this.router.navigate(['/apps/invoicing/guides/new']);
  }
}
