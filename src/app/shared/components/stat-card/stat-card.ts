import { Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmCardImports } from '@ui/card';

export type StatCardTrend = 'up' | 'down' | 'flat';

/** Dashboard KPI tile — used by the Shell's global dashboard and each App's own reporting. */
@Component({
  selector: 'app-stat-card',
  imports: [...HlmCardImports, NgIcon],
  templateUrl: './stat-card.html',
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly hint = input<string>();
  readonly trend = input<StatCardTrend>('flat');
  readonly trendLabel = input<string>();
}
