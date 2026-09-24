import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div *ngIf="confirmationService.activeDialog() as dialog"
         class="confirm-modal-overlay"
         (click)="onBackdropClick($event)">
      <div class="confirm-modal-card" (click)="$event.stopPropagation()">
        <!-- Header / Icon -->
        <div style="display: flex; gap: 14px; align-items: flex-start;">
          <div [ngClass]="getIconContainerClass(dialog.type)">
            <lucide-icon [name]="dialog.icon || 'trash-2'" [size]="22"></lucide-icon>
          </div>
          <div style="flex: 1; min-width: 0;">
            <h3 style="font-size: 16px; font-weight: 800; color: var(--slate-900); margin: 0 0 6px;">
              {{ dialog.title }}
            </h3>
            <p style="font-size: 13px; color: var(--slate-600); line-height: 1.5; margin: 0; word-break: break-word;">
              {{ dialog.message }}
            </p>
          </div>
        </div>

        <!-- Action Footer -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--slate-100);">
          <button type="button"
                  (click)="confirmationService.handleCancel()"
                  class="btn btn-outline"
                  style="padding: 8px 16px; font-size: 13px; font-weight: 600;">
            {{ dialog.cancelText || 'Cancel' }}
          </button>
          
          <button type="button"
                  (click)="confirmationService.handleConfirm()"
                  [ngClass]="getConfirmBtnClass(dialog.type)"
                  style="padding: 8px 18px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon [name]="dialog.icon || 'check'" [size]="14"></lucide-icon>
            {{ dialog.confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 16px;
      animation: fadeIn 0.15s ease-out;
    }

    .confirm-modal-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid var(--slate-200);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      width: 440px;
      max-width: 100%;
      padding: 22px;
      animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .icon-container-danger {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: #fee2e2;
      color: #dc2626;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-container-warning {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: #fef3c7;
      color: #d97706;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-container-info {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: #e0f2fe;
      color: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-container-primary {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: #ede9fe;
      color: #7c3aed;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleUp {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(public confirmationService: ConfirmationService) {}

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmationService.activeDialog()) {
      this.confirmationService.handleCancel();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.confirmationService.handleCancel();
    }
  }

  getIconContainerClass(type?: string): string {
    switch (type) {
      case 'warning': return 'icon-container-warning';
      case 'info': return 'icon-container-info';
      case 'primary': return 'icon-container-primary';
      default: return 'icon-container-danger';
    }
  }

  getConfirmBtnClass(type?: string): string {
    switch (type) {
      case 'warning': return 'btn btn-warning';
      case 'info': return 'btn btn-info';
      case 'primary': return 'btn btn-primary';
      default: return 'btn btn-danger';
    }
  }
}
