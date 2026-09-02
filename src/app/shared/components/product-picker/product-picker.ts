import { Component, ElementRef, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { HlmInputImports } from '@ui/input';
import { SALES_CATEGORY_LABEL, SalesCategory, SalesProduct, formatSalesProductName } from '@core/models';

type CategoryFilter = 'all' | SalesCategory;

/**
 * Combined search box for finding a `SalesProduct`: free-text typeahead (name, código, dimensión,
 * espec) plus one-click category filters, all in the same control, with ↑/↓ + Enter keyboard
 * navigation over the results. Emits the chosen product.
 */
@Component({
  selector: 'app-product-picker',
  imports: [FormsModule, DecimalPipe, NgIcon, ...HlmInputImports],
  host: { '(document:click)': 'onDocumentClick($event)' },
  template: `
    <div class="relative">
      <div class="relative">
        <ng-icon name="tablerSearch" size="16" class="text-muted-foreground pointer-events-none absolute start-3 top-1/2 -translate-y-1/2" />
        <input
          #searchInput
          hlmInput
          type="text"
          class="w-full ps-9 pe-9"
          role="combobox"
          [attr.aria-expanded]="open()"
          [placeholder]="placeholder()"
          [ngModel]="query()"
          (ngModelChange)="onQueryChange($event)"
          (focus)="open.set(true)"
          (keydown.arrowDown)="move(1); $event.preventDefault()"
          (keydown.arrowUp)="move(-1); $event.preventDefault()"
          (keydown.enter)="pickActive(); $event.preventDefault()"
          (keydown.escape)="open.set(false)"
        />
        @if (selectedProduct()) {
          <button type="button" class="text-muted-foreground hover:text-foreground absolute end-2.5 top-1/2 -translate-y-1/2" (click)="clear()" aria-label="Quitar producto">
            <ng-icon name="tablerX" size="15" />
          </button>
        }
      </div>

      @if (!compact() || open()) {
        <div class="mt-1.5 flex flex-wrap gap-1">
          @for (c of categoryChips; track c.value) {
            <button
              type="button"
              class="rounded-full border px-2 py-0.5 text-[11px] transition-colors"
              [class.bg-primary]="category() === c.value"
              [class.text-primary-foreground]="category() === c.value"
              [class.border-primary]="category() === c.value"
              [class.text-muted-foreground]="category() !== c.value"
              (click)="setCategory(c.value)"
            >
              {{ c.label }}
            </button>
          }
        </div>
      }

      @if (open() && (results().length || (allowFreeText() && query().trim().length))) {
        <ul #list class="bg-popover absolute z-30 mt-1.5 max-h-72 w-full overflow-auto rounded-md border p-1 shadow-lg">
          @for (p of results(); track p.id; let i = $index) {
            <li>
              <button
                type="button"
                class="flex w-full flex-col items-start gap-0.5 rounded px-2.5 py-1.5 text-start"
                [class.bg-muted]="i === activeIndex()"
                (mouseenter)="activeIndex.set(i)"
                (click)="pick(p)"
              >
                <span class="text-sm font-medium">{{ fullName(p) }}</span>
                <span class="text-muted-foreground text-[11px]">
                  {{ categoryLabel(p.category) }} · {{ p.legacyCode }} · banda s/IGV {{ p.currency }} {{ p.costBand.min | number: '1.2-2' }}–{{ p.costBand.max | number: '1.2-2' }}
                </span>
              </button>
            </li>
          }
          @if (allowFreeText() && query().trim().length) {
            <li class="mt-1 border-t pt-1">
              <button
                type="button"
                class="flex w-full items-center gap-1.5 rounded px-2.5 py-1.5 text-start text-xs"
                [class.bg-muted]="activeIndex() >= results().length"
                (mouseenter)="activeIndex.set(results().length)"
                (click)="useFreeText()"
              >
                <ng-icon name="tablerPencil" size="13" />
                Usar «{{ query().trim() }}» como texto libre
              </button>
            </li>
          }
        </ul>
      } @else if (open() && query().trim().length) {
        <div class="bg-popover text-muted-foreground absolute z-30 mt-1.5 w-full rounded-md border px-3 py-2 text-xs shadow-lg">
          Sin resultados para "{{ query() }}".
        </div>
      }
    </div>
  `,
})
export class ProductPicker {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly list = viewChild<ElementRef<HTMLUListElement>>('list');

  readonly products = input.required<SalesProduct[]>();
  /** Selected product id, so the parent can reset/edit the row (single-select mode). */
  readonly value = input<string>('');
  /** Seeds the text box on first render (e.g. an existing free-text line description). */
  readonly initialText = input<string>('');
  /** When true, the box empties itself after each pick so the user can add the next item right away. */
  readonly resetAfterPick = input(false);
  /** Allow the typed text to be used as-is (a line that isn't a catalog product). */
  readonly allowFreeText = input(false);
  /** Hide the category chip row unless the box is focused — keeps table rows short. */
  readonly compact = input(false);
  readonly placeholder = input('Buscar producto por nombre, código o dimensión…');

  readonly picked = output<SalesProduct>();
  readonly freeText = output<string>();
  readonly cleared = output<void>();

  protected readonly query = signal('');
  protected readonly category = signal<CategoryFilter>('all');
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(0);

  protected readonly categoryChips: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'POSTES', label: SALES_CATEGORY_LABEL.POSTES },
    { value: 'FIERRO', label: SALES_CATEGORY_LABEL.FIERRO },
    { value: 'ACCESORIOS', label: SALES_CATEGORY_LABEL.ACCESORIOS },
  ];

  protected readonly selectedProduct = computed(() => this.products().find((p) => p.id === this.value()) ?? null);

  protected readonly results = computed(() => {
    const terms = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    const cat = this.category();
    return this.products()
      .filter((p) => cat === 'all' || p.category === cat)
      .filter((p) => {
        if (!terms.length) return true;
        const hay = `${formatSalesProductName(p)} ${p.legacyCode}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      })
      .slice(0, 12);
  });

  private seeded = false;

  constructor() {
    // Seed the box once from an existing line's text (free-text or otherwise).
    effect(() => {
      const t = this.initialText();
      if (!this.seeded && t) {
        this.seeded = true;
        this.query.set(t);
      }
    });

    // Single-select mode: keep the text box in sync when the parent sets/clears the selected product.
    effect(() => {
      if (this.resetAfterPick()) return;
      const p = this.selectedProduct();
      if (p) this.query.set(formatSalesProductName(p));
    });

    // Keep the highlighted row valid and scrolled into view as the result set changes.
    effect(() => {
      const max = this.navCount() - 1;
      if (this.activeIndex() > max) this.activeIndex.set(Math.max(0, max));
      this.scrollActiveIntoView();
    });
  }

  protected fullName = (p: SalesProduct) => formatSalesProductName(p);
  protected categoryLabel = (c: SalesCategory) => SALES_CATEGORY_LABEL[c];

  protected onQueryChange(v: string): void {
    this.query.set(v);
    this.open.set(true);
    this.activeIndex.set(0);
    if (!v.trim() && this.value()) this.cleared.emit();
  }

  /** Picking a category returns focus to the input and re-filters with whatever is already typed. */
  protected setCategory(c: CategoryFilter): void {
    this.category.set(c);
    this.open.set(true);
    this.activeIndex.set(0);
    this.focusInput();
  }

  /** Number of keyboard-navigable rows: products + the optional "usar como texto libre" row. */
  private navCount(): number {
    return this.results().length + (this.allowFreeText() && this.query().trim() ? 1 : 0);
  }

  protected move(delta: number): void {
    if (!this.open()) {
      this.open.set(true);
      return;
    }
    const count = this.navCount();
    if (!count) return;
    this.activeIndex.set((this.activeIndex() + delta + count) % count);
    this.scrollActiveIntoView();
  }

  protected pick(p: SalesProduct): void {
    this.picked.emit(p);
    if (this.resetAfterPick()) {
      this.query.set('');
    } else {
      this.query.set(formatSalesProductName(p));
    }
    this.category.set('all');
    this.activeIndex.set(0);
    this.open.set(false);
    if (this.resetAfterPick()) this.focusInput();
  }

  protected pickActive(): void {
    const res = this.results();
    // The synthetic "usar como texto libre" row sits just past the last product.
    if (this.allowFreeText() && this.query().trim() && (this.activeIndex() >= res.length || !res.length)) {
      this.useFreeText();
      return;
    }
    const p = res[this.activeIndex()] ?? res[0];
    if (p) this.pick(p);
  }

  protected useFreeText(): void {
    const text = this.query().trim();
    if (!text) return;
    this.freeText.emit(text);
    if (this.resetAfterPick()) {
      this.query.set('');
      this.focusInput();
    }
    this.category.set('all');
    this.activeIndex.set(0);
    this.open.set(false);
  }

  protected clear(): void {
    this.query.set('');
    this.category.set('all');
    this.open.set(false);
    this.cleared.emit();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  private focusInput(): void {
    queueMicrotask(() => this.searchInput()?.nativeElement.focus());
  }

  private scrollActiveIntoView(): void {
    queueMicrotask(() => {
      const el = this.list()?.nativeElement.children[this.activeIndex()] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    });
  }
}
