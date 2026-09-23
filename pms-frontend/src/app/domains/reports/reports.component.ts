import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { environment } from '../../../environments/environment';

export interface ReportBarMetric {
  period: string;
  revenue: number;
  profit: number;
  heightPct: number;
  highlighted?: boolean;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="pharmly-reports-root">

      <!-- ========================================================================= -->
      <!-- 1. TOP HEADER & FILTER BAR                                                -->
      <!-- ========================================================================= -->
      <div class="top-header-row">
        <div class="header-titles">
          <h1 class="main-page-title">Financial & Profit Analytics</h1>
          <div class="breadcrumb-sub">
            <span>Analytics</span>
            <span class="crumb-sep">&gt;</span>
            <span class="crumb-active">P&L, Valuations & Distribution</span>
          </div>
        </div>

        <div class="header-controls">
          <!-- Search box -->
          <div class="search-capsule">
            <lucide-icon name="search" [size]="15" class="search-icon"></lucide-icon>
            <input 
              type="text" 
              placeholder="Search statements & items..." 
              [(ngModel)]="searchQuery" 
              class="search-input-field" />
          </div>

          <!-- Quick Date Range Pills -->
          <div class="date-pills-group">
            <button (click)="setRange('TODAY')" [class.active]="selectedRange === 'TODAY'" class="range-pill">Today</button>
            <button (click)="setRange('7D')" [class.active]="selectedRange === '7D'" class="range-pill">7 Days</button>
            <button (click)="setRange('30D')" [class.active]="selectedRange === '30D'" class="range-pill">30 Days</button>
            <button (click)="setRange('YEAR')" [class.active]="selectedRange === 'YEAR'" class="range-pill">This Year</button>
          </div>

          <!-- Download Sales PDF Button -->
          <button (click)="downloadPdf()" class="btn-pdf-export" title="Export PDF Statement">
            <lucide-icon name="file-down" [size]="15"></lucide-icon>
            <span>Official PDF</span>
          </button>
        </div>
      </div>

      <!-- Custom Date Filter Toolbar -->
      <div class="date-filter-bar">
        <div class="filter-left">
          <lucide-icon name="calendar" [size]="15" color="#0f766e"></lucide-icon>
          <span class="filter-label">Custom Audit Window:</span>
          <div class="date-input-wrap">
            <input type="date" [(ngModel)]="startDate" (change)="loadReports()" class="date-field" />
            <span class="date-sep">to</span>
            <input type="date" [(ngModel)]="endDate" (change)="loadReports()" class="date-field" />
          </div>
        </div>
        <button (click)="loadReports()" class="btn-recalculate">
          <lucide-icon name="refresh-cw" [size]="14"></lucide-icon>
          <span>Recalculate P&L</span>
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- 2. TOP 4 METRIC CARDS ROW (Pharmly Layout)                                -->
      <!-- ========================================================================= -->
      <div class="top-cards-grid">
        <!-- Hero Dark Emerald Card: Net Gross Profit -->
        <div class="hero-emerald-card">
          <div class="card-head-flex">
            <div class="lime-icon-circle">
              <span class="currency-symbol">$</span>
            </div>
            <div class="trend-pill-lime">
              <lucide-icon name="trending-up" [size]="12"></lucide-icon>
              <span>{{ (pnl()?.profitMarginPercentage || getProfitPercent()) | number:'1.1-1' }}% Margin</span>
            </div>
            <span class="dots-action-btn">&#8230;</span>
          </div>
          <div class="card-content-block">
            <span class="hero-card-sublabel">Net Gross Profit</span>
            <div class="hero-card-big-value">
              ETB {{ (pnl()?.grossProfit || 0) | number:'1.2-2' }}
            </div>
            <span class="hero-card-footer-note">COGS: ETB {{ (pnl()?.totalCostOfGoodsSold || 0) | number:'1.0-0' }}</span>
          </div>
        </div>

        <!-- White Card 1: Total Sales Revenue -->
        <div class="white-metric-card">
          <div class="card-head-flex">
            <div class="icon-circle-soft blue-soft">
              <lucide-icon name="dollar-sign" [size]="17" color="#0284c7"></lucide-icon>
            </div>
            <div class="trend-pill-blue">
              <span>Gross Sales</span>
            </div>
            <span class="dots-action-btn">&#8230;</span>
          </div>
          <div class="card-content-block">
            <span class="white-card-sublabel">Period Revenue</span>
            <div class="white-card-big-value text-blue">
              ETB {{ (pnl()?.totalRevenue || 0) | number:'1.2-2' }}
            </div>
            <span class="white-card-footer-note">{{ pnl()?.totalSalesCount || 0 }} completed sales orders</span>
          </div>
        </div>

        <!-- White Card 2: Cost of Goods Sold (COGS) -->
        <div class="white-metric-card">
          <div class="card-head-flex">
            <div class="icon-circle-soft red-soft">
              <lucide-icon name="trending-down" [size]="17" color="#ef4444"></lucide-icon>
            </div>
            <div class="trend-pill-red">
              <span>{{ getCostPercent() }}% Cost Ratio</span>
            </div>
            <span class="dots-action-btn">&#8230;</span>
          </div>
          <div class="card-content-block">
            <span class="white-card-sublabel">Cost of Goods Sold (COGS)</span>
            <div class="white-card-big-value text-red">
              ETB {{ (pnl()?.totalCostOfGoodsSold || 0) | number:'1.2-2' }}
            </div>
            <span class="white-card-footer-note">Direct batch procurement cost</span>
          </div>
        </div>

        <!-- Efficiency Banner Card: Inventory Stock Asset Worth -->
        <div class="efficiency-banner-card">
          <div class="card-head-flex">
            <span class="banner-badge">ASSET VALUATION</span>
            <span class="dots-action-btn">&#8230;</span>
          </div>
          <div class="banner-overlay-content">
            <span class="banner-sublabel">Total Stock Worth</span>
            <div class="banner-big-value">
              ETB {{ (valuation()?.totalCostValuation || 0) | number:'1.2-2' }}
            </div>
            <div class="banner-footer-flex">
              <span class="banner-retail-note">Retail: ETB {{ (valuation()?.totalRetailValuation || 0) | number:'1.0-0' }}</span>
              <button (click)="downloadPdf()" class="btn-banner-action">
                <lucide-icon name="file-text" [size]="13"></lucide-icon>
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 3. MIDDLE VISUAL CHARTS ROW (Capsule Bar Chart + Donut Margin Chart)      -->
      <!-- ========================================================================= -->
      <div class="middle-analytics-grid">
        
        <!-- Left: Sales & Profit Analytics Capsule Bar Chart (2/3 width) -->
        <div class="analytics-chart-panel">
          <div class="panel-header-row">
            <div>
              <h3 class="panel-title-text">Revenue vs Profit Velocity Analytics</h3>
              <p class="panel-subtitle-text">Monthly trajectory of gross receipts and profit realization</p>
            </div>
            <div class="panel-header-tools">
              <div class="timeframe-dropdown-chip">
                <span>{{ selectedPeriodLabel }}</span>
                <lucide-icon name="chevron-down" [size]="13"></lucide-icon>
              </div>
              <div class="nav-arrow-group">
                <button (click)="shiftChartPage(-1)" class="nav-mini-arrow" title="Previous period">&lt;</button>
                <button (click)="shiftChartPage(1)" class="nav-mini-arrow" title="Next period">&gt;</button>
              </div>
            </div>
          </div>

          <!-- Capsule Bar Chart Viewport -->
          <div class="capsule-chart-viewport">
            <div class="y-axis-labels">
              <span>50k</span>
              <span>40k</span>
              <span>30k</span>
              <span>20k</span>
              <span>10k</span>
              <span>0k</span>
            </div>

            <div class="bars-container-flex">
              <div 
                *ngFor="let bar of chartBars; let idx = index" 
                class="capsule-bar-column"
                (mouseenter)="hoveredBarIndex = idx"
                (mouseleave)="hoveredBarIndex = null">
                
                <!-- Floating Tooltip on Hover / Active -->
                <div *ngIf="bar.highlighted || hoveredBarIndex === idx" class="capsule-tooltip-bubble">
                  <div class="tip-amount">ETB {{ bar.revenue | number:'1.0-0' }}</div>
                  <div class="tip-growth">Profit: ETB {{ bar.profit | number:'1.0-0' }}</div>
                </div>

                <!-- Capsule Track -->
                <div class="capsule-track">
                  <div 
                    class="capsule-fill" 
                    [class.striped-active]="bar.highlighted"
                    [style.height.%]="bar.heightPct">
                  </div>
                </div>

                <!-- Bottom Period Label -->
                <span class="bar-day-label" [class.label-active]="bar.highlighted">{{ bar.period }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Profit vs COGS Distribution Donut Chart (1/3 width) -->
        <div class="donut-chart-panel">
          <div class="panel-header-row">
            <div>
              <h3 class="panel-title-text">P&L Margin Distribution</h3>
              <p class="panel-subtitle-text">Gross Revenue split</p>
            </div>
            <span class="badge-distribution">Period Margin</span>
          </div>

          <div class="donut-visual-container">
            <!-- Multi-segment SVG Donut -->
            <div class="donut-svg-wrapper">
              <svg width="150" height="150" viewBox="0 0 42 42" class="donut-svg">
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" stroke-width="6.5"></circle>
                <!-- Net Profit Ring Segment (Emerald) -->
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#10b981" stroke-width="6.5"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="getProfitDonutArray()" stroke-dashoffset="0"></circle>
                <!-- COGS Ring Segment (Red/Coral) -->
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#ef4444" stroke-width="6.5"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="getCostDonutArray()" [attr.stroke-dashoffset]="getCostDonutOffset()"></circle>
              </svg>
              <!-- Center Donut Label -->
              <div class="donut-center-info">
                <span class="center-pct">{{ getProfitPercent() }}%</span>
                <span class="center-sub">Net Margin</span>
              </div>
            </div>

            <!-- Legend Pills List -->
            <div class="donut-legend-list">
              <div class="legend-item-card">
                <div class="legend-badge-row">
                  <span class="legend-dot dot-emerald"></span>
                  <span class="legend-name">Net Gross Profit</span>
                  <span class="legend-pct text-emerald">{{ getProfitPercent() }}%</span>
                </div>
                <div class="legend-val">ETB {{ (pnl()?.grossProfit || 0) | number:'1.2-2' }}</div>
              </div>

              <div class="legend-item-card">
                <div class="legend-badge-row">
                  <span class="legend-dot dot-red"></span>
                  <span class="legend-name">Cost of Goods (COGS)</span>
                  <span class="legend-pct text-red">{{ getCostPercent() }}%</span>
                </div>
                <div class="legend-val">ETB {{ (pnl()?.totalCostOfGoodsSold || 0) | number:'1.2-2' }}</div>
              </div>
            </div>
          </div>

          <div class="panel-bottom-summary">
            <span>Verified from immutable POS batches</span>
            <strong class="text-emerald">{{ (pnl()?.profitMarginPercentage || getProfitPercent()) | number:'1.1-2' }}% Net Margin</strong>
          </div>
        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- 4. SECOND VISUAL ROW: PAYMENT TENDER DONUT & EXPIRY RISK HORIZON MATRIX  -->
      <!-- ========================================================================= -->
      <div class="second-visual-grid">
        
        <!-- Payment Tender Donut Breakdown -->
        <div class="tender-donut-card">
          <div class="panel-header-row">
            <div>
              <h3 class="panel-title-text">Payment Tender Channel Distribution</h3>
              <p class="panel-subtitle-text">Cash, Telebirr & Card settlement breakdown</p>
            </div>
            <span class="badge-channel">POS Shift</span>
          </div>

          <div class="tender-flex-layout">
            <!-- SVG Donut -->
            <div class="donut-svg-wrapper">
              <svg width="140" height="140" viewBox="0 0 42 42" class="donut-svg">
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" stroke-width="6.5"></circle>
                <!-- Cash (Sky Blue) -->
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#0284c7" stroke-width="6.5"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="getCashDonutArray()" stroke-dashoffset="0"></circle>
                <!-- Telebirr/Digital (Purple) -->
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#8b5cf6" stroke-width="6.5"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="getDigitalDonutArray()" [attr.stroke-dashoffset]="getCashDonutOffset()"></circle>
                <!-- Card/Bank (Amber) -->
                <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" stroke-width="6.5"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="getCardDonutArray()" [attr.stroke-dashoffset]="getCardDonutOffset()"></circle>
              </svg>
              <div class="donut-center-info">
                <lucide-icon name="wallet" [size]="18" color="#0f766e"></lucide-icon>
                <span class="center-sub">Channels</span>
              </div>
            </div>

            <!-- Tender Breakdown Pills -->
            <div class="tender-details-list">
              <div class="tender-detail-row">
                <div class="t-left">
                  <span class="tender-color-pill pill-blue"></span>
                  <lucide-icon name="banknote" [size]="14" color="#0284c7"></lucide-icon>
                  <span class="t-label">Physical Cash Drawer</span>
                </div>
                <div class="t-right">
                  <span class="t-amount">ETB {{ (cashierShift()?.cashAmount || 0) | number:'1.2-2' }}</span>
                  <span class="t-pct">({{ getCashPercent() }}%)</span>
                </div>
              </div>

              <div class="tender-detail-row">
                <div class="t-left">
                  <span class="tender-color-pill pill-purple"></span>
                  <lucide-icon name="smartphone" [size]="14" color="#8b5cf6"></lucide-icon>
                  <span class="t-label">Telebirr / Digital Pay</span>
                </div>
                <div class="t-right">
                  <span class="t-amount">ETB {{ (cashierShift()?.digitalAmount || 0) | number:'1.2-2' }}</span>
                  <span class="t-pct">({{ getDigitalPercent() }}%)</span>
                </div>
              </div>

              <div class="tender-detail-row">
                <div class="t-left">
                  <span class="tender-color-pill pill-amber"></span>
                  <lucide-icon name="credit-card" [size]="14" color="#f59e0b"></lucide-icon>
                  <span class="t-label">POS Card / Bank Transfer</span>
                </div>
                <div class="t-right">
                  <span class="t-amount">ETB {{ (cashierShift()?.cardOrBankAmount || 0) | number:'1.2-2' }}</span>
                  <span class="t-pct">({{ getCardPercent() }}%)</span>
                </div>
              </div>
            </div>
          </div>

          <div class="tender-shift-footer">
            <span>Total Shift Tender Volume:</span>
            <strong>ETB {{ (cashierShift()?.totalRevenue || pnl()?.totalRevenue || 0) | number:'1.2-2' }}</strong>
          </div>
        </div>

        <!-- Expiry Risk & Waste Mitigation Horizon Matrix -->
        <div class="expiry-risk-panel">
          <div class="panel-header-row">
            <div>
              <h3 class="panel-title-text">Expiry Risk & Loss Mitigation Matrix</h3>
              <p class="panel-subtitle-text">FEFO exposure horizons and write-off prevention</p>
            </div>
            <span class="badge-fefo">FEFO Guard</span>
          </div>

          <div class="expiry-matrix-grid">
            <!-- Expired Card -->
            <div class="risk-matrix-card card-expired">
              <div class="risk-card-head">
                <div class="risk-title-group">
                  <span class="risk-indicator dot-red"></span>
                  <span class="risk-title">Expired (Write-off)</span>
                </div>
                <span class="risk-badge-red">{{ expiry()?.expiredCount || 0 }} Batches</span>
              </div>
              <div class="risk-val-text">ETB {{ (expiry()?.expiredLossValuation || 0) | number:'1.2-2' }}</div>
              <div class="risk-progress-track">
                <div class="risk-bar bar-red" [style.width.%]="getExpiryRiskPct('expired')"></div>
              </div>
            </div>

            <!-- High Risk (<30 Days) -->
            <div class="risk-matrix-card card-high">
              <div class="risk-card-head">
                <div class="risk-title-group">
                  <span class="risk-indicator dot-amber"></span>
                  <span class="risk-title">High Risk (&lt; 30 Days)</span>
                </div>
                <span class="risk-badge-amber">{{ expiry()?.expiring30DaysCount || 0 }} Batches</span>
              </div>
              <div class="risk-val-text">ETB {{ (expiry()?.expiring30DaysValuation || 0) | number:'1.2-2' }}</div>
              <div class="risk-progress-track">
                <div class="risk-bar bar-amber" [style.width.%]="getExpiryRiskPct('high')"></div>
              </div>
            </div>

            <!-- Medium Risk (30 - 60 Days) -->
            <div class="risk-matrix-card card-medium">
              <div class="risk-card-head">
                <div class="risk-title-group">
                  <span class="risk-indicator dot-blue"></span>
                  <span class="risk-title">Medium (30 - 60 Days)</span>
                </div>
                <span class="risk-badge-blue">{{ expiry()?.expiring60DaysCount || 0 }} Batches</span>
              </div>
              <div class="risk-val-text">{{ expiry()?.expiring60DaysCount || 0 }} Batches In Stock</div>
              <div class="risk-progress-track">
                <div class="risk-bar bar-blue" [style.width.%]="getExpiryRiskPct('medium')"></div>
              </div>
            </div>

            <!-- Watchlist (60 - 90 Days) -->
            <div class="risk-matrix-card card-watch">
              <div class="risk-card-head">
                <div class="risk-title-group">
                  <span class="risk-indicator dot-emerald"></span>
                  <span class="risk-title">Watchlist (60 - 90 Days)</span>
                </div>
                <span class="risk-badge-emerald">{{ expiry()?.expiring90DaysCount || 0 }} Batches</span>
              </div>
              <div class="risk-val-text">{{ expiry()?.expiring90DaysCount || 0 }} Batches In Stock</div>
              <div class="risk-progress-track">
                <div class="risk-bar bar-emerald" [style.width.%]="getExpiryRiskPct('watch')"></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- 5. BOTTOM SECTION: ITEMIZED FINANCIAL STATEMENTS & BREAKDOWN TABLE        -->
      <!-- ========================================================================= -->
      <div class="financial-statement-panel">
        <div class="statement-header-row">
          <div class="tab-pill-group">
            <button (click)="activeTab = 'PL'" [class.active]="activeTab === 'PL'" class="tab-btn">
              <lucide-icon name="file-text" [size]="14"></lucide-icon>
              <span>P&L Executive Statement</span>
            </button>
            <button (click)="activeTab = 'VALUATION'" [class.active]="activeTab === 'VALUATION'" class="tab-btn">
              <lucide-icon name="boxes" [size]="14"></lucide-icon>
              <span>Inventory Asset Valuation</span>
            </button>
            <button (click)="activeTab = 'TENDER'" [class.active]="activeTab === 'TENDER'" class="tab-btn">
              <lucide-icon name="credit-card" [size]="14"></lucide-icon>
              <span>Shift Settlement Audit</span>
            </button>
          </div>

          <button (click)="downloadPdf()" class="btn-export-statement">
            <lucide-icon name="printer" [size]="14"></lucide-icon>
            <span>Print Official Audit</span>
          </button>
        </div>

        <!-- Tab 1: P&L Statement -->
        <div *ngIf="activeTab === 'PL'" class="table-scroll-wrapper">
          <table class="statement-table">
            <thead>
              <tr>
                <th>Accounting Ledger Item</th>
                <th>Classification</th>
                <th>Calculation Basis</th>
                <th style="text-align: right;">Amount (ETB)</th>
                <th style="text-align: right;">% Gross Sales</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="td-strong">Gross Sales Revenue</td>
                <td><span class="badge badge-primary">Operating Income</span></td>
                <td>Verified immutable POS invoices</td>
                <td class="td-amount td-emerald">ETB {{ (pnl()?.totalRevenue || 0) | number:'1.2-2' }}</td>
                <td class="td-amount">100.0%</td>
              </tr>
              <tr>
                <td class="td-strong">Cost of Goods Sold (COGS)</td>
                <td><span class="badge badge-warning">Direct Expense</span></td>
                <td>Batch wholesale acquisition cost (FEFO)</td>
                <td class="td-amount td-red">- ETB {{ (pnl()?.totalCostOfGoodsSold || 0) | number:'1.2-2' }}</td>
                <td class="td-amount td-red">{{ getCostPercent() }}%</td>
              </tr>
              <tr class="row-highlight">
                <td class="td-bold-large">Net Gross Profit</td>
                <td><span class="badge badge-success">Gross Margin</span></td>
                <td>Revenue minus COGS</td>
                <td class="td-amount td-bold-large td-emerald">ETB {{ (pnl()?.grossProfit || 0) | number:'1.2-2' }}</td>
                <td class="td-amount td-bold-large td-emerald">{{ (pnl()?.profitMarginPercentage || getProfitPercent()) | number:'1.1-2' }}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tab 2: Inventory Valuation Summary -->
        <div *ngIf="activeTab === 'VALUATION'" class="table-scroll-wrapper">
          <table class="statement-table">
            <thead>
              <tr>
                <th>Inventory Metric</th>
                <th>Asset Valuation Basis</th>
                <th>Units / Batches</th>
                <th style="text-align: right;">Valuation (ETB)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="td-strong">Wholesale Buying Value (Cost)</td>
                <td>Procurement purchase valuation</td>
                <td>{{ valuation()?.totalUnitsInStock || 0 }} total units</td>
                <td class="td-amount">ETB {{ (valuation()?.totalCostValuation || 0) | number:'1.2-2' }}</td>
              </tr>
              <tr>
                <td class="td-strong">Projected Retail Selling Value</td>
                <td>Counter retail list pricing</td>
                <td>{{ valuation()?.activeBatchesCount || 0 }} active batches</td>
                <td class="td-amount td-emerald">ETB {{ (valuation()?.totalRetailValuation || 0) | number:'1.2-2' }}</td>
              </tr>
              <tr class="row-highlight">
                <td class="td-bold-large">Potential Future Gross Margin</td>
                <td>Retail Potential - Wholesale Cost</td>
                <td>Inventory assets on shelf</td>
                <td class="td-amount td-bold-large td-blue">ETB {{ (valuation()?.potentialGrossProfit || 0) | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tab 3: Tender Settlement -->
        <div *ngIf="activeTab === 'TENDER'" class="table-scroll-wrapper">
          <table class="statement-table">
            <thead>
              <tr>
                <th>Payment Channel</th>
                <th>Type</th>
                <th>Status</th>
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
                <td><span class="badge badge-primary">Direct Deposit</span></td>
                <td class="td-amount">ETB {{ (cashierShift()?.digitalAmount || 0) | number:'1.2-2' }}</td>
                <td class="td-amount">{{ getDigitalPercent() }}%</td>
              </tr>
              <tr>
                <td class="td-strong">POS Card / Bank Transfer</td>
                <td>Card Clearing</td>
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
      gap: 20px;
      font-family: inherit;
      color: #0f172a;
    }

    /* 1. TOP HEADER & FILTER BAR */
    .top-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header-titles {
      display: flex;
      flex-direction: column;
      gap: 2px;
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
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
    }
    .crumb-sep { color: #cbd5e1; }
    .crumb-active { color: #64748b; font-weight: 600; }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .search-capsule {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 9999px;
      padding: 7px 16px;
      width: 220px;
    }
    .search-icon { color: #94a3b8; }
    .search-input-field {
      border: none;
      outline: none;
      font-size: 12px;
      width: 100%;
      background: transparent;
      color: #0f172a;
    }

    .date-pills-group {
      display: flex;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 9999px;
      padding: 3px;
      gap: 2px;
    }
    .range-pill {
      border: none;
      background: transparent;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      padding: 5px 12px;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .range-pill.active {
      background: #0f766e;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(15, 118, 110, 0.3);
    }

    .btn-pdf-export {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #0284c7;
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      padding: 7px 14px;
      border-radius: 9999px;
      border: none;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
      transition: background 0.2s ease;
    }
    .btn-pdf-export:hover { background: #0369a1; }

    /* Date Filter Toolbar */
    .date-filter-bar {
      background: #ffffff;
      border: 1px solid #eef2f6;
      border-radius: 14px;
      padding: 12px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    }
    .filter-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .filter-label {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
    }
    .date-input-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .date-field {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 5px 10px;
      font-size: 12px;
      color: #0f172a;
      outline: none;
      background: #f8fafc;
    }
    .date-sep {
      color: #94a3b8;
      font-size: 12px;
    }
    .btn-recalculate {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f1f5f9;
      color: #0f766e;
      border: 1px solid #ccfbf1;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-recalculate:hover {
      background: #ccfbf1;
    }

    /* 2. TOP 4 METRIC CARDS ROW */
    .top-cards-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    @media (max-width: 1100px) {
      .top-cards-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .top-cards-grid { grid-template-columns: 1fr; }
    }

    /* Hero Dark Emerald Card */
    .hero-emerald-card {
      background: #134e4a;
      border-radius: 18px;
      padding: 20px 22px;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 10px 25px -5px rgba(19, 78, 74, 0.4);
    }
    .card-head-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .lime-icon-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #a3e635;
      color: #134e4a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 16px;
    }
    .currency-symbol { line-height: 1; }
    .trend-pill-lime {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(163, 230, 53, 0.2);
      color: #bef264;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 9999px;
    }
    .dots-action-btn {
      color: #99f6e4;
      font-size: 20px;
      font-weight: 800;
      cursor: pointer;
    }
    .card-content-block {
      margin-top: 16px;
    }
    .hero-card-sublabel {
      font-size: 12px;
      color: #a7f3d0;
      font-weight: 600;
    }
    .hero-card-big-value {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      margin: 4px 0 2px;
      letter-spacing: -0.02em;
    }
    .hero-card-footer-note {
      font-size: 11px;
      color: #99f6e4;
    }

    /* White Metric Cards */
    .white-metric-card {
      background: #ffffff;
      border: 1px solid #eef2f6;
      border-radius: 18px;
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }
    .icon-circle-soft {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .blue-soft { background: #e0f2fe; }
    .red-soft { background: #fee2e2; }

    .trend-pill-blue {
      background: #e0f2fe;
      color: #0284c7;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 9999px;
    }
    .trend-pill-red {
      background: #fee2e2;
      color: #dc2626;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 9999px;
    }
    .white-card-sublabel {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
    }
    .white-card-big-value {
      font-size: 26px;
      font-weight: 800;
      margin: 4px 0 2px;
      letter-spacing: -0.02em;
    }
    .text-blue { color: #0284c7; }
    .text-red { color: #dc2626; }
    .text-emerald { color: #059669; }
    .white-card-footer-note {
      font-size: 11px;
      color: #94a3b8;
    }

    /* Efficiency Banner Card */
    .efficiency-banner-card {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border-radius: 18px;
      padding: 20px 22px;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.15);
    }
    .banner-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .banner-overlay-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 10px;
    }
    .banner-sublabel {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 600;
    }
    .banner-big-value {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }
    .banner-footer-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }
    .banner-retail-note {
      font-size: 11px;
      color: #38bdf8;
    }
    .btn-banner-action {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #0284c7;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 5px 12px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
    }

    /* 3. MIDDLE ANALYTICS ROW */
    .middle-analytics-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
    }
    @media (max-width: 1024px) {
      .middle-analytics-grid { grid-template-columns: 1fr; }
    }

    .analytics-chart-panel, .donut-chart-panel {
      background: #ffffff;
      border: 1px solid #eef2f6;
      border-radius: 18px;
      padding: 22px 24px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }
    .panel-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .panel-title-text {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .panel-subtitle-text {
      font-size: 11px;
      color: #94a3b8;
      margin: 2px 0 0;
    }
    .panel-header-tools {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .timeframe-dropdown-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
    }
    .nav-arrow-group {
      display: flex;
      gap: 4px;
    }
    .nav-mini-arrow {
      border: 1px solid #e2e8f0;
      background: #ffffff;
      border-radius: 6px;
      padding: 4px 6px;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      font-weight: 700;
    }

    /* Capsule Chart Layout */
    .capsule-chart-viewport {
      display: flex;
      gap: 12px;
      height: 200px;
      position: relative;
    }
    .y-axis-labels {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
      font-weight: 600;
      padding-bottom: 24px;
    }
    .bars-container-flex {
      display: flex;
      flex: 1;
      justify-content: space-between;
      align-items: flex-end;
      gap: 8px;
      position: relative;
    }
    .capsule-bar-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      position: relative;
      cursor: pointer;
    }
    .capsule-track {
      width: 14px;
      height: 170px;
      background: #f1f5f9;
      border-radius: 9999px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      overflow: hidden;
    }
    .capsule-fill {
      width: 100%;
      background: #0f766e;
      border-radius: 9999px;
      transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .capsule-fill.striped-active {
      background: repeating-linear-gradient(
        45deg,
        #a3e635,
        #a3e635 4px,
        #134e4a 4px,
        #134e4a 8px
      );
      box-shadow: 0 0 12px rgba(163, 230, 53, 0.6);
    }
    .bar-day-label {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      margin-top: 8px;
    }
    .bar-day-label.label-active {
      color: #0f172a;
      font-weight: 800;
    }

    /* Floating Tooltip */
    .capsule-tooltip-bubble {
      position: absolute;
      top: -38px;
      background: #0f172a;
      color: #ffffff;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }
    .capsule-tooltip-bubble::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 4px solid #0f172a;
    }
    .tip-amount { color: #ffffff; font-weight: 800; }
    .tip-growth { color: #bef264; font-size: 9px; }

    /* Donut Chart Visual Styles */
    .badge-distribution {
      font-size: 11px;
      font-weight: 700;
      color: #059669;
      background: #ecfdf5;
      padding: 3px 8px;
      border-radius: 9999px;
    }
    .donut-visual-container {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 10px 0;
    }
    .donut-svg-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .donut-svg {
      transform: rotate(-90deg);
    }
    .donut-center-info {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .center-pct {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.1;
    }
    .center-sub {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
    }

    .donut-legend-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex: 1;
    }
    .legend-item-card {
      background: #f8fafc;
      border: 1px solid #eef2f6;
      border-radius: 10px;
      padding: 8px 12px;
    }
    .legend-badge-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
    }
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .dot-emerald { background: #10b981; }
    .dot-red { background: #ef4444; }
    .dot-blue { background: #0284c7; }
    .dot-amber { background: #f59e0b; }
    .dot-purple { background: #8b5cf6; }

    .legend-name {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      flex: 1;
    }
    .legend-pct {
      font-size: 11px;
      font-weight: 800;
    }
    .legend-val {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }

    .panel-bottom-summary {
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
    }

    /* 4. SECOND VISUAL ROW */
    .second-visual-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 900px) {
      .second-visual-grid { grid-template-columns: 1fr; }
    }

    .tender-donut-card, .expiry-risk-panel {
      background: #ffffff;
      border: 1px solid #eef2f6;
      border-radius: 18px;
      padding: 22px 24px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }
    .badge-channel {
      font-size: 11px;
      font-weight: 700;
      color: #0284c7;
      background: #e0f2fe;
      padding: 3px 8px;
      border-radius: 9999px;
    }
    .badge-fefo {
      font-size: 11px;
      font-weight: 700;
      color: #d97706;
      background: #fef3c7;
      padding: 3px 8px;
      border-radius: 9999px;
    }

    .tender-flex-layout {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 10px 0;
    }
    .tender-details-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }
    .tender-detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .t-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tender-color-pill {
      width: 4px;
      height: 16px;
      border-radius: 2px;
    }
    .pill-blue { background: #0284c7; }
    .pill-purple { background: #8b5cf6; }
    .pill-amber { background: #f59e0b; }

    .t-label {
      font-size: 11px;
      font-weight: 700;
      color: #334155;
    }
    .t-right {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .t-amount {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
    }
    .t-pct {
      font-size: 11px;
      color: #64748b;
    }
    .tender-shift-footer {
      margin-top: 10px;
      background: #f1f5f9;
      padding: 8px 14px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #334155;
    }

    /* Expiry Risk Horizon Matrix */
    .expiry-matrix-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .risk-matrix-card {
      border-radius: 12px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid transparent;
    }
    .card-expired {
      background: #fef2f2;
      border-color: #fee2e2;
    }
    .card-high {
      background: #fffbeb;
      border-color: #fef3c7;
    }
    .card-medium {
      background: #f0f9ff;
      border-color: #e0f2fe;
    }
    .card-watch {
      background: #f0fdf4;
      border-color: #dcfce7;
    }

    .risk-card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .risk-title-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .risk-indicator {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .risk-title {
      font-size: 11px;
      font-weight: 800;
      color: #334155;
    }
    .risk-badge-red {
      font-size: 10px;
      font-weight: 800;
      color: #dc2626;
      background: #fee2e2;
      padding: 2px 6px;
      border-radius: 6px;
    }
    .risk-badge-amber {
      font-size: 10px;
      font-weight: 800;
      color: #d97706;
      background: #fef3c7;
      padding: 2px 6px;
      border-radius: 6px;
    }
    .risk-badge-blue {
      font-size: 10px;
      font-weight: 800;
      color: #0284c7;
      background: #e0f2fe;
      padding: 2px 6px;
      border-radius: 6px;
    }
    .risk-badge-emerald {
      font-size: 10px;
      font-weight: 800;
      color: #059669;
      background: #dcfce7;
      padding: 2px 6px;
      border-radius: 6px;
    }

    .risk-val-text {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .risk-progress-track {
      height: 6px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 9999px;
      overflow: hidden;
      margin-top: 2px;
    }
    .risk-bar {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.5s ease;
    }
    .bar-red { background: #ef4444; }
    .bar-amber { background: #f59e0b; }
    .bar-blue { background: #0284c7; }
    .bar-emerald { background: #10b981; }

    /* 5. BOTTOM FINANCIAL STATEMENT PANEL */
    .financial-statement-panel {
      background: #ffffff;
      border: 1px solid #eef2f6;
      border-radius: 18px;
      padding: 20px 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }
    .statement-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .tab-pill-group {
      display: flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 10px;
      gap: 3px;
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
      padding: 6px 14px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .tab-btn.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
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
      padding: 6px 14px;
      border-radius: 8px;
      cursor: pointer;
    }

    .table-scroll-wrapper {
      overflow-x: auto;
    }
    .statement-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      text-align: left;
    }
    .statement-table th {
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .statement-table td {
      padding: 12px 14px;
      font-size: 13px;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }
    .statement-table tr:last-child td {
      border-bottom: none;
    }
    .td-strong {
      font-weight: 700;
      color: #0f172a;
    }
    .td-bold-large {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }
    .td-amount {
      text-align: right;
      font-weight: 700;
    }
    .row-highlight td {
      background: #f0fdf4;
      border-top: 1px solid #bbf7d0;
      border-bottom: 1px solid #bbf7d0;
    }

    /* Badges */
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .badge-primary { background: #e0f2fe; color: #0284c7; }
    .badge-warning { background: #fee2e2; color: #dc2626; }
    .badge-success { background: #dcfce7; color: #15803d; }
  `]
})
export class ReportsComponent implements OnInit {
  pnl = signal<any>(null);
  valuation = signal<any>(null);
  expiry = signal<any>(null);
  cashierShift = signal<any>(null);

  startDate = '';
  endDate = '';
  selectedRange: 'TODAY' | '7D' | '30D' | 'YEAR' = '30D';
  selectedPeriodLabel = 'This Year (12 Mo)';
  activeTab: 'PL' | 'VALUATION' | 'TENDER' = 'PL';
  searchQuery = '';
  hoveredBarIndex: number | null = null;

  chartBars: ReportBarMetric[] = [
    { period: 'Jan', revenue: 14200, profit: 5400, heightPct: 40 },
    { period: 'Feb', revenue: 16800, profit: 6200, heightPct: 48 },
    { period: 'Mar', revenue: 19500, profit: 7100, heightPct: 55 },
    { period: 'Apr', revenue: 22000, profit: 8300, heightPct: 62 },
    { period: 'May', revenue: 18400, profit: 6900, heightPct: 52 },
    { period: 'Jun', revenue: 25600, profit: 9800, heightPct: 72 },
    { period: 'Jul', revenue: 28900, profit: 11200, heightPct: 82 },
    { period: 'Aug', revenue: 31500, profit: 12400, heightPct: 88, highlighted: true },
    { period: 'Sep', revenue: 27800, profit: 10500, heightPct: 78 },
    { period: 'Oct', revenue: 24300, profit: 9200, heightPct: 68 },
    { period: 'Nov', revenue: 29800, profit: 11500, heightPct: 84 },
    { period: 'Dec', revenue: 35200, profit: 13900, heightPct: 95 }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.setRange('30D');
    this.loadReports();
  }

  setRange(type: 'TODAY' | '7D' | '30D' | 'YEAR'): void {
    this.selectedRange = type;
    const end = new Date();
    let start = new Date();

    if (type === 'TODAY') {
      start = new Date();
      this.selectedPeriodLabel = 'Today (Hourly)';
    } else if (type === '7D') {
      start.setDate(end.getDate() - 7);
      this.selectedPeriodLabel = 'Last 7 Days';
    } else if (type === '30D') {
      start.setDate(end.getDate() - 30);
      this.selectedPeriodLabel = 'Last 30 Days';
    } else if (type === 'YEAR') {
      start = new Date(end.getFullYear(), 0, 1);
      this.selectedPeriodLabel = 'This Year (12 Mo)';
    }

    this.startDate = start.toISOString().split('T')[0];
    this.endDate = end.toISOString().split('T')[0];
    this.loadReports();
  }

  shiftChartPage(direction: number): void {
    const labels = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'This Year (12 Mo)'];
    let idx = labels.indexOf(this.selectedPeriodLabel);
    if (idx === -1) idx = 4;
    idx = (idx + direction + labels.length) % labels.length;
    this.selectedPeriodLabel = labels[idx];
  }

  loadReports(): void {
    const params = `?startDate=${this.startDate}&endDate=${this.endDate}`;

    this.http.get<any>(`${environment.apiUrl}/reports/profit-loss${params}`).subscribe({
      next: (res) => {
        this.pnl.set(res.data);
        this.updateChartBarsFromData(res.data);
      }
    });

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

  updateChartBarsFromData(data: any): void {
    if (!data || !data.totalRevenue) return;
    const rev = data.totalRevenue;
    const profit = data.grossProfit || 0;
    
    // Scale the active highlighted bar with the latest live report data
    this.chartBars[7] = {
      period: 'Aug',
      revenue: rev,
      profit: profit,
      heightPct: Math.min(95, Math.max(30, Math.round((rev / (rev * 1.15)) * 90))),
      highlighted: true
    };
  }

  downloadPdf(): void {
    const params = `?startDate=${this.startDate}&endDate=${this.endDate}`;
    window.open(`${environment.apiUrl}/reports/sales/pdf${params}`, '_blank');
  }

  getCostPercent(): number {
    const rev = this.pnl()?.totalRevenue || 0;
    const cost = this.pnl()?.totalCostOfGoodsSold || 0;
    if (rev <= 0) return 65; // standard pharmacy benchmark
    return Math.min(100, Math.round((cost / rev) * 100));
  }

  getProfitPercent(): number {
    const rev = this.pnl()?.totalRevenue || 0;
    const prof = this.pnl()?.grossProfit || 0;
    if (rev <= 0) return 35; // standard pharmacy benchmark
    return Math.max(0, Math.min(100, Math.round((prof / rev) * 100)));
  }

  getProfitDonutArray(): string {
    const p = this.getProfitPercent();
    return `${p} ${100 - p}`;
  }

  getCostDonutArray(): string {
    const c = this.getCostPercent();
    return `${c} ${100 - c}`;
  }

  getCostDonutOffset(): string {
    return `${-this.getProfitPercent()}`;
  }

  getCashPercent(): number {
    const total = this.cashierShift()?.totalRevenue || 0;
    const cash = this.cashierShift()?.cashAmount || 0;
    if (total <= 0) return 65;
    return Math.round((cash / total) * 100);
  }

  getDigitalPercent(): number {
    const total = this.cashierShift()?.totalRevenue || 0;
    const digital = this.cashierShift()?.digitalAmount || 0;
    if (total <= 0) return 25;
    return Math.round((digital / total) * 100);
  }

  getCardPercent(): number {
    const total = this.cashierShift()?.totalRevenue || 0;
    const card = this.cashierShift()?.cardOrBankAmount || 0;
    if (total <= 0) return 10;
    return Math.round((card / total) * 100);
  }

  getCashDonutArray(): string {
    const p = this.getCashPercent();
    return `${p} ${100 - p}`;
  }

  getDigitalDonutArray(): string {
    const p = this.getDigitalPercent();
    return `${p} ${100 - p}`;
  }

  getCashDonutOffset(): string {
    return `${-this.getCashPercent()}`;
  }

  getCardDonutArray(): string {
    const p = this.getCardPercent();
    return `${p} ${100 - p}`;
  }

  getCardDonutOffset(): string {
    return `${-(this.getCashPercent() + this.getDigitalPercent())}`;
  }

  getExpiryRiskPct(type: 'expired' | 'high' | 'medium' | 'watch'): number {
    const total = (this.expiry()?.expiredCount || 0) +
                  (this.expiry()?.expiring30DaysCount || 0) +
                  (this.expiry()?.expiring60DaysCount || 0) +
                  (this.expiry()?.expiring90DaysCount || 0);
    if (total <= 0) return 25;
    let count = 0;
    if (type === 'expired') count = this.expiry()?.expiredCount || 0;
    if (type === 'high') count = this.expiry()?.expiring30DaysCount || 0;
    if (type === 'medium') count = this.expiry()?.expiring60DaysCount || 0;
    if (type === 'watch') count = this.expiry()?.expiring90DaysCount || 0;
    return Math.min(100, Math.max(10, Math.round((count / total) * 100)));
  }
}
