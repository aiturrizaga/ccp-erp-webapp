import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { StatCard } from '@shared/components/stat-card/stat-card';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { DispatchState } from '../dispatch-state';
import { FinishedProductStock } from '../dispatch.models';

@Component({
  selector: 'app-finished-stock',
  imports: [FormsModule, DecimalPipe, ...HlmCardImports, ...HlmInputImports, StatCard, StatusBadge],
  templateUrl: './finished-stock.html',
})
export class FinishedStock {
  protected readonly state = inject(DispatchState);
  protected readonly search = signal('');
  protected readonly plant = signal('Todas');
  protected readonly category = signal('Todas');
  protected readonly plants = computed(() => ['Todas', ...new Set(this.state.stock().map((row) => row.plant))]);
  protected readonly rows = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.state.stock().filter((row) => (!q || `${row.productCode} ${row.productName} ${row.custodyCustomer ?? ''}`.toLowerCase().includes(q)) && (this.plant() === 'Todas' || row.plant === this.plant()) && (this.category() === 'Todas' || row.category === this.category()));
  });
  protected readonly produced = computed(() => this.rows().reduce((sum, row) => sum + row.producedQuantity, 0));
  protected readonly scheduled = computed(() => this.rows().reduce((sum, row) => sum + row.scheduledQuantity, 0));
  protected readonly dispatched = computed(() => this.rows().reduce((sum, row) => sum + row.dispatchedQuantity, 0));
  protected readonly availableTotal = computed(() => this.rows().reduce((sum, row) => sum + this.available(row), 0));
  protected available(row: FinishedProductStock): number { return Math.max(0, row.producedQuantity - row.scheduledQuantity - row.dispatchedQuantity); }
}
