import { Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

export type OrderTimelineKind = 'quotation' | 'order' | 'advance' | 'work_sheet' | 'release' | 'dispatch' | 'guide' | 'invoice' | 'claim' | 'other';

export interface OrderTimelineEvent {
  date: string;
  kind: OrderTimelineKind;
  title: string;
  detail?: string;
  user?: string;
}

const KIND_ICONS: Record<OrderTimelineKind, string> = {
  quotation: 'tablerFileText',
  order: 'tablerShoppingCart',
  advance: 'tablerCashBanknote',
  work_sheet: 'tablerClipboardText',
  release: 'tablerTruckDelivery',
  dispatch: 'tablerPackage',
  guide: 'tablerRoute',
  invoice: 'tablerReceipt2',
  claim: 'tablerAlertTriangle',
  other: 'tablerDots',
};

/** Línea de tiempo cronológica de los movimientos de una orden de pedido. */
@Component({
  selector: 'app-order-timeline',
  imports: [NgIcon],
  template: `
    <ol class="relative ml-2 border-l pl-6">
      @for (event of events(); track $index) {
        <li class="relative pb-5 last:pb-0">
          <span class="bg-primary/10 text-primary absolute -left-[29px] flex size-6 items-center justify-center rounded-full border">
            <ng-icon [name]="icon(event.kind)" size="13" />
          </span>
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-sm font-medium">{{ event.title }}</p>
              @if (event.detail) { <p class="text-muted-foreground mt-0.5 text-xs">{{ event.detail }}</p> }
              @if (event.user) { <p class="text-muted-foreground mt-0.5 text-xs">por {{ event.user }}</p> }
            </div>
            <span class="text-muted-foreground whitespace-nowrap text-xs">{{ event.date }}</span>
          </div>
        </li>
      } @empty {
        <li class="text-muted-foreground py-6 text-center text-sm">Sin movimientos registrados para esta orden.</li>
      }
    </ol>
  `,
})
export class OrderTimelineComponent {
  readonly events = input.required<OrderTimelineEvent[]>();

  protected icon(kind: OrderTimelineKind): string {
    return KIND_ICONS[kind];
  }
}