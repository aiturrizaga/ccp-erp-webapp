import { Component, DestroyRef, ElementRef, effect, inject, input, viewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

/**
 * Thin Angular wrapper around Chart.js (canvas rendering) — takes a full `ChartConfiguration` and
 * owns the Chart instance's lifecycle (create on config change, destroy on re-create/unmount).
 * Re-reads the app's CSS theme tokens on every (re)build so charts stay legible in light and dark
 * mode without hardcoding colors, and re-renders when the OS color scheme changes.
 */
@Component({
  selector: 'app-chart-canvas',
  template: `<canvas #canvas [style.height.px]="heightPx()"></canvas>`,
})
export class ChartCanvas {
  readonly config = input.required<ChartConfiguration>();
  readonly heightPx = input(280);

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    const destroyRef = inject(DestroyRef);
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const render = () => {
      const canvas = this.canvasRef().nativeElement;
      const textColor = getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground').trim();
      const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();
      const cfg = this.config();

      this.chart?.destroy();
      this.chart = new Chart(canvas, {
        ...cfg,
        options: {
          maintainAspectRatio: false,
          ...cfg.options,
          color: textColor,
          scales: cfg.options?.scales
            ? Object.fromEntries(
                Object.entries(cfg.options.scales).map(([key, scale]) => [
                  key,
                  { ...scale, ticks: { color: textColor, ...scale?.ticks }, grid: { color: gridColor, ...scale?.grid } },
                ]),
              )
            : undefined,
          plugins: {
            ...cfg.options?.plugins,
            legend: { labels: { color: textColor }, ...cfg.options?.plugins?.legend },
          },
        },
      });
    };

    effect(render);
    media.addEventListener('change', render);
    destroyRef.onDestroy(() => {
      media.removeEventListener('change', render);
      this.chart?.destroy();
    });
  }
}
