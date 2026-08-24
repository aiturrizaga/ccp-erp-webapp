import { Component, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmInputImports } from '@ui/input';
import { HlmButtonImports } from '@ui/button';

/** Toolbar reused by every list screen: search box + projected filter controls + primary action. */
@Component({
  selector: 'app-data-filters',
  imports: [FormsModule, ...HlmInputImports, ...HlmButtonImports],
  templateUrl: './data-filters.html',
})
export class DataFilters {
  readonly search = model('');
  readonly searchPlaceholder = model('Buscar...');
  readonly actionLabel = model<string | undefined>(undefined);

  readonly action = output<void>();
}
