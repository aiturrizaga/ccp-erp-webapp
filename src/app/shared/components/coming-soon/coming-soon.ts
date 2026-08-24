import { Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

/** Full-page placeholder for routes/Apps present in the navigation but not built in this phase.
 *  `icon` accepts either a Tabler icon name (e.g. "tablerClockHour4") or, for the four still-unbuilt
 *  Apps (Ventas/CRM/Facturación/Finanzas), the same emoji shown for that App in the App Launcher. */
@Component({
  selector: 'app-coming-soon',
  imports: [NgIcon],
  templateUrl: './coming-soon.html',
})
export class ComingSoon {
  readonly title = input.required<string>();
  readonly description = input('Esta sección está planificada y aparecerá aquí en una próxima iteración del prototipo.');
  readonly icon = input('tablerClockHour4');

  protected readonly isTablerIcon = computed(() => this.icon().startsWith('tabler'));
}
