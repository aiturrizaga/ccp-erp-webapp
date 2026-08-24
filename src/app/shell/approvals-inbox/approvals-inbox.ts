import { Component, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HlmButtonImports } from '@ui/button';
import { DataTable, DataTableColumn } from '@shared/components/data-table/data-table';
import { DataFilters } from '@shared/components/data-filters/data-filters';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { ApprovalTimeline } from '@shared/components/approval-timeline/approval-timeline';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { SelectFilter, SelectFilterOption } from '@shared/components/select-filter/select-filter';
import { APPROVALS } from '@core/mock-data';
import { Approval, ApprovalStatus, APPROVAL_PROCESS_LABEL, Tone } from '@core/models';

const STATUS_LABEL: Record<ApprovalStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  observed: 'Observado',
};

const STATUS_TONE: Record<ApprovalStatus, Tone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  observed: 'info',
};

/** Transversal approval inbox (Section 30 of the master context) — not owned by any single App. */
@Component({
  selector: 'app-approvals-inbox',
  imports: [...HlmButtonImports, DataTable, DataFilters, StatusBadge, ApprovalTimeline, EmptyState, DecimalPipe, SelectFilter],
  templateUrl: './approvals-inbox.html',
})
export class ApprovalsInbox {
  protected readonly search = signal('');
  protected readonly statusFilter = signal('pending');
  protected readonly selectedId = signal<string | null>(APPROVALS.find((a) => a.status === 'pending')?.id ?? null);

  protected readonly statusOptions: SelectFilterOption[] = [
    { value: 'pending', label: 'Pendientes' },
    { value: 'approved', label: 'Aprobadas' },
    { value: 'rejected', label: 'Rechazadas' },
    { value: 'observed', label: 'Observadas' },
    { value: 'all', label: 'Todas' },
  ];

  protected readonly columns: DataTableColumn[] = [
    { key: 'documentNumber', header: 'Documento' },
    { key: 'process', header: 'Proceso' },
    { key: 'description', header: 'Descripción' },
    { key: 'requestedBy', header: 'Solicitante' },
    { key: 'amount', header: 'Monto', align: 'end' },
    { key: 'status', header: 'Estado' },
  ];

  protected readonly filteredApprovals = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return APPROVALS.filter((approval) => {
      const matchesStatus = status === 'all' || approval.status === (status as ApprovalStatus);
      const matchesSearch =
        !term ||
        approval.documentNumber.toLowerCase().includes(term) ||
        approval.description.toLowerCase().includes(term) ||
        approval.requestedBy.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    }).reverse();
  });

  protected readonly selected = computed<Approval | null>(() => APPROVALS.find((a) => a.id === this.selectedId()) ?? null);

  protected select(approval: Approval): void {
    this.selectedId.set(approval.id);
  }

  protected processLabel(process: string): string {
    return APPROVAL_PROCESS_LABEL[process as keyof typeof APPROVAL_PROCESS_LABEL] ?? process;
  }

  protected statusLabel(status: ApprovalStatus): string {
    return STATUS_LABEL[status];
  }

  protected statusTone(status: ApprovalStatus): Tone {
    return STATUS_TONE[status];
  }
}
