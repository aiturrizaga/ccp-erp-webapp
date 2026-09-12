import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { toast } from '@shared/toast';
import { DispatchState } from '../dispatch-state';
import { DispatchCandidate } from '../dispatch.models';

@Component({
  selector: 'app-dispatch-planning',
  imports: [FormsModule, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, StatusBadge],
  templateUrl: './dispatch-planning.html',
})
export class DispatchPlanning {
  protected readonly state = inject(DispatchState);
  protected readonly search = signal('');
  protected readonly plant = signal('Todas');
  protected readonly progress = signal('Todos');
  protected readonly selected = signal<DispatchCandidate | null>(null);
  protected quantity = 0;
  protected dispatchDate = '2026-09-14';
  protected originPlant = '';
  protected transportType: 'Propio' | 'Tercero' | 'Recojo del cliente' = 'Propio';
  protected carrier = 'Flota CCP';
  protected vehiclePlate = '';
  protected driver = '';
  protected destination = '';
  protected comments = '';

  protected readonly plants = computed(() => ['Todas', ...new Set(this.state.candidates().map((row) => row.plant))]);
  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.state.pendingCandidates().filter((row) =>
      (!q || [row.salesOrderNumber, row.workSheetNumber, row.customerOrderNumber, row.customerName, row.productCode, row.productName].some((value) => value.toLowerCase().includes(q))) &&
      (this.plant() === 'Todas' || row.plant === this.plant()) &&
      (this.progress() === 'Todos' || (this.progress() === 'Terminada' ? row.productionProgress === 100 : row.productionProgress < 100)),
    );
  });

  protected available(row: DispatchCandidate): number { return this.state.availableToPlan(row); }
  protected open(row: DispatchCandidate): void {
    this.selected.set(row); this.quantity = this.available(row); this.originPlant = row.plant; this.destination = `Dirección de entrega de ${row.customerName}`;
  }
  protected close(): void { this.selected.set(null); }
  protected save(): void {
    const row = this.selected();
    if (!row || this.quantity <= 0 || this.quantity > this.available(row) || !this.dispatchDate || !this.originPlant || !this.carrier || !this.destination) {
      toast.error('Revisa los datos de la programación', { description: 'Cantidad, fecha, planta, transporte y destino son obligatorios.' }); return;
    }
    const plan = this.state.schedule({ candidateId: row.id, salesOrderNumber: row.salesOrderNumber, workSheetNumber: row.workSheetNumber, customerOrderNumber: row.customerOrderNumber, customerName: row.customerName, productCode: row.productCode, productName: row.productName, quantity: this.quantity, dispatchDate: this.dispatchDate, originPlant: this.originPlant, transportType: this.transportType, carrier: this.carrier, vehiclePlate: this.vehiclePlate || undefined, driver: this.driver || undefined, destination: this.destination, comments: this.comments || undefined });
    toast.success(`${plan.id} programado`, { description: `Salida de ${plan.quantity} UND el ${plan.dispatchDate}.` }); this.close();
  }
}
