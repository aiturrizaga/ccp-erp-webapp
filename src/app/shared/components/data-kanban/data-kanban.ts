import { Component, TemplateRef, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Tone } from '@core/models';
import { StatusBadge } from '../status-badge/status-badge';

export interface KanbanColumn {
  value: string;
  label: string;
  tone?: Tone;
}

/** Board view grouping rows into columns by `groupKey(row)` — the caller supplies the card body via `cardTemplate`. */
@Component({
  selector: 'app-data-kanban',
  imports: [NgTemplateOutlet, StatusBadge],
  templateUrl: './data-kanban.html',
  host: { class: 'block min-w-0 w-full' },
})
export class DataKanban<T> {
  readonly columns = input.required<KanbanColumn[]>();
  readonly rows = input.required<T[]>();
  readonly groupKey = input.required<(row: T) => string>();
  readonly cardTemplate = input.required<TemplateRef<{ $implicit: T }>>();
  readonly rowClickable = input(false);

  readonly rowClick = output<T>();

  protected readonly columnRows = computed(() => {
    const key = this.groupKey();
    const rows = this.rows();
    return this.columns().map((column) => ({
      column,
      rows: rows.filter((row) => key(row) === column.value),
    }));
  });

  protected onRowClick(row: T): void {
    if (this.rowClickable()) this.rowClick.emit(row);
  }
}
