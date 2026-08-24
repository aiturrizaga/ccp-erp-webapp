import { Component, TemplateRef, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HlmTableImports } from '@ui/table';

export interface DataTableColumn {
  key: string;
  header: string;
  align?: 'start' | 'end' | 'center';
  width?: string;
  /** Consecutive columns sharing the same groupLabel render under one spanning header cell (e.g. "Estadísticas" over Jun/Jul/Ago). Columns without it keep the single-row header untouched. */
  groupLabel?: string;
}

interface DataTableHeaderGroup {
  label: string | null;
  columns: DataTableColumn[];
  startIndex: number;
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
  /** Caps the table body height and makes the header sticky within it — lets a long list scroll internally instead of the whole page. */
  readonly maxHeight = input<string>();
  /** Number of leading columns (by declaration order) to pin in place during horizontal scroll. Those columns must all declare a pixel `width` for the offsets to line up. */
  readonly frozenColumnCount = input(0);
  /** When true, columns keep their declared widths (growing the table past the container and scrolling horizontally) instead of shrinking to fit — use when there are too many columns to compact without hurting legibility. */
  readonly naturalWidth = input(false);

  readonly rowClick = output<T>();

  protected readonly headerGroups = computed<DataTableHeaderGroup[]>(() => {
    const groups: DataTableHeaderGroup[] = [];
    let index = 0;
    for (const col of this.columns()) {
      const label = col.groupLabel ?? null;
      const last = groups[groups.length - 1];
      if (label !== null && last?.label === label) {
        last.columns.push(col);
      } else {
        groups.push({ label, columns: [col], startIndex: index });
      }
      index++;
    }
    return groups;
  });

  protected readonly hasGroupedHeaders = computed(() => this.columns().some((c) => c.groupLabel));

  protected readonly totalNaturalWidth = computed(() => {
    const total = this.columns().reduce((sum, col) => sum + (parseInt(col.width ?? '', 10) || 0), 0);
    return total > 0 ? `${total}px` : null;
  });

  protected readonly frozenOffsets = computed<number[]>(() => {
    const offsets: number[] = [];
    let acc = 0;
    for (const col of this.columns()) {
      offsets.push(acc);
      acc += parseInt(col.width ?? '', 10) || 0;
    }
    return offsets;
  });

  protected isFrozen(index: number): boolean {
    return index < this.frozenColumnCount();
  }

  protected frozenLeft(index: number): string | null {
    return this.isFrozen(index) ? `${this.frozenOffsets()[index]}px` : null;
  }

  protected isLastFrozen(index: number): boolean {
    return index === this.frozenColumnCount() - 1;
  }

  /** Frozen + sticky-header cells sit above plain sticky-header cells, which sit above plain frozen cells. */
  protected headerZIndex(index: number): number | null {
    const frozen = this.isFrozen(index);
    const stickyHeader = !!this.maxHeight();
    if (frozen && stickyHeader) return 30;
    if (frozen || stickyHeader) return 20;
    return null;
  }

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
