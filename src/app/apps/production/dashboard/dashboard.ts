import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { HlmCardImports } from '@ui/card';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { ChartCanvas } from '@shared/components/chart-canvas/chart-canvas';
import { OUTPUT_BUNDLES, PRODUCTS } from '@core/mock-data';
import { allRuns, bottleneckOperation, lineProducedQuantity, WorkSheet, workSheetStatus } from '@core/models';
import { ProductionState } from '../production-state';

const OUTPUT_BUNDLES_PENDING_SIGNATURE = new Set(['preparing', 'lot_selected']);

/** Same fixed "today" used across Producción (work-sheet-detail, inspection-create, production-state). */
const TODAY = '2026-09-04';

const CHART_PALETTE = ['#2563eb', '#dc2626', '#d97706', '#7c3aed', '#16a34a', '#6b7280'];

/** Monday..Sunday ISO bounds (yyyy-mm-dd) for the week containing TODAY. */
function currentWeekRange(): [string, string] {
  const d = new Date(TODAY + 'T00:00:00');
  const isoDow = d.getDay() === 0 ? 7 : d.getDay(); // Monday=1 .. Sunday=7
  const monday = new Date(d);
  monday.setDate(d.getDate() - (isoDow - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return [monday.toISOString().slice(0, 10), sunday.toISOString().slice(0, 10)];
}

/**
 * App-level analytics for Producción — plan vs. real, causas de atraso, tendencia de producción,
 * rendimiento por molde, ocupación de planta y calidad por protocolo, además de HT en riesgo/en
 * curso y bolsas pendientes de firma. Todo derivado de `ProductionState`, nada hardcodeado.
 */
@Component({
  selector: 'app-production-dashboard',
  imports: [RouterLink, ...HlmCardImports, StatCard, ChartCanvas],
  templateUrl: './dashboard.html',
})
export class ProductionDashboard {
  private readonly router = inject(Router);
  protected readonly productionState = inject(ProductionState);

  // ---------------------------------------------------------------------------
  // KPI row
  // ---------------------------------------------------------------------------

  protected readonly workSheetsInProgress = computed(() => this.productionState.workSheets().filter((ws) => workSheetStatus(ws) === 'in_progress'));

  protected readonly worksheetsAtRisk = computed(() => this.productionState.workSheets().filter((ws) => ws.atRisk));

  protected readonly workSheetsCompleted = computed(() => this.productionState.workSheets().filter((ws) => workSheetStatus(ws) === 'completed').length);

  protected readonly bundlesPendingSignature = computed(() => OUTPUT_BUNDLES.filter((b) => OUTPUT_BUNDLES_PENDING_SIGNATURE.has(b.status)).length);

  /** Produced vs. planned quantity, aggregated across every HT line — the plant's overall "hit rate". */
  protected readonly planComplianceRate = computed(() => {
    const sheets = this.productionState.workSheets();
    const planned = sheets.reduce((sum, ws) => sum + ws.lines.reduce((s, l) => s + l.plannedQuantity, 0), 0);
    const produced = sheets.reduce((sum, ws) => sum + ws.lines.reduce((s, l) => s + lineProducedQuantity(l), 0), 0);
    return planned === 0 ? 0 : Math.round((produced / planned) * 100);
  });

  /** Rejected vs. produced quantity across every corrida registered so far. */
  protected readonly rejectionRate = computed(() => {
    const runs = this.productionState.workSheets().flatMap(allRuns);
    const produced = runs.reduce((s, r) => s + r.producedQuantity, 0);
    const rejected = runs.reduce((s, r) => s + r.rejectedQuantity, 0);
    return produced === 0 ? 0 : Math.round((rejected / produced) * 1000) / 10;
  });

  protected readonly openNonConformities = computed(() => this.productionState.nonConformities().filter((n) => !n.resolved).length);

  /** Corridas either mid-execution (started, not yet closed) or scheduled to start today. */
  protected readonly activeRunsToday = computed(() => {
    const runs = this.productionState.workSheets().flatMap(allRuns);
    return runs.filter((r) => (!!r.actualStart && !r.actualEnd) || r.scheduledStart.slice(0, 10) === TODAY).length;
  });

  // ---------------------------------------------------------------------------
  // Plan vs Real por HT
  // ---------------------------------------------------------------------------

  private readonly recentWorkSheets = computed(() =>
    [...this.productionState.workSheets()].sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate)).slice(0, 8).reverse(),
  );

  protected readonly planVsRealChart = computed<ChartConfiguration>(() => {
    const sheets = this.recentWorkSheets();
    return {
      type: 'bar',
      data: {
        labels: sheets.map((ws) => ws.number.replace('HT-2026-', 'HT-')),
        datasets: [
          { label: 'Planificado', data: sheets.map((ws) => ws.lines.reduce((s, l) => s + l.plannedQuantity, 0)), backgroundColor: '#9ca3af' },
          { label: 'Producido', data: sheets.map((ws) => ws.lines.reduce((s, l) => s + lineProducedQuantity(l), 0)), backgroundColor: '#2563eb' },
        ],
      },
      options: { scales: { y: { beginAtZero: true } } },
    };
  });

  // ---------------------------------------------------------------------------
  // Causas de atraso
  // ---------------------------------------------------------------------------

  /** Delayed = flagged en riesgo, or past su fecha comprometida y todavía con una operación abierta. */
  protected readonly delayedWorkSheets = computed(() => this.productionState.workSheets().filter((ws) => ws.atRisk || !!bottleneckOperation(ws, TODAY)));

  private delayCategory(ws: WorkSheet): string {
    const bottleneck = bottleneckOperation(ws, TODAY);
    if (bottleneck) return bottleneck.operationName;
    const reason = (ws.riskReason ?? '').toLowerCase();
    if (reason.includes('secado')) return 'Secado';
    if (reason.includes('bom') || reason.includes('receta')) return 'Ingeniería (BOM)';
    if (reason.includes('molde')) return 'Moldes';
    if (reason.includes('stock') || reason.includes('insuficient') || reason.includes('faltante') || reason.includes('requerimiento')) return 'Abastecimiento';
    if (reason.includes('calidad') || reason.includes('fisura') || reason.includes('rotura')) return 'Calidad';
    return 'Otro';
  }

  protected readonly delayCausesChart = computed<ChartConfiguration>(() => {
    const totals = new Map<string, number>();
    for (const ws of this.delayedWorkSheets()) {
      const category = this.delayCategory(ws);
      totals.set(category, (totals.get(category) ?? 0) + 1);
    }
    const entries = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    return {
      type: 'doughnut',
      data: {
        labels: entries.map(([category]) => category),
        datasets: [{ data: entries.map(([, count]) => count), backgroundColor: entries.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]) }],
      },
      options: { plugins: { legend: { position: 'right' } } },
    };
  });

  // ---------------------------------------------------------------------------
  // Tendencia de producción
  // ---------------------------------------------------------------------------

  protected readonly productionTrendChart = computed<ChartConfiguration>(() => {
    const runs = this.productionState.workSheets().flatMap(allRuns).filter((r) => !!r.actualEnd);
    const byDay = new Map<string, number>();
    for (const run of runs) {
      const day = run.actualEnd!.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + run.producedQuantity);
    }
    const days = Array.from(byDay.keys()).sort();
    return {
      type: 'line',
      data: {
        labels: days,
        datasets: [
          {
            label: 'Unidades producidas',
            data: days.map((d) => byDay.get(d) ?? 0),
            borderColor: '#16a34a',
            backgroundColor: '#16a34a33',
            tension: 0.3,
            fill: true,
            pointRadius: 4,
          },
        ],
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    };
  });

  // ---------------------------------------------------------------------------
  // Rendimiento por molde
  // ---------------------------------------------------------------------------

  protected readonly moldPerformance = computed(() => {
    const runs = this.productionState.workSheets().flatMap(allRuns).filter((r) => !!r.moldId);
    const totals = new Map<string, number>();
    for (const run of runs) totals.set(run.moldId!, (totals.get(run.moldId!) ?? 0) + run.producedQuantity);
    return Array.from(totals.entries())
      .map(([moldId, quantity]) => ({ moldId, quantity, label: this.productionState.molds().find((m) => m.id === moldId)?.code ?? moldId }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  });

  protected readonly moldPerformanceChart = computed<ChartConfiguration>(() => {
    const rows = this.moldPerformance();
    return {
      type: 'bar',
      data: { labels: rows.map((r) => r.label), datasets: [{ label: 'Unidades producidas', data: rows.map((r) => r.quantity), backgroundColor: '#2563eb' }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } },
    };
  });

  // ---------------------------------------------------------------------------
  // Ocupación por centro de trabajo (semana actual)
  // ---------------------------------------------------------------------------

  protected readonly workCenterOccupancy = computed(() => {
    const [start, end] = currentWeekRange();
    const runs = this.productionState
      .workSheets()
      .flatMap(allRuns)
      .filter((r) => r.status !== 'cancelled' && r.scheduledStart.slice(0, 10) >= start && r.scheduledStart.slice(0, 10) <= end);
    return this.productionState.workCenters().map((wc) => ({ workCenter: wc, count: runs.filter((r) => r.workCenterId === wc.id).length }));
  });

  protected readonly workCenterOccupancyChart = computed<ChartConfiguration>(() => {
    const rows = this.workCenterOccupancy();
    return {
      type: 'bar',
      data: { labels: rows.map((r) => r.workCenter.name), datasets: [{ label: 'Corridas programadas esta semana', data: rows.map((r) => r.count), backgroundColor: '#7c3aed' }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
    };
  });

  // ---------------------------------------------------------------------------
  // Calidad por protocolo
  // ---------------------------------------------------------------------------

  protected readonly qualityByProtocol = computed(() => {
    const inspections = this.productionState.qualityInspections();
    return this.productionState
      .qualityProtocols()
      .map((protocol) => {
        const rows = inspections.filter((i) => i.protocolId === protocol.id);
        const pass = rows.filter((i) => i.overallResult === 'pass').length;
        const fail = rows.filter((i) => i.overallResult === 'fail').length;
        return { protocol, pass, fail, total: rows.length, passPct: rows.length ? Math.round((pass / rows.length) * 100) : 0 };
      })
      .filter((row) => row.total > 0);
  });

  protected readonly qualityByProtocolChart = computed<ChartConfiguration>(() => {
    const rows = this.qualityByProtocol();
    return {
      type: 'bar',
      data: {
        labels: rows.map((r) => r.protocol.name),
        datasets: [
          { label: 'Conformes', data: rows.map((r) => r.pass), backgroundColor: '#16a34a' },
          { label: 'No conformes', data: rows.map((r) => r.fail), backgroundColor: '#dc2626' },
        ],
      },
      options: {
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } },
        plugins: { legend: { position: 'bottom' } },
      },
    };
  });

  // ---------------------------------------------------------------------------

  protected productName(productId: string): string {
    return PRODUCTS.find((p) => p.id === productId)?.name ?? productId;
  }

  protected goToWorkSheet(id: string): void {
    this.router.navigate(['/apps/production/work-sheets', id]);
  }

  protected goToMold(id: string): void {
    this.router.navigate(['/apps/production/molds', id]);
  }

  protected goToProtocol(id: string): void {
    this.router.navigate(['/apps/production/quality/protocols', id]);
  }
}
