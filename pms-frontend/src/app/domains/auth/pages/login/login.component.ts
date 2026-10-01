import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #075985 100%); padding: 20px;">
      <div style="width: 100%; max-width: 440px; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: var(--shadow-lg);">
        <div style="text-align: center; margin-bottom: 24px;">
          <!-- Logo: shows uploaded image or fallback pill icon -->
          <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px; box-shadow: 0 4px 14px rgba(2,132,199,0.2); overflow: hidden;">
            <img
              *ngIf="logoUrl()"
              [src]="logoUrl()!"
              alt="Pharmacy Logo"
              width="64"
              height="64"
              fetchpriority="high"
              style="width: 64px; height: 64px; object-fit: cover; display: block;"
              (error)="logoUrl.set(null)"
            />
            <lucide-icon *ngIf="!logoUrl()" name="pill" [size]="32" color="#0284c7" aria-hidden="true"></lucide-icon>
          </div>

          <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
            {{ pharmacyName() || 'Pharmacy Management System' }}
          </h1>
          <p style="font-size: 13px; color: #475569; margin-top: 4px; font-weight: 500;">
            Sign in to access your pharmacy operations terminal
          </p>
        </div>

        <!-- Inactivity / Session Notice Banner -->
        <div *ngIf="timeoutReason()"
             style="margin-bottom: 20px; padding: 12px 16px; border-radius: 10px; background: #fef3c7; border: 1px solid #fde68a; display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: #92400e;">
          <lucide-icon name="clock" [size]="18" color="#d97706" style="flex-shrink: 0;"></lucide-icon>
          <div>
            <strong>Session Disconnected:</strong>
            {{ timeoutReason() === 'idle_timeout' ? ' You were logged out due to inactivity for terminal security.' : ' Your session has expired. Please sign in again.' }}
          </div>
        </div>

        <!-- Prominent In-Card Error Alert Banner -->
        <div *ngIf="errorMessage()"
             style="margin-bottom: 20px; padding: 12px 16px; border-radius: 10px; background: #fef2f2; border: 1px solid #fecaca; display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: #991b1b; animation: shake 0.3s ease-in-out;">
          <lucide-icon name="alert-circle" [size]="18" color="#dc2626" style="flex-shrink: 0; margin-top: 2px;"></lucide-icon>
          <div style="flex: 1;">
            <strong style="display: block; font-size: 13px; font-weight: 700; color: #7f1d1d; margin-bottom: 2px;">
              Authentication Error
            </strong>
            <span>{{ errorMessage() }}</span>
          </div>
          <button 
            type="button" 
            (click)="errorMessage.set(null)" 
            aria-label="Dismiss error message" 
            style="background: none; border: none; color: #b91c1c; cursor: pointer; font-size: 16px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px;" 
            title="Dismiss">✕</button>
        </div>

        <form (ngSubmit)="handleLogin()">
          <div style="margin-bottom: 18px;">
            <label for="usernameInput" style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">
              <lucide-icon name="user" [size]="14" color="#64748b"></lucide-icon>
              Username or Email
            </label>
            <input 
              id="usernameInput"
              type="text" 
              [(ngModel)]="username" 
              (input)="errorMessage.set(null)" 
              name="username" 
              class="form-control" 
              placeholder="e.g. admin, pharmacist, cashier" 
              autocomplete="username"
              required 
              autofocus />
          </div>

          <div style="margin-bottom: 24px;">
            <label for="passwordInput" style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">
              <lucide-icon name="lock" [size]="14" color="#64748b"></lucide-icon>
              Password
            </label>
            <div style="position: relative;">
              <input
                id="passwordInput"
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="password"
                (input)="errorMessage.set(null)"
                name="password"
                class="form-control"
                placeholder="••••••••"
                style="padding-right: 42px;"
                autocomplete="current-password"
                required />
              <button
                type="button"
                (click)="showPassword.set(!showPassword())"
                style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; background: none; border: none; cursor: pointer; color: #475569; display: flex; align-items: center; justify-content: center; border-radius: 8px;"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                [title]="showPassword() ? 'Hide password' : 'Show password'">
                <lucide-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="18" aria-hidden="true"></lucide-icon>
              </button>
            </div>
          </div>

          <button type="submit" [disabled]="loading()" class="btn btn-primary" aria-label="Sign In to Terminal" style="width: 100%; padding: 12px; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700;">
            <span>{{ loading() ? 'Authenticating Credentials...' : 'Sign In to Terminal' }}</span>
            <lucide-icon *ngIf="!loading()" name="arrow-right" [size]="16"></lucide-icon>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
  `]
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  showPassword = signal(false);
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  timeoutReason = signal<string | null>(null);

  pharmacyName = signal<string | null>(null);
  logoUrl = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Clear any lingering toast notifications from previous sessions or redirects
    this.notificationService.clearAll();

    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason) {
      this.timeoutReason.set(reason);
    }
    this.loadPublicBranding();
  }

  loadPublicBranding(): void {
    this.http.get<any>(`${environment.apiUrl}/auth/branding`).subscribe({
      next: (res) => {
        if (res.data) {
          this.pharmacyName.set(res.data.name || null);
          const path: string = res.data.logoPath || '';
          if (path) {
            // Resolve relative path to backend URL
            const backendOrigin = environment.apiUrl.replace(/\/api\/v1.*$/, '');
            const resolved = path.startsWith('http') ? path : backendOrigin + (path.startsWith('/') ? path : '/' + path);
            this.logoUrl.set(resolved);
          }
        }
      },
      error: () => {} // Silently ignore — login still works without branding
    });
  }

  handleLogin(): void {
    this.errorMessage.set(null);

    if (!this.username?.trim() || !this.password?.trim()) {
      this.errorMessage.set('Please enter both username/email and password.');
      this.notificationService.warning('Please enter both username and password');
      return;
    }

    this.loading.set(true);
    this.authService.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.notificationService.clearAll();
        this.notificationService.success(`Welcome back, ${res.data.fullName}!`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        let msg = '';
        if (err.status === 0) {
          msg = 'Unable to connect to the pharmacy backend server. Please verify network connection or ensure the server is online.';
        } else if (err.status === 403 || (err.error?.message && err.error.message.toLowerCase().includes('suspended')) || (err.error?.message && err.error.message.toLowerCase().includes('deactivated'))) {
          msg = err.error?.message || 'Your staff account has been deactivated or suspended by the administrator. Please contact pharmacy management.';
        } else if (err.status === 401) {
          msg = err.error?.message || 'Invalid username or password. Please verify your credentials.';
        } else {
          msg = err.error?.message || 'Authentication failed. Please check your credentials or contact system support.';
        }

        this.errorMessage.set(msg);
      }
    });
  }
}
