import { Component, input } from '@angular/core';
import { ApprovalLevel, ApprovalLevelStatus, Tone } from '@core/models';
import { StatusBadge } from '../status-badge/status-badge';

const LEVEL_STATUS_LABEL: Record<ApprovalLevelStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  observed: 'Observado',
};

const LEVEL_STATUS_TONE: Record<ApprovalLevelStatus, Tone> = {
  pending: 'neutral',
  approved: 'success',
  rejected: 'danger',
  observed: 'warning',
};

/** Renders an Approval's levels as a vertical timeline — used on any document with a critical-operation workflow. */
@Component({
  selector: 'app-approval-timeline',
  imports: [StatusBadge],
  templateUrl: './approval-timeline.html',
})
export class ApprovalTimeline {
  readonly levels = input.required<ApprovalLevel[]>();

  protected statusLabel(status: ApprovalLevelStatus): string {
    return LEVEL_STATUS_LABEL[status];
  }

  protected statusTone(status: ApprovalLevelStatus): Tone {
    return LEVEL_STATUS_TONE[status];
  }
}
