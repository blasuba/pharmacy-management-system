import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { PaginationComponent, PaginatePipe } from '../../shared';

export interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  paymentMethod: string;
  receiptNumber?: string;
  vendorOrPayee?: string;
  notes?: string;
  recordedBy?: { id: number; fullName: string; username: string };
  branch?: { id: number; name: string };
  createdAt?: string;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent, PaginatePipe],
  template: `
    <div style="display: flex; flex-direction: column; gap: 18px;">
      
      <!-- ========================================================================= -->
      <!-- 1. HEADER ROW                                                             -->
      <!-- ========================================================================= -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: var(--slate-900); margin: 0;">Operating Expenses & Cost Ledger</h1>
          <p style="font-size: 13px; color: var(--slate-500); margin-top: 2px;">
            Manage pharmacy operating expenditures, overhead payments, petty cash, utilities, store rent & payroll.
          </p>
        </div>

        <div style="display: flex; gap: 8px;">
          <button (click)="openExpenseModal()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px; box-shadow: var(--shadow); font-weight: 700;">
            <lucide-icon name="plus" [size]="15"></lucide-icon> Record Expense
          </button>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 2. KPI SUMMARY CARDS                                                      -->
      <!-- ========================================================================= -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
        <!-- Card 1: Total Period Overheads -->
        <div class="card" style="border-left: 4px solid #d97706; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Total Period Overheads</span>
            <lucide-icon name="receipt" [size]="18" color="#d97706"></lucide-icon>
          </div>
          <div style="font-size: 22px; font-weight: 800; color: var(--slate-900); margin: 6px 0 2px; font-family: 'JetBrains Mono', monospace;">
            ETB {{ totalExpensesAmount() | number:'1.2-2' }}
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            {{ filteredExpenses().length }} logged expenditures in filter window
          </div>
        </div>

        <!-- Card 2: Facility & Rent / Utilities -->
        <div class="card" style="border-left: 4px solid #0284c7; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Facility, Rent & Utilities</span>
            <lucide-icon name="building-2" [size]="18" color="#0284c7"></lucide-icon>
          </div>
          <div style="font-size: 22px; font-weight: 800; color: #0284c7; margin: 6px 0 2px; font-family: 'JetBrains Mono', monospace;">
            ETB {{ getCategorySum(['RENT', 'UTILITIES', 'MAINTENANCE_REPAIRS']) | number:'1.2-2' }}
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Store rent, electricity, water & internet
          </div>
        </div>

        <!-- Card 3: Salaries & Operations -->
        <div class="card" style="border-left: 4px solid #10b981; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Salaries & Operations</span>
            <lucide-icon name="users" [size]="18" color="#059669"></lucide-icon>
          </div>
          <div style="font-size: 22px; font-weight: 800; color: #059669; margin: 6px 0 2px; font-family: 'JetBrains Mono', monospace;">
            ETB {{ getCategorySum(['SALARIES_PAYROLL', 'TRANSPORT_LOGISTICS', 'PACKAGING_CONSUMABLES']) | number:'1.2-2' }}
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Staff payroll, delivery transport & packaging
          </div>
        </div>

        <!-- Card 4: Regulatory, Taxes & Other -->
        <div class="card" style="border-left: 4px solid #8b5cf6; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Regulatory, Taxes & Other</span>
            <lucide-icon name="file-text" [size]="18" color="#7c3aed"></lucide-icon>
          </div>
          <div style="font-size: 22px; font-weight: 800; color: #7c3aed; margin: 6px 0 2px; font-family: 'JetBrains Mono', monospace;">
            ETB {{ getCategorySum(['LICENSES_REGULATORY', 'TAXES_LEVIES', 'OFFICE_SUPPLIES', 'MISCELLANEOUS', 'STOCK_LOSS_WRITE_OFF']) | number:'1.2-2' }}
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Annual pharmacy license, permits & taxes
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 3. TAB NAVIGATION                                                         -->
      <!-- ========================================================================= -->
      <div style="display: flex; gap: 8px; border-bottom: 2px solid var(--slate-200); padding-bottom: 8px; flex-wrap: wrap;">
        <button (click)="activeTab = 'ledger'"
                [style.background]="activeTab === 'ledger' ? '#0284c7' : 'transparent'"
                [style.color]="activeTab === 'ledger' ? '#fff' : 'var(--slate-600)'"
                class="btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="receipt" [size]="15"></lucide-icon> Expenses & Cost Ledger ({{ filteredExpenses().length }})
        </button>

        <button (click)="activeTab = 'categories'"
                [style.background]="activeTab === 'categories' ? '#0284c7' : 'transparent'"
                [style.color]="activeTab === 'categories' ? '#fff' : 'var(--slate-600)'"
                class="btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="tag" [size]="15"></lucide-icon> Category Breakdown ({{ categorySummaryList.length }})
        </button>

        <button (click)="activeTab = 'tender'"
                [style.background]="activeTab === 'tender' ? '#0284c7' : 'transparent'"
                [style.color]="activeTab === 'tender' ? '#fff' : 'var(--slate-600)'"
                class="btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="credit-card" [size]="15"></lucide-icon> Payment Channels Breakdown
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- 4. UNIFIED FILTERS & SEARCH TOOLBAR                                       -->
      <!-- ========================================================================= -->
      <div class="card" style="padding: 14px 16px; display: flex; flex-direction: column; gap: 12px;">
        
        <!-- Top Row: Search Input & Dropdown Selects -->
        <div style="display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 260px; position: relative;">
            <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
            <input type="text" [(ngModel)]="searchQuery" (input)="page.set(1)"
                   class="form-control" style="padding-left: 36px;" placeholder="Search expense title, payee, voucher #, or notes..." />
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <select [(ngModel)]="categoryFilter" (change)="page.set(1)" aria-label="Filter expenses by category" class="form-control" style="width: auto; min-width: 170px;">
              <option value="">All Categories</option>
              <option *ngFor="let cat of availableCategories" [value]="cat">{{ formatCategory(cat) }}</option>
            </select>

            <select [(ngModel)]="paymentMethodFilter" (change)="page.set(1)" aria-label="Filter expenses by payment method" class="form-control" style="width: auto; min-width: 170px;">
              <option value="">All Payment Methods</option>
              <option value="CASH">Physical Cash</option>
              <option value="MOBILE_MONEY">Telebirr / Mobile Money</option>
              <option value="CARD">Debit / Credit Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>

            <button (click)="resetFilters()" class="btn btn-outline" style="padding: 8px 12px; display: inline-flex; align-items: center; gap: 4px;" title="Reset all search and dropdown filters">
              <lucide-icon name="rotate-ccw" [size]="13"></lucide-icon> Reset
            </button>
          </div>
        </div>

        <!-- Bottom Row: Time Window Quick Pills & Custom Date Selectors -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-top: 1px solid var(--slate-100); padding-top: 10px;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <lucide-icon name="calendar" [size]="15" color="#0284c7"></lucide-icon>
            <span style="font-size: 12px; font-weight: 700; color: var(--slate-600);">Audit Period:</span>
            
            <div style="display: flex; background: #f1f5f9; padding: 2px; border-radius: 8px; gap: 2px;">
              <button (click)="setPeriod('TODAY')" [style.background]="periodMode === 'TODAY' ? '#fff' : 'transparent'" [style.color]="periodMode === 'TODAY' ? '#0284c7' : '#64748b'" class="btn-pill">Today</button>
              <button (click)="setPeriod('7D')" [style.background]="periodMode === '7D' ? '#fff' : 'transparent'" [style.color]="periodMode === '7D' ? '#0284c7' : '#64748b'" class="btn-pill">7 Days</button>
              <button (click)="setPeriod('MONTH')" [style.background]="periodMode === 'MONTH' ? '#fff' : 'transparent'" [style.color]="periodMode === 'MONTH' ? '#0284c7' : '#64748b'" class="btn-pill">This Month</button>
              <button (click)="setPeriod('QUARTER')" [style.background]="periodMode === 'QUARTER' ? '#fff' : 'transparent'" [style.color]="periodMode === 'QUARTER' ? '#0284c7' : '#64748b'" class="btn-pill">This Quarter</button>
              <button (click)="setPeriod('YEAR')" [style.background]="periodMode === 'YEAR' ? '#fff' : 'transparent'" [style.color]="periodMode === 'YEAR' ? '#0284c7' : '#64748b'" class="btn-pill">This Year</button>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 11px; color: var(--slate-500);">From:</span>
            <input type="date" [(ngModel)]="startDate" (change)="loadExpenses()" class="form-control" style="font-size: 12px; padding: 5px 8px; width: auto;" />
            <span style="font-size: 11px; color: var(--slate-500);">To:</span>
            <input type="date" [(ngModel)]="endDate" (change)="loadExpenses()" class="form-control" style="font-size: 12px; padding: 5px 8px; width: auto;" />
            <button (click)="loadExpenses()" class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;">Apply</button>
          </div>
        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- TAB 1: EXPENSES DATA TABLE                                                -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab === 'ledger'" class="card" style="padding: 0; overflow: hidden;">
        <app-pagination
          [totalItems]="filteredExpenses().length"
          [pageSize]="pageSize()"
          [currentPage]="page()"
          (pageChange)="page.set($event)"
          (pageSizeChange)="pageSize.set($event); page.set(1)">
        </app-pagination>

        <div class="table-responsive">
          <table class="data-table" style="margin: 0;">
            <thead>
              <tr>
                <th style="padding: 10px 14px;">Expense Date</th>
                <th style="padding: 10px 14px;">Title & Purpose</th>
                <th style="padding: 10px 14px;">Category</th>
                <th style="padding: 10px 14px;">Payment Method</th>
                <th style="padding: 10px 14px;">Receipt / Voucher #</th>
                <th style="padding: 10px 14px;">Payee / Vendor</th>
                <th style="padding: 10px 14px; text-align: right;">Amount (ETB)</th>
                <th style="padding: 10px 14px; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let exp of (filteredExpenses() | paginate: page() : pageSize())" style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 14px; color: #475569; font-size: 12.5px;">
                  {{ exp.expenseDate | date:'mediumDate' }}
                </td>

                <td style="padding: 10px 14px;">
                  <strong style="color: var(--slate-900); font-size: 13px;">{{ exp.title }}</strong>
                  <div *ngIf="exp.notes" style="font-size: 11px; color: var(--slate-500); margin-top: 1px;">{{ exp.notes }}</div>
                </td>

                <td style="padding: 10px 14px;">
                  <span class="badge badge-amber">{{ formatCategory(exp.category) }}</span>
                </td>

                <td style="padding: 10px 14px;">
                  <span class="badge badge-primary">{{ formatPaymentMethod(exp.paymentMethod) }}</span>
                </td>

                <td style="padding: 10px 14px;">
                  <code style="font-family: 'JetBrains Mono', monospace; font-size: 11.5px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 4px;">
                    {{ exp.receiptNumber || 'N/A' }}
                  </code>
                </td>

                <td style="padding: 10px 14px; color: #475569; font-size: 12.5px;">
                  {{ exp.vendorOrPayee || '—' }}
                </td>

                <td style="padding: 10px 14px; text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #d97706; font-size: 13.5px;">
                  ETB {{ exp.amount | number:'1.2-2' }}
                </td>

                <td style="padding: 10px 14px; text-align: right;">
                  <div style="display: inline-flex; gap: 4px;">
                    <button (click)="openExpenseModal(exp)" class="btn btn-outline" style="padding: 4px 7px; font-size: 11.5px; color: #0284c7; border-color: #bae6fd;" title="Edit Expense">
                      <lucide-icon name="edit" [size]="12"></lucide-icon>
                    </button>
                    <button (click)="deleteExpense(exp)" class="btn btn-outline" style="padding: 4px 7px; font-size: 11.5px; color: #ef4444; border-color: #fecaca;" title="Delete Expense">
                      <lucide-icon name="trash-2" [size]="12"></lucide-icon>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="filteredExpenses().length === 0">
                <td colspan="8" style="text-align: center; padding: 36px; color: #94a3b8;">
                  No operational expenses found matching your filter criteria.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 2: CATEGORY BREAKDOWN TABLE                                           -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab === 'categories'" style="display: flex; flex-direction: column; gap: 14px;">
        <div class="card" style="padding: 0; overflow: hidden;">
          <div class="table-responsive">
            <table class="data-table" style="margin: 0;">
              <thead>
                <tr>
                  <th style="padding: 10px 14px;">Expense Category</th>
                  <th style="padding: 10px 14px;">Accounting Classification</th>
                  <th style="padding: 10px 14px; text-align: center;">Entry Count</th>
                  <th style="padding: 10px 14px; text-align: right;">Total Outflow (ETB)</th>
                  <th style="padding: 10px 14px; text-align: right;">Share of Total OpEx</th>
                  <th style="padding: 10px 14px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of categorySummaryList" style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 14px;">
                    <span class="badge badge-amber" style="margin-right: 8px;">●</span>
                    <strong style="color: var(--slate-900);">{{ formatCategory(item.category) }}</strong>
                  </td>
                  <td style="padding: 10px 14px; color: var(--slate-600); font-size: 12.5px;">
                    {{ getCategoryClassification(item.category) }}
                  </td>
                  <td style="padding: 10px 14px; text-align: center;">
                    <span class="badge badge-primary">{{ item.count }} entries</span>
                  </td>
                  <td style="padding: 10px 14px; text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #d97706; font-size: 13.5px;">
                    ETB {{ item.amount | number:'1.2-2' }}
                  </td>
                  <td style="padding: 10px 14px; text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 700;">
                    {{ getCategorySharePct(item.amount) }}%
                  </td>
                  <td style="padding: 10px 14px; text-align: right;">
                    <button (click)="filterByCategory(item.category)" class="btn btn-outline" style="padding: 4px 8px; font-size: 11.5px; color: #0284c7;">
                      View Logs ➔
                    </button>
                  </td>
                </tr>

                <tr *ngIf="categorySummaryList.length === 0">
                  <td colspan="6" style="text-align: center; padding: 36px; color: #94a3b8;">
                    No category expenditures recorded in this period.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 3: PAYMENT CHANNELS BREAKDOWN                                         -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab === 'tender'" style="display: flex; flex-direction: column; gap: 14px;">
        <div class="card" style="padding: 0; overflow: hidden;">
          <div class="table-responsive">
            <table class="data-table" style="margin: 0;">
              <thead>
                <tr>
                  <th style="padding: 10px 14px;">Payment Method</th>
                  <th style="padding: 10px 14px;">Disbursement Account</th>
                  <th style="padding: 10px 14px; text-align: center;">Transactions</th>
                  <th style="padding: 10px 14px; text-align: right;">Total Disbursed (ETB)</th>
                  <th style="padding: 10px 14px; text-align: right;">Share of Total Paid</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of paymentMethodSummaryList" style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 14px;">
                    <span class="badge badge-primary">{{ formatPaymentMethod(item.method) }}</span>
                  </td>
                  <td style="padding: 10px 14px; color: var(--slate-600); font-size: 12.5px;">
                    {{ getPaymentAccountNote(item.method) }}
                  </td>
                  <td style="padding: 10px 14px; text-align: center;">
                    <span class="badge badge-amber">{{ item.count }} receipts</span>
                  </td>
                  <td style="padding: 10px 14px; text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #0284c7; font-size: 13.5px;">
                    ETB {{ item.amount | number:'1.2-2' }}
                  </td>
                  <td style="padding: 10px 14px; text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 700;">
                    {{ getPaymentSharePct(item.amount) }}%
                  </td>
                </tr>
                <tr *ngIf="paymentMethodSummaryList.length === 0">
                  <td colspan="5" style="text-align: center; padding: 36px; color: #94a3b8;">
                    No payment transactions found in this audit window.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>

    <!-- ========================================================================= -->
    <!-- MODAL: RECORD / EDIT OPERATING EXPENSE                                    -->
    <!-- ========================================================================= -->
    <div *ngIf="showModal" class="modal-overlay">
      <div class="card modal-content" style="width: 560px; max-width: 95vw; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 10px;">
          <h3 style="font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px; color: var(--slate-900);">
            <lucide-icon name="receipt" [size]="20" color="#d97706"></lucide-icon>
            {{ editingId ? 'Edit Operating Expense' : 'Record Operating Expense' }}
          </h3>
          <button (click)="showModal = false" style="background: none; border: none; cursor: pointer; color: var(--slate-400); font-size: 18px;">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Expense Title / Description *</label>
            <input type="text" [(ngModel)]="form.title" class="form-control" placeholder="e.g. Pharmacy Store Rent - September" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Expense Category *</label>
              <select [(ngModel)]="form.category" class="form-control">
                <option *ngFor="let cat of availableCategories" [value]="cat">{{ formatCategory(cat) }}</option>
              </select>
            </div>

            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Amount (ETB) *</label>
              <input type="number" [(ngModel)]="form.amount" min="0.01" step="10" class="form-control" style="font-family: monospace; font-weight: 700;" placeholder="e.g. 7500.00" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Expense Date *</label>
              <input type="date" [(ngModel)]="form.expenseDate" class="form-control" />
            </div>

            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Payment Method *</label>
              <select [(ngModel)]="form.paymentMethod" class="form-control">
                <option value="CASH">Physical Cash</option>
                <option value="MOBILE_MONEY">Telebirr / Mobile Money</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Receipt / Voucher #</label>
              <input type="text" [(ngModel)]="form.receiptNumber" class="form-control" placeholder="e.g. REC-0941" />
            </div>

            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Vendor / Payee</label>
              <input type="text" [(ngModel)]="form.vendorOrPayee" class="form-control" placeholder="e.g. Ethiopian Electric Utility" />
            </div>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Notes / Remarks</label>
            <input type="text" [(ngModel)]="form.notes" class="form-control" placeholder="e.g. Approved monthly recurring overhead" />
          </div>

          <div style="display: flex; gap: 10px; margin-top: 10px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
            <button (click)="showModal = false" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button (click)="saveExpense()" class="btn btn-primary" style="flex: 2; font-weight: 700;">
              {{ editingId ? 'Save Changes' : 'Record Expense' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-pill {
      border: none;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 6px;
    }
    .badge-primary { background: #e0f2fe; color: #0284c7; }
    .badge-amber { background: #fef3c7; color: #d97706; }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
  `]
})
export class ExpensesComponent implements OnInit {
  expenses = signal<Expense[]>([]);
  page = signal(1);
  pageSize = signal(10);

  activeTab: 'ledger' | 'categories' | 'tender' = 'ledger';
  periodMode: 'TODAY' | '7D' | 'MONTH' | 'QUARTER' | 'YEAR' = 'MONTH';
  startDate = '';
  endDate = '';
  searchQuery = '';
  categoryFilter = '';
  paymentMethodFilter = '';

  showModal = false;
  editingId: number | null = null;

  availableCategories = [
    'RENT', 'UTILITIES', 'SALARIES_PAYROLL', 'TRANSPORT_LOGISTICS',
    'LICENSES_REGULATORY', 'MAINTENANCE_REPAIRS', 'PACKAGING_CONSUMABLES',
    'MARKETING_ADVERTISING', 'STOCK_LOSS_WRITE_OFF', 'TAXES_LEVIES',
    'OFFICE_SUPPLIES', 'MISCELLANEOUS'
  ];

  form = {
    title: '',
    category: 'RENT',
    amount: null as number | null,
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    receiptNumber: '',
    vendorOrPayee: '',
    notes: ''
  };

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.setPeriod('MONTH');
  }

  setPeriod(mode: 'TODAY' | '7D' | 'MONTH' | 'QUARTER' | 'YEAR'): void {
    this.periodMode = mode;
    const now = new Date();
    let start = new Date();

    if (mode === 'TODAY') {
      start = new Date();
    } else if (mode === '7D') {
      start.setDate(now.getDate() - 7);
    } else if (mode === 'MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (mode === 'QUARTER') {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qStartMonth, 1);
    } else if (mode === 'YEAR') {
      start = new Date(now.getFullYear(), 0, 1);
    }

    this.startDate = start.toISOString().split('T')[0];
    this.endDate = now.toISOString().split('T')[0];
    this.loadExpenses();
  }

  loadExpenses(): void {
    let url = `${environment.apiUrl}/expenses`;
    if (this.startDate && this.endDate) {
      url += `?startDate=${this.startDate}&endDate=${this.endDate}`;
    }
    this.http.get<any>(url).subscribe({
      next: (res) => this.expenses.set(res.data || [])
    });
  }

  totalExpensesAmount(): number {
    return this.filteredExpenses().reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }

  getCategorySum(categories: string[]): number {
    return this.expenses()
      .filter(e => categories.includes(e.category))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }

  filteredExpenses(): Expense[] {
    const q = this.searchQuery.toLowerCase().trim();
    const cat = this.categoryFilter;
    const pm = this.paymentMethodFilter;

    return this.expenses().filter(e => {
      const matchSearch = !q ||
        e.title?.toLowerCase().includes(q) ||
        e.vendorOrPayee?.toLowerCase().includes(q) ||
        e.receiptNumber?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q);
      const matchCat = !cat || e.category === cat;
      const matchPm = !pm || e.paymentMethod === pm;
      return matchSearch && matchCat && matchPm;
    });
  }

  get categorySummaryList(): Array<{ category: string; amount: number; count: number }> {
    const map = new Map<string, { amount: number; count: number }>();
    for (const exp of this.filteredExpenses()) {
      const curr = map.get(exp.category) || { amount: 0, count: 0 };
      curr.amount += Number(exp.amount || 0);
      curr.count += 1;
      map.set(exp.category, curr);
    }
    return Array.from(map.entries())
      .map(([category, data]) => ({ category, amount: data.amount, count: data.count }))
      .sort((a, b) => b.amount - a.amount);
  }

  get paymentMethodSummaryList(): Array<{ method: string; amount: number; count: number }> {
    const map = new Map<string, { amount: number; count: number }>();
    for (const exp of this.filteredExpenses()) {
      const curr = map.get(exp.paymentMethod) || { amount: 0, count: 0 };
      curr.amount += Number(exp.amount || 0);
      curr.count += 1;
      map.set(exp.paymentMethod, curr);
    }
    return Array.from(map.entries())
      .map(([method, data]) => ({ method, amount: data.amount, count: data.count }))
      .sort((a, b) => b.amount - a.amount);
  }

  getCategorySharePct(amount: number): number {
    const total = this.totalExpensesAmount();
    if (total <= 0) return 0;
    return Math.round((amount / total) * 100);
  }

  getPaymentSharePct(amount: number): number {
    const total = this.totalExpensesAmount();
    if (total <= 0) return 0;
    return Math.round((amount / total) * 100);
  }

  getCategoryClassification(key: string): string {
    switch (key) {
      case 'RENT':
      case 'UTILITIES':
      case 'LICENSES_REGULATORY':
      case 'TAXES_LEVIES':
        return 'Fixed Recurring Overhead';
      case 'SALARIES_PAYROLL':
      case 'MAINTENANCE_REPAIRS':
      case 'PACKAGING_CONSUMABLES':
      case 'TRANSPORT_LOGISTICS':
        return 'Variable Operating Outflow';
      case 'STOCK_LOSS_WRITE_OFF':
        return 'Non-Operating Stock Loss';
      default:
        return 'General Operational Overhead';
    }
  }

  getPaymentAccountNote(method: string): string {
    switch (method) {
      case 'CASH': return 'Physical POS Cash Drawer / Petty Cash';
      case 'MOBILE_MONEY': return 'Telebirr / CBE Birr Merchant Account';
      case 'CARD': return 'Bank POS Card Settlement';
      case 'BANK_TRANSFER': return 'Commercial Bank Account Transfer';
      default: return 'General Payment Account';
    }
  }

  filterByCategory(cat: string): void {
    this.categoryFilter = cat;
    this.activeTab = 'ledger';
    this.page.set(1);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.categoryFilter = '';
    this.paymentMethodFilter = '';
    this.page.set(1);
  }

  formatCategory(cat: string): string {
    if (!cat) return '';
    return cat.replace(/_/g, ' ').replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
  }

  formatPaymentMethod(method: string): string {
    switch (method) {
      case 'CASH': return 'Physical Cash';
      case 'MOBILE_MONEY': return 'Telebirr / Mobile Money';
      case 'CARD': return 'Card Payment';
      case 'BANK_TRANSFER': return 'Bank Transfer';
      default: return method || 'Cash';
    }
  }

  openExpenseModal(exp?: Expense): void {
    if (exp) {
      this.editingId = exp.id;
      this.form = {
        title: exp.title,
        category: exp.category,
        amount: exp.amount,
        expenseDate: exp.expenseDate,
        paymentMethod: exp.paymentMethod,
        receiptNumber: exp.receiptNumber || '',
        vendorOrPayee: exp.vendorOrPayee || '',
        notes: exp.notes || ''
      };
    } else {
      this.editingId = null;
      this.form = {
        title: '',
        category: 'RENT',
        amount: null,
        expenseDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        receiptNumber: '',
        vendorOrPayee: '',
        notes: ''
      };
    }
    this.showModal = true;
  }

  saveExpense(): void {
    if (!this.form.title?.trim()) {
      this.notificationService.warning('Please enter an expense title.');
      return;
    }
    if (!this.form.amount || this.form.amount <= 0) {
      this.notificationService.warning('Please enter a valid amount greater than 0.');
      return;
    }

    if (this.editingId) {
      this.http.put<any>(`${environment.apiUrl}/expenses/${this.editingId}`, this.form).subscribe({
        next: () => {
          this.notificationService.success('Expense updated successfully.');
          this.showModal = false;
          this.loadExpenses();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to update expense')
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/expenses`, this.form).subscribe({
        next: () => {
          this.notificationService.success('Operating expense logged successfully.');
          this.showModal = false;
          this.loadExpenses();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to record expense')
      });
    }
  }

  async deleteExpense(exp: Expense): Promise<void> {
    const ok = await this.confirmationService.confirm({
      title: 'Delete Operating Expense',
      message: `Are you sure you want to delete expense "${exp.title}" (ETB ${exp.amount})?`,
      confirmText: 'Delete Expense',
      type: 'danger',
      icon: 'trash-2'
    });

    if (ok) {
      this.http.delete<any>(`${environment.apiUrl}/expenses/${exp.id}`).subscribe({
        next: () => {
          this.notificationService.success('Expense removed.');
          this.loadExpenses();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to delete expense')
      });
    }
  }
}
