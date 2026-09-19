import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { LoginComponent } from './domains/auth/pages/login/login.component';
import { ShellComponent } from './domains/shell/shell.component';
import { DashboardComponent } from './domains/dashboard/dashboard.component';
import { PosComponent } from './domains/pos/pos.component';
import { InventoryComponent } from './domains/inventory/inventory.component';
import { PurchasesComponent } from './domains/purchases/purchases.component';
import { SalesComponent } from './domains/sales/sales.component';
import { ReportsComponent } from './domains/reports/reports.component';
import { UsersComponent } from './domains/users/users.component';
import { CustomersComponent } from './domains/customers/customers.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: UsersComponent },
      { path: 'customers', component: CustomersComponent },
      { path: 'pos', component: PosComponent },
      { path: 'inventory', component: InventoryComponent },
      { path: 'purchases', component: PurchasesComponent },
      { path: 'sales', component: SalesComponent },
      { path: 'reports', component: ReportsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
