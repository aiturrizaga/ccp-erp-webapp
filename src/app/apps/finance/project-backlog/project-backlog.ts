import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { HlmTabsImports } from '@ui/tabs';
import {
  ACTIVE_PROJECTS,
  BACKLOG_CUT_OFF,
  EXECUTED_PROJECTS,
  GUARANTEES,
  PIPELINE_PROJECTS,
  ActiveProjectRow,
  ExecutedProjectRow,
  GuaranteeRow,
  PipelineProjectRow,
} from './project-backlog.data';

type RiskTone = 'success' | 'warning' | 'danger' | 'neutral';

@Component({
  selector: 'app-project-backlog',
  standalone: true,
  imports: [CommonModule, ...HlmTabsImports],
  templateUrl: './project-backlog.html',
})
export class ProjectBacklog {
  protected readonly cutOff = BACKLOG_CUT_OFF;
  protected readonly search = signal('');
  protected readonly customer = signal('ALL');
  protected readonly activeStatus = signal('ALL');

  protected readonly customers = computed(() => {
    const values = new Set<string>();
    EXECUTED_PROJECTS.forEach((row) => values.add(row.customer));
    ACTIVE_PROJECTS.forEach((row) => values.add(row.customer));
    PIPELINE_PROJECTS.forEach((row) => values.add(row.customer));
    return [...values].filter(Boolean).sort((a, b) => a.localeCompare(b));
  });

  protected readonly filteredExecuted = computed(() => EXECUTED_PROJECTS.filter((row) => this.matches(row.customer, row.project, row.id)));
  protected readonly filteredActive = computed(() => ACTIVE_PROJECTS.filter((row) => {
    if (!this.matches(row.customer, row.project, row.id)) return false;
    const status = this.projectStatus(row);
    return this.activeStatus() === 'ALL' || status === this.activeStatus();
  }));
  protected readonly filteredPipeline = computed(() => PIPELINE_PROJECTS.filter((row) => this.matches(row.customer, row.project, row.id)));
  protected readonly filteredGuarantees = computed(() => GUARANTEES.filter((row) => this.matches(row.beneficiary, row.contract, row.guaranteeType, row.id)));

  protected readonly activeContracted = computed(() => ACTIVE_PROJECTS.reduce((sum, row) => sum + row.contractAmount, 0));
  protected readonly activeBacklog = computed(() => ACTIVE_PROJECTS.reduce((sum, row) => sum + this.calculatedBacklog(row), 0));
  protected readonly pending2026 = computed(() => ACTIVE_PROJECTS.reduce((sum, row) => sum + row.pendingBilling2026, 0));
  protected readonly pipelineGross = computed(() => PIPELINE_PROJECTS.reduce((sum, row) => sum + row.contractAmount, 0));
  protected readonly pipelineWeighted = computed(() => PIPELINE_PROJECTS.reduce((sum, row) => sum + this.weightedAmount(row), 0));
  protected readonly guaranteesAtRisk = computed(() => GUARANTEES.filter((row) => this.daysUntil(row.endDate) <= 90).length);

  protected updateSearch(value: string): void { this.search.set(value); }
  protected updateCustomer(value: string): void { this.customer.set(value); }
  protected updateStatus(value: string): void { this.activeStatus.set(value); }
  protected clearFilters(): void { this.search.set(''); this.customer.set('ALL'); this.activeStatus.set('ALL'); }

  protected formatCurrency(value: number, currency = 'PEN'): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value || 0);
  }

  protected calculatedBilled(row: ActiveProjectRow): number {
    return Math.max(0, row.contractAmount * Math.min(1, Math.max(0, row.progress)));
  }

  protected calculatedBacklog(row: ActiveProjectRow): number {
    return Math.max(0, row.contractAmount - this.calculatedBilled(row));
  }

  protected weightedAmount(row: PipelineProjectRow): number {
    return row.contractAmount * row.probability;
  }

  protected pipelineStage(row: PipelineProjectRow): string {
    if (row.probability >= 0.85) return 'Alta probabilidad';
    if (row.probability >= 0.7) return 'En negociación';
    return 'En evaluación';
  }

  protected projectStatus(row: ActiveProjectRow): string {
    if (row.progress >= 1) return 'Completado';
    const days = this.daysUntil(row.endDate);
    if (days < 0) return 'Vencido';
    if (days <= 30) return 'Por vencer';
    return 'En ejecución';
  }

  protected projectRisk(row: ActiveProjectRow): RiskTone {
    const days = this.daysUntil(row.endDate);
    if (days < 0 && row.progress < 1) return 'danger';
    if (days <= 30 || (row.progress < 0.3 && days <= 90)) return 'warning';
    return 'success';
  }

  protected guaranteeRisk(row: GuaranteeRow): RiskTone {
    const days = this.daysUntil(row.endDate);
    if (days < 0) return 'danger';
    if (days <= 30) return 'danger';
    if (days <= 90) return 'warning';
    return 'success';
  }

  protected riskClass(tone: RiskTone): string {
    return {
      success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      warning: 'bg-amber-50 text-amber-700 border-amber-200',
      danger: 'bg-red-50 text-red-700 border-red-200',
      neutral: 'bg-slate-50 text-slate-700 border-slate-200',
    }[tone];
  }

  protected daysUntil(date: string | null): number {
    if (!date) return 9999;
    const start = new Date(`${BACKLOG_CUT_OFF}T00:00:00`);
    const end = new Date(`${date}T00:00:00`);
    return Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
  }

  protected visibleBilled(row: ExecutedProjectRow): number { return row.billed2025 + row.billed2026; }

  protected displayDate(date: string | null): string {
    if (!date) return '—';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  private matches(...values: Array<string | number | null>): boolean {
    const customer = this.customer();
    if (customer !== 'ALL' && !values.some((value) => String(value ?? '').toUpperCase() === customer.toUpperCase())) return false;
    const term = this.search().trim().toLowerCase();
    if (!term) return true;
    return values.some((value) => String(value ?? '').toLowerCase().includes(term));
  }
}
