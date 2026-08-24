import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmCardImports } from '@ui/card';
import { HlmButtonImports } from '@ui/button';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { EmptyState } from '@shared/components/empty-state/empty-state';
import { OUTPUT_BUNDLES, WORK_SHEETS, ITEMS, STOCK_LOTS } from '@core/mock-data';
import { OutputBundleStatus, OUTPUT_BUNDLE_STATUS_LABEL, Tone } from '@core/models';

const STATUS_TONE: Record<OutputBundleStatus, Tone> = {
  preparing: 'neutral',
  lot_selected: 'info',
  signed: 'warning',
  dispatched: 'success',
};

@Component({
  selector: 'app-output-bundle-detail',
  imports: [RouterLink, NgIcon, ...HlmCardImports, ...HlmButtonImports, EntityHeader, StatusBadge, EmptyState],
  templateUrl: './output-bundle-detail.html',
})
export class OutputBundleDetail {
  readonly id = input.required<string>();

  protected readonly bundle = computed(() => OUTPUT_BUNDLES.find((b) => b.id === this.id()));
  protected readonly workSheets = computed(() => WORK_SHEETS.filter((ws) => this.bundle()?.workSheetIds.includes(ws.id)));

  protected itemLabel(itemId: string): string {
    const item = ITEMS.find((i) => i.id === itemId);
    return item ? `${item.code} — ${item.description}` : itemId;
  }

  protected lotCode(lotId: string): string {
    return STOCK_LOTS.find((l) => l.id === lotId)?.lot ?? lotId;
  }

  protected statusLabel(status: OutputBundleStatus): string {
    return OUTPUT_BUNDLE_STATUS_LABEL[status];
  }

  protected statusTone(status: OutputBundleStatus): Tone {
    return STATUS_TONE[status];
  }
}
