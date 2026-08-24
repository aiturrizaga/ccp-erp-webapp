import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { Tone } from '@core/models';
import { StatusBadge } from '../status-badge/status-badge';

export interface EntityHeaderCrumb {
  label: string;
  link?: string;
}

/** Detail-view header reused across every App: breadcrumb, title, status badge and an action slot. */
@Component({
  selector: 'app-entity-header',
  imports: [RouterLink, ...HlmButtonImports, StatusBadge],
  templateUrl: './entity-header.html',
})
export class EntityHeader {
  readonly crumbs = input<EntityHeaderCrumb[]>([]);
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly statusLabel = input<string>();
  readonly statusTone = input<Tone>('neutral');
}
