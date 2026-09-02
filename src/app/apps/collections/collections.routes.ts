import { Routes } from '@angular/router';

export const COLLECTIONS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then((m) => m.CollectionsDashboard) },
  { path: 'payments', loadComponent: () => import('./payments-review/payments-review').then((m) => m.PaymentsReview) },
  { path: 'customer-file', loadComponent: () => import('./customer-file/customer-file').then((m) => m.CustomerFile) },
  { path: 'agreements', loadComponent: () => import('./agreements/agreement-list/agreement-list').then((m) => m.AgreementList) },
  { path: 'agreements/:id', loadComponent: () => import('./agreements/agreement-detail/agreement-detail').then((m) => m.AgreementDetail) },
];
