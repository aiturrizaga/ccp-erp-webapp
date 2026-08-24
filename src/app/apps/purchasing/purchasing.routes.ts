import { Routes } from '@angular/router';

export const PURCHASING_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'requisitions' },
  { path: 'requisitions', loadComponent: () => import('./requisitions/requisition-list/requisition-list').then((m) => m.RequisitionList) },
  { path: 'requisitions/:id', loadComponent: () => import('./requisitions/requisition-detail/requisition-detail').then((m) => m.RequisitionDetail) },
  { path: 'sourcing', loadComponent: () => import('./sourcing/quotation-list/quotation-list').then((m) => m.QuotationList) },
  { path: 'sourcing/comparison/:requisitionId', loadComponent: () => import('./sourcing/quotation-comparison/quotation-comparison').then((m) => m.QuotationComparison) },
  { path: 'sourcing/:id', loadComponent: () => import('./sourcing/quotation-detail/quotation-detail').then((m) => m.QuotationDetail) },
  { path: 'purchase-orders', loadComponent: () => import('./purchase-orders/purchase-order-list/purchase-order-list').then((m) => m.PurchaseOrderList) },
  { path: 'purchase-orders/:id', loadComponent: () => import('./purchase-orders/purchase-order-detail/purchase-order-detail').then((m) => m.PurchaseOrderDetail) },
  { path: 'suppliers', loadComponent: () => import('./suppliers/supplier-list/supplier-list').then((m) => m.SupplierList) },
  { path: 'suppliers/:id', loadComponent: () => import('./suppliers/supplier-detail/supplier-detail').then((m) => m.SupplierDetail) },
  {
    path: 'agreements',
    loadComponent: () => import('@shared/components/coming-soon/coming-soon').then((m) => m.ComingSoon),
    data: { title: 'Acuerdos', description: 'Acuerdos comerciales, precios negociados y condiciones vigentes por proveedor. Próximamente.', icon: 'tablerHeartHandshake' },
  },
];
