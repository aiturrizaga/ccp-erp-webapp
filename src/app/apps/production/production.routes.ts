import { Routes } from '@angular/router';

const comingSoon = () => import('@shared/components/coming-soon/coming-soon').then((m) => m.ComingSoon);

export const PRODUCTION_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'production-orders' },
  { path: 'production-orders', loadComponent: () => import('./production-orders/production-order-list/production-order-list').then((m) => m.ProductionOrderList) },
  { path: 'production-orders/:id', loadComponent: () => import('./production-orders/production-order-detail/production-order-detail').then((m) => m.ProductionOrderDetail) },
  { path: 'work-sheets', loadComponent: () => import('./work-sheets/work-sheet-list/work-sheet-list').then((m) => m.WorkSheetList) },
  { path: 'work-sheets/:id', loadComponent: () => import('./work-sheets/work-sheet-detail/work-sheet-detail').then((m) => m.WorkSheetDetail) },
  { path: 'output-bundles', loadComponent: () => import('./output-bundles/output-bundle-list/output-bundle-list').then((m) => m.OutputBundleList) },
  { path: 'output-bundles/:id', loadComponent: () => import('./output-bundles/output-bundle-detail/output-bundle-detail').then((m) => m.OutputBundleDetail) },
  { path: 'planning', loadComponent: comingSoon, data: { title: 'Planificación', description: 'Planificación de demanda y capacidad productiva por planta y turno. Próximamente.', icon: 'tablerCalendar' } },
  { path: 'work-centers', loadComponent: comingSoon, data: { title: 'Centros de trabajo', description: 'Capacidad, turnos y calendario por centro de trabajo. Próximamente.', icon: 'tablerBuildingFactory2' } },
  { path: 'operation-routes', loadComponent: comingSoon, data: { title: 'Rutas', description: 'Secuencia de operaciones y tiempos estándar por producto. Próximamente.', icon: 'tablerRoute' } },
];
