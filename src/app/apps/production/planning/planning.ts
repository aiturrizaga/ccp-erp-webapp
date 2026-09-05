import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { HlmButtonImports } from '@ui/button';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmPopoverImports } from '@ui/popover';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { toast } from '@shared/toast';
import { ManufacturingRun } from '@core/models';
import { ProductionState } from '../production-state';

interface RunCell {
  run: ManufacturingRun;
  workSheetId: string;
  lineId: string;
  workSheetNumber: string;
  productLabel: string;
}

/** One column per day across a 16-day window that covers every scheduled run in the data. */
function dayRange(days: string[]): string[] {
  if (days.length === 0) return [];
  const sorted = [...days].sort();
  const start = new Date(sorted[0]);
  const out: string[] = [];
  for (let i = 0; i < 16; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

type PlanningView = 'gantt' | 'calendar';

/** Planificación MVP: Gantt manual + vista de calendario, ambas de solo lectura salvo por la
 *  reasignación manual de una corrida (fecha/máquina/molde) — sin validación automática de
 *  restricciones, solo alertas visuales de doble reserva. */
@Component({
  selector: 'app-planning',
  imports: [FormsModule, NgTemplateOutlet, RouterLink, ...HlmCardImports, ...HlmButtonImports, ...HlmInputImports, ...HlmLabelImports, ...HlmPopoverImports, EntityHeader, EmptyState],
  templateUrl: './planning.html',
})
export class Planning {
  protected readonly productionState = inject(ProductionState);

  protected readonly machines = computed(() => this.productionState.machines());
  protected readonly view = signal<PlanningView>('gantt');

  private readonly runCells = computed<RunCell[]>(() =>
    this.productionState.workSheets().flatMap((ws) =>
      ws.lines.flatMap((line) =>
        line.runs
          .filter((r) => r.status !== 'cancelled')
          .map((run) => ({
            run,
            workSheetId: ws.id,
            lineId: line.id,
            workSheetNumber: ws.number,
            productLabel: this.productionState.products().find((p) => p.id === line.productId)?.code ?? line.productId,
          })),
      ),
    ),
  );

  protected readonly days = computed(() => dayRange(this.runCells().map((c) => c.run.scheduledStart.slice(0, 10))));

  protected cellsFor(machineId: string, day: string): RunCell[] {
    return this.runCells().filter((c) => c.run.machineId === machineId && c.run.scheduledStart.slice(0, 10) <= day && c.run.scheduledEnd.slice(0, 10) >= day);
  }

  /** Purely visual overbooking flag — a machine with more than one run scheduled the same day. Never blocking. */
  protected isDoubleBooked(machineId: string, day: string): boolean {
    return this.cellsFor(machineId, day).length > 1;
  }

  // --- Vista calendario ------------------------------------------------------

  /** Every run whose scheduled window touches `day`, across all machines — the calendar cell's chips. */
  protected cellsForDay(day: string): RunCell[] {
    return this.runCells().filter((c) => c.run.scheduledStart.slice(0, 10) <= day && c.run.scheduledEnd.slice(0, 10) >= day);
  }

  /** Visual double-booking alert per day (any machine with 2+ runs that day), for the calendar cell. */
  protected dayHasDoubleBooking(day: string): boolean {
    return this.machines().some((m) => this.isDoubleBooked(m.id, day));
  }

  // --- Reasignar corrida (Gantt y calendario) --------------------------------

  protected readonly reassignRun = signal<RunCell | null>(null);
  protected readonly reassignStart = signal('');
  protected readonly reassignEnd = signal('');
  protected readonly reassignMachineId = signal('');
  protected readonly reassignMoldId = signal('');

  protected openReassign(cell: RunCell): void {
    this.reassignRun.set(cell);
    this.reassignStart.set(cell.run.scheduledStart);
    this.reassignEnd.set(cell.run.scheduledEnd);
    this.reassignMachineId.set(cell.run.machineId ?? '');
    this.reassignMoldId.set(cell.run.moldId ?? '');
  }

  protected confirmReassign(): void {
    const cell = this.reassignRun();
    if (!cell) return;
    this.productionState.rescheduleRun(cell.workSheetId, cell.lineId, cell.run.id, {
      scheduledStart: this.reassignStart(),
      scheduledEnd: this.reassignEnd(),
      machineId: this.reassignMachineId() || undefined,
      moldId: this.reassignMoldId() || undefined,
    });
    toast.success(`Corrida ${cell.run.id} reprogramada`);
    this.reassignRun.set(null);
  }
}
