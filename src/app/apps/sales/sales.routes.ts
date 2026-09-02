import { Routes } from '@angular/router';

export const SALES_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then((m) => m.SalesDashboard) },
  { path: 'products', loadComponent: () => import('./products/product-list/product-list').then((m) => m.ProductList) },
  { path: 'products/new', loadComponent: () => import('./products/product-create/product-create').then((m) => m.ProductCreate) },
  { path: 'products/:id', loadComponent: () => import('./products/product-detail/product-detail').then((m) => m.ProductDetail) },
  { path: 'products/:id/edit', loadComponent: () => import('./products/product-create/product-create').then((m) => m.ProductCreate) },
  { path: 'customers', loadComponent: () => import('./customers/customer-list/customer-list').then((m) => m.CustomerList) },
  { path: 'customers/new', loadComponent: () => import('./customers/customer-create/customer-create').then((m) => m.CustomerCreate) },
  { path: 'customers/:id', loadComponent: () => import('./customers/customer-detail/customer-detail').then((m) => m.CustomerDetail) },
  { path: 'quotations', loadComponent: () => import('./quotations/quotation-list/quotation-list').then((m) => m.QuotationList) },
  { path: 'quotations/:id', loadComponent: () => import('./quotations/quotation-detail/quotation-detail').then((m) => m.QuotationDetail) },
  { path: 'orders', loadComponent: () => import('./orders/order-list/order-list').then((m) => m.OrderList) },
  { path: 'orders/:id', loadComponent: () => import('./orders/order-detail/order-detail').then((m) => m.OrderDetail) },
  { path: 'production-board', loadComponent: () => import('./production-board/production-board').then((m) => m.ProductionBoard) },
  { path: 'dispatch', loadComponent: () => import('./dispatch/dispatch-board').then((m) => m.DispatchBoard) },
  { path: 'claims', loadComponent: () => import('./claims/claim-list/claim-list').then((m) => m.ClaimList) },
  { path: 'claims/new', loadComponent: () => import('./claims/claim-create/claim-create').then((m) => m.ClaimCreate) },
  { path: 'claims/:id', loadComponent: () => import('./claims/claim-detail/claim-detail').then((m) => m.ClaimDetail) },
];
