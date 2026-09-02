import { Routes } from '@angular/router';
import { authGuard } from './shell/auth-guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./shell/login/login').then((m) => m.Login) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/layout/layout').then((m) => m.Layout),
    children: [
      { path: '', loadComponent: () => import('./shell/dashboard/dashboard').then((m) => m.Dashboard) },
      { path: 'approvals', loadComponent: () => import('./shell/approvals-inbox/approvals-inbox').then((m) => m.ApprovalsInbox) },
      { path: 'apps/purchasing', loadChildren: () => import('./apps/purchasing/purchasing.routes').then((m) => m.PURCHASING_ROUTES) },
      { path: 'apps/inventory', loadChildren: () => import('./apps/inventory/inventory.routes').then((m) => m.INVENTORY_ROUTES) },
      { path: 'apps/production', loadChildren: () => import('./apps/production/production.routes').then((m) => m.PRODUCTION_ROUTES) },
      { path: 'apps/plm', loadChildren: () => import('./apps/plm/plm.routes').then((m) => m.PLM_ROUTES) },
      { path: 'apps/crm', loadChildren: () => import('./apps/crm/crm.routes').then((m) => m.CRM_ROUTES) },
      { path: 'apps/sales', loadChildren: () => import('./apps/sales/sales.routes').then((m) => m.SALES_ROUTES) },
      { path: 'apps/finance', loadChildren: () => import('./apps/finance/finance.routes').then((m) => m.FINANCE_ROUTES) },
      { path: 'apps/invoicing', loadChildren: () => import('./apps/invoicing/invoicing.routes').then((m) => m.INVOICING_ROUTES) },
      { path: 'apps/collections', loadChildren: () => import('./apps/collections/collections.routes').then((m) => m.COLLECTIONS_ROUTES) },
    ],
  },
];
