import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LucideAngularModule],
  template: `
    <router-outlet></router-outlet>

    <!-- Global Toast Notifications Overlay (Shown on all pages including Login) -->
    <div style="position: fixed; bottom: 24px; right: 24px; z-index: 99999; display: flex; flex-direction: column; gap: 8px; max-width: 400px;">
      <div *ngFor="let notif of notificationService.notifications()"
           [style.border-left]="notif.type === 'success' ? '4px solid #10b981' : (notif.type === 'error' ? '4px solid #ef4444' : (notif.type === 'warning' ? '4px solid #f59e0b' : '4px solid #0284c7'))"
           style="min-width: 280px; padding: 12px 16px; border-radius: 8px; background: #0f172a; color: #fff; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); font-size: 13px; font-weight: 500; display: flex; align-items: center; justify-content: space-between; animation: slideIn 0.2s ease;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <lucide-icon *ngIf="notif.type === 'success'" name="check-circle" [size]="16" color="#10b981"></lucide-icon>
          <lucide-icon *ngIf="notif.type === 'error'" name="alert-circle" [size]="16" color="#ef4444"></lucide-icon>
          <lucide-icon *ngIf="notif.type === 'warning'" name="alert-triangle" [size]="16" color="#f59e0b"></lucide-icon>
          <lucide-icon *ngIf="notif.type === 'info'" name="info" [size]="16" color="#38bdf8"></lucide-icon>
          <span>{{ notif.message }}</span>
        </div>
        <button (click)="notificationService.remove(notif.id)" style="background: none; border: none; color: #94a3b8; cursor: pointer; margin-left: 10px; display: flex; align-items: center;">
          <lucide-icon name="x" [size]="14"></lucide-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from { transform: translateX(30px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class AppComponent {
  title = 'pms-frontend';

  constructor(public notificationService: NotificationService) {}
}

