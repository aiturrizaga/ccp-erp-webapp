import { Injectable, computed, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { APP_CATALOG } from './app-catalog';

function extractAppId(url: string): string | null {
  const match = url.match(/^\/apps\/([^/]+)/);
  return match ? match[1] : null;
}

/** Tracks which App the current route belongs to, so the Sidebar/Topbar can stay contextual. */
@Injectable({ providedIn: 'root' })
export class ActiveApp {
  private readonly router = inject(Router);

  readonly id = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => extractAppId(event.urlAfterRedirects)),
      startWith(extractAppId(this.router.url)),
    ),
    { initialValue: extractAppId(this.router.url) },
  );

  readonly descriptor = computed(() => APP_CATALOG.find((app) => app.id === this.id()) ?? null);
}
