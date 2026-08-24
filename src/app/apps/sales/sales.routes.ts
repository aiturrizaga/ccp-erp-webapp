import { Routes } from '@angular/router';

export const SALES_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'quotations' },
  { path: 'quotations', loadComponent: () => import('./quotations/quotation-list/quotation-list').then((m) => m.QuotationList) },
  { path: 'quotations/:id', loadComponent: () => import('./quotations/quotation-detail/quotation-detail').then((m) => m.QuotationDetail) },
  { path: 'orders', loadComponent: () => import('./orders/order-list/order-list').then((m) => m.OrderList) },
  { path: 'orders/:id', loadComponent: () => import('./orders/order-detail/order-detail').then((m) => m.OrderDetail) },
];
