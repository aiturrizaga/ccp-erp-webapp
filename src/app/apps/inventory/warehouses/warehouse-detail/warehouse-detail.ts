import { Component, computed, input } from '@angular/core';
import { HlmCardImports } from '@ui/card';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { WAREHOUSES } from '@core/mock-data';
import { LOCATION_TYPE_LABEL, LocationType, Tone } from '@core/models';

const LOCATION_TYPE_TONE: Record<LocationType, Tone> = {
  receiving: 'info',
  storage: 'neutral',
  production: 'warning',
  quarantine: 'danger',
  claims: 'danger',
  dispatch: 'success',
  transit: 'info',
  scrap: 'neutral',
  returns: 'neutral',
};

@Component({
  selector: 'app-warehouse-detail',
  imports: [...HlmCardImports, EntityHeader, StatusBadge, EmptyState],
  templateUrl: './warehouse-detail.html',
})
export class WarehouseDetail {
  readonly id = input.required<string>();

  protected readonly warehouse = computed(() => WAREHOUSES.find((w) => w.id === this.id()));

  protected typeLabel(type: LocationType): string {
    return LOCATION_TYPE_LABEL[type];
  }

  protected typeTone(type: LocationType): Tone {
    return LOCATION_TYPE_TONE[type];
  }
}
