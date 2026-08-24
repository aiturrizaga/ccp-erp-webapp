import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmInputImports } from '@ui/input';
import { HlmBadgeImports } from '@ui/badge';
import { HlmPopoverImports } from '@ui/popover';
import { ListViewOption, ListViewType } from '@shared/models/list-view.model';
import { SelectFilter, SelectFilterOption } from '../select-filter/select-filter';

/** Standardized toolbar for list screens: search, filters, group-by, view switcher, primary/secondary actions.
 *  Filters and secondary-actions content is projected in (each screen defines its own fields/actions) and shown
 *  inside a popover — not a CdkMenu-based dropdown, since content projected across components loses the
 *  logical injector chain a `CdkMenu` ancestor would otherwise provide to `hlmDropdownMenuItem` children.
 *  Set `hasFilters`/`hasSecondaryActions` to reveal their triggers once content is provided. */
@Component({
  selector: 'app-list-toolbar',
  imports: [FormsModule, NgIcon, ...HlmButtonImports, ...HlmInputImports, ...HlmBadgeImports, ...HlmPopoverImports, SelectFilter],
  templateUrl: './list-toolbar.html',
})
export class ListToolbar {
  readonly search = model('');
  readonly searchPlaceholder = input('Buscar...');

  readonly views = input<ListViewOption[]>([]);
  readonly view = model<ListViewType>('list');

  readonly groupByOptions = input<SelectFilterOption[]>([]);
  readonly groupBy = model('none');

  readonly hasFilters = input(false);
  readonly filterCount = input(0);

  readonly hasSecondaryActions = input(false);

  readonly actionLabel = input<string>();
  readonly action = output<void>();
}
