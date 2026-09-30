import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../core/services/notification.service';

export interface PeriodicTrendSlot {
  periodName: string;
  date?: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  purchases?: number;
  netProfit: number;
  heightPct?: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="pharmly-reports-root">

      <!-- ========================================================================= -->
      <!-- 1. TOP HEADER & FINANCIAL PERIOD SELECTOR BAR                             -->
      <!-- ========================================================================= -->
      <div class="top-header-row">
        <div class="header-titles">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, #0f766e, #0d9488); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(15,118,110,0.25);">
              <lucide-icon name="line-chart" [size]="22"></lucide-icon>
            </div>
            <div>
              <h1 class="main-page-title">Financial Accounting & Stock Intelligence</h1>
              <div class="breadcrumb-sub">
                <span>Pharmacy Management</span>
                <span class="crumb-sep">&gt;</span>
                <span class="crumb-active">P&L, Expenses, Revenue & Stock Valuations</span>
              </div>
            </div>
          </div>
        </div>

        <div class="header-controls">
          <!-- Quick Period Mode Pills -->
          <div class="date-pills-group">
            <button (click)="selectPeriodMode('DAILY')" [class.active]="selectedPeriodMode === 'DAILY'" class="range-pill">Daily</button>
            <button (click)="selectPeriodMode('WEEKLY')" [class.active]="selectedPeriodMode === 'WEEKLY'" class="range-pill">7 Days</button>
            <button (click)="selectPeriodMode('MONTHLY')" [class.active]="selectedPeriodMode === 'MONTHLY'" class="range-pill">Monthly</button>
            <button (click)="selectPeriodMode('QUARTERLY')" [class.active]="selectedPeriodMode === 'QUARTERLY'" class="range-pill">Quarterly</button>
            <button (click)="selectPeriodMode('YEARLY')" [class.active]="selectedPeriodMode === 'YEARLY'" class="range-pill">Yearly</button>
            <button (click)="selectPeriodMode('CUSTOM')" [class.active]="selectedPeriodMode === 'CUSTOM'" class="range-pill">Custom</button>
          </div>

          <!-- Export PDF Button -->
          <button (click)="downloadPdf()" class="btn-pdf-export" title="Download Official Financial Statement PDF">
            <lucide-icon name="file-down" [size]="15"></lucide-icon>
            <span>Audit PDF</span>
          </button>
        </div>
      </div>

      <!-- Secondary Period Navigator & Filter Toolbar -->
      <div class="date-filter-bar">
        <!-- Monthly/Quarterly/Yearly specific selectors -->
        <div class="filter-left">
          <lucide-icon name="calendar" [size]="16" color="#0f766e"></lucide-icon>
          <span class="filter-label">Financial Period:</span>

          <!-- Year Selector (Applicable for Monthly, Quarterly, Yearly) -->
          <select [(ngModel)]="selectedYear" (change)="loadFinancialStatement()" class="form-control-sm" *ngIf="selectedPeriodMode !== 'DAILY' && selectedPeriodMode !== 'WEEKLY' && selectedPeriodMode !== 'CUSTOM'">
            <option *ngFor="let y of availableYears" [value]="y">{{ y }}</option>
          </select>

          <!-- Month Selector if Monthly -->
          <select [(ngModel)]="selectedMonth" (change)="loadFinancialStatement()" class="form-control-sm" *ngIf="selectedPeriodMode === 'MONTHLY'">
            <option *ngFor="let m of monthsList; let i = index" [value]="i + 1">{{ m }}</option>
          </select>

          <!-- Quarter Selector if Quarterly -->
          <select [(ngModel)]="selectedQuarter" (change)="loadFinancialStatement()" class="form-control-sm" *ngIf="selectedPeriodMode === 'QUARTERLY'">
            <option [value]="1">Q1 (Jan - Mar)</option>
            <option [value]="2">Q2 (Apr - Jun)</option>
            <option [value]="3">Q3 (Jul - Sep)</option>
            <option [value]="4">Q4 (Oct - Dec)</option>
          </select>

          <!-- Custom Date Range Pickers -->
          <div class="date-input-wrap" *ngIf="selectedPeriodMode === 'CUSTOM'">
            <input type="date" [(ngModel)]="startDate" (change)="loadFinancialStatement()" class="date-field" />
            <span class="date-sep">to</span>
            <input type="date" [(ngModel)]="endDate" (change)="loadFinancialStatement()" class="date-field" />
          </div>

          <!-- Active Period Statement Badge -->
          <span class="active-period-badge">
            {{ statement()?.periodLabel || 'Consolidated Statement' }}
          </span>
        </div>

        <div style="display: flex; gap: 8px;">
          <button (click)="loadFinancialStatement()" class="btn-recalculate" title="Recalculate live financial metrics">
            <lucide-icon name="refresh-cw" [size]="14"></lucide-icon>
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 2. TOP 6 EXECUTIVE FINANCIAL KPI CARDS                                    -->
      <!-- ========================================================================= -->
      <div class="top-cards-grid-6">
        <!-- 1. Gross Sales Revenue -->
        <div class="metric-card bg-card-blue">
          <div class="card-head-flex">
            <div class="icon-circle-soft blue-soft">
              <lucide-icon name="dollar-sign" [size]="18" color="#0284c7"></lucide-icon>
            </div>
            <span class="badge badge-primary">Operating Revenue</span>
          </div>
          <div class="card-content-block">
            <span class="card-sublabel">Gross Sales Revenue</span>
            <div class="card-big-value text-blue">
              ETB {{ (statement()?.totalRevenue || 0) | number:'1.2-2' }}
            </div>
            <span class="card-footer-note">{{ statement()?.totalSalesCount || 0 }} completed invoices</span>
          </div>
        </div>

        <!-- 2. Cost of Goods Sold (COGS) -->
        <div class="metric-card bg-card-rose">
          <div class="card-head-flex">
            <div class="icon-circle-soft rose-soft">
              <lucide-icon name="shopping-bag" [size]="18" color="#e11d48"></lucide-icon>
            </div>
            <span class="badge badge-rose">{{ getCostPercent() }}% Cost Ratio</span>
          </div>
          <div class="card-content-block">
            <span class="card-sublabel">Cost of Goods Sold (COGS)</span>
            <div class="card-big-value text-rose">
              ETB {{ (statement()?.totalCostOfGoodsSold || 0) | number:'1.2-2' }}
            </div>
            <span class="card-footer-note">Direct batch acquisition cost</span>
          </div>
        </div>

        <!-- 3. Gross Operating Profit -->
        <div class="metric-card bg-card-teal">
          <div class="card-head-flex">
            <div class="icon-circle-soft teal-soft">
              <lucide-icon name="trending-up" [size]="18" color="#0f766e"></lucide-icon>
            </div>
            <span class="badge badge-teal">{{ (statement()?.grossMarginPercentage || 0) | number:'1.1-1' }}% Gross Margin</span>
          </div>
          <div class="card-content-block">
            <span class="card-sublabel">Gross Profit</span>
            <div class="card-big-value text-teal">
              ETB {{ (statement()?.grossProfit || 0) | number:'1.2-2' }}
            </div>
            <span class="card-footer-note">Revenue minus direct COGS</span>
          </div>
        </div>

        <!-- 4. Operating Expenses (OpEx) -->
        <div class="metric-card bg-card-amber">
          <div class="card-head-flex">
            <div class="icon-circle-soft amber-soft">
              <lucide-icon name="receipt" [size]="18" color="#d97706"></lucide-icon>
            </div>
            <span class="badge badge-amber">{{ statement()?.expensesCount || 0 }} Expenses</span>
          </div>
          <div class="card-content-block">
            <span class="card-sublabel">Operating Expenses (OpEx)</span>
            <div class="card-big-value text-amber">
              ETB {{ (statement()?.totalOperatingExpenses || 0) | number:'1.2-2' }}
            </div>
            <span class="card-footer-note">Rent, salaries, utilities & overheads</span>
          </div>
        </div>

        <!-- 5. Procurement Outflows (Purchases) -->
        <div class="metric-card bg-card-purple">
          <div class="card-head-flex">
            <div class="icon-circle-soft purple-soft">
              <lucide-icon name="truck" [size]="18" color="#7c3aed"></lucide-icon>
            </div>
            <span class="badge badge-purple">{{ statement()?.purchasesCount || 0 }} Restock POs</span>
          </div>
          <div class="card-content-block">
            <span class="card-sublabel">Inventory Restocking</span>
            <div class="card-big-value text-purple">
              ETB {{ (statement()?.totalPurchases || 0) | number:'1.2-2' }}
            </div>
            <span class="card-footer-note">GRN Received: ETB {{ (statement()?.totalReceivedPurchases || 0) | number:'1.0-0' }}</span>
          </div>
        </div>

        <!-- 6. Hero Net Operating Profit (Bottom Line) -->
        <div class="hero-emerald-card" [class.hero-loss]="(statement()?.netOperatingProfit || 0) < 0">
          <div class="card-head-flex">
            <div class="lime-icon-circle">
              <lucide-icon [name]="(statement()?.netOperatingProfit || 0) >= 0 ? 'award' : 'alert-triangle'" [size]="20"></lucide-icon>
            </div>
            <div class="trend-pill-lime">
              <span>{{ (statement()?.netProfitMarginPercentage || 0) | number:'1.1-1' }}% Net Margin</span>
            </div>
          </div>
          <div class="card-content-block">
            <span class="hero-card-sublabel">Net Operating Bottom Line</span>
            <div class="hero-card-big-value">
              ETB {{ (statement()?.netOperatingProfit || 0) | number:'1.2-2' }}
            </div>
            <span class="hero-card-footer-note">Gross Profit minus Operating Overheads</span>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 3. VISUAL CHARTS & DISTRIBUTION BREAKDOWN                                 -->
      <!-- ========================================================================= -->
      <div class="middle-analytics-grid">
        
        <!-- Left: Periodic Trend Velocity Bar Chart -->
        <div class="analytics-chart-panel">
          <div class="panel-header-row">
            <div>
              <h3 class="panel-title-text">Financial Velocity: Revenue vs Expenses vs Net Profit</h3>
              <p class="panel-subtitle-text">
                {{ selectedPeriodMode }} trajectory showing daily/monthly cash generation and bottom-line margin
              </p>
            </div>
            <div class="chart-legend-row">
              <span class="legend-chip"><span class="legend-box bg-blue"></span> Revenue</span>
              <span class="legend-chip"><span class="legend-box bg-amber"></span> OpEx</span>
              <span class="legend-chip"><span class="legend-box bg-emerald"></span> Net Profit</span>
            </div>
          </div>

          <!-- Trend Bar Chart Viewport -->
          <div class="capsule-chart-viewport" *ngIf="trendSeries.length > 0">
            <div class="bars-container-flex">
              <div 
                *ngFor="let slot of trendSeries; let idx = index" 
                class="trend-slot-column"
                (mouseenter)="hoveredSlotIndex = idx"
                (mouseleave)="hoveredSlotIndex = null">
                
                <!-- Floating Tooltip -->
                <div *ngIf="hoveredSlotIndex === idx" class="capsule-tooltip-bubble">
                  <div class="tip-title">{{ slot.periodName }}</div>
                  <div class="tip-line"><span style="color: #38bdf8;">Revenue:</span> ETB {{ slot.revenue | number:'1.0-0' }}</div>
                  <div class="tip-line"><span style="color: #f43f5e;">COGS:</span> ETB {{ slot.cogs | number:'1.0-0' }}</div>
                  <div class="tip-line"><span style="color: #fbbf24;">Expenses:</span> ETB {{ slot.expenses | number:'1.0-0' }}</div>
                  <div class="tip-line" style="font-weight: 800; border-top: 1px solid #334155; margin-top: 2px; padding-top: 2px;">
                    <span [style.color]="slot.netProfit >= 0 ? '#4ade80' : '#f87171'">Net:</span> ETB {{ slot.netProfit | number:'1.0-0' }}
                  </div>
                </div>

                <!-- Multi-bar group -->
                <div class="multi-bars-group">
                  <!-- Revenue Bar -->
                  <div class="bar-pill bar-blue" [style.height.%]="getBarHeightPct(slot.revenue)" title="Revenue: ETB {{ slot.revenue }}"></div>
                  <!-- Expense Bar -->
                  <div class="bar-pill bar-amber" [style.height.%]="getBarHeightPct(slot.expenses)" title="Expenses: ETB {{ slot.expenses }}"></div>
                  <!-- Net Profit Bar -->
                  <div class="bar-pill" [class.bar-emerald]="slot.netProfit >= 0" [class.bar-red]="slot.netProfit < 0" [style.height.%]="getBarHeightPct(slot.netProfit)" title="Net Profit: ETB {{ slot.netProfit }}"></div>
                </div>

                <span class="bar-day-label" [class.label-active]="hoveredSlotIndex === idx">{{ slot.periodName }}</span>
              </div>
            </div>
          </div>

          <div *ngIf="trendSeries.length === 0" style="padding: 40px; text-align: center; color: #94a3b8;">
            No transactions recorded for the selected audit window.
          </div>
        </div>

        <!-- Right: Revenue Distribution Breakdown Donut -->
        <div class="donut-chart-panel">
          <div class="panel-header-row">
            <div>
              <h3 class="panel-title-text">P&L Revenue Allocation</h3>
              <p class="panel-subtitle-text">How incoming revenue is distributed</p>
            </div>
            <span class="badge badge-success">{{ (statement()?.netProfitMarginPercentage || 0) | number:'1.1-1' }}% Net</span>
          </div>

          <div class="donut-visual-container">
            <div class="donut-svg-wrapper">
              <svg width="150" height="150" viewBox="0 0 42 42" class="donut-svg">
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" stroke-width="6.5"></circle>
                <!-- Net Profit Ring Segment (Emerald) -->
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#10b981" stroke-width="6.5"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="getNetProfitDonutArray()" stroke-dashoffset="0"></circle>
                <!-- OpEx Ring Segment (Amber) -->
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" stroke-width="6.5"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="getOpExDonutArray()" [attr.stroke-dashoffset]="getNetProfitDonutOffset()"></circle>
                <!-- COGS Ring Segment (Rose) -->
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e11d48" stroke-width="6.5"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="getCostDonutArray()" [attr.stroke-dashoffset]="getCostDonutOffsetCalculated()"></circle>
              </svg>
              <div class="donut-center-info">
                <span class="center-pct">{{ (statement()?.netProfitMarginPercentage || 0) | number:'1.0-0' }}%</span>
                <span class="center-sub">Net Profit</span>
              </div>
            </div>

            <!-- Distribution Legend Cards -->
            <div class="donut-legend-list">
              <div class="legend-item-card">
                <div class="legend-badge-row">
                  <span class="legend-dot dot-emerald"></span>
                  <span class="legend-name">Net Retained Profit</span>
                  <span class="legend-pct text-emerald">{{ (statement()?.netProfitMarginPercentage || 0) | number:'1.1-1' }}%</span>
                </div>
                <div class="legend-val">ETB {{ (statement()?.netOperatingProfit || 0) | number:'1.2-2' }}</div>
              </div>

              <div class="legend-item-card">
                <div class="legend-badge-row">
                  <span class="legend-dot dot-amber"></span>
                  <span class="legend-name">Operating Expenses (OpEx)</span>
                  <span class="legend-pct text-amber">{{ getOpExPercent() }}%</span>
                </div>
                <div class="legend-val">ETB {{ (statement()?.totalOperatingExpenses || 0) | number:'1.2-2' }}</div>
              </div>

              <div class="legend-item-card">
                <div class="legend-badge-row">
                  <span class="legend-dot dot-rose"></span>
                  <span class="legend-name">Cost of Goods (COGS)</span>
                  <span class="legend-pct text-rose">{{ getCostPercent() }}%</span>
                </div>
                <div class="legend-val">ETB {{ (statement()?.totalCostOfGoodsSold || 0) | number:'1.2-2' }}</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- 4. NAVIGATION TABS FOR DETAILED STATEMENTS & EXPENSES                      -->
      <!-- ========================================================================= -->
      <div class="financial-statement-panel">
        <div class="statement-header-row">
          <div class="tab-pill-group">
            <button (click)="activeTab = 'PL'" [class.active]="activeTab === 'PL'" class="tab-btn">
              <lucide-icon name="file-text" [size]="14"></lucide-icon>
              <span>Profit & Loss Statement</span>
            </button>

            <button (click)="activeTab = 'EXPENSES'" [class.active]="activeTab === 'EXPENSES'" class="tab-btn">
              <lucide-icon name="receipt" [size]="14"></lucide-icon>
              <span>Operating Expenses Allocation ({{ statement()?.expensesCount || 0 }})</span>
            </button>

            <button (click)="activeTab = 'VALUATION'" [class.active]="activeTab === 'VALUATION'" class="tab-btn">
              <lucide-icon name="boxes" [size]="14"></lucide-icon>
              <span>Stock Valuation & Asset Worth</span>
            </button>

            <button (click)="activeTab = 'TENDER'" [class.active]="activeTab === 'TENDER'" class="tab-btn">
              <lucide-icon name="credit-card" [size]="14"></lucide-icon>
              <span>Payment Channels Audit</span>
            </button>
          </div>

          <div style="display: flex; gap: 8px;">
            <button (click)="downloadPdf()" class="btn-export-statement">
              <lucide-icon name="printer" [size]="14"></lucide-icon>
              <span>Print Official Audit</span>
            </button>
          </div>
        </div>

        <!-- TAB 1: P&L EXECUTIVE STATEMENT TABLE -->
        <div *ngIf="activeTab === 'PL'" class="table-scroll-wrapper">
          <table class="statement-table">
            <thead>
              <tr>
                <th>Accounting Ledger Item</th>
                <th>Classification</th>
                <th>Calculation Basis / Notes</th>
                <th style="text-align: right;">Amount (ETB)</th>
                <th style="text-align: right;">% Gross Revenue</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. Revenue -->
              <tr>
                <td class="td-strong">1. Gross Sales Revenue</td>
                <td><span class="badge badge-primary">Operating Income</span></td>
                <td>Completed POS sales transactions</td>
                <td class="td-amount td-emerald">ETB {{ (statement()?.totalRevenue || 0) | number:'1.2-2' }}</td>
                <td class="td-amount">100.0%</td>
              </tr>

              <!-- 2. COGS -->
              <tr>
                <td class="td-strong">2. Cost of Goods Sold (COGS)</td>
                <td><span class="badge badge-rose">Direct Cost</span></td>
                <td>Batch wholesale purchase price (FEFO intake)</td>
                <td class="td-amount td-rose">- ETB {{ (statement()?.totalCostOfGoodsSold || 0) | number:'1.2-2' }}</td>
                <td class="td-amount td-rose">{{ getCostPercent() }}%</td>
              </tr>

              <!-- 3. Gross Margin -->
              <tr class="row-subtotal">
                <td class="td-bold-large">3. Gross Operating Profit</td>
                <td><span class="badge badge-teal">Gross Margin</span></td>
                <td>Gross Revenue minus Direct COGS</td>
                <td class="td-amount td-bold-large td-teal">ETB {{ (statement()?.grossProfit || 0) | number:'1.2-2' }}</td>
                <td class="td-amount td-bold-large td-teal">{{ (statement()?.grossMarginPercentage || 0) | number:'1.1-2' }}%</td>
              </tr>

              <!-- 4. Operating Expenses Line -->
              <tr>
                <td class="td-strong">4. Total Operating Expenses (OpEx)</td>
                <td><span class="badge badge-amber">Overhead Outflow</span></td>
                <td>Rent, payroll, utilities, transport, licenses</td>
                <td class="td-amount td-amber">- ETB {{ (statement()?.totalOperatingExpenses || 0) | number:'1.2-2' }}</td>
                <td class="td-amount td-amber">{{ getOpExPercent() }}%</td>
              </tr>

              <!-- 5. Expired Stock Losses -->
              <tr *ngIf="(statement()?.expiredStockLoss || 0) > 0">
                <td class="td-strong">5. Expired / Disposed Stock Loss</td>
                <td><span class="badge badge-rose">Inventory Loss</span></td>
                <td>Cost valuation of expired and written-off batches</td>
                <td class="td-amount td-rose">- ETB {{ (statement()?.expiredStockLoss || 0) | number:'1.2-2' }}</td>
                <td class="td-amount td-rose">{{ getLossPercent() }}%</td>
              </tr>

              <!-- 6. NET OPERATING PROFIT -->
              <tr class="row-grand-total" [class.row-loss]="(statement()?.netOperatingProfit || 0) < 0">
                <td class="td-hero-bold">NET OPERATING PROFIT (BOTTOM LINE)</td>
                <td>
                  <span [class]="(statement()?.netOperatingProfit || 0) >= 0 ? 'badge badge-success' : 'badge badge-rose'">
                    {{ (statement()?.netOperatingProfit || 0) >= 0 ? 'Net Surplus' : 'Operating Deficit' }}
                  </span>
                </td>
                <td>Gross Profit minus All Operating Overheads</td>
                <td class="td-amount td-hero-bold" [style.color]="(statement()?.netOperatingProfit || 0) >= 0 ? '#059669' : '#dc2626'">
                  ETB {{ (statement()?.netOperatingProfit || 0) | number:'1.2-2' }}
                </td>
                <td class="td-amount td-hero-bold" [style.color]="(statement()?.netOperatingProfit || 0) >= 0 ? '#059669' : '#dc2626'">
                  {{ (statement()?.netProfitMarginPercentage || 0) | number:'1.1-2' }}%
                </td>
              </tr>

              <!-- Restocking Memo Line -->
              <tr style="background: #f8fafc; font-size: 12px; color: #64748b;">
                <td><em>Memo: Period Procurement Purchases</em></td>
                <td><span class="badge badge-purple">Inventory Capex</span></td>
                <td>Restock Purchase Orders issued to suppliers</td>
                <td class="td-amount">ETB {{ (statement()?.totalPurchases || 0) | number:'1.2-2' }}</td>
                <td class="td-amount">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TAB 2: OPERATING EXPENSES COST ALLOCATION & BREAKDOWN -->
        <div *ngIf="activeTab === 'EXPENSES'" style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Banner link to dedicated Expenses page -->
          <div class="card" style="padding: 14px 18px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #bae6fd; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; border-radius: 10px; background: #0284c7; color: #fff; display: flex; align-items: center; justify-content: center;">
                <lucide-icon name="wallet" [size]="20"></lucide-icon>
              </div>
              <div>
                <h4 style="font-size: 14px; font-weight: 800; color: #0369a1; margin: 0;">Detailed Expense Records & Receipt Vouchers</h4>
                <p style="font-size: 12px; color: #0284c7; margin: 2px 0 0;">
                  Manage daily entries, search voucher numbers, attach payment proofs, and edit logs in the dedicated register.
                </p>
              </div>
            </div>
            <a routerLink="/expenses" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; text-decoration: none;">
              <span>Open Expenses Register</span>
              <lucide-icon name="arrow-right" [size]="14"></lucide-icon>
            </a>
          </div>

          <!-- Category Quick Summary Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
            <div *ngFor="let cat of expenseCategoriesSummary" class="card" style="padding: 12px 14px; border-left: 4px solid #0284c7;">
              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">{{ formatCategoryName(cat.key) }}</div>
              <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; font-family: 'JetBrains Mono', monospace;">
                ETB {{ cat.amount | number:'1.2-2' }}
              </div>
              <div style="font-size: 11px; color: #0284c7; margin-top: 2px; font-weight: 600;">
                {{ getCategoryOpExShare(cat.amount) }}% of Total OpEx
              </div>
            </div>
          </div>

          <!-- Expense Allocation Statement Table -->
          <div class="table-scroll-wrapper card" style="padding: 0; overflow: hidden;">
            <table class="statement-table">
              <thead>
                <tr>
                  <th>Expense Category</th>
                  <th>Overhead Classification</th>
                  <th style="text-align: right;">Period Expenditure (ETB)</th>
                  <th style="text-align: right;">% of Total OpEx</th>
                  <th style="text-align: right;">% of Gross Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cat of expenseCategoriesSummary">
                  <td class="td-strong">
                    <span class="badge badge-amber" style="margin-right: 8px;">●</span>
                    {{ formatCategoryName(cat.key) }}
                  </td>
                  <td>{{ getCategoryClassification(cat.key) }}</td>
                  <td class="td-amount td-bold-large" style="color: #d97706;">
                    ETB {{ cat.amount | number:'1.2-2' }}
                  </td>
                  <td class="td-amount td-bold-large">
                    {{ getCategoryOpExShare(cat.amount) }}%
                  </td>
                  <td class="td-amount">
                    {{ getCategoryRevenueShare(cat.amount) }}%
                  </td>
                </tr>
                <tr class="row-subtotal">
                  <td class="td-bold-large">Total Period Operating Expenses (OpEx)</td>
                  <td>Consolidated Operating Overheads</td>
                  <td class="td-amount td-bold-large td-amber">
                    ETB {{ (statement()?.totalOperatingExpenses || 0) | number:'1.2-2' }}
                  </td>
                  <td class="td-amount td-bold-large">100.0%</td>
                  <td class="td-amount td-bold-large">{{ getOpExPercent() }}%</td>
                </tr>
                <tr *ngIf="expenseCategoriesSummary.length === 0">
                  <td colspan="5" style="text-align: center; padding: 36px; color: #94a3b8;">
                    No operational overheads recorded for this financial cycle.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TAB 3: STOCK VALUATION & ASSET WORTH -->
        <div *ngIf="activeTab === 'VALUATION'" class="table-scroll-wrapper">
          <table class="statement-table">
            <thead>
              <tr>
                <th>Stock Valuation Metric</th>
                <th>Asset Valuation Basis</th>
                <th>Units / Batches</th>
                <th style="text-align: right;">Valuation (ETB)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="td-strong">Wholesale Buying Value (Cost)</td>
                <td>Procurement purchase valuation for current on-hand batches</td>
                <td>{{ valuation()?.totalUnitsInStock || 0 }} total units</td>
                <td class="td-amount">ETB {{ (valuation()?.totalCostValuation || 0) | number:'1.2-2' }}</td>
              </tr>
              <tr>
                <td class="td-strong">Projected Retail Selling Value</td>
                <td>Counter retail list pricing across active stock</td>
                <td>{{ valuation()?.activeBatchesCount || 0 }} active batches</td>
                <td class="td-amount td-emerald">ETB {{ (valuation()?.totalRetailValuation || 0) | number:'1.2-2' }}</td>
              </tr>
              <tr class="row-subtotal">
                <td class="td-bold-large">Potential Future Gross Margin</td>
                <td>Retail Potential minus Wholesale Cost</td>
                <td>Inventory assets on shelf</td>
                <td class="td-amount td-bold-large td-teal">ETB {{ (valuation()?.potentialGrossProfit || 0) | number:'1.2-2' }}</td>
              </tr>
              <tr style="background: #fef2f2;">
                <td class="td-strong" style="color: #dc2626;">Expired Batch Stock Write-off Loss</td>
                <td>Batches past FEFO expiry date</td>
                <td>{{ expiry()?.expiredCount || 0 }} expired batches</td>
                <td class="td-amount td-rose">- ETB {{ (expiry()?.expiredLossValuation || 0) | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TAB 4: PAYMENT CHANNELS AUDIT -->
        <div *ngIf="activeTab === 'TENDER'" class="table-scroll-wrapper">
          <table class="statement-table">
            <thead>
              <tr>
                <th>Payment Channel</th>
                <th>Settlement Method</th>
                <th>Audit Status</th>
                <th style="text-align: right;">Collected Amount (ETB)</th>
                <th style="text-align: right;">Channel Share</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="td-strong">Physical Cash Drawer</td>
                <td>Cash Tender</td>
                <td><span class="badge badge-success">Reconciled</span></td>
                <td class="td-amount">ETB {{ (cashierShift()?.cashAmount || 0) | number:'1.2-2' }}</td>
                <td class="td-amount">{{ getCashPercent() }}%</td>
              </tr>
              <tr>
                <td class="td-strong">Telebirr / Digital Wallet</td>
                <td>Electronic Pay</td>
                <td><span class="badge badge-primary">Direct Settlement</span></td>
                <td class="td-amount">ETB {{ (cashierShift()?.digitalAmount || 0) | number:'1.2-2' }}</td>
                <td class="td-amount">{{ getDigitalPercent() }}%</td>
              </tr>
              <tr>
                <td class="td-strong">POS Card / Bank Transfer</td>
                <td>Card & Bank Clearing</td>
                <td><span class="badge badge-primary">Settled</span></td>
                <td class="td-amount">ETB {{ (cashierShift()?.cardOrBankAmount || 0) | number:'1.2-2' }}</td>
                <td class="td-amount">{{ getCardPercent() }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .pharmly-reports-root {
      display: flex;
      flex-direction: column;
      gap: 18px;
      font-family: inherit;
      color: #0f172a;
    }

    .top-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 14px;
    }
    .main-page-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .breadcrumb-sub {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      color: #64748b;
      margin-top: 2px;
    }
    .crumb-sep { color: #cbd5e1; }
    .crumb-active { color: #0f766e; font-weight: 600; }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .date-pills-group {
      display: flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 10px;
      gap: 3px;
    }
    .range-pill {
      border: none;
      background: transparent;
      padding: 6px 12px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .range-pill.active {
      background: #ffffff;
      color: #0f766e;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    .btn-pdf-export {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 8px;
      background: #0f766e;
      color: #ffffff;
      font-size: 12.5px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(15,118,110,0.25);
    }

    /* Date Filter Toolbar */
    .date-filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .filter-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .filter-label {
      font-size: 12.5px;
      font-weight: 700;
      color: #334155;
    }
    .form-control-sm {
      padding: 5px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      background: #fff;
    }
    .date-input-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .date-field {
      padding: 4px 8px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 12px;
    }
    .date-sep {
      font-size: 11.5px;
      color: #64748b;
    }
    .active-period-badge {
      font-size: 11.5px;
      font-weight: 700;
      color: #0f766e;
      background: #ccfbf1;
      padding: 4px 10px;
      border-radius: 6px;
      margin-left: 6px;
    }
    .btn-recalculate {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
    }

    /* 6 Top Cards Grid */
    .top-cards-grid-6 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
    }
    .metric-card {
      background: #ffffff;
      border: 1px solid #eef2f6;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.02);
    }
    .card-head-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .icon-circle-soft {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .blue-soft { background: #e0f2fe; }
    .rose-soft { background: #ffe4e6; }
    .teal-soft { background: #ccfbf1; }
    .amber-soft { background: #fef3c7; }
    .purple-soft { background: #ede9fe; }

    .card-sublabel {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .card-big-value {
      font-size: 20px;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      margin: 4px 0 2px;
    }
    .card-footer-note {
      font-size: 11px;
      color: #64748b;
    }

    .text-blue { color: #0284c7; }
    .text-rose { color: #e11d48; }
    .text-teal { color: #0f766e; }
    .text-amber { color: #d97706; }
    .text-purple { color: #7c3aed; }
    .text-emerald { color: #059669; }

    /* Hero Net Card */
    .hero-emerald-card {
      background: linear-gradient(135deg, #064e3b, #047857);
      color: #ffffff;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 4px 14px rgba(4,120,87,0.25);
    }
    .hero-loss {
      background: linear-gradient(135deg, #881337, #be123c);
    }
    .lime-icon-circle {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #bef264;
    }
    .trend-pill-lime {
      font-size: 11px;
      font-weight: 800;
      color: #bef264;
      background: rgba(0,0,0,0.25);
      padding: 2px 8px;
      border-radius: 9999px;
    }
    .hero-card-sublabel {
      font-size: 11px;
      font-weight: 700;
      color: rgba(255,255,255,0.8);
      text-transform: uppercase;
    }
    .hero-card-big-value {
      font-size: 22px;
      font-weight: 900;
      font-family: 'JetBrains Mono', monospace;
      color: #ffffff;
      margin: 4px 0 2px;
    }
    .hero-card-footer-note {
      font-size: 10.5px;
      color: rgba(255,255,255,0.7);
    }

    /* Middle Visual Grid */
    .middle-analytics-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
    }
    @media (max-width: 990px) {
      .middle-analytics-grid { grid-template-columns: 1fr; }
    }

    .analytics-chart-panel, .donut-chart-panel {
      background: #ffffff;
      border: 1px solid #eef2f6;
      border-radius: 16px;
      padding: 18px 20px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }
    .panel-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .panel-title-text {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .panel-subtitle-text {
      font-size: 12px;
      color: #64748b;
      margin: 2px 0 0;
    }

    .chart-legend-row {
      display: flex;
      gap: 12px;
      font-size: 11px;
      font-weight: 700;
      color: #475569;
    }
    .legend-chip {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .legend-box {
      width: 10px;
      height: 10px;
      border-radius: 3px;
    }
    .bg-blue { background: #0284c7; }
    .bg-amber { background: #f59e0b; }
    .bg-emerald { background: #10b981; }

    /* Multi-bar Group Chart */
    .capsule-chart-viewport {
      height: 200px;
      display: flex;
      align-items: flex-end;
      padding-top: 20px;
      position: relative;
    }
    .bars-container-flex {
      display: flex;
      flex: 1;
      justify-content: space-between;
      align-items: flex-end;
      height: 100%;
      gap: 6px;
    }
    .trend-slot-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
      position: relative;
      cursor: pointer;
    }
    .multi-bars-group {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 160px;
      width: 100%;
      justify-content: center;
    }
    .bar-pill {
      width: 8px;
      min-height: 4px;
      border-radius: 4px 4px 0 0;
      transition: height 0.4s ease;
    }
    .bar-blue { background: #0284c7; }
    .bar-amber { background: #f59e0b; }
    .bar-emerald { background: #10b981; }
    .bar-red { background: #ef4444; }

    .bar-day-label {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      margin-top: 6px;
      text-align: center;
      white-space: nowrap;
    }
    .bar-day-label.label-active { color: #0f172a; font-weight: 800; }

    .capsule-tooltip-bubble {
      position: absolute;
      top: -65px;
      background: #0f172a;
      color: #ffffff;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 11px;
      white-space: nowrap;
      z-index: 20;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      pointer-events: none;
    }
    .tip-title { font-weight: 800; margin-bottom: 2px; color: #fff; }
    .tip-line { font-size: 10px; }

    /* Donut layout */
    .donut-visual-container {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 10px 0;
    }
    .donut-svg-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .donut-svg { transform: rotate(-90deg); }
    .donut-center-info {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .center-pct { font-size: 18px; font-weight: 900; color: #0f172a; line-height: 1.1; }
    .center-sub { font-size: 10px; font-weight: 700; color: #94a3b8; }

    .donut-legend-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }
    .legend-item-card {
      background: #f8fafc;
      border: 1px solid #eef2f6;
      border-radius: 8px;
      padding: 6px 10px;
    }
    .legend-badge-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 1px;
    }
    .legend-dot { width: 7px; height: 7px; border-radius: 50%; }
    .dot-emerald { background: #10b981; }
    .dot-amber { background: #f59e0b; }
    .dot-rose { background: #e11d48; }
    .legend-name { font-size: 10.5px; font-weight: 700; color: #475569; flex: 1; }
    .legend-pct { font-size: 10.5px; font-weight: 800; }
    .legend-val { font-size: 12px; font-weight: 800; color: #0f172a; font-family: monospace; }

    /* Bottom Financial Statement Panel */
    .financial-statement-panel {
      background: #ffffff;
      border: 1px solid #eef2f6;
      border-radius: 16px;
      padding: 18px 20px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }
    .statement-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .tab-pill-group {
      display: flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 10px;
      gap: 3px;
      flex-wrap: wrap;
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: none;
      background: transparent;
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      padding: 6px 12px;
      border-radius: 7px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .tab-btn.active {
      background: #ffffff;
      color: #0f766e;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .btn-export-statement {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      padding: 6px 12px;
      border-radius: 8px;
      cursor: pointer;
    }

    /* Statement Table */
    .table-scroll-wrapper { overflow-x: auto; }
    .statement-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      text-align: left;
      font-size: 12.5px;
    }
    .statement-table th {
      padding: 10px 12px;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .statement-table td {
      padding: 11px 12px;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }
    .td-strong { font-weight: 700; color: #0f172a; }
    .td-bold-large { font-size: 13.5px; font-weight: 800; color: #0f172a; }
    .td-hero-bold { font-size: 14px; font-weight: 900; color: #0f172a; letter-spacing: 0.02em; }
    .td-amount { text-align: right; font-weight: 700; font-family: 'JetBrains Mono', monospace; }

    .row-subtotal td {
      background: #f0fdfa;
      border-top: 1px solid #99f6e4;
      border-bottom: 1px solid #99f6e4;
    }
    .row-grand-total td {
      background: #ecfdf5;
      border-top: 2px solid #6ee7b7;
      border-bottom: 2px solid #6ee7b7;
    }
    .row-loss td {
      background: #fff1f2 !important;
      border-color: #fecdd3 !important;
    }

    /* Badges */
    .badge {
      display: inline-block;
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 6px;
    }
    .badge-primary { background: #e0f2fe; color: #0284c7; }
    .badge-rose { background: #ffe4e6; color: #e11d48; }
    .badge-teal { background: #ccfbf1; color: #0f766e; }
    .badge-amber { background: #fef3c7; color: #d97706; }
    .badge-purple { background: #ede9fe; color: #7c3aed; }
    .badge-success { background: #dcfce7; color: #15803d; }

    /* Modal Overlay */
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
export class ReportsComponent implements OnInit {
  statement = signal<any>(null);
  valuation = signal<any>(null);
  expiry = signal<any>(null);
  cashierShift = signal<any>(null);

  selectedPeriodMode: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM' = 'MONTHLY';
  selectedYear: number = new Date().getFullYear();
  selectedQuarter: number = Math.floor((new Date().getMonth() / 3)) + 1;
  selectedMonth: number = new Date().getMonth() + 1;
  startDate = '';
  endDate = '';

  availableYears: number[] = [2026, 2025, 2024];
  monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  activeTab: 'PL' | 'EXPENSES' | 'VALUATION' | 'TENDER' = 'PL';
  trendSeries: PeriodicTrendSlot[] = [];
  hoveredSlotIndex: number | null = null;

  constructor(
    private http: HttpClient,
    public router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const today = new Date();
    this.startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];

    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab && ['PL', 'EXPENSES', 'VALUATION', 'TENDER'].includes(tab)) {
        this.activeTab = tab as any;
      }
    });

    this.loadFinancialStatement();
    this.loadOtherReports();
  }

  selectPeriodMode(mode: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'): void {
    this.selectedPeriodMode = mode;
    this.loadFinancialStatement();
  }

  loadFinancialStatement(): void {
    let url = `${environment.apiUrl}/reports/financial-statement?periodType=${this.selectedPeriodMode}&year=${this.selectedYear}`;
    if (this.selectedPeriodMode === 'MONTHLY') {
      url += `&month=${this.selectedMonth}`;
    } else if (this.selectedPeriodMode === 'QUARTERLY') {
      url += `&quarter=${this.selectedQuarter}`;
    } else if (this.selectedPeriodMode === 'CUSTOM') {
      url += `&startDate=${this.startDate}&endDate=${this.endDate}`;
    }

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.statement.set(res.data);
        this.trendSeries = res.data?.trendSeries || [];
      },
      error: () => this.notificationService.error('Failed to load financial statement.')
    });
  }

  loadOtherReports(): void {
    this.http.get<any>(`${environment.apiUrl}/reports/inventory-valuation`).subscribe({
      next: (res) => this.valuation.set(res.data)
    });

    this.http.get<any>(`${environment.apiUrl}/reports/expiry-risk`).subscribe({
      next: (res) => this.expiry.set(res.data)
    });

    this.http.get<any>(`${environment.apiUrl}/reports/cashier-shift`).subscribe({
      next: (res) => this.cashierShift.set(res.data)
    });
  }

  get expenseCategoriesSummary(): Array<{ key: string; amount: number }> {
    const summary = this.statement()?.expensesByCategory || {};
    return Object.keys(summary).filter(k => summary[k] > 0).map(k => ({ key: k, amount: summary[k] }));
  }

  formatCategoryName(cat: string): string {
    if (!cat) return '';
    return cat.replace(/_/g, ' ').replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
  }

  getCategoryOpExShare(amount: number): number {
    const total = this.statement()?.totalOperatingExpenses || 0;
    if (total <= 0) return 0;
    return Math.round((amount / total) * 100);
  }

  getCategoryRevenueShare(amount: number): number {
    const rev = this.statement()?.totalRevenue || 0;
    if (rev <= 0) return 0;
    return Math.round((amount / rev) * 1000) / 10;
  }

  getCategoryClassification(key: string): string {
    switch (key) {
      case 'RENT':
      case 'UTILITIES':
      case 'LICENSES_REGULATORY':
      case 'TAXES_LEVIES':
        return 'Fixed Overhead';
      case 'SALARIES_PAYROLL':
      case 'MAINTENANCE_REPAIRS':
      case 'PACKAGING_CONSUMABLES':
      case 'TRANSPORT_LOGISTICS':
        return 'Operating Outflow';
      case 'STOCK_LOSS_WRITE_OFF':
        return 'Non-Operating Loss';
      default:
        return 'General Overhead';
    }
  }

  downloadPdf(): void {
    const params = `?startDate=${this.statement()?.startDate || this.startDate}&endDate=${this.statement()?.endDate || this.endDate}`;
    window.open(`${environment.apiUrl}/reports/sales/pdf${params}`, '_blank');
  }

  // Math & Percent Helpers
  getBarHeightPct(val: number): number {
    if (!val || val <= 0) return 4;
    const maxVal = Math.max(...this.trendSeries.map(s => Math.max(s.revenue, s.expenses, s.grossProfit, 1)));
    return Math.min(95, Math.max(8, Math.round((val / maxVal) * 90)));
  }

  getCostPercent(): number {
    const rev = this.statement()?.totalRevenue || 0;
    const cost = this.statement()?.totalCostOfGoodsSold || 0;
    if (rev <= 0) return 0;
    return Math.min(100, Math.round((cost / rev) * 100));
  }

  getOpExPercent(): number {
    const rev = this.statement()?.totalRevenue || 0;
    const opex = this.statement()?.totalOperatingExpenses || 0;
    if (rev <= 0) return 0;
    return Math.min(100, Math.round((opex / rev) * 100));
  }

  getLossPercent(): number {
    const rev = this.statement()?.totalRevenue || 0;
    const loss = this.statement()?.expiredStockLoss || 0;
    if (rev <= 0) return 0;
    return Math.min(100, Math.round((loss / rev) * 100));
  }

  getNetProfitDonutArray(): string {
    const margin = Math.max(0, this.statement()?.netProfitMarginPercentage || 0);
    return `${margin} ${Math.max(0, 100 - margin)}`;
  }

  getOpExDonutArray(): string {
    const opex = this.getOpExPercent();
    return `${opex} ${Math.max(0, 100 - opex)}`;
  }

  getNetProfitDonutOffset(): string {
    const margin = Math.max(0, this.statement()?.netProfitMarginPercentage || 0);
    return `${-margin}`;
  }

  getCostDonutArray(): string {
    const c = this.getCostPercent();
    return `${c} ${Math.max(0, 100 - c)}`;
  }

  getCostDonutOffsetCalculated(): string {
    const margin = Math.max(0, this.statement()?.netProfitMarginPercentage || 0);
    const opex = this.getOpExPercent();
    return `${-(margin + opex)}`;
  }

  getCashPercent(): number {
    const total = this.cashierShift()?.totalRevenue || 1;
    return Math.round(((this.cashierShift()?.cashAmount || 0) / total) * 100);
  }

  getDigitalPercent(): number {
    const total = this.cashierShift()?.totalRevenue || 1;
    return Math.round(((this.cashierShift()?.digitalAmount || 0) / total) * 100);
  }

  getCardPercent(): number {
    const total = this.cashierShift()?.totalRevenue || 1;
    return Math.round(((this.cashierShift()?.cardOrBankAmount || 0) / total) * 100);
  }
}
