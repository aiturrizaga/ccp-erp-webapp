import { Routes } from '@angular/router';

export const INVOICING_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'invoices' },
  { path: 'invoices', loadComponent: () => import('./invoices/invoice-list/invoice-list').then((m) => m.InvoiceList) },
  { path: 'invoices/:id', loadComponent: () => import('./invoices/invoice-detail/invoice-detail').then((m) => m.InvoiceDetail) },
];
