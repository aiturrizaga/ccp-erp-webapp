import { Component, input } from '@angular/core';
import { HistoryEvent } from '@core/models';

/** Audit trail list (Section 37 of the master context: who/when/what for every critical operation). */
@Component({
  selector: 'app-activity-timeline',
  templateUrl: './activity-timeline.html',
})
export class ActivityTimeline {
  readonly events = input.required<HistoryEvent[]>();
}
