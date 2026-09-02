import { Component, computed, input } from '@angular/core';
import { HlmCardImports } from '@ui/card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { WAREHOUSES } from '@core/mock-data';
import { LocationType, LOCATION_TYPE_LABEL } from '@core/models';

@Component({
  selector: 'app-warehouse-detail',
  imports: [...HlmCardImports, EntityHeader, EmptyState],
  templateUrl: './warehouse-detail.html',
})
export class WarehouseDetail {
  readonly id = input.required<string>();

  protected readonly warehouse = computed(() => WAREHOUSES.find((w) => w.id === this.id()));

  protected locationTypeLabel(type: LocationType): string {
    return LOCATION_TYPE_LABEL[type];
  }
}
