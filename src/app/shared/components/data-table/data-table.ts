import { Component, TemplateRef, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HlmTableImports } from '@ui/table';

export interface DataTableColumn {
  key: string;
  header: string;
  align?: 'start' | 'end' | 'center';
  width?: string;
}

/** Generic list table reused across every App — columns/rows in, optional custom cell + row-actions templates. */
@Component({
  selector: 'app-data-table',
  imports: [...HlmTableImports, NgTemplateOutlet],
  templateUrl: './data-table.html',
  // `block min-w-0` keeps this component well-behaved as a flex/grid item — without it, the table's
  // intrinsic content width forces the item (and its ancestor container) wider than the viewport
  // instead of scrolling locally inside `hlmTableContainer`.
  host: { class: 'block min-w-0 w-full' },
})
export class DataTable<T> {
  readonly columns = input.required<DataTableColumn[]>();
  readonly rows = input.required<T[]>();
  readonly cellTemplate = input<TemplateRef<{ $implicit: T; key: string }>>();
  readonly actionsTemplate = input<TemplateRef<{ $implicit: T }>>();
  readonly emptyMessage = input('Sin registros');
  readonly rowClickable = input(false);

  readonly rowClick = output<T>();

  protected onRowClick(row: T): void {
    if (this.rowClickable()) this.rowClick.emit(row);
  }

  protected cellValue(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }

  protected alignClass(align: DataTableColumn['align']): string {
    return align === 'end' ? 'text-end' : align === 'center' ? 'text-center' : '';
  }
}
