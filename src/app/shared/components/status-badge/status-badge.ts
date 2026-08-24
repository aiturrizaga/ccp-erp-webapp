import { Component, computed, input } from '@angular/core';
import { HlmBadgeImports } from '@ui/badge';
import { Tone } from '@core/models';

const TONE_VARIANT: Record<Tone, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  neutral: 'secondary',
  info: 'outline',
  success: 'default',
  warning: 'outline',
  danger: 'destructive',
};

const TONE_CLASS: Record<Tone, string> = {
  neutral: '',
  info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
  success: 'bg-emerald-600 text-white hover:bg-emerald-600/90',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  danger: '',
};

@Component({
  selector: 'app-status-badge',
  imports: [...HlmBadgeImports],
  template: `<span hlmBadge [variant]="variant()" [class]="toneClass()">{{ label() }}</span>`,
})
export class StatusBadge {
  readonly label = input.required<string>();
  readonly tone = input<Tone>('neutral');

  protected readonly variant = computed(() => TONE_VARIANT[this.tone()]);
  protected readonly toneClass = computed(() => TONE_CLASS[this.tone()]);
}
