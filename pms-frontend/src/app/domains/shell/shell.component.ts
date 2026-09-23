import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <div style="display: flex; min-height: 100vh; background: #f8fafc;">
      <!-- Sidebar -->
      <aside style="width: 260px; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; flex-shrink: 0; border-right: 1px solid #1e293b;">
        <!-- Logo Header -->
        <div style="padding: 22px 20px; border-bottom: 1px solid #1e293b; display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);">
            <lucide-icon name="pill" [size]="22" color="#ffffff"></lucide-icon>
          </div>
          <div>
            <h2 style="font-size: 16px; font-weight: 800; color: #fff; line-height: 1.2; letter-spacing: -0.3px;">Apex PMS</h2>
            <p style="font-size: 11px; color: #38bdf8; font-weight: 600;">Enterprise Pharmacy</p>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav style="flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto;">
          <div class="nav-section-title">MAIN MENU</div>
          <a routerLink="/dashboard" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="layout-dashboard" [size]="17"></lucide-icon>
            <span>Dashboard</span>
          </a>

          <div class="nav-section-title" style="margin-top: 10px;">SALES & CASH REGISTER</div>
          <a routerLink="/pos" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="zap" [size]="17" color="#f59e0b"></lucide-icon>
            <span>Point of Sale (POS)</span>
          </a>
          <a routerLink="/sales" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="receipt" [size]="17" color="#38bdf8"></lucide-icon>
            <span>Sales & Receipts</span>
          </a>
          <a routerLink="/cash" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="circle-dollar-sign" [size]="17" color="#34d399"></lucide-icon>
            <span>Cash Register & Shifts</span>
          </a>

          <div class="nav-section-title" style="margin-top: 10px;">INVENTORY & SUPPLY</div>
          <a routerLink="/inventory" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="boxes" [size]="17" color="#a78bfa"></lucide-icon>
            <span>FEFO Inventory & Stock</span>
          </a>
          <a routerLink="/purchases" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="truck" [size]="17" color="#2dd4bf"></lucide-icon>
            <span>Procurement & GRN</span>
          </a>
          <a routerLink="/customers" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="building-2" [size]="17" color="#67e8f9"></lucide-icon>
            <span>Customers & Credit</span>
          </a>
          <a *ngIf="authService.hasRole('ROLE_OWNER') || authService.hasRole('ROLE_CASHIER_ACCOUNTANT') || authService.hasRole('ROLE_PHARMACIST')"
             routerLink="/assets" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="monitor" [size]="17" color="#f472b6"></lucide-icon>
            <span>Fixed Assets & Hardware</span>
          </a>

          <div class="nav-section-title" style="margin-top: 10px;">ANALYTICS & ADMIN</div>
          <a *ngIf="authService.hasRole('ROLE_OWNER') || authService.hasPermission('REPORT_PROFIT_VIEW')"
             routerLink="/reports" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="trending-up" [size]="17" color="#c084fc"></lucide-icon>
            <span>Profit & Analytics</span>
          </a>
          <a *ngIf="authService.hasRole('ROLE_OWNER') || authService.hasPermission('USER_MANAGE')"
             routerLink="/users" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="users" [size]="17" color="#93c5fd"></lucide-icon>
            <span>Users & Staff</span>
          </a>
        </nav>

        <!-- User Profile Card -->
        <div style="padding: 14px 16px; border-top: 1px solid #1e293b; background: #090e1a; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
            <div style="width: 34px; height: 34px; border-radius: 8px; background: #1e293b; color: #38bdf8; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0;">
              {{ (authService.currentUser()?.fullName || 'U').charAt(0) }}
            </div>
            <div style="min-width: 0;">
              <div style="font-size: 12px; font-weight: 700; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ authService.currentUser()?.fullName }}</div>
              <div style="font-size: 11px; color: #94a3b8; font-weight: 500;">{{ authService.currentUser()?.roles?.[0] || 'User' }}</div>
            </div>
          </div>
          <button (click)="authService.logout()" class="btn btn-outline" style="padding: 5px 8px; font-size: 11px; color: #ef4444; border-color: #334155; display: flex; align-items: center; gap: 4px;" title="Sign out">
            <lucide-icon name="log-out" [size]="13"></lucide-icon>
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div style="flex: 1; display: flex; flex-direction: column; overflow-x: hidden; min-width: 0;">
        <!-- Topbar -->
        <header style="height: 60px; background: #ffffff; border-bottom: 1px solid var(--slate-200); display: flex; align-items: center; justify-content: space-between; padding: 0 28px; position: sticky; top: 0; z-index: 50;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="badge badge-primary" style="display: inline-flex; align-items: center; gap: 6px;">
              <lucide-icon name="store" [size]="13"></lucide-icon>
              Branch: {{ authService.currentUser()?.branchName || 'HQ Main Store' }}
            </span>
            <span style="font-size: 12px; color: var(--slate-500); display: inline-flex; align-items: center; gap: 6px;">
              <lucide-icon name="shield-check" [size]="14" color="#059669"></lucide-icon>
              License: PH-ET-2026-88910
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="font-size: 12px; font-weight: 600; color: var(--slate-600); display: inline-flex; align-items: center; gap: 6px;">
              <lucide-icon name="calendar" [size]="14" color="#64748b"></lucide-icon>
              {{ today | date:'fullDate' }}
            </div>
          </div>
        </header>

        <!-- Page Outlet -->
        <main style="flex: 1; padding: 24px 28px; background: #f8fafc;">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>

    <!-- Toast Notifications Overlay -->
    <div style="position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; max-width: 360px;">
      <div *ngFor="let notif of notificationService.notifications()"
           [style.border-left]="notif.type === 'success' ? '4px solid #10b981' : (notif.type === 'error' ? '4px solid #ef4444' : '4px solid #f59e0b')"
           style="min-width: 260px; padding: 12px 16px; border-radius: 8px; background: #0f172a; color: #fff; box-shadow: var(--shadow-lg); font-size: 13px; font-weight: 500; display: flex; align-items: center; justify-content: space-between;">
        <span>{{ notif.message }}</span>
        <button (click)="notificationService.remove(notif.id)" style="background: none; border: none; color: #94a3b8; cursor: pointer; margin-left: 10px; display: flex; align-items: center;">
          <lucide-icon name="x" [size]="14"></lucide-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .nav-section-title {
      font-size: 10px;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.06em;
      padding: 6px 14px 2px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .nav-item:hover {
      background-color: #1e293b;
      color: #f8fafc;
    }
    .active-nav {
      background-color: #0284c7 !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
    }
  `]
})
export class ShellComponent {
  today = new Date();

  constructor(
    public authService: AuthService,
    public notificationService: NotificationService
  ) {}
}
