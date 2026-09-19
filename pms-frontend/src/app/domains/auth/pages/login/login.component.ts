import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #075985 100%); padding: 20px;">
      <div style="width: 100%; max-width: 440px; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: var(--shadow-lg);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); color: #0284c7; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.2);">
            <lucide-icon name="pill" [size]="32" color="#0284c7"></lucide-icon>
          </div>
          <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">Apex Central Pharmacy</h1>
          <p style="font-size: 13px; color: #64748b; margin-top: 4px;">Sign in to access your pharmacy operations terminal</p>
        </div>

        <form (ngSubmit)="handleLogin()">
          <div style="margin-bottom: 18px;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">
              <lucide-icon name="user" [size]="14" color="#64748b"></lucide-icon>
              Username or Email
            </label>
            <input type="text" [(ngModel)]="username" name="username" class="form-control" placeholder="e.g. admin, pharmacist, cashier" required autofocus />
          </div>

          <div style="margin-bottom: 24px;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">
              <lucide-icon name="lock" [size]="14" color="#64748b"></lucide-icon>
              Password
            </label>
            <input type="password" [(ngModel)]="password" name="password" class="form-control" placeholder="••••••••" required />
          </div>

          <button type="submit" [disabled]="loading()" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span>{{ loading() ? 'Authenticating...' : 'Sign In to Terminal' }}</span>
            <lucide-icon *ngIf="!loading()" name="arrow-right" [size]="16"></lucide-icon>
          </button>
        </form>

        <div style="margin-top: 24px; padding: 14px; background: #f8fafc; border-radius: 10px; border: 1px dashed #cbd5e1; font-size: 12px; color: #475569;">
          <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: #334155; margin-bottom: 6px;">
            <lucide-icon name="shield-check" [size]="15" color="#0284c7"></lucide-icon>
            Quick Demo Accounts:
          </div>
          • <code>admin</code> / <code>Admin&#64;123</code> (Full Owner)<br>
          • <code>pharmacist</code> / <code>Pharm&#64;123</code> (Dispensing/Batches)<br>
          • <code>cashier</code> / <code>Cash&#64;123</code> (POS Sales/Receipts)
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  username = '';
  password = '';
  loading = signal(false);

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  handleLogin(): void {
    if (!this.username || !this.password) {
      this.notificationService.warning('Please enter both username and password');
      return;
    }

    this.loading.set(true);
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.notificationService.success(`Welcome back, ${res.data.fullName}!`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.notificationService.error(err.error?.message || 'Login failed. Please verify credentials.');
      }
    });
  }
}
