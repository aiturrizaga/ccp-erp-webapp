import { Component, TemplateRef, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/** Card-grid rendering of a row set — the caller supplies the card body via `cardTemplate`. */
@Component({
  selector: 'app-data-grid',
  imports: [NgTemplateOutlet],
  templateUrl: './data-grid.html',
  host: { class: 'block min-w-0 w-full' },
})
export class DataGrid<T> {
  readonly rows = input.required<T[]>();
  readonly cardTemplate = input.required<TemplateRef<{ $implicit: T }>>();
  readonly emptyMessage = input('Sin registros');
  readonly rowClickable = input(false);

  readonly rowClick = output<T>();

  protected onRowClick(row: T): void {
    if (this.rowClickable()) this.rowClick.emit(row);
  }
}
