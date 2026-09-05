import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { Mold, MOLD_TYPE_LABEL, RESOURCE_CONDITION_LABEL, Tone } from '@core/models';
import { ProductionState } from '../../production-state';

@Component({
  selector: 'app-mold-list',
  imports: [...HlmButtonImports, DataTable, ListToolbar, StatusBadge],
  templateUrl: './mold-list.html',
})
export class MoldList {
  private readonly router = inject(Router);
  private readonly productionState = inject(ProductionState);

  protected readonly search = signal('');

  protected readonly columns: DataTableColumn[] = [
    { key: 'code', header: 'Código', width: '160px' },
    { key: 'tipo', header: 'Tipo', width: '120px' },
    { key: 'location', header: 'Ubicación' },
    { key: 'usage', header: 'Uso', width: '140px' },
    { key: 'estado', header: 'Estado', width: '110px' },
  ];

  protected readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.productionState.molds().filter((m) => !term || m.code.toLowerCase().includes(term));
  });

  protected productNames(mold: Mold): string {
    return mold.compatibleProductIds.map((id) => this.productionState.products().find((p) => p.id === id)?.code ?? id).join(', ');
  }

  protected typeLabel(mold: Mold): string {
    return MOLD_TYPE_LABEL[mold.tipo];
  }

  protected conditionLabel(mold: Mold): string {
    return RESOURCE_CONDITION_LABEL[mold.estado];
  }

  protected conditionTone(mold: Mold): Tone {
    return mold.estado === 'bueno' ? 'success' : 'danger';
  }

  protected openDetail(mold: Mold): void {
    this.router.navigate(['/apps/production/molds', mold.id]);
  }

  protected onNew(): void {
    this.router.navigate(['/apps/production/molds/new']);
  }
}
