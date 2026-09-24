import { Injectable, signal } from '@angular/core';

export interface ConfirmationOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'primary';
  icon?: string;
}

export interface ActiveConfirmation extends ConfirmationOptions {
  id: string;
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  activeDialog = signal<ActiveConfirmation | null>(null);

  confirm(options: ConfirmationOptions | string): Promise<boolean> {
    const opts: ConfirmationOptions = typeof options === 'string'
      ? { message: options, title: 'Confirm Action', type: 'danger' }
      : {
          title: options.title || 'Confirm Action',
          message: options.message,
          confirmText: options.confirmText || (options.type === 'danger' ? 'Yes, Delete' : 'Confirm'),
          cancelText: options.cancelText || 'Cancel',
          type: options.type || 'danger',
          icon: options.icon || (options.type === 'warning' ? 'alert-triangle' : (options.type === 'info' ? 'help-circle' : 'trash-2'))
        };

    return new Promise<boolean>((resolve) => {
      this.activeDialog.set({
        ...opts,
        id: Math.random().toString(36).substring(2, 9),
        resolve
      });
    });
  }

  handleConfirm(): void {
    const dialog = this.activeDialog();
    if (dialog) {
      dialog.resolve(true);
      this.activeDialog.set(null);
    }
  }

  handleCancel(): void {
    const dialog = this.activeDialog();
    if (dialog) {
      dialog.resolve(false);
      this.activeDialog.set(null);
    }
  }
}
