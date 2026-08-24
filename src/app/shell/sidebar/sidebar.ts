import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmSidebarImports } from '@ui/sidebar';
import { HlmAvatarImports } from '@ui/avatar';
import { HlmDropdownMenuImports } from '@ui/dropdown-menu';
import { ActiveApp } from '../active-app';
import { AuthState } from '../auth-state';
import { NavItem } from '../nav-item.model';
import { AppLauncherState } from '../app-launcher-state';
import { Company, COMPANIES } from '../company';
import { PURCHASING_NAV } from '@apps/purchasing/purchasing-nav';
import { INVENTORY_NAV } from '@apps/inventory/inventory-nav';
import { PRODUCTION_NAV } from '@apps/production/production-nav';
import { PLM_NAV } from '@apps/plm/plm-nav';
import { CRM_NAV } from '@apps/crm/crm-nav';
import { SALES_NAV } from '@apps/sales/sales-nav';
import { FINANCE_NAV } from '@apps/finance/finance-nav';
import { INVOICING_NAV } from '@apps/invoicing/invoicing-nav';

const NAV_BY_APP: Record<string, NavItem[]> = {
  purchasing: PURCHASING_NAV,
  inventory: INVENTORY_NAV,
  production: PRODUCTION_NAV,
  plm: PLM_NAV,
  crm: CRM_NAV,
  sales: SALES_NAV,
  finance: FINANCE_NAV,
  invoicing: INVOICING_NAV,
};

/** Contextual sidebar, built on spartan/ui's hlm-sidebar (inset variant, collapsible to icons). */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, NgIcon, ...HlmSidebarImports, ...HlmAvatarImports, ...HlmDropdownMenuImports],
  // See app.ts — this host only wraps `hlmSidebarWrapper`, which must sit directly in Layout's box chain.
  host: { class: 'contents' },
  templateUrl: './sidebar.html',
})
export class Sidebar {
  private readonly activeApp = inject(ActiveApp);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthState);
  protected readonly appLauncher = inject(AppLauncherState);

  protected readonly navItems = computed<NavItem[]>(() => {
    const role = this.auth.currentUser()?.role;
    const items = NAV_BY_APP[this.activeApp.id() ?? ''] ?? [];
    return items.filter((item) => !item.roles || (role && item.roles.includes(role)));
  });

  protected readonly companies = COMPANIES;
  protected readonly activeCompany = signal<Company>(COMPANIES[0]);

  protected selectCompany(company: Company): void {
    this.activeCompany.set(company);
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
