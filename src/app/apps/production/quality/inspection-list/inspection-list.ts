import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { QualityInspection, QualityInspectionResult, QUALITY_INSPECTION_RESULT_LABEL, Tone } from '@core/models';
import { ProductionState } from '../../production-state';

const RESULT_TONE: Record<QualityInspectionResult, Tone> = {
  pass: 'success',
  fail: 'danger',
  pending: 'neutral',
};

@Component({
  selector: 'app-inspection-list',
  imports: [...HlmButtonImports, DataTable, ListToolbar, StatusBadge],
  templateUrl: './inspection-list.html',
})
export class InspectionList {
  private readonly router = inject(Router);
  private readonly productionState = inject(ProductionState);

  protected readonly search = signal('');

  protected readonly columns: DataTableColumn[] = [
    { key: 'workSheetId', header: 'HT', width: '140px' },
    { key: 'operationName', header: 'Operación' },
    { key: 'protocol', header: 'Protocolo' },
    { key: 'inspectedBy', header: 'Inspeccionado por' },
    { key: 'inspectedAt', header: 'Fecha', width: '160px' },
    { key: 'overallResult', header: 'Resultado', width: '120px' },
  ];

  protected readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.productionState.qualityInspections().filter((i) => !term || i.workSheetId.toLowerCase().includes(term) || i.operationName.toLowerCase().includes(term));
  });

  protected protocolName(inspection: QualityInspection): string {
    return this.productionState.qualityProtocols().find((p) => p.id === inspection.protocolId)?.name ?? inspection.protocolId;
  }

  protected resultLabel(inspection: QualityInspection): string {
    return QUALITY_INSPECTION_RESULT_LABEL[inspection.overallResult];
  }

  protected resultTone(inspection: QualityInspection): Tone {
    return RESULT_TONE[inspection.overallResult];
  }

  protected openDetail(inspection: QualityInspection): void {
    this.router.navigate(['/apps/production/quality/inspections', inspection.id]);
  }

  protected onNew(): void {
    this.router.navigate(['/apps/production/quality/inspections/new']);
  }
}
