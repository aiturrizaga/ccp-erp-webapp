import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@ui/button';
import { HlmBadgeImports } from '@ui/badge';
import { HlmSeparatorImports } from '@ui/separator';
import { HlmBreadcrumbImports } from '@ui/breadcrumb';
import { HlmSidebarImports } from '@ui/sidebar';
import { APPROVALS } from '@core/mock-data';
import { ActiveApp } from '../active-app';
import { AuthState } from '../auth-state';
import { AppLauncherState } from '../app-launcher-state';
import { AppLauncher } from '../app-launcher/app-launcher';
import { NavItem } from '../nav-item.model';
import { PURCHASING_NAV } from '@apps/purchasing/purchasing-nav';
import { INVENTORY_NAV } from '@apps/inventory/inventory-nav';
import { PRODUCTION_NAV } from '@apps/production/production-nav';
import { SALES_NAV } from '@apps/sales/sales-nav';
import { FINANCE_NAV } from '@apps/finance/finance-nav';

const NAV_BY_APP: Record<string, NavItem[]> = {
  purchasing: PURCHASING_NAV,
  inventory: INVENTORY_NAV,
  production: PRODUCTION_NAV,
  sales: SALES_NAV,
  finance: FINANCE_NAV,
};

/** Inset main's header: sidebar trigger, breadcrumb, global search, notifications and approvals bell. */
@Component({
  selector: 'app-topbar',
  imports: [RouterLink, NgIcon, ...HlmButtonImports, ...HlmBadgeImports, ...HlmSeparatorImports, ...HlmBreadcrumbImports, ...HlmSidebarImports, AppLauncher],
  templateUrl: './topbar.html',
})
export class Topbar {
  private readonly router = inject(Router);
  private readonly activeApp = inject(ActiveApp);
  private readonly auth = inject(AuthState);
  protected readonly appLauncher = inject(AppLauncherState);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly appName = computed(() => this.activeApp.descriptor()?.name ?? 'CCP ERP');

  protected readonly pageLabel = computed(() => {
    const role = this.auth.currentUser()?.role;
    const items = (NAV_BY_APP[this.activeApp.id() ?? ''] ?? []).filter((item) => role === 'admin' || !item.roles || (role && item.roles.includes(role)));
    const current = this.url();
    const match = items.find((item) => current.startsWith(item.route));
    if (match) return match.label;
    if (current.startsWith('/approvals')) return 'Bandeja de aprobaciones';
    return 'Dashboard';
  });

  protected readonly pendingApprovals = computed(() => APPROVALS.filter((approval) => approval.status === 'pending').length);
}
