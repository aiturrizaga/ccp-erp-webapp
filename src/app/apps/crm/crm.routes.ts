import { Routes } from '@angular/router';

export const CRM_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then((m) => m.CrmDashboard) },
  { path: 'leads', loadComponent: () => import('./leads/lead-list/lead-list').then((m) => m.LeadList) },
  { path: 'leads/:id', loadComponent: () => import('./leads/lead-detail/lead-detail').then((m) => m.LeadDetail) },
  { path: 'opportunities', loadComponent: () => import('./opportunities/opportunity-list/opportunity-list').then((m) => m.OpportunityList) },
  { path: 'opportunities/:id', loadComponent: () => import('./opportunities/opportunity-detail/opportunity-detail').then((m) => m.OpportunityDetail) },
  { path: 'customers', loadComponent: () => import('./customers/customer-list/customer-list').then((m) => m.CustomerList) },
  { path: 'customers/:id', loadComponent: () => import('./customers/customer-detail/customer-detail').then((m) => m.CustomerDetail) },
];
