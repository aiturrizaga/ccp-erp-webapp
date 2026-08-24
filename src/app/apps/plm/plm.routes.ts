import { Routes } from '@angular/router';

export const PLM_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then((m) => m.PlmDashboard) },
  { path: 'products', loadComponent: () => import('./products/product-list/product-list').then((m) => m.ProductList) },
  { path: 'products/:id', loadComponent: () => import('./products/product-detail/product-detail').then((m) => m.ProductDetail) },
  { path: 'bill-of-materials', loadComponent: () => import('./bill-of-materials/bom-list/bom-list').then((m) => m.BomList) },
  { path: 'bill-of-materials/:id', loadComponent: () => import('./bill-of-materials/bom-detail/bom-detail').then((m) => m.BomDetail) },
  {
    path: 'change-management',
    loadComponent: () => import('@shared/components/coming-soon/coming-soon').then((m) => m.ComingSoon),
    data: { title: 'Cambios', description: 'Órdenes de cambio de ingeniería (ECO), revisiones y documentación técnica. Próximamente.', icon: 'tablerTool' },
  },
];
