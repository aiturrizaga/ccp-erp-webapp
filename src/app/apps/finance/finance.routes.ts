import { Routes } from '@angular/router';

export const FINANCE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then((m) => m.InvoicingDashboard) },
  { path: 'invoices', loadComponent: () => import('./invoices/invoice-list/invoice-list').then((m) => m.InvoiceList) },
  { path: 'invoices/new', loadComponent: () => import('./invoices/invoice-create/invoice-create').then((m) => m.InvoiceCreate) },
  { path: 'invoices/:id', loadComponent: () => import('./invoices/invoice-detail/invoice-detail').then((m) => m.InvoiceDetail) },
  { path: 'guides', loadComponent: () => import('./guides/guide-list/guide-list').then((m) => m.GuideList) },
  { path: 'guides/new', loadComponent: () => import('./guides/guide-create/guide-create').then((m) => m.GuideCreate) },
  { path: 'series', loadComponent: () => import('./series/series-list').then((m) => m.SeriesList) },
  { path: 'collections', loadComponent: () => import('./collections-dashboard/dashboard').then((m) => m.CollectionsDashboard) },
  { path: 'payments', loadComponent: () => import('./payments-review/payments-review').then((m) => m.PaymentsReview) },
  { path: 'customer-file', loadComponent: () => import('./customer-file/customer-file').then((m) => m.CustomerFile) },
  { path: 'agreements', loadComponent: () => import('./agreements/agreement-list/agreement-list').then((m) => m.AgreementList) },
  { path: 'agreements/:id', loadComponent: () => import('./agreements/agreement-detail/agreement-detail').then((m) => m.AgreementDetail) },
];
