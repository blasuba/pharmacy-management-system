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
      <!-- 1. TOP HEADER & FINANCIAL PERIOD SELECTOR                                 -->
      <!-- ========================================================================= -->
      <div class="top-header-row">
        <div class="header-titles">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="header-icon-box">
              <lucide-icon name="line-chart" [size]="22"></lucide-icon>
            </div>
            <div>
              <h1 class="main-page-title">Profit & Financial Analytics</h1>
              <p class="header-subtitle">
                Track your pharmacy's sales income, product costs, daily expenses, and take-home net profit.
              </p>
            </div>
          </div>
        </div>

        <div class="header-controls">
          <!-- Quick Period Mode Pills -->
          <div class="date-pills-group">
            <button (click)="selectPeriodMode('DAILY')" [class.active]="selectedPeriodMode === 'DAILY'" class="range-pill">Today</button>
            <button (click)="selectPeriodMode('WEEKLY')" [class.active]="selectedPeriodMode === 'WEEKLY'" class="range-pill">7 Days</button>
            <button (click)="selectPeriodMode('MONTHLY')" [class.active]="selectedPeriodMode === 'MONTHLY'" class="range-pill">Monthly</button>
            <button (click)="selectPeriodMode('QUARTERLY')" [class.active]="selectedPeriodMode === 'QUARTERLY'" class="range-pill">Quarterly</button>
            <button (click)="selectPeriodMode('YEARLY')" [class.active]="selectedPeriodMode === 'YEARLY'" class="range-pill">Yearly</button>
            <button (click)="selectPeriodMode('CUSTOM')" [class.active]="selectedPeriodMode === 'CUSTOM'" class="range-pill">Custom</button>
          </div>

          <!-- Export PDF Button -->
          <button (click)="downloadPdf()" class="btn-pdf-export" title="Download Official Financial Statement PDF">
            <lucide-icon name="file-down" [size]="15"></lucide-icon>
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      <!-- Secondary Period Navigator & Filter Toolbar -->
      <div class="date-filter-bar">
        <div class="filter-left">
          <lucide-icon name="calendar" [size]="16" color="#059669"></lucide-icon>
          <span class="filter-label">Selected Period:</span>

          <!-- Year Selector -->
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
            {{ statement()?.periodLabel || 'Consolidated Overview' }}
          </span>
        </div>

        <div style="display: flex; gap: 8px;">
          <button (click)="loadFinancialStatement()" class="btn-recalculate" title="Recalculate live financial metrics">
            <lucide-icon name="refresh-cw" [size]="14"></lucide-icon>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 2. INTUITIVE VISUAL PROFIT FLOW BANNER (NON-TECH FRIENDLY)                -->
      <!-- ========================================================================= -->
      <div class="profit-equation-banner">
        <div class="eq-step">
          <span class="eq-label">1. Total Sales</span>
          <span class="eq-val text-blue">ETB {{ (statement()?.totalRevenue || 0) | number:'1.2-2' }}</span>
          <span class="eq-sub">{{ statement()?.totalSalesCount || 0 }} sales</span>
        </div>

        <div class="eq-operator">−</div>

        <div class="eq-step">
          <span class="eq-label">2. Product Buying Cost</span>
          <span class="eq-val text-slate">ETB {{ (statement()?.totalCostOfGoodsSold || 0) | number:'1.2-2' }}</span>
          <span class="eq-sub">{{ getCostPercent() }}% of sales</span>
        </div>

        <div class="eq-operator">=</div>

        <div class="eq-step">
          <span class="eq-label">3. Gross Margin</span>
          <span class="eq-val text-teal">ETB {{ (statement()?.grossProfit || 0) | number:'1.2-2' }}</span>
          <span class="eq-sub">{{ (statement()?.grossMarginPercentage || 0) | number:'1.1-1' }}% margin</span>
        </div>

        <div class="eq-operator">−</div>

        <div class="eq-step">
          <span class="eq-label">4. Running Expenses</span>
          <span class="eq-val text-amber">ETB {{ (statement()?.totalOperatingExpenses || 0) | number:'1.2-2' }}</span>
          <span class="eq-sub">{{ statement()?.expensesCount || 0 }} expenses</span>
        </div>

        <div class="eq-operator">➔</div>

        <div class="eq-step eq-highlight-green">
          <span class="eq-label eq-label-hero">5. Take-Home Net Profit</span>
          <span class="eq-val eq-val-hero">ETB {{ (statement()?.netOperatingProfit || 0) | number:'1.2-2' }}</span>
          <span class="eq-sub eq-sub-hero">{{ (statement()?.netProfitMarginPercentage || 0) | number:'1.1-1' }}% net profit margin</span>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 3. TOP 4 EXECUTIVE SUMMARY CARDS                                          -->
      <!-- ========================================================================= -->
      <div class="top-cards-grid-4">
        <!-- 1. Gross Sales Revenue -->
        <div class="summary-card card-blue">
          <div class="card-head-flex">
            <div class="icon-circle icon-blue">
              <lucide-icon name="dollar-sign" [size]="18" color="#0284c7"></lucide-icon>
            </div>
            <span class="status-pill pill-blue">Sales Income</span>
          </div>
          <div class="card-body-block">
            <span class="card-sublabel">Total Sales Revenue</span>
            <div class="card-big-value text-blue">
              ETB {{ (statement()?.totalRevenue || 0) | number:'1.2-2' }}
            </div>
            <span class="card-footer-note">{{ statement()?.totalSalesCount || 0 }} completed customer transactions</span>
          </div>
        </div>

        <!-- 2. Cost of Goods (Neutral / Slate-Blue - NO RED) -->
        <div class="summary-card card-slate">
          <div class="card-head-flex">
            <div class="icon-circle icon-slate">
              <lucide-icon name="shopping-bag" [size]="18" color="#475569"></lucide-icon>
            </div>
            <span class="status-pill pill-slate">{{ getCostPercent() }}% Cost Ratio</span>
          </div>
          <div class="card-body-block">
            <span class="card-sublabel">Product Buying Cost (COGS)</span>
            <div class="card-big-value text-slate">
              ETB {{ (statement()?.totalCostOfGoodsSold || 0) | number:'1.2-2' }}
            </div>
            <span class="card-footer-note">Wholesale inventory purchase cost</span>
          </div>
        </div>

        <!-- 3. Operating Expenses -->
        <div class="summary-card card-amber">
          <div class="card-head-flex">
            <div class="icon-circle icon-amber">
              <lucide-icon name="receipt" [size]="18" color="#d97706"></lucide-icon>
            </div>
            <span class="status-pill pill-amber">{{ statement()?.expensesCount || 0 }} Entries</span>
          </div>
          <div class="card-body-block">
            <span class="card-sublabel">Operating Expenses (OpEx)</span>
            <div class="card-big-value text-amber">
              ETB {{ (statement()?.totalOperatingExpenses || 0) | number:'1.2-2' }}
            </div>
            <span class="card-footer-note">Store rent, salaries, utilities & overheads</span>
          </div>
        </div>

        <!-- 4. Hero Net Profit (Comforting Emerald Green) -->
        <div class="summary-card hero-emerald-card">
          <div class="card-head-flex">
            <div class="icon-circle icon-emerald-glow">
              <lucide-icon name="award" [size]="20" color="#ffffff"></lucide-icon>
            </div>
            <span class="status-pill pill-emerald-bright">
              {{ (statement()?.netProfitMarginPercentage || 0) | number:'1.1-1' }}% Margin
            </span>
          </div>
          <div class="card-body-block">
            <span class="hero-card-sublabel">Net Operating Profit</span>
            <div class="hero-card-big-value">
              ETB {{ (statement()?.netOperatingProfit || 0) | number:'1.2-2' }}
            </div>
            <span class="hero-card-footer-note">Final take-home profit after all costs</span>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 4. CHARTS & REVENUE DISTRIBUTION BREAKDOWN                                -->
      <!-- ========================================================================= -->
      <div class="middle-analytics-grid">
        
        <!-- Left: Periodic Trend Velocity Bar Chart -->
        <div class="analytics-chart-panel">
          <div class="panel-header-row">
            <div>
              <h3 class="panel-title-text">Income vs Expenses vs Net Profit</h3>
              <p class="panel-subtitle-text">
                {{ selectedPeriodMode }} trend showing money in, costs, and profit over time
              </p>
            </div>
            <div class="chart-legend-row">
              <span class="legend-chip"><span class="legend-box bg-blue"></span> Sales</span>
              <span class="legend-chip"><span class="legend-box bg-amber"></span> Expenses</span>
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
                  <div class="tip-line"><span style="color: #60a5fa;">Sales:</span> ETB {{ slot.revenue | number:'1.0-0' }}</div>
                  <div class="tip-line"><span style="color: #94a3b8;">Cost:</span> ETB {{ slot.cogs | number:'1.0-0' }}</div>
                  <div class="tip-line"><span style="color: #fbbf24;">Expenses:</span> ETB {{ slot.expenses | number:'1.0-0' }}</div>
                  <div class="tip-line" style="font-weight: 800; border-top: 1px solid #334155; margin-top: 3px; padding-top: 3px;">
                    <span style="color: #4ade80;">Net Profit:</span> ETB {{ slot.netProfit | number:'1.0-0' }}
                  </div>
                </div>

                <!-- Multi-bar group -->
                <div class="multi-bars-group">
                  <!-- Revenue Bar -->
                  <div class="bar-pill bar-blue" [style.height.%]="getBarHeightPct(slot.revenue)" title="Sales: ETB {{ slot.revenue }}"></div>
                  <!-- Expense Bar -->
                  <div class="bar-pill bar-amber" [style.height.%]="getBarHeightPct(slot.expenses)" title="Expenses: ETB {{ slot.expenses }}"></div>
                  <!-- Net Profit Bar (Clean Emerald) -->
                  <div class="bar-pill bar-emerald" [style.height.%]="getBarHeightPct(slot.netProfit)" title="Net Profit: ETB {{ slot.netProfit }}"></div>
                </div>

                <span class="bar-day-label" [class.label-active]="hoveredSlotIndex === idx">{{ slot.periodName }}</span>
              </div>
            </div>
          </div>

          <div *ngIf="trendSeries.length === 0" style="padding: 36px; text-align: center; color: #94a3b8; font-size: 13px;">
            No transactions recorded for the selected time window.
          </div>
        </div>

        <!-- Right: Revenue Distribution Breakdown Donut -->
        <div class="donut-chart-panel">
          <div class="panel-header-row">
            <div>
              <h3 class="panel-title-text">Where Your Sales Money Goes</h3>
              <p class="panel-subtitle-text">Percentage share of total income</p>
            </div>
            <span class="status-pill pill-emerald-bright">{{ (statement()?.netProfitMarginPercentage || 0) | number:'1.1-1' }}% Net</span>
          </div>

          <div class="donut-visual-container">
            <div class="donut-svg-wrapper">
              <svg width="140" height="140" viewBox="0 0 42 42" class="donut-svg">
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" stroke-width="6.5"></circle>
                <!-- Net Profit Ring Segment (Emerald) -->
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#10b981" stroke-width="6.5"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="getNetProfitDonutArray()" stroke-dashoffset="0"></circle>
                <!-- OpEx Ring Segment (Amber) -->
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" stroke-width="6.5"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="getOpExDonutArray()" [attr.stroke-dashoffset]="getNetProfitDonutOffset()"></circle>
                <!-- Product Cost Ring Segment (Slate / Indigo - No Red) -->
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#64748b" stroke-width="6.5"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="getCostDonutArray()" [attr.stroke-dashoffset]="getCostDonutOffsetCalculated()"></circle>
              </svg>
              <div class="donut-center-info">
                <span class="center-pct text-emerald">{{ (statement()?.netProfitMarginPercentage || 0) | number:'1.0-0' }}%</span>
                <span class="center-sub">Net Profit</span>
              </div>
            </div>

            <!-- Distribution Legend Cards -->
            <div class="donut-legend-list">
              <div class="legend-item-card">
                <div class="legend-badge-row">
                  <span class="legend-dot dot-emerald"></span>
                  <span class="legend-name">Take-Home Profit</span>
                  <span class="legend-pct text-emerald">{{ (statement()?.netProfitMarginPercentage || 0) | number:'1.1-1' }}%</span>
                </div>
                <div class="legend-val text-emerald">ETB {{ (statement()?.netOperatingProfit || 0) | number:'1.2-2' }}</div>
              </div>

              <div class="legend-item-card">
                <div class="legend-badge-row">
                  <span class="legend-dot dot-amber"></span>
                  <span class="legend-name">Operating Expenses</span>
                  <span class="legend-pct text-amber">{{ getOpExPercent() }}%</span>
                </div>
                <div class="legend-val">ETB {{ (statement()?.totalOperatingExpenses || 0) | number:'1.2-2' }}</div>
              </div>

              <div class="legend-item-card">
                <div class="legend-badge-row">
                  <span class="legend-dot dot-slate"></span>
                  <span class="legend-name">Product Buying Cost</span>
                  <span class="legend-pct text-slate">{{ getCostPercent() }}%</span>
                </div>
                <div class="legend-val">ETB {{ (statement()?.totalCostOfGoodsSold || 0) | number:'1.2-2' }}</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- 5. TABS FOR DETAILED BREAKDOWNS                                           -->
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
              <span>Expenses Breakdown ({{ statement()?.expensesCount || 0 }})</span>
            </button>

            <button (click)="activeTab = 'VALUATION'" [class.active]="activeTab === 'VALUATION'" class="tab-btn">
              <lucide-icon name="boxes" [size]="14"></lucide-icon>
              <span>Stock Value on Shelf</span>
            </button>

            <button (click)="activeTab = 'TENDER'" [class.active]="activeTab === 'TENDER'" class="tab-btn">
              <lucide-icon name="credit-card" [size]="14"></lucide-icon>
              <span>Payment Methods</span>
            </button>
          </div>

          <div style="display: flex; gap: 8px;">
            <button (click)="downloadPdf()" class="btn-export-statement">
              <lucide-icon name="printer" [size]="14"></lucide-icon>
              <span>Print Financial Report</span>
            </button>
          </div>
        </div>

        <!-- TAB 1: P&L SUMMARY TABLE -->
        <div *ngIf="activeTab === 'PL'" class="table-scroll-wrapper">
          <table class="statement-table">
            <thead>
              <tr>
                <th>Summary Line</th>
                <th>Type</th>
                <th>Description</th>
                <th style="text-align: right;">Amount (ETB)</th>
                <th style="text-align: right;">% of Sales</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. Revenue -->
              <tr>
                <td class="td-strong">1. Total Sales Revenue</td>
                <td><span class="status-pill pill-blue">Sales Income</span></td>
                <td>Money collected from all completed customer purchases</td>
                <td class="td-amount text-blue">ETB {{ (statement()?.totalRevenue || 0) | number:'1.2-2' }}</td>
                <td class="td-amount">100.0%</td>
              </tr>

              <!-- 2. COGS -->
              <tr>
                <td class="td-strong">2. Product Wholesale Cost (COGS)</td>
                <td><span class="status-pill pill-slate">Product Cost</span></td>
                <td>Purchase price of the drugs sold to customers</td>
                <td class="td-amount text-slate">- ETB {{ (statement()?.totalCostOfGoodsSold || 0) | number:'1.2-2' }}</td>
                <td class="td-amount text-slate">{{ getCostPercent() }}%</td>
              </tr>

              <!-- 3. Gross Profit -->
              <tr class="row-subtotal">
                <td class="td-bold-large">3. Gross Profit (Trading Margin)</td>
                <td><span class="status-pill pill-teal">Gross Profit</span></td>
                <td>Sales revenue minus the direct wholesale product costs</td>
                <td class="td-amount td-bold-large text-teal">ETB {{ (statement()?.grossProfit || 0) | number:'1.2-2' }}</td>
                <td class="td-amount td-bold-large text-teal">{{ (statement()?.grossMarginPercentage || 0) | number:'1.1-2' }}%</td>
              </tr>

              <!-- 4. Operating Expenses Line -->
              <tr>
                <td class="td-strong">4. Operating Running Expenses (OpEx)</td>
                <td><span class="status-pill pill-amber">Daily Overheads</span></td>
                <td>Pharmacy rent, staff salaries, electricity, water, licenses</td>
                <td class="td-amount text-amber">- ETB {{ (statement()?.totalOperatingExpenses || 0) | number:'1.2-2' }}</td>
                <td class="td-amount text-amber">{{ getOpExPercent() }}%</td>
              </tr>

              <!-- 5. Expired Stock Losses if any -->
              <tr *ngIf="(statement()?.expiredStockLoss || 0) > 0">
                <td class="td-strong">5. Expired / Disposed Stock</td>
                <td><span class="status-pill pill-slate">Inventory Loss</span></td>
                <td>Cost value of expired batches removed from shelf</td>
                <td class="td-amount text-slate">- ETB {{ (statement()?.expiredStockLoss || 0) | number:'1.2-2' }}</td>
                <td class="td-amount text-slate">{{ getLossPercent() }}%</td>
              </tr>

              <!-- 6. NET OPERATING PROFIT -->
              <tr class="row-grand-total">
                <td class="td-hero-bold">NET TAKE-HOME PROFIT (BOTTOM LINE)</td>
                <td>
                  <span class="status-pill pill-emerald-bright">
                    Net Surplus
                  </span>
                </td>
                <td>Final profit after paying for products and all pharmacy expenses</td>
                <td class="td-amount td-hero-bold text-emerald">
                  ETB {{ (statement()?.netOperatingProfit || 0) | number:'1.2-2' }}
                </td>
                <td class="td-amount td-hero-bold text-emerald">
                  {{ (statement()?.netProfitMarginPercentage || 0) | number:'1.1-2' }}%
                </td>
              </tr>

              <!-- Restocking Memo Line -->
              <tr style="background: #f8fafc; font-size: 12px; color: #64748b;">
                <td><em>Memo: Restock Purchases Made in Period</em></td>
                <td><span class="status-pill pill-purple">Restock Orders</span></td>
                <td>Total restock orders placed with pharmaceutical distributors</td>
                <td class="td-amount">ETB {{ (statement()?.totalPurchases || 0) | number:'1.2-2' }}</td>
                <td class="td-amount">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TAB 2: OPERATING EXPENSES BREAKDOWN -->
        <div *ngIf="activeTab === 'EXPENSES'" style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Banner link to dedicated Expenses page -->
          <div class="card" style="padding: 14px 18px; background: #f0fdf4; border: 1px solid #bbf7d0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-radius: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; border-radius: 10px; background: #059669; color: #fff; display: flex; align-items: center; justify-content: center;">
                <lucide-icon name="wallet" [size]="20"></lucide-icon>
              </div>
              <div>
                <h4 style="font-size: 14px; font-weight: 800; color: #065f46; margin: 0;">Detailed Expense Records & Receipts</h4>
                <p style="font-size: 12px; color: #059669; margin: 2px 0 0;">
                  Record new receipts, attach payment proofs, search payee names, and view full expense audit logs.
                </p>
              </div>
            </div>
            <a routerLink="/expenses" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; text-decoration: none; background: #059669; border-color: #059669;">
              <span>Open Expenses Register</span>
              <lucide-icon name="arrow-right" [size]="14"></lucide-icon>
            </a>
          </div>

          <!-- Category Quick Summary Cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
            <div *ngFor="let cat of expenseCategoriesSummary" class="card" style="padding: 14px; border-left: 4px solid #059669; border-radius: 10px;">
              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">{{ formatCategoryName(cat.key) }}</div>
              <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px; font-family: 'JetBrains Mono', monospace;">
                ETB {{ cat.amount | number:'1.2-2' }}
              </div>
              <div style="font-size: 11px; color: #059669; margin-top: 3px; font-weight: 600;">
                {{ getCategoryOpExShare(cat.amount) }}% of Total Expenses
              </div>
            </div>
          </div>

          <!-- Expense Allocation Statement Table -->
          <div class="table-scroll-wrapper card" style="padding: 0; overflow: hidden; border-radius: 12px;">
            <table class="statement-table">
              <thead>
                <tr>
                  <th>Expense Category</th>
                  <th>Overhead Classification</th>
                  <th style="text-align: right;">Amount (ETB)</th>
                  <th style="text-align: right;">% of Total Expenses</th>
                  <th style="text-align: right;">% of Sales Income</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cat of expenseCategoriesSummary">
                  <td class="td-strong">
                    <span style="color: #059669; margin-right: 6px;">●</span>
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
                  <td class="td-bold-large">Total Period Operating Expenses</td>
                  <td>Consolidated Operating Overheads</td>
                  <td class="td-amount td-bold-large text-amber">
                    ETB {{ (statement()?.totalOperatingExpenses || 0) | number:'1.2-2' }}
                  </td>
                  <td class="td-amount td-bold-large">100.0%</td>
                  <td class="td-amount td-bold-large">{{ getOpExPercent() }}%</td>
                </tr>
                <tr *ngIf="expenseCategoriesSummary.length === 0">
                  <td colspan="5" style="text-align: center; padding: 36px; color: #94a3b8; font-size: 13px;">
                    No operational expenses recorded for this period.
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
                <th>Stock Valuation Item</th>
                <th>Description</th>
                <th>Quantity</th>
                <th style="text-align: right;">Valuation (ETB)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="td-strong">Wholesale Buying Value (Cost)</td>
                <td>Total money invested in the current medicine stock on shelf</td>
                <td>{{ valuation()?.totalUnitsInStock || 0 }} total units</td>
                <td class="td-amount">ETB {{ (valuation()?.totalCostValuation || 0) | number:'1.2-2' }}</td>
              </tr>
              <tr>
                <td class="td-strong">Projected Retail Selling Value</td>
                <td>Total expected sales revenue when all current shelf stock is sold</td>
                <td>{{ valuation()?.activeBatchesCount || 0 }} active batches</td>
                <td class="td-amount text-emerald">ETB {{ (valuation()?.totalRetailValuation || 0) | number:'1.2-2' }}</td>
              </tr>
              <tr class="row-subtotal">
                <td class="td-bold-large">Potential Future Gross Margin</td>
                <td>Expected profit once current shelf inventory is sold</td>
                <td>Active inventory margin</td>
                <td class="td-amount td-bold-large text-teal">ETB {{ (valuation()?.potentialGrossProfit || 0) | number:'1.2-2' }}</td>
              </tr>
              <tr *ngIf="(expiry()?.expiredLossValuation || 0) > 0" style="background: #f8fafc;">
                <td class="td-strong" style="color: #64748b;">Expired Batch Stock Value</td>
                <td>Batches past their FEFO expiry date</td>
                <td>{{ expiry()?.expiredCount || 0 }} expired batches</td>
                <td class="td-amount text-slate">- ETB {{ (expiry()?.expiredLossValuation || 0) | number:'1.2-2' }}</td>
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
                <th>Status</th>
                <th style="text-align: right;">Collected Amount (ETB)</th>
                <th style="text-align: right;">Share of Sales</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="td-strong">Physical Cash Drawer</td>
                <td>Cash Tender</td>
                <td><span class="status-pill pill-emerald-bright">Reconciled</span></td>
                <td class="td-amount">ETB {{ (cashierShift()?.cashAmount || 0) | number:'1.2-2' }}</td>
                <td class="td-amount">{{ getCashPercent() }}%</td>
              </tr>
              <tr>
                <td class="td-strong">Telebirr / Digital Wallet</td>
                <td>Electronic Mobile Pay</td>
                <td><span class="status-pill pill-blue">Direct Settlement</span></td>
                <td class="td-amount">ETB {{ (cashierShift()?.digitalAmount || 0) | number:'1.2-2' }}</td>
                <td class="td-amount">{{ getDigitalPercent() }}%</td>
              </tr>
              <tr>
                <td class="td-strong">POS Card / Bank Transfer</td>
                <td>Card & Bank Clearing</td>
                <td><span class="status-pill pill-blue">Settled</span></td>
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
    .header-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #059669, #0d9488);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(5,150,105,0.25);
    }
    .main-page-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .header-subtitle {
      font-size: 13px;
      color: #64748b;
      margin: 2px 0 0;
    }

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
      color: #059669;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    .btn-pdf-export {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 8px;
      background: #059669;
      color: #ffffff;
      font-size: 12.5px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(5,150,105,0.25);
      transition: all 0.2s ease;
    }
    .btn-pdf-export:hover {
      background: #047857;
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
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
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
      color: #059669;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
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
      transition: all 0.2s ease;
    }
    .btn-recalculate:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    /* Intuitive Profit Equation Banner */
    .profit-equation-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 20px;
      gap: 10px;
      flex-wrap: wrap;
      box-shadow: 0 1px 4px rgba(0,0,0,0.02);
    }
    .eq-step {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .eq-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .eq-val {
      font-size: 16px;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
    }
    .eq-sub {
      font-size: 11px;
      color: #94a3b8;
    }
    .eq-operator {
      font-size: 18px;
      font-weight: 800;
      color: #94a3b8;
    }
    .eq-highlight-green {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 10px;
      padding: 6px 14px;
    }
    .eq-label-hero {
      color: #047857;
    }
    .eq-val-hero {
      color: #059669;
      font-size: 18px;
    }
    .eq-sub-hero {
      color: #059669;
      font-weight: 600;
    }

    /* 4 Top Cards Grid */
    .top-cards-grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 16px;
    }
    .summary-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.02);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .summary-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    .card-blue { border-left: 4px solid #0284c7; }
    .card-slate { border-left: 4px solid #64748b; }
    .card-amber { border-left: 4px solid #d97706; }

    .card-head-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .icon-circle {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-blue { background: #e0f2fe; }
    .icon-slate { background: #f1f5f9; }
    .icon-amber { background: #fef3c7; }
    .icon-emerald-glow {
      background: rgba(255,255,255,0.25);
    }

    .card-body-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .card-sublabel {
      font-size: 11.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .card-big-value {
      font-size: 22px;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      margin: 2px 0;
    }
    .card-footer-note {
      font-size: 11px;
      color: #64748b;
    }

    .text-blue { color: #0284c7; }
    .text-slate { color: #475569; }
    .text-teal { color: #0d9488; }
    .text-amber { color: #d97706; }
    .text-emerald { color: #059669; }

    /* Hero Net Card */
    .hero-emerald-card {
      background: linear-gradient(135deg, #065f46 0%, #047857 100%);
      color: #ffffff;
      border: 1px solid #047857;
      border-radius: 14px;
      box-shadow: 0 4px 14px rgba(4,120,87,0.25);
    }
    .hero-card-sublabel {
      font-size: 11.5px;
      font-weight: 700;
      color: rgba(255,255,255,0.85);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .hero-card-big-value {
      font-size: 24px;
      font-weight: 900;
      font-family: 'JetBrains Mono', monospace;
      color: #ffffff;
      margin: 2px 0;
    }
    .hero-card-footer-note {
      font-size: 11px;
      color: rgba(255,255,255,0.8);
    }

    /* Status Pills */
    .status-pill {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .pill-blue { background: #e0f2fe; color: #0284c7; }
    .pill-slate { background: #f1f5f9; color: #475569; }
    .pill-amber { background: #fef3c7; color: #d97706; }
    .pill-teal { background: #ccfbf1; color: #0f766e; }
    .pill-purple { background: #ede9fe; color: #7c3aed; }
    .pill-emerald-bright { background: #dcfce7; color: #15803d; }

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
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 18px 20px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.02);
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
      top: -70px;
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
      padding: 8px 0;
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
    .center-pct { font-size: 18px; font-weight: 900; line-height: 1.1; }
    .center-sub { font-size: 10px; font-weight: 700; color: #64748b; }

    .donut-legend-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }
    .legend-item-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
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
    .dot-slate { background: #64748b; }
    .legend-name { font-size: 10.5px; font-weight: 700; color: #475569; flex: 1; }
    .legend-pct { font-size: 10.5px; font-weight: 800; }
    .legend-val { font-size: 12px; font-weight: 800; color: #0f172a; font-family: monospace; }

    /* Bottom Financial Statement Panel */
    .financial-statement-panel {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 18px 20px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.02);
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
      color: #059669;
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
      transition: all 0.2s ease;
    }
    .btn-export-statement:hover {
      background: #f1f5f9;
      color: #0f172a;
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
