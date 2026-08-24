import { Injectable, signal } from '@angular/core';

/** Shared open/close state for the App Launcher overlay — the trigger lives in the Topbar, but the
 *  Sidebar's empty-state ("choose an App") also needs to open it. */
@Injectable({ providedIn: 'root' })
export class AppLauncherState {
  readonly open = signal(false);

  toggle(): void {
    this.open.update((value) => !value);
  }

  show(): void {
    this.open.set(true);
  }

  hide(): void {
    this.open.set(false);
  }
}
