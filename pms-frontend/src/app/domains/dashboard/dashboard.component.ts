import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth/services/auth.service';
import { PrintService } from '../../core/services/print.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div style="display: flex; flex-direction: column; gap: 24px;">

      <!-- Top Header & Role View Switcher for Admin -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <h1 style="font-size: 24px; font-weight: 800; color: var(--slate-900);">
              {{ getDashboardTitle() }}
            </h1>
            <span class="badge" [ngClass]="getRoleBadgeClass()">
              {{ currentPersona() }}
            </span>
          </div>
          <p style="font-size: 13px; color: var(--slate-500); margin-top: 2px;">
            {{ getDashboardSubtitle() }}
          </p>
        </div>

        <!-- Role View Switcher for Admin/Owner -->
        <div *ngIf="authService.hasRole('ROLE_OWNER')" style="display: flex; align-items: center; gap: 6px; background: #e2e8f0; padding: 4px; border-radius: 10px;">
          <span style="font-size: 11px; font-weight: 700; color: var(--slate-600); padding: 0 8px;">Switch Persona View:</span>
          <button (click)="activeView.set('ADMIN')"
                  [style.background]="activeView() === 'ADMIN' ? '#0f172a' : 'transparent'"
                  [style.color]="activeView() === 'ADMIN' ? '#fff' : 'var(--slate-700)'"
                  class="btn" style="padding: 6px 12px; font-size: 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon name="crown" [size]="14"></lucide-icon>
            <span>Owner/Admin</span>
          </button>
          <button (click)="activeView.set('PHARMACIST')"
                  [style.background]="activeView() === 'PHARMACIST' ? '#0284c7' : 'transparent'"
                  [style.color]="activeView() === 'PHARMACIST' ? '#fff' : 'var(--slate-700)'"
                  class="btn" style="padding: 6px 12px; font-size: 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon name="pill" [size]="14"></lucide-icon>
            <span>Pharmacist</span>
          </button>
          <button (click)="activeView.set('CASHIER')"
                  [style.background]="activeView() === 'CASHIER' ? '#059669' : 'transparent'"
                  [style.color]="activeView() === 'CASHIER' ? '#fff' : 'var(--slate-700)'"
                  class="btn" style="padding: 6px 12px; font-size: 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon name="zap" [size]="14"></lucide-icon>
            <span>Cashier</span>
          </button>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 1. ADMIN / OWNER EXECUTIVE DASHBOARD                                     -->
      <!-- ========================================================================= -->
      <div *ngIf="activeView() === 'ADMIN'" style="display: flex; flex-direction: column; gap: 24px;">
        <!-- Executive KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 18px;">
          <!-- Today's Total Revenue -->
          <div class="card" style="border-left: 4px solid #0284c7;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Today's Gross Sales</span>
              <lucide-icon name="dollar-sign" [size]="18" color="#0284c7"></lucide-icon>
            </div>
            <div style="font-size: 26px; font-weight: 800; color: var(--slate-900); margin: 8px 0 4px;">
              ETB {{ summary()?.todayRevenue | number:'1.2-2' }}
            </div>
            <div style="font-size: 12px; color: var(--slate-500);">
              {{ summary()?.todaySalesCount || 0 }} completed invoices today
            </div>
          </div>

          <!-- Today's Gross Profit Margin -->
          <div class="card" style="border-left: 4px solid #10b981;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Net Gross Profit</span>
              <lucide-icon name="trending-up" [size]="18" color="#059669"></lucide-icon>
            </div>
            <div style="font-size: 26px; font-weight: 800; color: #059669; margin: 8px 0 4px;">
              ETB {{ summary()?.todayProfit | number:'1.2-2' }}
            </div>
            <div style="font-size: 12px; color: #10b981; font-weight: 600;">
              Margin: {{ getProfitMarginPercent() }}%
            </div>
          </div>

          <!-- Total Stock Asset Valuation -->
          <div class="card" style="border-left: 4px solid #8b5cf6;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Total Inventory Worth</span>
              <lucide-icon name="boxes" [size]="18" color="#7c3aed"></lucide-icon>
            </div>
            <div style="font-size: 26px; font-weight: 800; color: #7c3aed; margin: 8px 0 4px;">
              ETB {{ valuation()?.totalCostValuation | number:'1.2-2' }}
            </div>
            <div style="font-size: 12px; color: var(--slate-500);">
              Retail potential: ETB {{ valuation()?.totalRetailValuation | number:'1.2-2' }}
            </div>
          </div>

          <!-- Stock Risk & Low Alerts -->
          <div class="card" style="border-left: 4px solid #f59e0b;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Stock & Expiry Risk</span>
              <lucide-icon name="alert-triangle" [size]="18" color="#d97706"></lucide-icon>
            </div>
            <div style="font-size: 26px; font-weight: 800; color: #d97706; margin: 8px 0 4px;">
              {{ summary()?.lowStockItemsCount || 0 }} Low / {{ summary()?.expiringSoonBatchesCount || 0 }} Expiring
            </div>
            <div style="font-size: 12px; color: var(--slate-500);">
              {{ summary()?.totalDrugsCount || 0 }} total catalog items
            </div>
          </div>
        </div>

        <!-- Middle Row: Financial P&L Breakdown & Admin Shortcuts -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
          <!-- Financial Snapshot & Profit Breakdown -->
          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 16px; font-weight: 800; color: var(--slate-900);">Monthly Financial Performance Snapshot</h3>
              <a routerLink="/reports" class="btn btn-outline" style="padding: 5px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
                <span>Full Financial Suite</span>
                <lucide-icon name="arrow-right" [size]="13"></lucide-icon>
              </a>
            </div>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px;">
              <div style="padding: 14px; background: #f8fafc; border-radius: 8px; border: 1px solid var(--slate-200);">
                <div style="font-size: 11px; font-weight: 700; color: var(--slate-500);">TOTAL REVENUE (30D)</div>
                <div style="font-size: 18px; font-weight: 800; color: var(--slate-900); margin-top: 4px;">
                  ETB {{ plReport()?.totalRevenue | number:'1.2-2' }}
                </div>
              </div>
              <div style="padding: 14px; background: #f8fafc; border-radius: 8px; border: 1px solid var(--slate-200);">
                <div style="font-size: 11px; font-weight: 700; color: var(--slate-500);">COST OF GOODS (COGS)</div>
                <div style="font-size: 18px; font-weight: 800; color: #ef4444; margin-top: 4px;">
                  ETB {{ plReport()?.totalCostOfGoodsSold | number:'1.2-2' }}
                </div>
              </div>
              <div style="padding: 14px; background: #f8fafc; border-radius: 8px; border: 1px solid var(--slate-200);">
                <div style="font-size: 11px; font-weight: 700; color: var(--slate-500);">GROSS MARGIN PROFIT</div>
                <div style="font-size: 18px; font-weight: 800; color: #059669; margin-top: 4px;">
                  ETB {{ plReport()?.grossProfit | number:'1.2-2' }}
                </div>
              </div>
            </div>

            <!-- Live announcements -->
            <div>
              <h4 style="font-size: 13px; font-weight: 700; color: var(--slate-700); margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                <lucide-icon name="bell" [size]="15" color="#0284c7"></lucide-icon>
                Operational & Expiry Notices
              </h4>
              <div *ngFor="let alert of alerts()" style="padding: 10px 14px; border-radius: 6px; background: #f1f5f9; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <lucide-icon name="alert-circle" [size]="16" color="#d97706"></lucide-icon>
                  <div>
                    <span style="font-weight: 700; font-size: 13px;">{{ alert.title }}</span>
                    <span style="font-size: 12px; color: var(--slate-600); margin-left: 8px;">{{ alert.message }}</span>
                  </div>
                </div>
                <span class="badge badge-warning">{{ alert.priority }}</span>
              </div>
            </div>
          </div>

          <!-- Fast Administration Shortcuts -->
          <div class="card" style="display: flex; flex-direction: column; gap: 12px;">
            <h3 style="font-size: 16px; font-weight: 800; color: var(--slate-900); margin-bottom: 6px;">Executive Shortcuts</h3>

            <a routerLink="/users" class="btn btn-primary" style="justify-content: flex-start; padding: 12px; display: flex; align-items: center; gap: 10px;">
              <lucide-icon name="users" [size]="18"></lucide-icon>
              <span>User & Role Management</span>
            </a>
            <a routerLink="/reports" class="btn btn-outline" style="justify-content: flex-start; padding: 12px; display: flex; align-items: center; gap: 10px;">
              <lucide-icon name="trending-up" [size]="18"></lucide-icon>
              <span>P&L & Margin Analytics</span>
            </a>
            <a routerLink="/inventory" class="btn btn-outline" style="justify-content: flex-start; padding: 12px; display: flex; align-items: center; gap: 10px;">
              <lucide-icon name="boxes" [size]="18"></lucide-icon>
              <span>Drug Catalog & FEFO Ledger</span>
            </a>
            <a routerLink="/pos" class="btn btn-outline" style="justify-content: flex-start; padding: 12px; display: flex; align-items: center; gap: 10px;">
              <lucide-icon name="zap" [size]="18"></lucide-icon>
              <span>POS Point of Sale Terminal</span>
            </a>
            <a routerLink="/purchases" class="btn btn-outline" style="justify-content: flex-start; padding: 12px; display: flex; align-items: center; gap: 10px;">
              <lucide-icon name="truck" [size]="18"></lucide-icon>
              <span>Procurement & Goods Received</span>
            </a>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 2. PHARMACIST DEDICATED DASHBOARD                                        -->
      <!-- ========================================================================= -->
      <div *ngIf="activeView() === 'PHARMACIST'" style="display: flex; flex-direction: column; gap: 24px;">
        <!-- Pharmacist Quick FEFO & Expiry Indicators -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          <!-- Expired Batches -->
          <div class="card" style="border-left: 4px solid #ef4444; background: #fff5f5;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: 700; color: #991b1b; text-transform: uppercase;">Expired Batches</span>
              <lucide-icon name="alert-triangle" [size]="18" color="#dc2626"></lucide-icon>
            </div>
            <div style="font-size: 28px; font-weight: 800; color: #dc2626; margin: 8px 0 4px;">
              {{ summary()?.expiredBatchesCount || 0 }} Batches
            </div>
            <div style="font-size: 12px; color: #991b1b;">Immediate disposal / write-off required</div>
          </div>

          <!-- Expiring < 90 Days -->
          <div class="card" style="border-left: 4px solid #f59e0b;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase;">Expiring Soon (&lt;90 Days)</span>
              <lucide-icon name="clock" [size]="18" color="#d97706"></lucide-icon>
            </div>
            <div style="font-size: 28px; font-weight: 800; color: #d97706; margin: 8px 0 4px;">
              {{ summary()?.expiringSoonBatchesCount || 0 }} Batches
            </div>
            <div style="font-size: 12px; color: var(--slate-600);">FEFO priority dispensing queue</div>
          </div>

          <!-- Low Stock Items -->
          <div class="card" style="border-left: 4px solid #0284c7;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: 700; color: #075985; text-transform: uppercase;">Low Stock Warning</span>
              <lucide-icon name="trending-down" [size]="18" color="#0284c7"></lucide-icon>
            </div>
            <div style="font-size: 28px; font-weight: 800; color: #0284c7; margin: 8px 0 4px;">
              {{ summary()?.lowStockItemsCount || 0 }} Drugs
            </div>
            <div style="font-size: 12px; color: var(--slate-600);">Below minimum reorder threshold</div>
          </div>

          <!-- Total Active Drugs -->
          <div class="card" style="border-left: 4px solid #10b981;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: 700; color: #065f46; text-transform: uppercase;">Active Drug Catalog</span>
              <lucide-icon name="pill" [size]="18" color="#059669"></lucide-icon>
            </div>
            <div style="font-size: 28px; font-weight: 800; color: #059669; margin: 8px 0 4px;">
              {{ summary()?.totalDrugsCount || 0 }} Drugs
            </div>
            <div style="font-size: 12px; color: var(--slate-600);">In stock and ready to dispense</div>
          </div>
        </div>

        <!-- Pharmacist Workflow Panels -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
          <!-- Expiring Batches Table -->
          <div class="card" style="padding: 0; overflow: hidden;">
            <div style="padding: 16px 20px; border-bottom: 1px solid var(--slate-200); display: flex; justify-content: space-between; align-items: center;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--slate-900);">FEFO Expiry Prioritization Queue</h3>
              <a routerLink="/inventory" class="btn btn-outline" style="padding: 4px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
                <span>Manage All Batches</span>
                <lucide-icon name="arrow-right" [size]="12"></lucide-icon>
              </a>
            </div>

            <div style="max-height: 280px; overflow-y: auto;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                <thead style="background: #f8fafc; color: var(--slate-600);">
                  <tr>
                    <th style="padding: 10px 16px;">Drug</th>
                    <th style="padding: 10px 16px;">Batch #</th>
                    <th style="padding: 10px 16px;">Expiry Date</th>
                    <th style="padding: 10px 16px;">Stock</th>
                    <th style="padding: 10px 16px;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let b of expiringBatches()" style="border-bottom: 1px solid var(--slate-100);">
                    <td style="padding: 10px 16px; font-weight: 700;">{{ b.drugName }}</td>
                    <td style="padding: 10px 16px;"><code>{{ b.batchNumber }}</code></td>
                    <td style="padding: 10px 16px;">{{ b.expiryDate }}</td>
                    <td style="padding: 10px 16px; font-weight: 700;">{{ b.quantityOnHand }}</td>
                    <td style="padding: 10px 16px;">
                      <span class="badge" [ngClass]="b.status === 'EXPIRED' ? 'badge-danger' : 'badge-warning'">
                        {{ b.status }}
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="expiringBatches().length === 0">
                    <td colspan="5" style="text-align: center; padding: 24px; color: var(--slate-400);">
                      All batches have safe expiry horizons.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Pharmacist Actions -->
          <div class="card" style="display: flex; flex-direction: column; gap: 12px;">
            <h3 style="font-size: 15px; font-weight: 800; color: var(--slate-900);">Pharmacist Fast Actions</h3>
            <a routerLink="/inventory" class="btn btn-primary" style="justify-content: flex-start; padding: 12px; display: flex; align-items: center; gap: 10px;">
              <lucide-icon name="plus" [size]="18"></lucide-icon>
              <span>Register New Batch (FEFO)</span>
            </a>
            <a routerLink="/inventory" class="btn btn-outline" style="justify-content: flex-start; padding: 12px; display: flex; align-items: center; gap: 10px;">
              <lucide-icon name="pill" [size]="18"></lucide-icon>
              <span>Add New Drug to Catalog</span>
            </a>
            <a routerLink="/inventory" class="btn btn-outline" style="justify-content: flex-start; padding: 12px; display: flex; align-items: center; gap: 10px;">
              <lucide-icon name="alert-triangle" [size]="18"></lucide-icon>
              <span>Stock Adjustment (Damage/Write-off)</span>
            </a>
            <a routerLink="/purchases" class="btn btn-outline" style="justify-content: flex-start; padding: 12px; display: flex; align-items: center; gap: 10px;">
              <lucide-icon name="package" [size]="18"></lucide-icon>
              <span>Purchase Orders & GRN Intake</span>
            </a>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 3. CASHIER DEDICATED DASHBOARD                                           -->
      <!-- ========================================================================= -->
      <div *ngIf="activeView() === 'CASHIER'" style="display: flex; flex-direction: column; gap: 24px;">
        <!-- Cashier Register & Shift KPIs -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          <!-- Shift Total Revenue -->
          <div class="card" style="border-left: 4px solid #059669; background: #f0fdf4;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: 700; color: #065f46; text-transform: uppercase;">Today's Shift Revenue</span>
              <lucide-icon name="dollar-sign" [size]="18" color="#047857"></lucide-icon>
            </div>
            <div style="font-size: 28px; font-weight: 800; color: #047857; margin: 8px 0 4px;">
              ETB {{ cashierShift()?.totalRevenue | number:'1.2-2' }}
            </div>
            <div style="font-size: 12px; color: #065f46;">
              {{ cashierShift()?.totalSalesCount || 0 }} completed checkouts
            </div>
          </div>

          <!-- Cash Collected -->
          <div class="card" style="border-left: 4px solid #0284c7;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: 700; color: #075985; text-transform: uppercase;">Physical Cash in Drawer</span>
              <lucide-icon name="banknote" [size]="18" color="#0284c7"></lucide-icon>
            </div>
            <div style="font-size: 24px; font-weight: 800; color: #0284c7; margin: 8px 0 4px;">
              ETB {{ cashierShift()?.cashAmount | number:'1.2-2' }}
            </div>
            <div style="font-size: 12px; color: var(--slate-500);">Ready for end-of-shift reconciliation</div>
          </div>

          <!-- Digital / Telebirr -->
          <div class="card" style="border-left: 4px solid #8b5cf6;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: 700; color: #5b21b6; text-transform: uppercase;">Telebirr / Mobile Money</span>
              <lucide-icon name="smartphone" [size]="18" color="#7c3aed"></lucide-icon>
            </div>
            <div style="font-size: 24px; font-weight: 800; color: #7c3aed; margin: 8px 0 4px;">
              ETB {{ cashierShift()?.digitalAmount | number:'1.2-2' }}
            </div>
            <div style="font-size: 12px; color: var(--slate-500);">Digital transactions confirmed</div>
          </div>

          <!-- Card / Bank -->
          <div class="card" style="border-left: 4px solid #f59e0b;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; font-weight: 700; color: #92400e; text-transform: uppercase;">Card / Bank Transfers</span>
              <lucide-icon name="credit-card" [size]="18" color="#d97706"></lucide-icon>
            </div>
            <div style="font-size: 24px; font-weight: 800; color: #d97706; margin: 8px 0 4px;">
              ETB {{ cashierShift()?.cardOrBankAmount | number:'1.2-2' }}
            </div>
            <div style="font-size: 12px; color: var(--slate-500);">Card / Bank transfers</div>
          </div>
        </div>

        <!-- POS Direct Launcher Card -->
        <div class="card" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; padding: 28px; display: flex; justify-content: space-between; align-items: center; border-radius: 14px;">
          <div>
            <h2 style="font-size: 22px; font-weight: 800; color: #fff;">High-Speed POS Checkout Terminal</h2>
            <p style="font-size: 13px; color: #94a3b8; margin-top: 4px;">
              Ready for barcode scanning, FEFO auto-selection, customer credit balance, and 80mm thermal receipt printing.
            </p>
          </div>
          <a routerLink="/pos" class="btn btn-primary" style="padding: 14px 28px; font-size: 16px; font-weight: 800; background: #0284c7; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4); display: flex; align-items: center; gap: 8px;">
            <lucide-icon name="zap" [size]="20"></lucide-icon>
            <span>Open POS Terminal Now</span>
          </a>
        </div>

        <!-- Recent Shift Invoices with Fast Reprint -->
        <div class="card" style="padding: 0; overflow: hidden;">
          <div style="padding: 16px 20px; border-bottom: 1px solid var(--slate-200); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 15px; font-weight: 800; color: var(--slate-900);">Recent Shift Receipts & Sales</h3>
            <a routerLink="/sales" class="btn btn-outline" style="padding: 4px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
              <span>All Invoices History</span>
              <lucide-icon name="arrow-right" [size]="12"></lucide-icon>
            </a>
          </div>

          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
            <thead style="background: #f8fafc; color: var(--slate-600);">
              <tr>
                <th style="padding: 10px 16px;">Invoice #</th>
                <th style="padding: 10px 16px;">Type</th>
                <th style="padding: 10px 16px;">Customer</th>
                <th style="padding: 10px 16px;">Payment</th>
                <th style="padding: 10px 16px;">Grand Total</th>
                <th style="padding: 10px 16px; text-align: right;">Reprint</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of recentSales()" style="border-bottom: 1px solid var(--slate-100);">
                <td style="padding: 10px 16px; font-weight: 700; color: var(--slate-900);">{{ s.invoiceNumber }}</td>
                <td style="padding: 10px 16px;"><span class="badge badge-primary">{{ s.saleType }}</span></td>
                <td style="padding: 10px 16px;">{{ s.customerName || 'Walk-in Retail' }}</td>
                <td style="padding: 10px 16px;"><span class="badge badge-success">{{ s.paymentMethod }}</span></td>
                <td style="padding: 10px 16px; font-weight: 800; color: #059669;">ETB {{ s.grandTotal | number:'1.2-2' }}</td>
                <td style="padding: 10px 16px; text-align: right;">
                  <button (click)="reprintSale(s)" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
                    <lucide-icon name="printer" [size]="12"></lucide-icon>
                    <span>Receipt</span>
                  </button>
                </td>
              </tr>
              <tr *ngIf="recentSales().length === 0">
                <td colspan="6" style="text-align: center; padding: 24px; color: var(--slate-400);">
                  No sales recorded on this shift yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class DashboardComponent implements OnInit {
  activeView = signal<'ADMIN' | 'PHARMACIST' | 'CASHIER'>('ADMIN');

  summary = signal<any>(null);
  valuation = signal<any>(null);
  plReport = signal<any>(null);
  cashierShift = signal<any>(null);
  expiringBatches = signal<any[]>([]);
  recentSales = signal<any[]>([]);
  alerts = signal<any[]>([]);

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private printService: PrintService
  ) {}

  ngOnInit(): void {
    this.detectInitialView();
    this.loadData();
  }

  detectInitialView(): void {
    if (this.authService.hasRole('ROLE_OWNER')) {
      this.activeView.set('ADMIN');
    } else if (this.authService.hasRole('ROLE_PHARMACIST')) {
      this.activeView.set('PHARMACIST');
    } else if (this.authService.hasRole('ROLE_CASHIER_ACCOUNTANT')) {
      this.activeView.set('CASHIER');
    } else {
      this.activeView.set('ADMIN');
    }
  }

  loadData(): void {
    this.http.get<any>(`${environment.apiUrl}/reports/dashboard`).subscribe({
      next: (res) => this.summary.set(res.data)
    });

    this.http.get<any>(`${environment.apiUrl}/reports/inventory-valuation`).subscribe({
      next: (res) => this.valuation.set(res.data)
    });

    this.http.get<any>(`${environment.apiUrl}/reports/profit-loss`).subscribe({
      next: (res) => this.plReport.set(res.data)
    });

    this.http.get<any>(`${environment.apiUrl}/reports/cashier-shift`).subscribe({
      next: (res) => this.cashierShift.set(res.data)
    });

    this.http.get<any>(`${environment.apiUrl}/batches/expiring?days=90`).subscribe({
      next: (res) => this.expiringBatches.set(res.data || [])
    });

    this.http.get<any>(`${environment.apiUrl}/sales?page=0&size=5`).subscribe({
      next: (res) => this.recentSales.set(res.data?.content || [])
    });

    this.http.get<any>(`${environment.apiUrl}/notifications`).subscribe({
      next: (res) => this.alerts.set(res.data || [])
    });
  }

  currentPersona(): string {
    switch (this.activeView()) {
      case 'ADMIN': return 'Owner / Executive View';
      case 'PHARMACIST': return 'Pharmacist View';
      case 'CASHIER': return 'Cashier / POS View';
    }
  }

  getDashboardTitle(): string {
    switch (this.activeView()) {
      case 'ADMIN': return 'Executive Operations & Financial Dashboard';
      case 'PHARMACIST': return 'Pharmacist & FEFO Inventory Dashboard';
      case 'CASHIER': return 'Cashier Shift & POS Terminal Dashboard';
    }
  }

  getDashboardSubtitle(): string {
    switch (this.activeView()) {
      case 'ADMIN': return 'Real-time overview of revenue, profit margins, stock valuation, and user governance';
      case 'PHARMACIST': return 'FEFO expiry matrix, minimum reorder alerts, and catalog management';
      case 'CASHIER': return 'Shift revenue reconciliation, fast checkout terminal, and receipt reprint';
    }
  }

  getRoleBadgeClass(): string {
    switch (this.activeView()) {
      case 'ADMIN': return 'badge-primary';
      case 'PHARMACIST': return 'badge-success';
      case 'CASHIER': return 'badge-warning';
    }
  }

  getProfitMarginPercent(): number {
    const rev = this.summary()?.todayRevenue;
    const prof = this.summary()?.todayProfit;
    if (!rev || rev === 0) return 0;
    return Math.round((prof / rev) * 100);
  }

  reprintSale(sale: any): void {
    this.printService.printThermalReceipt({
      invoiceNumber: sale.invoiceNumber,
      date: new Date(sale.createdAt),
      saleType: sale.saleType,
      customerName: sale.customerName || 'Walk-in Retail',
      customerPhone: '',
      cashierName: sale.cashierName || 'Cashier',
      branchName: 'HQ Main Store',
      items: sale.items || [],
      subTotal: sale.subTotal || sale.grandTotal,
      taxAmount: sale.taxAmount || 0,
      discountAmount: sale.discountAmount || 0,
      grandTotal: sale.grandTotal,
      amountPaid: sale.amountPaid || sale.grandTotal,
      changeReturned: sale.changeReturned || 0,
      paymentMethod: sale.paymentMethod
    });
  }
}
