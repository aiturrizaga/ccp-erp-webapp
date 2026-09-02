import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButtonImports } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmInputImports } from '@ui/input';
import { HlmSelectImports } from '@ui/select';
import { NgIcon } from '@ng-icons/core';
import { EntityHeader } from '@shared/components/entity-header/entity-header';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { toast } from '@shared/toast';
import { InvoicingState } from '../invoicing-state';
import { SERIES_DOC_KIND_LABEL, SERIES_ENVIRONMENT_LABEL, SeriesDocKind, SeriesEnvironment } from '@core/models';

@Component({
  selector: 'app-series-list',
  imports: [FormsModule, NgIcon, ...HlmButtonImports, ...HlmCardImports, ...HlmInputImports, ...HlmSelectImports, EntityHeader, StatusBadge],
  templateUrl: './series-list.html',
})
export class SeriesList {
  private readonly state = inject(InvoicingState);
  protected readonly series = this.state.series;

  protected readonly showForm = signal(false);
  protected readonly draft = signal({
    emisorRuc: '20549546626',
    emisorName: 'CONCRETO CENTRIFUGADO PERU S.A.C.',
    docKind: 'factura' as SeriesDocKind,
    series: '',
    lastCorrelativo: 0,
    environment: 'sunat' as SeriesEnvironment,
  });

  protected readonly kindOptions = (Object.keys(SERIES_DOC_KIND_LABEL) as SeriesDocKind[]).map((value) => ({ value, label: SERIES_DOC_KIND_LABEL[value] }));
  protected readonly envOptions = (Object.keys(SERIES_ENVIRONMENT_LABEL) as SeriesEnvironment[]).map((value) => ({ value, label: SERIES_ENVIRONMENT_LABEL[value] }));

  protected kindLabel = (k: SeriesDocKind) => SERIES_DOC_KIND_LABEL[k];
  protected envLabel = (e: SeriesEnvironment) => SERIES_ENVIRONMENT_LABEL[e];
  protected kindToString = (v: string) => SERIES_DOC_KIND_LABEL[v as SeriesDocKind] ?? v;
  protected envToString = (v: string) => SERIES_ENVIRONMENT_LABEL[v as SeriesEnvironment] ?? v;

  protected setDraft(patch: Partial<ReturnType<typeof this.draft>>): void {
    this.draft.update((d) => ({ ...d, ...patch }));
  }

  protected save(): void {
    const d = this.draft();
    if (!d.series.trim()) return;
    this.state.saveSeries({
      id: `DS-${Date.now().toString().slice(-6)}`,
      emisorRuc: d.emisorRuc.trim(),
      emisorName: d.emisorName.trim(),
      docKind: d.docKind,
      series: d.series.trim().toUpperCase(),
      lastCorrelativo: d.lastCorrelativo,
      environment: d.environment,
      active: true,
    });
    toast.success(`Serie ${d.series.toUpperCase()} registrada`);
    this.showForm.set(false);
    this.draft.set({ ...d, series: '', lastCorrelativo: 0 });
  }
}
