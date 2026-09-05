import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HlmCardImports } from '@ui/card';
import { HlmButtonImports } from '@ui/button';
import { HlmInputImports } from '@ui/input';
import { HlmLabelImports } from '@ui/label';
import { HlmPopoverImports } from '@ui/popover';
import { HlmDialogImports } from '@ui/dialog';
import { HlmCheckboxImports } from '@ui/checkbox';
import { NgIcon } from '@ng-icons/core';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { toast } from '@shared/toast';
import { ManufacturingRun, SALES_ORDER_STATUS_LABEL } from '@core/models';
import { salesOrders } from '../../sales/sales-state';
import { ProductionState } from '../production-state';

interface RunCell {
  run: ManufacturingRun;
  workSheetId: string;
  lineId: string;
  workSheetNumber: string;
  salesOrderNumber: string;
  customerName: string;
  productLabel: string;
}

type PlanningView = 'gantt' | 'calendar';

function isoDay(value: string): string {
  return value.slice(0, 10);
}

function eachDay(from: string, to: string): string[] {
  if (!from || !to || from > to) return [];
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const out: string[] = [];
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
    if (out.length >= 370) break;
  }
  return out;
}

@Component({
  selector: 'app-planning',
  imports: [FormsModule, NgTemplateOutlet, RouterLink, ...HlmCardImports, ...HlmButtonImports, ...HlmInputImports, ...HlmLabelImports, ...HlmPopoverImports, ...HlmDialogImports, ...HlmCheckboxImports, NgIcon, EntityHeader, EmptyState],
  templateUrl: './planning.html',
})
export class Planning {
  protected readonly productionState = inject(ProductionState);
  protected readonly machines = computed(() => this.productionState.machines());
  protected readonly view = signal<PlanningView>('gantt');

  // Filtros de negocio. Se aplican al presionar Buscar para que el usuario pueda completar
  // varios criterios antes de refrescar el tablero.
  protected readonly draftCustomer = signal('');
  protected readonly draftWorkSheet = signal('');
  protected readonly draftMonth = signal('');
  protected readonly draftFrom = signal('');
  protected readonly draftTo = signal('');

  protected readonly filterCustomer = signal('');
  protected readonly filterWorkSheet = signal('');
  protected readonly filterFrom = signal('');
  protected readonly filterTo = signal('');


  // Selección de pedidos desde modal.
  protected readonly selectedOrderIds = signal<Set<string>>(new Set());
  protected readonly orderModalSearch = signal('');

  // Pedidos que realmente tienen una HT existente en Producción.
  protected readonly ordersWithWorkSheet = computed(() => {
    const workSheets = this.productionState.workSheets();

    return salesOrders()
      .map((order) => {
        const workSheet = workSheets.find((ws) =>
          ws.id === order.workSheetId ||
          ws.salesOrderId === order.id ||
          ws.salesOrderNumber === order.number
        );

        return workSheet ? { order, workSheet } : null;
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  });

  // En Planificación solo aparecen empresas que tienen Pedido + HT.
  protected readonly customerOptions = computed(() =>
    [...new Set(this.ordersWithWorkSheet().map((row) => row.order.customerName).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
  );

  // Modal de pedidos: únicamente pedidos que tienen HT.
  protected readonly ordersForPlanning = computed(() => {
    const customer = this.draftCustomer().trim().toLowerCase();
    const term = this.orderModalSearch().trim().toLowerCase();

    return this.ordersWithWorkSheet().filter(({ order, workSheet }) => {
      if (customer && order.customerName.toLowerCase() !== customer) return false;

      if (
        term &&
        !order.number.toLowerCase().includes(term) &&
        !order.customerName.toLowerCase().includes(term) &&
        !workSheet.number.toLowerCase().includes(term)
      ) return false;

      return true;
    });
  });

  protected readonly allVisibleOrdersSelected = computed(() => {
    const rows = this.ordersForPlanning();
    return rows.length > 0 && rows.every(({ order }) => this.selectedOrderIds().has(order.id));
  });

  protected toggleOrder(orderId: string): void {
    this.selectedOrderIds.update((current) => {
      const next = new Set(current);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  }

  protected toggleAllOrders(): void {
    const rows = this.ordersForPlanning();
    const remove = rows.length > 0 && rows.every(({ order }) => this.selectedOrderIds().has(order.id));
    this.selectedOrderIds.update((current) => {
      const next = new Set(current);
      rows.forEach(({ order }) => remove ? next.delete(order.id) : next.add(order.id));
      return next;
    });
  }

  protected clearSelectedOrders(): void {
    this.selectedOrderIds.set(new Set());
  }

  protected orderStatusLabel(status: string): string {
    return SALES_ORDER_STATUS_LABEL[status as keyof typeof SALES_ORDER_STATUS_LABEL] ?? status;
  }

  private readonly allRunCells = computed<RunCell[]>(() =>
    this.productionState.workSheets().flatMap((ws) =>
      ws.lines.flatMap((line) =>
        line.runs
          .filter((r) => r.status !== 'cancelled')
          .map((run) => ({
            run,
            workSheetId: ws.id,
            lineId: line.id,
            workSheetNumber: ws.number,
            salesOrderNumber: ws.salesOrderNumber ?? '',
            customerName: ws.customerName ?? '',
            productLabel: this.productionState.products().find((p) => p.id === line.productId)?.code ?? line.productId,
          })),
      ),
    ),
  );


  protected readonly runCells = computed(() => {
    const selectedOrderNumbers = new Set(salesOrders().filter((o) => this.selectedOrderIds().has(o.id)).map((o) => o.number));
    const customer = this.filterCustomer().trim().toLowerCase();
    const ws = this.filterWorkSheet().trim().toLowerCase();
    const from = this.filterFrom();
    const to = this.filterTo();

    return this.allRunCells().filter((cell) => {
      if (selectedOrderNumbers.size > 0 && !selectedOrderNumbers.has(cell.salesOrderNumber)) return false;
      if (customer && !cell.customerName.toLowerCase().includes(customer)) return false;
      if (ws && !cell.workSheetNumber.toLowerCase().includes(ws)) return false;

      const start = isoDay(cell.run.scheduledStart);
      const end = isoDay(cell.run.scheduledEnd);
      // Una corrida se muestra si su ventana toca el rango consultado.
      if (from && end < from) return false;
      if (to && start > to) return false;
      return true;
    });
  });

  protected readonly days = computed(() => {
    const cells = this.runCells();
    if (!cells.length) return [];
    const starts = cells.map((c) => isoDay(c.run.scheduledStart)).sort();
    const ends = cells.map((c) => isoDay(c.run.scheduledEnd)).sort();
    const from = this.filterFrom() || starts[0];
    const to = this.filterTo() || ends[ends.length - 1];
    return eachDay(from, to);
  });

  protected readonly resultSummary = computed(() => {
    const cells = this.runCells();
    return {
      runs: cells.length,
      workSheets: new Set(cells.map((c) => c.workSheetId)).size,
      orders: new Set(cells.map((c) => c.salesOrderNumber).filter(Boolean)).size,
      customers: new Set(cells.map((c) => c.customerName).filter(Boolean)).size,
    };
  });

  protected applyMonth(month: string): void {
    this.draftMonth.set(month);
    if (!month) return;
    const [year, m] = month.split('-').map(Number);
    const last = new Date(year, m, 0).getDate();
    this.draftFrom.set(`${month}-01`);
    this.draftTo.set(`${month}-${String(last).padStart(2, '0')}`);
  }

  protected search(): void {
    if (this.draftFrom() && this.draftTo() && this.draftFrom() > this.draftTo()) {
      toast.error('La fecha desde no puede ser mayor que la fecha hasta.');
      return;
    }
    this.filterCustomer.set(this.draftCustomer());
    this.filterWorkSheet.set(this.draftWorkSheet());
    this.filterFrom.set(this.draftFrom());
    this.filterTo.set(this.draftTo());
  }

  protected clearFilters(): void {
    this.draftCustomer.set('');
    this.draftWorkSheet.set('');
    this.draftMonth.set('');
    this.draftFrom.set('');
    this.draftTo.set('');
    this.filterCustomer.set('');
    this.filterWorkSheet.set('');
    this.filterFrom.set('');
    this.filterTo.set('');
    this.clearSelectedOrders();
    this.orderModalSearch.set('');
  }

  protected cellsFor(machineId: string, day: string): RunCell[] {
    return this.runCells().filter((c) => c.run.machineId === machineId && isoDay(c.run.scheduledStart) <= day && isoDay(c.run.scheduledEnd) >= day);
  }

  protected isDoubleBooked(machineId: string, day: string): boolean {
    return this.cellsFor(machineId, day).length > 1;
  }

  protected cellsForDay(day: string): RunCell[] {
    return this.runCells().filter((c) => isoDay(c.run.scheduledStart) <= day && isoDay(c.run.scheduledEnd) >= day);
  }

  protected dayHasDoubleBooking(day: string): boolean {
    return this.machines().some((m) => this.isDoubleBooked(m.id, day));
  }

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
