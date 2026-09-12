import { Routes } from '@angular/router';

export const DISPATCH_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dispatch-dashboard').then((m) => m.DispatchDashboard) },
  { path: 'planning', loadComponent: () => import('./planning/dispatch-planning').then((m) => m.DispatchPlanning) },
  { path: 'finished-stock', loadComponent: () => import('./finished-stock/finished-stock').then((m) => m.FinishedStock) },
  { path: 'reports', loadComponent: () => import('./reports/dispatch-reports').then((m) => m.DispatchReports) },
];
