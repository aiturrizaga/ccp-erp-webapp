import { Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-empty-state',
  imports: [NgIcon],
  templateUrl: './empty-state.html',
})
export class EmptyState {
  readonly icon = input('tablerInbox');
  readonly title = input.required<string>();
  readonly description = input<string>();
}
