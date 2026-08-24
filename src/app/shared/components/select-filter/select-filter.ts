import { Component, input, model } from '@angular/core';
import { HlmSelectImports } from '@ui/select';

export interface SelectFilterOption {
  value: string;
  label: string;
}

/** Thin wrapper over spartan/ui's select — used for every status/category filter dropdown across the Apps. */
@Component({
  selector: 'app-select-filter',
  imports: [...HlmSelectImports],
  templateUrl: './select-filter.html',
})
export class SelectFilter {
  readonly options = input.required<SelectFilterOption[]>();
  readonly value = model.required<string>();
  readonly placeholder = input('Todos');

  protected readonly itemToString = (value: string): string => {
    return this.options().find((option) => option.value === value)?.label ?? value;
  };
}
