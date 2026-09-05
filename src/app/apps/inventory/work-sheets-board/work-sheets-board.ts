import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@ui/button';
import { HlmCheckboxImports } from '@ui/checkbox';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { DataKanban, KanbanColumn } from '@shared/components/data-kanban/data-kanban';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { ITEMS, PRODUCTS, WORK_SHEETS } from '@core/mock-data';
import { ReplenishmentSuggestion, Tone, WorkSheet, WorkSheetStatus, WORK_SHEET_STATUS_LABEL, workSheetStatus } from '@core/models';
import { PurchasingState } from '../../purchasing/purchasing-state';
import { WarehouseOpsState } from '../warehouse-ops-state';

const TODAY = '2026-08-23';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const STATUS_TONE: Record<WorkSheetStatus, Tone> = {
  planned: 'neutral',
  released: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

const STATUS_OPTIONS: { value: WorkSheetStatus; label: string }[] = (
  Object.keys(WORK_SHEET_STATUS_LABEL) as WorkSheetStatus[]
).map((value) => ({ value, label: WORK_SHEET_STATUS_LABEL[value] }));

const ACTIVE_STATUSES = new Set<WorkSheetStatus>(['planned', 'released', 'in_progress']);

/** Origin of the missing-quantity pressure a material puts on the plan, in decreasing severity. */
type CoverageTone = 'danger' | 'warning' | 'success';

interface MaterialGap {
  itemId: string;
  unitOfMeasure: string;
  missing: number;
}

interface BoardCard {
  ws: WorkSheet;
  productName: string;
  coveragePct: number;
  coverageTone: CoverageTone;
  gaps: MaterialGap[];
  daysToCommit: number;
  suggestion?: ReplenishmentSuggestion;
  requirementNumber?: string;
  requirementStatus?: string;
  dispatchLabel?: string;
  dispatchTone?: Tone;
  /** Lower sorts first — the ranking behind "qué HT atender primero". */
  priorityRank: number;
}

const DISPATCH_LABEL: Record<string, string> = {
  pending: 'Salida pendiente',
  partial: 'Salida parcial',
  dispatched: 'Salida completa',
  cancelled: 'Salida cancelada',
};

const DISPATCH_TONE: Record<string, Tone> = {
  pending: 'neutral',
  partial: 'warning',
  dispatched: 'success',
  cancelled: 'danger',
};

/**
 * Tablero de ejecución de HT para Almacén: en qué estado va cada Hoja de Trabajo, qué tan cubierta
 * está de materiales, y qué tan urgente es — para decidir qué HT atender primero con un Requerimiento
 * de Compra y qué artículos conviene stockear con anticipación por repetirse en varias HT.
 */
@Component({
  selector: 'app-work-sheets-board',
  imports: [FormsModule, RouterLink, ...HlmButtonImports, ...HlmCheckboxImports, StatCard, DataKanban, StatusBadge, EmptyState],
  templateUrl: './work-sheets-board.html',
})
export class WorkSheetsBoard {
  private readonly purchasingState = inject(PurchasingState);
  private readonly warehouseOpsState = inject(WarehouseOpsState);

  protected readonly search = signal('');
  protected readonly onlyAtRisk = signal(false);
  protected readonly plantFilter = signal<Set<string>>(new Set());

  protected readonly plantOptions = Array.from(new Set(WORK_SHEETS.map((w) => w.plant))).map((value) => ({ value, label: value }));
  protected readonly statusColumns: KanbanColumn[] = STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label, tone: STATUS_TONE[o.value] }));
  protected readonly statusKey = (row: BoardCard): string => workSheetStatus(row.ws);

  private coverage(ws: WorkSheet): { pct: number; tone: CoverageTone; gaps: MaterialGap[] } {
    const materials = ws.lines.flatMap((l) => l.materials);
    const ratios = materials.map((m) => (m.required > 0 ? Math.min(1, m.available / m.required) : 1));
    const pct = ratios.length ? Math.round(Math.min(...ratios) * 100) : 100;
    const gaps = materials
      .filter((m) => m.available < m.required)
      .map((m) => ({ itemId: m.itemId, unitOfMeasure: m.unitOfMeasure, missing: m.required - m.available }));
    const tone: CoverageTone = pct >= 100 ? 'success' : pct >= 50 ? 'warning' : 'danger';
    return { pct, tone, gaps };
  }

  private productIdOf(ws: WorkSheet): string {
    return ws.lines[0]?.productId ?? '';
  }

  /** All the board's per-HT rows, computed once — cards, filters and both decision panels all read from this. */
  protected readonly cards = computed<BoardCard[]>(() => {
    const suggestions = this.purchasingState.suggestions();
    const requirements = this.purchasingState.requirements();
    const stockIssues = this.warehouseOpsState.stockIssues();

    return WORK_SHEETS.map((ws) => {
      const { pct, tone, gaps } = this.coverage(ws);
      const daysToCommit = Math.round((new Date(ws.committedDate).getTime() - new Date(TODAY).getTime()) / ONE_DAY_MS);
      const suggestion = suggestions.find((s) => s.workSheetRef === ws.number);
      const requirement = suggestion?.requirementId ? requirements.find((r) => r.id === suggestion.requirementId) : undefined;
      const issue = stockIssues.find((i) => i.workSheetId === ws.id);

      // Lower rank = attend first: at-risk HT with no purchase requirement yet and the least time to commit date come first.
      const hasRequirement = !!requirement;
      const priorityRank = (ws.atRisk ? 0 : 1000) + (ws.atRisk && !hasRequirement ? 0 : 500) + Math.max(0, daysToCommit);

      return {
        ws,
        productName: this.productName(this.productIdOf(ws)),
        coveragePct: pct,
        coverageTone: tone,
        gaps,
        daysToCommit,
        suggestion,
        requirementNumber: requirement?.number,
        requirementStatus: requirement?.status,
        dispatchLabel: issue ? DISPATCH_LABEL[issue.status] : undefined,
        dispatchTone: issue ? DISPATCH_TONE[issue.status] : undefined,
        priorityRank,
      };
    });
  });

  protected readonly filteredCards = computed(() => {
    const term = this.search().trim().toLowerCase();
    const onlyRisk = this.onlyAtRisk();
    const plants = this.plantFilter();
    return this.cards().filter((c) => {
      const matchesSearch = !term || c.ws.number.toLowerCase().includes(term) || c.productName.toLowerCase().includes(term);
      const matchesRisk = !onlyRisk || c.ws.atRisk;
      const matchesPlant = plants.size === 0 || plants.has(c.ws.plant);
      return matchesSearch && matchesRisk && matchesPlant;
    });
  });

  // --- Panel de decisión: qué HT atender primero con un Requerimiento de Compra ---
  protected readonly needsPurchaseAction = computed(() =>
    this.cards()
      .filter((c) => c.ws.atRisk && ACTIVE_STATUSES.has(workSheetStatus(c.ws)) && !c.requirementNumber)
      .sort((a, b) => a.priorityRank - b.priorityRank),
  );

  // --- Panel de decisión: artículos a considerar para stock anticipado (se repiten en varias HT activas) ---
  protected readonly restockCandidates = computed(() => {
    const totals = new Map<string, { itemId: string; unitOfMeasure: string; totalMissing: number; htCount: number }>();
    for (const c of this.cards()) {
      if (!ACTIVE_STATUSES.has(workSheetStatus(c.ws))) continue;
      for (const gap of c.gaps) {
        const entry = totals.get(gap.itemId);
        if (entry) {
          entry.totalMissing += gap.missing;
          entry.htCount += 1;
        } else {
          totals.set(gap.itemId, { itemId: gap.itemId, unitOfMeasure: gap.unitOfMeasure, totalMissing: gap.missing, htCount: 1 });
        }
      }
    }
    return Array.from(totals.values())
      .filter((t) => t.htCount > 1)
      .sort((a, b) => b.htCount - a.htCount || b.totalMissing - a.totalMissing);
  });

  // --- KPIs ---
  protected readonly activeCount = computed(() => this.cards().filter((c) => ACTIVE_STATUSES.has(workSheetStatus(c.ws))).length);
  protected readonly atRiskCount = computed(() => this.cards().filter((c) => c.ws.atRisk && ACTIVE_STATUSES.has(workSheetStatus(c.ws))).length);
  protected readonly avgCoverage = computed(() => {
    const active = this.cards().filter((c) => ACTIVE_STATUSES.has(workSheetStatus(c.ws)));
    if (!active.length) return 100;
    return Math.round(active.reduce((sum, c) => sum + c.coveragePct, 0) / active.length);
  });

  protected togglePlantFilter(value: string): void {
    this.plantFilter.update((set) => {
      const next = new Set(set);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  protected productName(productId: string): string {
    return PRODUCTS.find((p) => p.id === productId)?.name ?? productId;
  }

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }
}
