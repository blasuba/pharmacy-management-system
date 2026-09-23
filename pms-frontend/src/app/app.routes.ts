import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { ShellComponent } from './domains/shell/shell.component';

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./domains/auth/pages/login/login.component').then(m => m.LoginComponent) 
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { 
        path: 'dashboard', 
        loadComponent: () => import('./domains/dashboard/dashboard.component').then(m => m.DashboardComponent) 
      },
      { 
        path: 'pos', 
        loadComponent: () => import('./domains/pos/pos.component').then(m => m.PosComponent) 
      },
      { 
        path: 'inventory', 
        loadComponent: () => import('./domains/inventory/inventory.component').then(m => m.InventoryComponent) 
      },
      { 
        path: 'purchases', 
        loadComponent: () => import('./domains/purchases/purchases.component').then(m => m.PurchasesComponent) 
      },
      { 
        path: 'sales', 
        loadComponent: () => import('./domains/sales/sales.component').then(m => m.SalesComponent) 
      },
      { 
        path: 'cash', 
        loadComponent: () => import('./domains/cash/cash-management.component').then(m => m.CashManagementComponent) 
      },
      { 
        path: 'customers', 
        loadComponent: () => import('./domains/customers/customers.component').then(m => m.CustomersComponent) 
      },
      { 
        path: 'assets', 
        loadComponent: () => import('./domains/assets/fixed-assets.component').then(m => m.FixedAssetsComponent) 
      },
      { 
        path: 'reports', 
        loadComponent: () => import('./domains/reports/reports.component').then(m => m.ReportsComponent) 
      },
      { 
        path: 'users', 
        loadComponent: () => import('./domains/users/users.component').then(m => m.UsersComponent) 
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];

