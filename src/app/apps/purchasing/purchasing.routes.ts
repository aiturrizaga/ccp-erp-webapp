import { Routes } from '@angular/router';
import { roleGuard } from '@shell/role-guard';

export const PURCHASING_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then((m) => m.PurchasingDashboard) },
  { path: 'replenishment-suggestions', loadComponent: () => import('./replenishment-suggestions/suggestion-list/suggestion-list').then((m) => m.SuggestionList) },
  { path: 'replenishment-suggestions/new', loadComponent: () => import('./replenishment-suggestions/suggestion-create/suggestion-create').then((m) => m.SuggestionCreate) },
  { path: 'replenishment-suggestions/:id', loadComponent: () => import('./replenishment-suggestions/suggestion-detail/suggestion-detail').then((m) => m.SuggestionDetail) },
  { path: 'requirements', loadComponent: () => import('./purchase-requirements/requirement-list/requirement-list').then((m) => m.RequirementList) },
  { path: 'requirements/new', loadComponent: () => import('./purchase-requirements/requirement-create/requirement-create').then((m) => m.RequirementCreate) },
  { path: 'requirements/:id', loadComponent: () => import('./purchase-requirements/requirement-detail/requirement-detail').then((m) => m.RequirementDetail) },
  {
    path: 'sourcing',
    canActivate: [roleGuard(['purchasing'])],
    loadComponent: () => import('./sourcing/quotation-list/quotation-list').then((m) => m.QuotationList),
  },
  {
    path: 'sourcing/comparison/:requirementId',
    canActivate: [roleGuard(['purchasing'])],
    loadComponent: () => import('./sourcing/quotation-comparison/quotation-comparison').then((m) => m.QuotationComparison),
  },
  {
    path: 'sourcing/:id',
    canActivate: [roleGuard(['purchasing'])],
    loadComponent: () => import('./sourcing/quotation-detail/quotation-detail').then((m) => m.QuotationDetail),
  },
  {
    path: 'purchase-orders',
    canActivate: [roleGuard(['purchasing'])],
    loadComponent: () => import('./purchase-orders/purchase-order-list/purchase-order-list').then((m) => m.PurchaseOrderList),
  },
  {
    path: 'purchase-orders/new',
    canActivate: [roleGuard(['purchasing'])],
    loadComponent: () => import('./purchase-orders/purchase-order-create/purchase-order-create').then((m) => m.PurchaseOrderCreate),
  },
  {
    path: 'purchase-orders/:id',
    canActivate: [roleGuard(['purchasing'])],
    loadComponent: () => import('./purchase-orders/purchase-order-detail/purchase-order-detail').then((m) => m.PurchaseOrderDetail),
  },
  { path: 'suppliers', loadComponent: () => import('./suppliers/supplier-list/supplier-list').then((m) => m.SupplierList) },
  { path: 'suppliers/:id', loadComponent: () => import('./suppliers/supplier-detail/supplier-detail').then((m) => m.SupplierDetail) },
];
