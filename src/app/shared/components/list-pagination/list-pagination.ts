import { Component, computed, input, model } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { SelectFilter, SelectFilterOption } from '../select-filter/select-filter';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50];

/** Page-size select + prev/next controls, driven purely by total item count — the caller slices its own rows. */
@Component({
  selector: 'app-list-pagination',
  imports: [NgIcon, ...HlmButtonImports, SelectFilter],
  templateUrl: './list-pagination.html',
})
export class ListPagination {
  readonly total = input.required<number>();
  readonly page = model(1);
  readonly pageSize = model(10);
  readonly pageSizeOptions = input<number[]>(DEFAULT_PAGE_SIZE_OPTIONS);

  protected readonly pageSizeSelectOptions = computed<SelectFilterOption[]>(() =>
    this.pageSizeOptions().map((size) => ({ value: String(size), label: `${size} por página` })),
  );
  protected readonly pageSizeValue = computed(() => String(this.pageSize()));

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  protected readonly rangeStart = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1));
  protected readonly rangeEnd = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  protected setPageSize(value: string): void {
    this.pageSize.set(Number(value));
    this.page.set(1);
  }

  protected goTo(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.pageCount()));
  }
}
