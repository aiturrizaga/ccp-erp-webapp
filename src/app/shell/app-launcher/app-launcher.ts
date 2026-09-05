import { Component, computed, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_CATALOG } from '../app-catalog';
import { AuthState } from '../auth-state';

/** Grid of the Apps the current user can reach, opened from the topbar trigger (Google/M365/Odoo-style app switcher). */
@Component({
  selector: 'app-app-launcher',
  imports: [RouterLink],
  templateUrl: './app-launcher.html',
})
export class AppLauncher {
  private readonly auth = inject(AuthState);

  protected readonly apps = computed(() => {
    const role = this.auth.currentUser()?.role;
    // admin sees every App, including the ones still `hidden` from the regular launcher (early mockups) —
    // this is the account used for end-to-end demos, so nothing should be out of reach.
    if (role === 'admin') return APP_CATALOG;
    return APP_CATALOG.filter((app) => !app.hidden && (!app.roles || (role != null && app.roles.includes(role))));
  });

  readonly close = output<void>();
}
