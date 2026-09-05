import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { ListToolbar } from '@shared/components/list-toolbar/list-toolbar';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { QualityProtocol, QualityProtocolStatus, QUALITY_PROTOCOL_STATUS_LABEL, Tone } from '@core/models';
import { ProductionState } from '../../production-state';

const STATUS_TONE: Record<QualityProtocolStatus, Tone> = {
  active: 'success',
  draft: 'warning',
  retired: 'neutral',
};

@Component({
  selector: 'app-protocol-list',
  imports: [...HlmButtonImports, DataTable, ListToolbar, StatusBadge],
  templateUrl: './protocol-list.html',
})
export class ProtocolList {
  private readonly router = inject(Router);
  private readonly productionState = inject(ProductionState);

  protected readonly search = signal('');

  protected readonly columns: DataTableColumn[] = [
    { key: 'name', header: 'Protocolo' },
    { key: 'version', header: 'Versión', width: '100px' },
    { key: 'appliesTo', header: 'Aplica a' },
    { key: 'fieldCount', header: 'Campos', width: '90px' },
    { key: 'status', header: 'Estado', width: '120px' },
  ];

  protected readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.productionState.qualityProtocols().filter((p) => !term || p.name.toLowerCase().includes(term));
  });

  protected appliesTo(protocol: QualityProtocol): string {
    return protocol.appliesToOperations.join(', ');
  }

  protected statusLabel(protocol: QualityProtocol): string {
    return QUALITY_PROTOCOL_STATUS_LABEL[protocol.status];
  }

  protected statusTone(protocol: QualityProtocol): Tone {
    return STATUS_TONE[protocol.status];
  }

  protected openDetail(protocol: QualityProtocol): void {
    this.router.navigate(['/apps/production/quality/protocols', protocol.id]);
  }

  protected onNew(): void {
    this.router.navigate(['/apps/production/quality/protocols/new']);
  }
}
