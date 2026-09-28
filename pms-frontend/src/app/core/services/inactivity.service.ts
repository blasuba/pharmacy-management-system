import { Injectable, NgZone, signal, computed, inject } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';
import { SettingsService } from './settings.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  private authService = inject(AuthService);
  private settingsService = inject(SettingsService);
  private notificationService = inject(NotificationService);
  private ngZone = inject(NgZone);

  // Dynamic timeout and warning computed directly from SettingsService signal
  idleTimeoutSeconds = computed(() => {
    const s = this.settingsService.systemSettings();
    const mins = s?.sessionTimeoutMinutes ?? 15;
    return Math.max(60, mins * 60);
  });

  warningSeconds = computed(() => {
    const totalSec = this.idleTimeoutSeconds();
    const s = this.settingsService.systemSettings();
    const warnMins = s?.sessionWarningMinutes ?? 2;
    const desiredWarningSec = totalSec <= 60 ? 30 : Math.max(30, warnMins * 60);
    return Math.min(totalSec - 10, desiredWarningSec);
  });

  private lastActivityTimestamp = Date.now();
  private timerIntervalId: any = null;

  isWarningVisible = signal<boolean>(false);
  secondsRemaining = signal<number>(30);

  formattedTimeRemaining = computed(() => {
    const totalSec = this.secondsRemaining();
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  });

  constructor() {
    this.initActivityMonitoring();
  }

  private initActivityMonitoring(): void {
    this.ngZone.runOutsideAngular(() => {
      let lastX = -1;
      let lastY = -1;

      const onUserActivity = () => {
        if (!this.isWarningVisible() && this.authService.isAuthenticated()) {
          this.lastActivityTimestamp = Date.now();
        }
      };

      const onMouseMove = (e: MouseEvent) => {
        if (lastX === -1 && lastY === -1) {
          lastX = e.clientX;
          lastY = e.clientY;
          return;
        }
        // Only treat as activity if cursor genuinely moved more than 4px
        if (Math.abs(e.clientX - lastX) > 4 || Math.abs(e.clientY - lastY) > 4) {
          lastX = e.clientX;
          lastY = e.clientY;
          onUserActivity();
        }
      };

      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('mousedown', onUserActivity, { passive: true });
      window.addEventListener('keydown', onUserActivity, { passive: true });
      window.addEventListener('touchstart', onUserActivity, { passive: true });
      window.addEventListener('scroll', onUserActivity, { passive: true });

      // Check inactivity every second
      this.timerIntervalId = setInterval(() => {
        this.checkInactivity();
      }, 1000);
    });
  }

  private checkInactivity(): void {
    if (!this.authService.isAuthenticated()) {
      if (this.isWarningVisible()) {
        this.ngZone.run(() => {
          this.isWarningVisible.set(false);
        });
      }
      this.lastActivityTimestamp = Date.now();
      return;
    }

    const elapsedSeconds = Math.floor((Date.now() - this.lastActivityTimestamp) / 1000);
    const timeoutSec = this.idleTimeoutSeconds();
    const warnSec = this.warningSeconds();
    const timeUntilTimeout = timeoutSec - elapsedSeconds;

    if (timeUntilTimeout <= 0) {
      // Auto Logout
      this.ngZone.run(() => {
        this.isWarningVisible.set(false);
        this.notificationService.warning('You have been logged out due to inactivity for security.');
        this.authService.logout('idle_timeout');
      });
      this.lastActivityTimestamp = Date.now();
    } else if (timeUntilTimeout <= warnSec) {
      // Show Warning Modal & update countdown
      this.ngZone.run(() => {
        this.secondsRemaining.set(timeUntilTimeout);
        if (!this.isWarningVisible()) {
          this.isWarningVisible.set(true);
        }
      });
    } else {
      if (this.isWarningVisible()) {
        this.ngZone.run(() => {
          this.isWarningVisible.set(false);
        });
      }
    }
  }

  keepAlive(): void {
    this.authService.refreshToken().subscribe({
      next: () => {
        this.isWarningVisible.set(false);
        this.lastActivityTimestamp = Date.now();
        this.notificationService.success('Session extended successfully.');
      },
      error: () => {
        this.isWarningVisible.set(false);
        this.authService.logout('session_expired');
      }
    });
  }

  logoutNow(): void {
    this.isWarningVisible.set(false);
    this.authService.logout();
  }

  resetTimer(): void {
    this.lastActivityTimestamp = Date.now();
    this.isWarningVisible.set(false);
  }
}
