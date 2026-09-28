import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { InactivityService } from '../../../core/services/inactivity.service';

@Component({
  selector: 'app-session-timeout-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div *ngIf="inactivityService.isWarningVisible()" 
         style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; animation: modalFadeIn 0.2s ease;">
      <div class="card" style="width: 100%; max-width: 440px; padding: 28px; text-align: center; box-shadow: var(--shadow-lg); border: 1px solid #f59e0b;">
        <!-- Pulsing Warning Icon -->
        <div style="width: 56px; height: 56px; border-radius: 16px; background: #fef3c7; color: #d97706; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.15);">
          <lucide-icon name="clock" [size]="28" color="#d97706"></lucide-icon>
        </div>

        <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 8px;">
          Session Expiring Soon
        </h3>
        
        <p style="font-size: 13px; color: #475569; margin: 0 0 18px; line-height: 1.5;">
          You have been idle for a while. For terminal and prescription security, your session will automatically disconnect in:
        </p>

        <!-- Countdown Display -->
        <div style="background: #f8fafc; border: 2px dashed #fde68a; border-radius: 12px; padding: 12px 20px; margin-bottom: 22px; display: inline-flex; align-items: center; gap: 8px;">
          <lucide-icon name="alert-triangle" [size]="16" color="#d97706"></lucide-icon>
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 800; color: #b45309;">
            {{ inactivityService.formattedTimeRemaining() }}
          </span>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button type="button" 
                  (click)="inactivityService.logoutNow()" 
                  class="btn btn-outline" 
                  style="flex: 1; padding: 10px 14px; font-size: 13px; color: #64748b;">
            <lucide-icon name="log-out" [size]="14"></lucide-icon>
            <span>Log Out</span>
          </button>
          
          <button type="button" 
                  (click)="inactivityService.keepAlive()" 
                  class="btn btn-primary" 
                  style="flex: 1.5; padding: 10px 16px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            <lucide-icon name="check-circle" [size]="15"></lucide-icon>
            <span>Stay Logged In</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class SessionTimeoutModalComponent {
  inactivityService = inject(InactivityService);
}
