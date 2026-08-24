import { Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_CATALOG } from '../app-catalog';

/** Grid of the 8 Apps, opened from the topbar trigger (Google/M365/Odoo-style app switcher). */
@Component({
  selector: 'app-app-launcher',
  imports: [RouterLink],
  templateUrl: './app-launcher.html',
})
export class AppLauncher {
  protected readonly apps = APP_CATALOG.filter((app) => !app.hidden);

  readonly close = output<void>();
}
