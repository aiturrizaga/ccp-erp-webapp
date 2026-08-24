import { Routes } from '@angular/router';

export const FINANCE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'payable' },
  { path: 'payable', loadComponent: () => import('./payable/payable-list/payable-list').then((m) => m.PayableList) },
  { path: 'receivable', loadComponent: () => import('./receivable/receivable-list/receivable-list').then((m) => m.ReceivableList) },
];
