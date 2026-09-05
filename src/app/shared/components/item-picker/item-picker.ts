import { Component, ElementRef, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { HlmInputImports } from '@ui/input';
import { Item } from '@core/models';

/**
 * Compact search box for picking an Almacén `Item` by código/descripción — used anywhere Producción's
 * forms need to reference an item (Producto.itemId, BOM component/substitute, corrida material
 * consumido) instead of building a bespoke picker per screen. Modeled after `ProductPicker`'s
 * typeahead + keyboard nav, simplified (no category chips) since items don't share that taxonomy.
 */
@Component({
  selector: 'app-item-picker',
  imports: [FormsModule, NgIcon, ...HlmInputImports],
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
        @if (selectedItem()) {
          <button type="button" class="text-muted-foreground hover:text-foreground absolute end-2.5 top-1/2 -translate-y-1/2" (click)="clear()" aria-label="Quitar artículo">
            <ng-icon name="tablerX" size="15" />
          </button>
        }
      </div>

      @if (open() && results().length) {
        <ul #list class="bg-popover absolute z-30 mt-1.5 max-h-72 w-full overflow-auto rounded-md border p-1 shadow-lg">
          @for (it of results(); track it.id; let i = $index) {
            <li>
              <button
                type="button"
                class="flex w-full flex-col items-start gap-0.5 rounded px-2.5 py-1.5 text-start"
                [class.bg-muted]="i === activeIndex()"
                (mouseenter)="activeIndex.set(i)"
                (click)="pick(it)"
              >
                <span class="text-sm font-medium">{{ it.code }} — {{ it.description }}</span>
                <span class="text-muted-foreground text-[11px]">{{ it.unitOfMeasure }} · {{ it.group }}</span>
              </button>
            </li>
          }
        </ul>
      } @else if (open() && query().trim().length) {
        <div class="bg-popover text-muted-foreground absolute z-30 mt-1.5 w-full rounded-md border px-3 py-2 text-xs shadow-lg">Sin resultados para "{{ query() }}".</div>
      }
    </div>
  `,
})
export class ItemPicker {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly list = viewChild<ElementRef<HTMLUListElement>>('list');

  readonly items = input.required<Item[]>();
  readonly value = input<string>('');
  readonly placeholder = input('Buscar artículo por código o descripción…');

  readonly picked = output<Item>();
  readonly cleared = output<void>();

  protected readonly query = signal('');
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(0);

  protected readonly selectedItem = computed(() => this.items().find((i) => i.id === this.value()) ?? null);

  protected readonly results = computed(() => {
    const terms = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return this.items().slice(0, 12);
    return this.items()
      .filter((i) => {
        const hay = `${i.code} ${i.description}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      })
      .slice(0, 12);
  });

  constructor() {
    effect(() => {
      const it = this.selectedItem();
      if (it) this.query.set(`${it.code} — ${it.description}`);
    });
    effect(() => {
      const max = this.results().length - 1;
      if (this.activeIndex() > max) this.activeIndex.set(Math.max(0, max));
    });
  }

  protected onQueryChange(v: string): void {
    this.query.set(v);
    this.open.set(true);
    this.activeIndex.set(0);
    if (!v.trim() && this.value()) this.cleared.emit();
  }

  protected move(delta: number): void {
    if (!this.open()) {
      this.open.set(true);
      return;
    }
    const count = this.results().length;
    if (!count) return;
    this.activeIndex.set((this.activeIndex() + delta + count) % count);
    queueMicrotask(() => {
      const el = this.list()?.nativeElement.children[this.activeIndex()] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    });
  }

  protected pick(it: Item): void {
    this.picked.emit(it);
    this.query.set(`${it.code} — ${it.description}`);
    this.activeIndex.set(0);
    this.open.set(false);
  }

  protected pickActive(): void {
    const res = this.results();
    const it = res[this.activeIndex()] ?? res[0];
    if (it) this.pick(it);
  }

  protected clear(): void {
    this.query.set('');
    this.open.set(false);
    this.cleared.emit();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }
}
