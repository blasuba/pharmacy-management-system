import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ValidationService } from '../../core/services/validation.service';
import { environment } from '../../../environments/environment';
import { PaginationComponent, PaginatePipe } from '../../shared';

export interface CashShift {
  id: number;
  shiftNumber: string;
  status: 'OPEN' | 'CLOSED';
  cashierId: number;
  cashierName: string;
  branchName: string;
  openedAt: string;
  closedAt: string | null;
  openingBalance: number;
  cashSalesTotal: number;
  digitalSalesTotal: number;
  cashInTotal: number;
  cashOutTotal: number;
  expectedCash: number;
  closingActualCash: number | null;
  discrepancy: number | null;
  notes: string | null;
}

export interface CashTransaction {
  id: number;
  transactionType: 'CASH_IN' | 'CASH_OUT';
  amount: number;
  category: string;
  reason: string;
  performedBy?: { id: number; fullName: string; username: string };
  createdAt: string;
}

@Component({
  selector: 'app-cash-management',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent, PaginatePipe],
  template: `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <h1 style="font-size: 22px; font-weight: 800; color: var(--slate-900);">Cash Register & Drawer Management</h1>
            <span class="badge" [ngClass]="activeShift ? 'badge-success' : 'badge-warning'">
              {{ activeShift ? 'Drawer Active (Shift #' + activeShift.shiftNumber + ')' : 'Drawer Closed' }}
            </span>
          </div>
          <p style="font-size: 13px; color: var(--slate-500); margin-top: 2px;">
            Physical cash float tracking, live expected drawer balance, petty expense vouchers, and daily Z-Reports
          </p>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          <button *ngIf="!activeShift" (click)="openOpenShiftModal()" class="btn btn-primary" style="box-shadow: var(--shadow); display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon name="plus" [size]="15"></lucide-icon> Open Register Shift
          </button>

          <ng-container *ngIf="activeShift">
            <button (click)="openCashInModal()" class="btn btn-success" style="padding: 7px 14px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
              <lucide-icon name="arrow-down-circle" [size]="14"></lucide-icon> + Cash-In Deposit
            </button>
            <button (click)="openCashOutModal()" class="btn btn-danger" style="padding: 7px 14px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
              <lucide-icon name="arrow-up-circle" [size]="14"></lucide-icon> - Cash-Out Payout
            </button>
            <button (click)="openCloseShiftModal()" class="btn btn-outline" style="padding: 7px 14px; font-size: 12px; background: #0f172a; color: #fff; border-color: #0f172a; display: inline-flex; align-items: center; gap: 6px;">
              <lucide-icon name="lock" [size]="14"></lucide-icon> Close & Reconcile
            </button>
          </ng-container>
        </div>
      </div>

      <!-- Active Shift Overview Cards -->
      <div *ngIf="activeShift" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
        <!-- Live Expected Drawer Cash -->
        <div class="card" style="border-left: 4px solid #10b981; background: #f0fdf4;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase;">Expected Cash in Drawer</span>
            <lucide-icon name="wallet" [size]="17" color="#059669"></lucide-icon>
          </div>
          <div style="font-size: 24px; font-weight: 800; color: #047857; margin: 6px 0 2px;" class="font-mono">
            ETB {{ activeShift.expectedCash | number:'1.2-2' }}
          </div>
          <div style="font-size: 11px; color: #059669;">
            Float ({{ activeShift.openingBalance }}) + Net Inflow ({{ activeShift.cashSalesTotal + activeShift.cashInTotal - activeShift.cashOutTotal | number:'1.2-2' }})
          </div>
        </div>

        <!-- Opening Float -->
        <div class="card" style="border-left: 4px solid #0284c7;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Opening Float</span>
            <lucide-icon name="circle-dollar-sign" [size]="17" color="#0284c7"></lucide-icon>
          </div>
          <div style="font-size: 22px; font-weight: 800; color: var(--slate-900); margin: 6px 0 2px;" class="font-mono">
            ETB {{ activeShift.openingBalance | number:'1.2-2' }}
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Declared at {{ activeShift.openedAt | date:'shortTime' }}
          </div>
        </div>

        <!-- Cash Sales -->
        <div class="card" style="border-left: 4px solid #059669;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Cash Sales Inflow</span>
            <lucide-icon name="trending-up" [size]="17" color="#059669"></lucide-icon>
          </div>
          <div style="font-size: 22px; font-weight: 800; color: #059669; margin: 6px 0 2px;" class="font-mono">
            +ETB {{ activeShift.cashSalesTotal | number:'1.2-2' }}
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Digital sales: ETB {{ activeShift.digitalSalesTotal | number:'1.2-2' }}
          </div>
        </div>

        <!-- Cash-In Deposits -->
        <div class="card" style="border-left: 4px solid #0d9488;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Cash-In Deposits</span>
            <lucide-icon name="arrow-down-circle" [size]="17" color="#0d9488"></lucide-icon>
          </div>
          <div style="font-size: 22px; font-weight: 800; color: #0d9488; margin: 6px 0 2px;" class="font-mono">
            +ETB {{ activeShift.cashInTotal | number:'1.2-2' }}
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Change additions & credit payments
          </div>
        </div>

        <!-- Cash-Out Payouts -->
        <div class="card" style="border-left: 4px solid #ef4444;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Cash-Out Payouts</span>
            <lucide-icon name="arrow-up-circle" [size]="17" color="#ef4444"></lucide-icon>
          </div>
          <div style="font-size: 22px; font-weight: 800; color: #dc2626; margin: 6px 0 2px;" class="font-mono">
            -ETB {{ activeShift.cashOutTotal | number:'1.2-2' }}
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Petty expenses & vendor payouts
          </div>
        </div>
      </div>

      <!-- Closed Drawer Alert -->
      <div *ngIf="!activeShift && !loading" class="card" style="background: #fffbeb; border: 1px solid #fde68a; display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 42px; height: 42px; border-radius: 10px; background: #fef3c7; display: flex; align-items: center; justify-content: center; color: #d97706;">
            <lucide-icon name="alert-triangle" [size]="22"></lucide-icon>
          </div>
          <div>
            <div style="font-weight: 800; font-size: 15px; color: #92400e;">Cash Register Drawer is Closed</div>
            <div style="font-size: 13px; color: #b45309;">Please open a shift float to record cash sales and manage drawer transactions.</div>
          </div>
        </div>
        <button (click)="openOpenShiftModal()" class="btn btn-warning" style="background: #d97706; color: #fff; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="plus" [size]="15"></lucide-icon> Open Shift Float Now
        </button>
      </div>

      <!-- Tabs Navigation -->
      <div style="display: flex; gap: 8px; border-bottom: 2px solid var(--slate-200); padding-bottom: 8px; flex-wrap: wrap;">
        <button (click)="activeTab = 'shifts'"
                [style.background]="activeTab === 'shifts' ? '#0284c7' : 'transparent'"
                [style.color]="activeTab === 'shifts' ? '#fff' : 'var(--slate-600)'"
                class="btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="history" [size]="15"></lucide-icon> Shift Audit & Z-Reports ({{ allShifts.length }})
        </button>

        <button *ngIf="activeShift" (click)="activeTab = 'transactions'"
                [style.background]="activeTab === 'transactions' ? '#0284c7' : 'transparent'"
                [style.color]="activeTab === 'transactions' ? '#fff' : 'var(--slate-600)'"
                class="btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="banknote" [size]="15"></lucide-icon> Active Shift Transactions ({{ activeTransactions.length }})
        </button>
      </div>

      <!-- Tab 1: Shift History Table -->
      <div *ngIf="activeTab === 'shifts'" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Filters Toolbar -->
        <div class="card" style="padding: 14px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 260px; position: relative;">
            <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
            <input type="text" [(ngModel)]="shiftSearchQuery" (input)="shiftPage = 1"
                   class="form-control" style="padding-left: 36px;" placeholder="Search shift #, cashier name, or notes..." />
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <select [(ngModel)]="shiftStatusFilter" (change)="shiftPage = 1" class="form-control" style="width: auto; min-width: 160px;">
              <option value="">All Shifts</option>
              <option value="OPEN">Open Drawers</option>
              <option value="CLOSED">Closed Shifts</option>
            </select>
            <button (click)="resetShiftFilters()" class="btn btn-outline" style="padding: 8px 12px; display: inline-flex; align-items: center; gap: 4px;">
              <lucide-icon name="rotate-ccw" [size]="13"></lucide-icon> Reset
            </button>
          </div>
        </div>

        <div class="card" style="padding: 0; overflow: hidden;">
          <app-pagination
            [totalItems]="filteredShifts().length"
            [pageSize]="shiftPageSize"
            [currentPage]="shiftPage"
            (pageChange)="shiftPage = $event"
            (pageSizeChange)="shiftPageSize = $event; shiftPage = 1">
          </app-pagination>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
              <thead style="background: #f8fafc; border-bottom: 1px solid var(--slate-200); color: var(--slate-600); font-weight: 700;">
                <tr>
                  <th style="padding: 12px 16px;">Shift #</th>
                  <th style="padding: 12px 16px;">Cashier</th>
                  <th style="padding: 12px 16px;">Opened</th>
                  <th style="padding: 12px 16px;">Closed</th>
                  <th style="padding: 12px 16px; text-align: right;">Opening Float</th>
                  <th style="padding: 12px 16px; text-align: right;">Cash Sales</th>
                  <th style="padding: 12px 16px; text-align: right;">Expected</th>
                  <th style="padding: 12px 16px; text-align: right;">Counted</th>
                  <th style="padding: 12px 16px; text-align: center;">Variance</th>
                  <th style="padding: 12px 16px; text-align: center;">Status</th>
                  <th style="padding: 12px 16px; text-align: center;">Z-Report</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of (filteredShifts() | paginate: shiftPage : shiftPageSize)" style="border-bottom: 1px solid var(--slate-100);" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                  <td style="padding: 12px 16px; font-weight: 800; font-family: monospace; color: var(--slate-900);">{{ s.shiftNumber }}</td>
                  <td style="padding: 12px 16px; font-weight: 700; color: var(--slate-800);">{{ s.cashierName }}</td>
                  <td style="padding: 12px 16px; color: var(--slate-500); font-size: 12px;">{{ s.openedAt | date:'short' }}</td>
                  <td style="padding: 12px 16px; color: var(--slate-500); font-size: 12px;">{{ s.closedAt ? (s.closedAt | date:'short') : 'Active' }}</td>
                  <td style="padding: 12px 16px; text-align: right; font-family: monospace;">{{ s.openingBalance | number:'1.2-2' }}</td>
                  <td style="padding: 12px 16px; text-align: right; font-family: monospace; color: #059669; font-weight: 700;">+{{ s.cashSalesTotal | number:'1.2-2' }}</td>
                  <td style="padding: 12px 16px; text-align: right; font-family: monospace; font-weight: 800; color: var(--slate-900);">{{ s.expectedCash | number:'1.2-2' }}</td>
                  <td style="padding: 12px 16px; text-align: right; font-family: monospace; font-weight: 800; color: var(--slate-900);">{{ s.closingActualCash != null ? (s.closingActualCash | number:'1.2-2') : '—' }}</td>
                  <td style="padding: 12px 16px; text-align: center;">
                    <span *ngIf="s.discrepancy == null" style="color: var(--slate-400);">—</span>
                    <span *ngIf="s.discrepancy === 0" class="badge badge-success">Balanced</span>
                    <span *ngIf="s.discrepancy && s.discrepancy > 0" class="badge badge-primary">+{{ s.discrepancy | number:'1.2-2' }} Over</span>
                    <span *ngIf="s.discrepancy && s.discrepancy < 0" class="badge badge-danger">{{ s.discrepancy | number:'1.2-2' }} Short</span>
                  </td>
                  <td style="padding: 12px 16px; text-align: center;">
                    <span class="badge" [ngClass]="s.status === 'OPEN' ? 'badge-success' : 'badge-primary'" style="text-transform: uppercase;">
                      {{ s.status }}
                    </span>
                  </td>
                  <td style="padding: 12px 16px; text-align: center;">
                    <button (click)="viewZReport(s)" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
                      <lucide-icon name="file-text" [size]="12"></lucide-icon> Z-Slip
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredShifts().length === 0">
                  <td colspan="11" style="text-align: center; padding: 36px; color: var(--slate-400);">No shift records found matching your filter criteria.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab 2: Transactions Table -->
      <div *ngIf="activeTab === 'transactions'" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Filters Toolbar -->
        <div class="card" style="padding: 14px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 260px; position: relative;">
            <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
            <input type="text" [(ngModel)]="txSearchQuery" (input)="txPage = 1"
                   class="form-control" style="padding-left: 36px;" placeholder="Search category, reason, or staff user..." />
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <select [(ngModel)]="txTypeFilter" (change)="txPage = 1" class="form-control" style="width: auto; min-width: 160px;">
              <option value="">All Transaction Types</option>
              <option value="CASH_IN">Cash-In Deposit</option>
              <option value="CASH_OUT">Cash-Out Payout</option>
            </select>
            <button (click)="resetTxFilters()" class="btn btn-outline" style="padding: 8px 12px; display: inline-flex; align-items: center; gap: 4px;">
              <lucide-icon name="rotate-ccw" [size]="13"></lucide-icon> Reset
            </button>
          </div>
        </div>

        <div class="card" style="padding: 0; overflow: hidden;">
          <app-pagination
            [totalItems]="filteredTransactions().length"
            [pageSize]="txPageSize"
            [currentPage]="txPage"
            (pageChange)="txPage = $event"
            (pageSizeChange)="txPageSize = $event; txPage = 1">
          </app-pagination>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
              <thead style="background: #f8fafc; border-bottom: 1px solid var(--slate-200); color: var(--slate-600); font-weight: 700;">
                <tr>
                  <th style="padding: 12px 16px;">Time</th>
                  <th style="padding: 12px 16px;">Type</th>
                  <th style="padding: 12px 16px;">Category</th>
                  <th style="padding: 12px 16px;">Reason / Notes</th>
                  <th style="padding: 12px 16px;">Authorized By</th>
                  <th style="padding: 12px 16px; text-align: right;">Amount (ETB)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let tx of (filteredTransactions() | paginate: txPage : txPageSize)" style="border-bottom: 1px solid var(--slate-100);">
                  <td style="padding: 12px 16px; color: var(--slate-500); font-family: monospace;">{{ tx.createdAt | date:'shortTime' }}</td>
                  <td style="padding: 12px 16px;">
                    <span class="badge" [ngClass]="tx.transactionType === 'CASH_IN' ? 'badge-success' : 'badge-danger'">
                      {{ tx.transactionType === 'CASH_IN' ? '⬇ CASH-IN' : '⬆ CASH-OUT' }}
                    </span>
                  </td>
                  <td style="padding: 12px 16px; font-weight: 700; color: var(--slate-800);">{{ tx.category }}</td>
                  <td style="padding: 12px 16px; color: var(--slate-600);">{{ tx.reason || '—' }}</td>
                  <td style="padding: 12px 16px; color: var(--slate-500);">{{ tx.performedBy?.fullName || tx.performedBy?.username || 'Current User' }}</td>
                  <td style="padding: 12px 16px; text-align: right; font-family: monospace; font-weight: 800; font-size: 14px;"
                      [style.color]="tx.transactionType === 'CASH_IN' ? '#059669' : '#dc2626'">
                    {{ tx.transactionType === 'CASH_IN' ? '+' : '-' }}{{ tx.amount | number:'1.2-2' }}
                  </td>
                </tr>
                <tr *ngIf="filteredTransactions().length === 0">
                  <td colspan="6" style="text-align: center; padding: 36px; color: var(--slate-400);">No cash transactions recorded matching your filter.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Open Shift -->
    <div *ngIf="showOpenModal" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 440px; max-width: 100%; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 10px;">
          <h3 style="font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <lucide-icon name="circle-dollar-sign" [size]="20" color="#059669"></lucide-icon> Open Register Shift Float
          </h3>
          <button (click)="showOpenModal = false" style="background: none; border: none; cursor: pointer; color: var(--slate-400);">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Opening Cash Float (ETB) *</label>
            <input type="number" [(ngModel)]="openForm.openingBalance" min="0" step="10" placeholder="500.00" class="form-control" style="font-size: 20px; font-weight: 800; color: #059669;" />
          </div>

          <!-- Quick Presets -->
          <div style="display: flex; gap: 6px; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: var(--slate-500);">Presets:</span>
            <button *ngFor="let p of [200, 500, 1000, 2000]" (click)="openForm.openingBalance = p" class="btn btn-outline" style="padding: 3px 8px; font-size: 11px;">
              {{ p }} ETB
            </button>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Shift Notes (Optional)</label>
            <textarea [(ngModel)]="openForm.notes" rows="2" class="form-control" placeholder="e.g. Counter #1 morning counter shift starting float"></textarea>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 10px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
            <button (click)="showOpenModal = false" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button (click)="submitOpenShift()" class="btn btn-success" style="flex: 2;">Confirm & Start Shift</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Cash-In / Cash-Out -->
    <div *ngIf="showTxModal" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 440px; max-width: 100%; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 10px;">
          <h3 style="font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <lucide-icon [name]="txForm.type === 'CASH_IN' ? 'arrow-down-circle' : 'arrow-up-circle'" [size]="20" [color]="txForm.type === 'CASH_IN' ? '#059669' : '#dc2626'"></lucide-icon>
            {{ txForm.type === 'CASH_IN' ? 'Cash-In (Drawer Deposit)' : 'Cash-Out (Expense / Payout)' }}
          </h3>
          <button (click)="showTxModal = false" style="background: none; border: none; cursor: pointer; color: var(--slate-400);">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Amount (ETB) *</label>
            <input type="number" [(ngModel)]="txForm.amount" min="1" step="5" class="form-control" style="font-size: 20px; font-weight: 800;" />
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Category *</label>
            <select [(ngModel)]="txForm.category" class="form-control">
              <ng-container *ngIf="txForm.type === 'CASH_IN'">
                <option value="CHANGE_DEPOSIT">Extra Change Float Deposit</option>
                <option value="CUSTOMER_CREDIT_SETTLEMENT">Customer Credit Settlement</option>
                <option value="MISC_INCOME">Miscellaneous Income</option>
              </ng-container>
              <ng-container *ngIf="txForm.type === 'CASH_OUT'">
                <option value="PETTY_CASH">Petty Cash / Daily Supplies</option>
                <option value="SUPPLIER_PAYOUT">Supplier Direct Cash Payout</option>
                <option value="UTILITY_EXPENSE">Utility / Fuel / Transport</option>
                <option value="OWNER_DRAW">Owner / Management Withdrawal</option>
                <option value="MISC_EXPENSE">Miscellaneous Expense</option>
              </ng-container>
            </select>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Reason / Description</label>
            <input type="text" [(ngModel)]="txForm.reason" class="form-control" placeholder="e.g. Purchased thermal receipt paper rolls" />
          </div>

          <div style="display: flex; gap: 10px; margin-top: 10px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
            <button (click)="showTxModal = false" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button (click)="submitCashTransaction()" [ngClass]="txForm.type === 'CASH_IN' ? 'btn-success' : 'btn-danger'" style="flex: 2;">
              Record Transaction
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Close Shift & Reconcile -->
    <div *ngIf="showCloseModal" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 480px; max-width: 100%; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 10px;">
          <h3 style="font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <lucide-icon name="lock" [size]="20" color="#dc2626"></lucide-icon> Close Shift & Reconcile Drawer
          </h3>
          <button (click)="showCloseModal = false" style="background: none; border: none; cursor: pointer; color: var(--slate-400);">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid var(--slate-200); display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
            <div><span style="color: var(--slate-500);">Opening Float:</span> <strong>ETB {{ activeShift?.openingBalance | number:'1.2-2' }}</strong></div>
            <div><span style="color: var(--slate-500);">Cash Sales:</span> <strong style="color: #059669;">+ETB {{ activeShift?.cashSalesTotal | number:'1.2-2' }}</strong></div>
            <div><span style="color: var(--slate-500);">Cash-In Total:</span> <strong style="color: #0d9488;">+ETB {{ activeShift?.cashInTotal | number:'1.2-2' }}</strong></div>
            <div><span style="color: var(--slate-500);">Cash-Out Total:</span> <strong style="color: #dc2626;">-ETB {{ activeShift?.cashOutTotal | number:'1.2-2' }}</strong></div>
            <div style="grid-column: span 2; border-top: 1px solid var(--slate-200); padding-top: 8px; display: flex; justify-content: space-between; font-size: 14px;">
              <span>Expected Cash in Till:</span>
              <strong style="color: #059669; font-size: 16px;">ETB {{ activeShift?.expectedCash | number:'1.2-2' }}</strong>
            </div>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Physical Counted Cash in Till (ETB) *</label>
            <input type="number" [(ngModel)]="closeForm.closingActualCash" min="0" step="5" class="form-control" style="font-size: 20px; font-weight: 800;" />
          </div>

          <div *ngIf="closeForm.closingActualCash != null && activeShift" style="padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 700; display: flex; justify-content: space-between; align-items: center;"
               [style.background]="closeForm.closingActualCash === activeShift.expectedCash ? '#d1fae5' : (closeForm.closingActualCash > activeShift.expectedCash ? '#e0f2fe' : '#fee2e2')"
               [style.color]="closeForm.closingActualCash === activeShift.expectedCash ? '#065f46' : (closeForm.closingActualCash > activeShift.expectedCash ? '#0369a1' : '#991b1b')">
            <span>Variance Status:</span>
            <span>
              ETB {{ (closeForm.closingActualCash - activeShift.expectedCash) | number:'1.2-2' }}
              ({{ closeForm.closingActualCash === activeShift.expectedCash ? 'Exact Balance' : (closeForm.closingActualCash > activeShift.expectedCash ? 'Surplus (+)' : 'Shortage (-)') }})
            </span>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Closing Handover Notes</label>
            <textarea [(ngModel)]="closeForm.notes" rows="2" class="form-control" placeholder="e.g. Register balanced. Handed over to next shift cashier."></textarea>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 10px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
            <button (click)="showCloseModal = false" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button (click)="submitCloseShift()" class="btn btn-danger" style="flex: 2;">Finalize & Close Shift</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Z-Report Slip Preview -->
    <div *ngIf="selectedZReport" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card printable-area" style="width: 360px; max-width: 100%; padding: 22px; font-family: monospace; font-size: 12px;">
        <div style="text-align: center; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; margin-bottom: 10px;">
          <h2 style="font-size: 15px; font-weight: 800; color: #0f172a;">APEX CENTRAL PHARMACY</h2>
          <div style="color: #64748b; font-size: 11px;">DAILY SHIFT Z-REPORT</div>
          <div style="color: #94a3b8; font-size: 10px;">Shift #{{ selectedZReport.shiftNumber }}</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 4px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; margin-bottom: 10px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between;"><span>Cashier:</span><strong>{{ selectedZReport.cashierName }}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Opened:</span><span>{{ selectedZReport.openedAt | date:'short' }}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Closed:</span><span>{{ selectedZReport.closedAt ? (selectedZReport.closedAt | date:'short') : 'Active' }}</span></div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 4px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between;"><span>Opening Float:</span><span>{{ selectedZReport.openingBalance | number:'1.2-2' }}</span></div>
          <div style="display: flex; justify-content: space-between; color: #059669;"><span>(+) Cash Sales:</span><span>{{ selectedZReport.cashSalesTotal | number:'1.2-2' }}</span></div>
          <div style="display: flex; justify-content: space-between; color: #0d9488;"><span>(+) Cash In:</span><span>{{ selectedZReport.cashInTotal | number:'1.2-2' }}</span></div>
          <div style="display: flex; justify-content: space-between; color: #dc2626;"><span>(-) Cash Out:</span><span>{{ selectedZReport.cashOutTotal | number:'1.2-2' }}</span></div>
          <div style="display: flex; justify-content: space-between; color: #0284c7;"><span>Digital Sales:</span><span>{{ selectedZReport.digitalSalesTotal | number:'1.2-2' }}</span></div>
          <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 13px; border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 4px;">
            <span>Expected Cash:</span><span>ETB {{ selectedZReport.expectedCash | number:'1.2-2' }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 800;">
            <span>Actual Count:</span><span>ETB {{ selectedZReport.closingActualCash != null ? (selectedZReport.closingActualCash | number:'1.2-2') : '—' }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 800;"
               [style.color]="selectedZReport.discrepancy && selectedZReport.discrepancy < 0 ? '#dc2626' : '#059669'">
            <span>Variance:</span>
            <span>ETB {{ selectedZReport.discrepancy != null ? (selectedZReport.discrepancy | number:'1.2-2') : '0.00' }}</span>
          </div>
        </div>

        <div *ngIf="selectedZReport.notes" style="font-size: 11px; color: var(--slate-500); border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; margin-bottom: 10px;">
          Notes: {{ selectedZReport.notes }}
        </div>

        <div style="display: flex; gap: 8px;" class="not-printable">
          <button (click)="selectedZReport = null" class="btn btn-outline" style="flex: 1;">Close</button>
          <button (click)="printZReport()" class="btn btn-primary" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            <lucide-icon name="printer" [size]="14"></lucide-icon> Print Slip
          </button>
        </div>
      </div>
    </div>
  `
})
export class CashManagementComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/cash/shifts`;

  activeShift: CashShift | null = null;
  allShifts: CashShift[] = [];
  activeTransactions: CashTransaction[] = [];
  activeTab: 'shifts' | 'transactions' = 'shifts';
  loading = false;
  currentUser: any = null;

  shiftPage = 1;
  shiftPageSize = 10;
  txPage = 1;
  txPageSize = 10;

  shiftSearchQuery = '';
  shiftStatusFilter = '';
  txSearchQuery = '';
  txTypeFilter = '';

  filteredShifts(): CashShift[] {
    const q = this.shiftSearchQuery.toLowerCase().trim();
    const status = this.shiftStatusFilter;
    return this.allShifts.filter(s => {
      const matchSearch = !q ||
        s.shiftNumber?.toLowerCase().includes(q) ||
        s.cashierName?.toLowerCase().includes(q) ||
        s.notes?.toLowerCase().includes(q);
      const matchStatus = !status || s.status === status;
      return matchSearch && matchStatus;
    });
  }

  resetShiftFilters(): void {
    this.shiftSearchQuery = '';
    this.shiftStatusFilter = '';
    this.shiftPage = 1;
  }

  filteredTransactions(): CashTransaction[] {
    const q = this.txSearchQuery.toLowerCase().trim();
    const type = this.txTypeFilter;
    return this.activeTransactions.filter(tx => {
      const matchSearch = !q ||
        tx.category?.toLowerCase().includes(q) ||
        tx.reason?.toLowerCase().includes(q) ||
        tx.performedBy?.fullName?.toLowerCase().includes(q) ||
        tx.performedBy?.username?.toLowerCase().includes(q);
      const matchType = !type || tx.transactionType === type;
      return matchSearch && matchType;
    });
  }

  resetTxFilters(): void {
    this.txSearchQuery = '';
    this.txTypeFilter = '';
    this.txPage = 1;
  }

  showOpenModal = false;
  showTxModal = false;
  showCloseModal = false;
  selectedZReport: CashShift | null = null;

  openForm = { openingBalance: 500, notes: '' };
  txForm: { type: 'CASH_IN' | 'CASH_OUT'; amount: number; category: string; reason: string } = {
    type: 'CASH_IN',
    amount: 100,
    category: 'CHANGE_DEPOSIT',
    reason: ''
  };
  closeForm = { closingActualCash: 0, notes: '' };

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
    private validationService: ValidationService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUser();
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.http.get<{ data: CashShift }>(`${this.apiUrl}/current`).subscribe({
      next: res => {
        this.activeShift = res.data;
        if (this.activeShift) {
          this.closeForm.closingActualCash = this.activeShift.expectedCash;
          this.loadShiftTransactions(this.activeShift.id);
        }
        this.loadAllShifts();
      },
      error: () => {
        this.activeShift = null;
        this.loadAllShifts();
      }
    });
  }

  loadAllShifts() {
    this.http.get<{ data: CashShift[] }>(this.apiUrl).subscribe({
      next: res => {
        this.allShifts = res.data || [];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadShiftTransactions(shiftId: number) {
    this.http.get<{ data: CashTransaction[] }>(`${this.apiUrl}/${shiftId}/transactions`).subscribe({
      next: res => this.activeTransactions = res.data || []
    });
  }

  openOpenShiftModal() {
    this.openForm = { openingBalance: 500, notes: '' };
    this.showOpenModal = true;
  }

  submitOpenShift() {
    if (!this.validationService.isPositiveNumber(this.openForm.openingBalance, true)) {
      this.notificationService.warning('Opening float balance must be a valid non-negative number.');
      return;
    }

    this.http.post<{ data: CashShift }>(`${this.apiUrl}/open`, this.openForm).subscribe({
      next: res => {
        this.activeShift = res.data;
        this.showOpenModal = false;
        this.notificationService.success(`Shift #${res.data.shiftNumber} opened with ${res.data.openingBalance} ETB float!`);
        this.loadData();
      },
      error: err => this.notificationService.error(err.error?.message || 'Failed to open shift')
    });
  }

  openCashInModal() {
    this.txForm = { type: 'CASH_IN', amount: 100, category: 'CHANGE_DEPOSIT', reason: '' };
    this.showTxModal = true;
  }

  openCashOutModal() {
    this.txForm = { type: 'CASH_OUT', amount: 50, category: 'PETTY_CASH', reason: '' };
    this.showTxModal = true;
  }

  submitCashTransaction() {
    const valResult = this.validationService.validateCashTransaction(this.txForm);
    if (!valResult.valid) {
      this.notificationService.warning(valResult.errors[0]);
      return;
    }

    this.http.post<{ data: CashShift }>(`${this.apiUrl}/transaction`, this.txForm).subscribe({
      next: res => {
        this.activeShift = res.data;
        this.showTxModal = false;
        this.notificationService.success(`Cash ${this.txForm.type === 'CASH_IN' ? 'Deposit' : 'Payout'} of ${this.txForm.amount} ETB recorded!`);
        this.loadData();
      },
      error: err => this.notificationService.error(err.error?.message || 'Failed to record cash transaction')
    });
  }

  openCloseShiftModal() {
    if (this.activeShift) {
      this.closeForm = { closingActualCash: this.activeShift.expectedCash, notes: '' };
    }
    this.showCloseModal = true;
  }

  submitCloseShift() {
    if (!this.validationService.isPositiveNumber(this.closeForm.closingActualCash, true)) {
      this.notificationService.warning('Counted cash must be a valid non-negative number.');
      return;
    }

    this.http.post<{ data: CashShift }>(`${this.apiUrl}/close`, this.closeForm).subscribe({
      next: res => {
        this.showCloseModal = false;
        this.selectedZReport = res.data;
        this.notificationService.success(`Shift #${res.data.shiftNumber} closed and balanced!`);
        this.loadData();
      },
      error: err => this.notificationService.error(err.error?.message || 'Failed to close shift')
    });
  }

  viewZReport(shift: CashShift) {
    this.selectedZReport = shift;
  }

  printZReport() {
    window.print();
  }
}
