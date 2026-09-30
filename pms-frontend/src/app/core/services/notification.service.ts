import { Injectable, signal } from '@angular/core';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications = signal<ToastNotification[]>([]);

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastNotification = { id, type, message };
    this.notifications.update(list => [...list, item]);

    setTimeout(() => {
      this.remove(id);
    }, 4000);
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string): void { this.show(message, 'error'); }
  warning(message: string): void { this.show(message, 'warning'); }
  info(message: string): void { this.show(message, 'info'); }

  remove(id: string): void {
    this.notifications.update(list => list.filter(n => n.id !== id));
  }

  clearAll(): void {
    this.notifications.set([]);
  }
}

