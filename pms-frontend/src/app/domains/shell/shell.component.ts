import { Component, signal } from '@angular/core';
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
    <div style="display: flex; min-height: 100vh;">
      <!-- Sidebar -->
      <aside style="width: 260px; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; flex-shrink: 0;">
        <!-- Logo -->
        <div style="padding: 24px 20px; border-bottom: 1px solid #1e293b; display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">
            <lucide-icon name="pill" [size]="22" color="#ffffff"></lucide-icon>
          </div>
          <div>
            <h2 style="font-size: 16px; font-weight: 800; color: #fff; line-height: 1.2; letter-spacing: -0.3px;">Apex PMS</h2>
            <p style="font-size: 11px; color: #94a3b8; font-weight: 500;">Pharmacy & Wholesale</p>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav style="flex: 1; padding: 18px 12px; display: flex; flex-direction: column; gap: 6px;">
          <a routerLink="/dashboard" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="layout-dashboard" [size]="18"></lucide-icon>
            <span>Dashboard</span>
          </a>

          <a *ngIf="authService.hasRole('ROLE_OWNER') || authService.hasPermission('USER_MANAGE')"
             routerLink="/users" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="users" [size]="18"></lucide-icon>
            <span>Users & Staff</span>
          </a>

          <a routerLink="/customers" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="building-2" [size]="18"></lucide-icon>
            <span>Customers & Clients</span>
          </a>

          <a routerLink="/pos" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="zap" [size]="18"></lucide-icon>
            <span>Point of Sale (POS)</span>
          </a>

          <a routerLink="/inventory" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="boxes" [size]="18"></lucide-icon>
            <span>FEFO Inventory</span>
          </a>

          <a routerLink="/purchases" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="truck" [size]="18"></lucide-icon>
            <span>Procurement & GRN</span>
          </a>

          <a routerLink="/sales" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="receipt" [size]="18"></lucide-icon>
            <span>Sales Invoices</span>
          </a>

          <a *ngIf="authService.hasRole('ROLE_OWNER') || authService.hasPermission('REPORT_PROFIT_VIEW')"
             routerLink="/reports" routerLinkActive="active-nav" class="nav-item">
            <lucide-icon name="trending-up" [size]="18"></lucide-icon>
            <span>Profit & Analytics</span>
          </a>
        </nav>

        <!-- User Profile Card in Sidebar -->
        <div style="padding: 16px; border-top: 1px solid #1e293b; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 34px; height: 34px; border-radius: 8px; background: #1e293b; color: #38bdf8; display: flex; align-items: center; justify-content: center;">
              <lucide-icon name="user-check" [size]="18"></lucide-icon>
            </div>
            <div>
              <div style="font-size: 13px; font-weight: 700; color: #f8fafc;">{{ authService.currentUser()?.fullName }}</div>
              <div style="font-size: 11px; color: #38bdf8; font-weight: 600;">{{ authService.currentUser()?.roles?.[0] }}</div>
            </div>
          </div>
          <button (click)="authService.logout()" class="btn btn-outline" style="padding: 6px 10px; font-size: 12px; color: #ef4444; border-color: #334155; display: flex; align-items: center; gap: 4px;" title="Sign out">
            <lucide-icon name="log-out" [size]="14"></lucide-icon>
            <span>Exit</span>
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div style="flex: 1; display: flex; flex-direction: column; overflow-x: hidden;">
        <!-- Topbar -->
        <header style="height: 64px; background: #ffffff; border-bottom: 1px solid var(--slate-200); display: flex; align-items: center; justify-content: space-between; padding: 0 28px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="badge badge-primary" style="display: inline-flex; align-items: center; gap: 6px;">
              <lucide-icon name="store" [size]="14"></lucide-icon>
              Branch: {{ authService.currentUser()?.branchName || 'HQ Main Store' }}
            </span>
            <span style="font-size: 13px; color: var(--slate-500); display: inline-flex; align-items: center; gap: 6px;">
              <lucide-icon name="shield-check" [size]="14" color="#059669"></lucide-icon>
              License: PH-ET-2026-88910
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="font-size: 13px; font-weight: 600; color: var(--slate-700); display: inline-flex; align-items: center; gap: 6px;">
              <lucide-icon name="calendar" [size]="15" color="#64748b"></lucide-icon>
              {{ today | date:'mediumDate' }}
            </div>
          </div>
        </header>

        <!-- Page Outlet -->
        <main style="flex: 1; padding: 28px; background: #f8fafc;">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>

    <!-- Toast Notifications Overlay -->
    <div style="position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;">
      <div *ngFor="let notif of notificationService.notifications()"
           [ngClass]="'toast-' + notif.type"
           style="min-width: 280px; padding: 12px 18px; border-radius: 8px; background: #0f172a; color: #fff; box-shadow: var(--shadow-lg); font-size: 13px; font-weight: 500; display: flex; align-items: center; justify-content: space-between;">
        <span>{{ notif.message }}</span>
        <button (click)="notificationService.remove(notif.id)" style="background: none; border: none; color: #94a3b8; cursor: pointer; margin-left: 10px; display: flex; align-items: center;">
          <lucide-icon name="x" [size]="14"></lucide-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #94a3b8;
      text-decoration: none;
      transition: all 0.2s;
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
