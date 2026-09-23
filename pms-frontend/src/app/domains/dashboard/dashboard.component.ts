import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth/services/auth.service';
import { PrintService } from '../../core/services/print.service';
import { environment } from '../../../environments/environment';

export interface BarMetric {
  day: string;
  value: number;
  heightPct: number;
  highlighted?: boolean;
}

export interface PillarMetric {
  label: string;
  sublabel: string;
  amount: number;
  heightPct: number;
  colorClass: string;
  iconName: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule],
  template: `
    <div class="pharmly-dash-root">

      <!-- ========================================================================= -->
      <!-- 1. TOP HEADER & PERSONA ROLE SWITCHER                                     -->
      <!-- ========================================================================= -->
      <div class="top-header-row">
        <div class="header-titles">
          <h1 class="main-page-title">{{ getRoleTitle() }}</h1>
          <div class="breadcrumb-sub">
            <span>Overview</span>
            <span class="crumb-sep">&gt;</span>
            <span class="crumb-active">{{ currentPersona() }}</span>
          </div>
        </div>

        <div class="header-controls">
          <!-- Dynamic Search Box -->
          <div class="search-capsule">
            <lucide-icon name="search" [size]="15" class="search-icon"></lucide-icon>
            <input 
              type="text" 
              [placeholder]="getSearchPlaceholder()" 
              [(ngModel)]="searchQuery" 
              class="search-input-field" />
          </div>

          <!-- Notification Bell -->
          <div class="bell-circle-btn" title="Alerts & Notices">
            <lucide-icon name="bell" [size]="17"></lucide-icon>
            <span class="bell-red-dot" *ngIf="alerts().length > 0"></span>
          </div>

          <!-- User Profile Chip -->
          <div class="user-profile-chip">
            <div class="user-avatar-circle">
              <lucide-icon name="user" [size]="15"></lucide-icon>
            </div>
            <div class="user-text-group">
              <span class="u-name">{{ authService.currentUser()?.fullName || 'James Bond' }}</span>
              <span class="u-handle">{{ currentPersona() }}</span>
            </div>
          </div>

          <!-- Role View Switcher for Owner / Admin -->
          <div *ngIf="authService.hasRole('ROLE_OWNER')" class="persona-switch-pill">
            <button (click)="switchView('ADMIN')" [class.active]="activeView() === 'ADMIN'" class="p-btn">
              <lucide-icon name="crown" [size]="12"></lucide-icon>
              <span>Owner</span>
            </button>
            <button (click)="switchView('PHARMACIST')" [class.active]="activeView() === 'PHARMACIST'" class="p-btn">
              <lucide-icon name="pill" [size]="12"></lucide-icon>
              <span>Pharmacist</span>
            </button>
            <button (click)="switchView('CASHIER')" [class.active]="activeView() === 'CASHIER'" class="p-btn">
              <lucide-icon name="zap" [size]="12"></lucide-icon>
              <span>Cashier</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 2. TOP METRIC CARDS ROW (Role-Tailored Dynamic Cards)                     -->
      <!-- ========================================================================= -->
      
      <!-- 2A. OWNER / ADMIN KPI ROW -->
      <div *ngIf="activeView() === 'ADMIN'" class="top-cards-grid">
        <!-- Hero Profit Card -->
        <div class="hero-emerald-card">
          <div class="card-head-flex">
            <div class="lime-icon-circle">
              <span class="currency-symbol">$</span>
            </div>
            <div class="trend-pill-lime">
              <lucide-icon name="trending-up" [size]="12"></lucide-icon>
              <span>{{ getProfitMarginPercent() }}% Margin</span>
            </div>
            <span class="dots-action-btn">&#8230;</span>
          </div>
          <div class="card-content-block">
            <span class="hero-card-sublabel">Total Gross Profit</span>
            <div class="hero-card-big-value">
              ETB {{ (summary()?.todayProfit || plReport()?.grossProfit || 15560) | number:'1.2-2' }}
            </div>
            <span class="hero-card-footer-note">COGS: ETB {{ (plReport()?.totalCostOfGoodsSold || 33090) | number:'1.0-0' }}</span>
          </div>
        </div>

        <!-- White Card 1: Registered Clients -->
        <div class="white-metric-card">
          <div class="card-head-flex">
            <div class="icon-circle-soft green-soft">
              <lucide-icon name="users" [size]="17" color="#059669"></lucide-icon>
            </div>
            <div class="trend-pill-green">
              <span>Active</span>
            </div>
            <span class="dots-action-btn">&#8230;</span>
          </div>
          <div class="card-content-block">
            <span class="white-card-sublabel">Registered Clients</span>
            <div class="white-card-big-value">
              {{ (customers().length || 1200) | number }}
            </div>
            <span class="white-card-footer-note">Clinics & retail accounts</span>
          </div>
        </div>

        <!-- White Card 2: Today's Total Sales -->
        <div class="white-metric-card">
          <div class="card-head-flex">
            <div class="icon-circle-soft emerald-soft">
              <lucide-icon name="dollar-sign" [size]="17" color="#10b981"></lucide-icon>
            </div>
            <div class="trend-pill-green">
              <span>+ 12.5%</span>
            </div>
            <span class="dots-action-btn">&#8230;</span>
          </div>
          <div class="card-content-block">
            <span class="white-card-sublabel">Today's Total Sales</span>
            <div class="white-card-big-value">
              ETB {{ (summary()?.todayRevenue || 48650) | number:'1.0-0' }}
            </div>
            <span class="white-card-footer-note">{{ (summary()?.todaySalesCount || 14) }} Invoices processed</span>
          </div>
        </div>

        <!-- Banner Card: Financial Reports -->
        <div class="efficiency-banner-card">
          <div class="banner-overlay-content">
            <span class="banner-badge">Executive Analytics</span>
            <h3 class="banner-headline">Full Financial & P&L Intelligence Suite</h3>
            <a routerLink="/reports" class="btn-banner-action">
              <span>View Financials</span>
              <lucide-icon name="arrow-right" [size]="13"></lucide-icon>
            </a>
          </div>
        </div>
      </div>

      <!-- 2B. PHARMACIST KPI ROW -->
      <div *ngIf="activeView() === 'PHARMACIST'" class="top-cards-grid">
        <!-- Hero FEFO Card -->
        <div class="hero-emerald-card">
          <div class="card-head-flex">
            <div class="lime-icon-circle">
              <lucide-icon name="clock" [size]="18" color="#134e4a"></lucide-icon>
            </div>
            <div class="trend-pill-lime">
              <span>FEFO Queue</span>
            </div>
            <span class="dots-action-btn">&#8230;</span>
          </div>
          <div class="card-content-block">
            <span class="hero-card-sublabel">Expiring Soon (&lt; 90 Days)</span>
            <div class="hero-card-big-value">
              {{ (summary()?.expiringSoonBatchesCount || expiringBatches().length || 8) }} Batches
            </div>
            <span class="hero-card-footer-note">Priority dispensing required</span>
          </div>
        </div>

        <!-- White Card 1: Low Stock Items -->
        <div class="white-metric-card">
          <div class="card-head-flex">
            <div class="icon-circle-soft yellow-soft">
              <lucide-icon name="alert-triangle" [size]="17" color="#d97706"></lucide-icon>
            </div>
            <div class="trend-pill-yellow">
              <span>Reorder</span>
            </div>
            <span class="dots-action-btn">&#8230;</span>
          </div>
          <div class="card-content-block">
            <span class="white-card-sublabel">Low Stock Alerts</span>
            <div class="white-card-big-value text-amber">
              {{ (summary()?.lowStockItemsCount || 12) }} Items
            </div>
            <span class="white-card-footer-note">Below minimum safety buffer</span>
          </div>
        </div>

        <!-- White Card 2: Active Drugs -->
        <div class="white-metric-card">
          <div class="card-head-flex">
            <div class="icon-circle-soft green-soft">
              <lucide-icon name="pill" [size]="17" color="#059669"></lucide-icon>
            </div>
            <div class="trend-pill-green">
              <span>Ready</span>
            </div>
            <span class="dots-action-btn">&#8230;</span>
          </div>
          <div class="card-content-block">
            <span class="white-card-sublabel">Active Drug Catalog</span>
            <div class="white-card-big-value">
              {{ (summary()?.totalDrugsCount || 20579) | number }}
            </div>
            <span class="white-card-footer-note">In stock & ready to dispense</span>
          </div>
        </div>

        <!-- Banner Card: Register Batch -->
        <div class="efficiency-banner-card">
          <div class="banner-overlay-content">
            <span class="banner-badge">FEFO Intake</span>
            <h3 class="banner-headline">Register Incoming Batches & GRN Intake</h3>
            <a routerLink="/inventory" class="btn-banner-action">
              <span>Add New Batch</span>
              <lucide-icon name="plus" [size]="13"></lucide-icon>
            </a>
          </div>
        </div>
      </div>

      <!-- 2C. CASHIER KPI ROW -->
      <div *ngIf="activeView() === 'CASHIER'" class="top-cards-grid">
        <!-- Hero Shift Card -->
        <div class="hero-emerald-card">
          <div class="card-head-flex">
            <div class="lime-icon-circle">
              <lucide-icon name="zap" [size]="18" color="#134e4a"></lucide-icon>
            </div>
            <div class="trend-pill-lime">
              <span>Live Shift</span>
            </div>
            <span class="dots-action-btn">&#8230;</span>
          </div>
          <div class="card-content-block">
            <span class="hero-card-sublabel">Today's Shift Revenue</span>
            <div class="hero-card-big-value">
              ETB {{ (cashierShift()?.totalRevenue || summary()?.todayRevenue || 48650) | number:'1.2-2' }}
            </div>
            <span class="hero-card-footer-note">{{ (cashierShift()?.totalSalesCount || summary()?.todaySalesCount || 14) }} Completed checkouts</span>
          </div>
        </div>

        <!-- White Card 1: Cash in Till -->
        <div class="white-metric-card">
          <div class="card-head-flex">
            <div class="icon-circle-soft green-soft">
              <lucide-icon name="banknote" [size]="17" color="#059669"></lucide-icon>
            </div>
            <div class="trend-pill-green">
              <span>Physical</span>
            </div>
            <span class="dots-action-btn">&#8230;</span>
          </div>
          <div class="card-content-block">
            <span class="white-card-sublabel">Cash in Drawer</span>
            <div class="white-card-big-value text-emerald">
              ETB {{ (cashierShift()?.cashAmount || 26750) | number:'1.2-2' }}
            </div>
            <span class="white-card-footer-note">Reconciliation ready</span>
          </div>
        </div>

        <!-- White Card 2: Digital Telebirr -->
        <div class="white-metric-card">
          <div class="card-head-flex">
            <div class="icon-circle-soft purple-soft">
              <lucide-icon name="smartphone" [size]="17" color="#7c3aed"></lucide-icon>
            </div>
            <div class="trend-pill-purple">
              <span>Instant</span>
            </div>
            <span class="dots-action-btn">&#8230;</span>
          </div>
          <div class="card-content-block">
            <span class="white-card-sublabel">Telebirr & Digital</span>
            <div class="white-card-big-value text-purple">
              ETB {{ (cashierShift()?.digitalAmount || 14600) | number:'1.2-2' }}
            </div>
            <span class="white-card-footer-note">Confirmed mobile deposits</span>
          </div>
        </div>

        <!-- Banner Card: Open POS -->
        <div class="efficiency-banner-card">
          <div class="banner-overlay-content">
            <span class="banner-badge">Fast POS Terminal</span>
            <h3 class="banner-headline">Barcode Scanning & Thermal 80mm Checkout</h3>
            <a routerLink="/pos" class="btn-banner-action">
              <span>Launch POS Now</span>
              <lucide-icon name="zap" [size]="13"></lucide-icon>
            </a>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 3. MIDDLE SECTION (Sales Analytics & Top Movers / Proportions)            -->
      <!-- ========================================================================= -->
      <div class="middle-analytics-grid">
        
        <!-- LEFT: CAPSULE BAR CHART (Dynamic Analytics) -->
        <div class="analytics-chart-panel">
          <div class="panel-header-row">
            <h3 class="panel-title-text">{{ getAnalyticsChartTitle() }}</h3>

            <div class="panel-header-tools">
              <div class="timeframe-dropdown-chip" (click)="togglePeriod()">
                <span>{{ selectedPeriod() }}</span>
                <lucide-icon name="chevron-right" [size]="13" style="transform: rotate(90deg);"></lucide-icon>
              </div>
              <div class="nav-arrow-group">
                <button class="nav-mini-arrow" (click)="prevBarPage()">
                  <lucide-icon name="chevron-left" [size]="14"></lucide-icon>
                </button>
                <button class="nav-mini-arrow" (click)="nextBarPage()">
                  <lucide-icon name="chevron-right" [size]="14"></lucide-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Y-Axis & Capsule Bars -->
          <div class="capsule-chart-viewport">
            <div class="chart-y-axis">
              <span>25k</span>
              <span>20k</span>
              <span>15k</span>
              <span>10k</span>
              <span>5k</span>
            </div>

            <div class="capsule-bars-strip">
              <div *ngFor="let bar of activeMonthlyBars(); let i = index" class="capsule-bar-item" (click)="highlightBar(i)">
                <!-- Floating Peak Tooltip -->
                <div class="bar-peak-badge" *ngIf="bar.highlighted">
                  <span class="peak-val">ETB {{ bar.value | number }}</span>
                  <span class="peak-trend">+ 8%</span>
                  <div class="peak-pointer"></div>
                </div>

                <!-- Capsule Bar Track -->
                <div class="capsule-track">
                  <div 
                    class="capsule-fill" 
                    [style.height.%]="bar.heightPct"
                    [class.capsule-striped]="bar.highlighted">
                  </div>
                </div>

                <span class="capsule-day-label">{{ bar.day }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: TOP MOVING MEDICATIONS / SETTLEMENT PILLARS -->
        <div class="top-selling-panel">
          <div class="panel-header-row">
            <h3 class="panel-title-text">{{ getRightPanelTitle() }}</h3>

            <div class="timeframe-dropdown-chip">
              <span>This Month</span>
            </div>
          </div>

          <!-- Vertical Pillars Container -->
          <div class="top-pillars-viewport">
            <div class="pillars-y-axis">
              <span>100k</span>
              <span>80k</span>
              <span>60k</span>
              <span>40k</span>
              <span>20k</span>
              <span>10k</span>
            </div>

            <div class="pillars-container">
              <div *ngFor="let pillar of currentPillars()" class="vertical-medicine-pillar">
                <div class="pillar-tube" [ngClass]="pillar.colorClass" [style.height.%]="pillar.heightPct">
                  <span class="pillar-vertical-name">{{ pillar.label }}</span>
                  <div class="pillar-round-badge">
                    <lucide-icon [name]="pillar.iconName" [size]="14"></lucide-icon>
                  </div>
                </div>
                <span class="pillar-revenue-label">ETB {{ pillar.amount | number }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- 4. BOTTOM SECTION: ROLE-TAILORED DATA TABLE (All Buttons Working)         -->
      <!-- ========================================================================= -->
      
      <!-- 4A. OWNER & CASHIER: LATEST SALES & INVOICES TABLE -->
      <div *ngIf="activeView() !== 'PHARMACIST'" class="latest-orders-panel">
        <div class="orders-header-row">
          <div class="orders-title-group">
            <h3 class="panel-title-text">Latest Sales & Fiscal Receipts</h3>
            <span class="table-count-tag">{{ filteredSales().length }} Invoices</span>
          </div>

          <a routerLink="/sales" class="view-all-link">
            <span>View All Sales Ledger</span>
            <lucide-icon name="arrow-right" [size]="13"></lucide-icon>
          </a>
        </div>

        <div class="table-scroll-wrapper">
          <table class="pharmly-orders-table">
            <thead>
              <tr>
                <th style="width: 140px;">Invoice #</th>
                <th>Type</th>
                <th>Customer / Patient</th>
                <th>Payment Channel</th>
                <th>Grand Total</th>
                <th style="text-align: right; width: 140px;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sale of filteredSales()">
                <td class="td-order-id">{{ sale.invoiceNumber }}</td>
                <td><span class="badge badge-primary">{{ sale.saleType || 'RETAIL' }}</span></td>
                <td class="td-customer-name">{{ sale.customerName || 'Walk-in Retail' }}</td>
                <td>
                  <span class="status-pill-badge" [ngClass]="getPaymentClass(sale.paymentMethod)">
                    {{ sale.paymentMethod || 'CASH' }}
                  </span>
                </td>
                <td class="td-price-val">ETB {{ sale.grandTotal | number:'1.2-2' }}</td>
                <td style="text-align: right;">
                  <div class="order-action-group">
                    <a [routerLink]="['/sales']" class="btn-order-icon" title="View details">
                      <lucide-icon name="eye" [size]="15"></lucide-icon>
                    </a>
                    <button (click)="reprintThermalReceipt(sale)" class="btn-order-icon" title="Thermal Receipt Print">
                      <lucide-icon name="printer" [size]="15"></lucide-icon>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredSales().length === 0">
                <td colspan="6" class="table-empty">
                  No sales recorded yet today.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 4B. PHARMACIST: FEFO EXPIRATION & DISPENSING RISK QUEUE -->
      <div *ngIf="activeView() === 'PHARMACIST'" class="latest-orders-panel">
        <div class="orders-header-row">
          <div class="orders-title-group">
            <h3 class="panel-title-text">FEFO Expiration Prioritization Queue (&lt; 90 Days)</h3>
            <span class="table-count-tag">{{ filteredExpiringBatches().length }} Batches</span>
          </div>

          <a routerLink="/inventory" class="view-all-link">
            <span>Manage All Inventory</span>
            <lucide-icon name="arrow-right" [size]="13"></lucide-icon>
          </a>
        </div>

        <div class="table-scroll-wrapper">
          <table class="pharmly-orders-table">
            <thead>
              <tr>
                <th style="width: 140px;">Batch #</th>
                <th>Drug Name</th>
                <th>Expiry Date</th>
                <th>Quantity</th>
                <th>Horizon Status</th>
                <th style="text-align: right; width: 140px;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let batch of filteredExpiringBatches()">
                <td class="td-order-id"><code>{{ batch.batchNumber }}</code></td>
                <td class="td-med-name">{{ batch.drugName }}</td>
                <td class="td-customer-name">{{ batch.expiryDate }}</td>
                <td class="td-price-val">{{ batch.quantityOnHand }} Units</td>
                <td>
                  <span class="status-pill-badge" [ngClass]="batch.status === 'EXPIRED' ? 'badge-credit' : 'badge-pending'">
                    {{ batch.status === 'EXPIRED' ? 'Expired' : 'Expiring Soon' }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="order-action-group">
                    <a routerLink="/inventory" class="btn-order-icon" title="Dispense / Adjust">
                      <lucide-icon name="eye" [size]="15"></lucide-icon>
                    </a>
                    <button (click)="printBatchLabel(batch)" class="btn-order-icon" title="Print Batch Label">
                      <lucide-icon name="printer" [size]="15"></lucide-icon>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredExpiringBatches().length === 0">
                <td colspan="6" class="table-empty">
                  All drug batches have safe expiry horizons (> 90 days).
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .pharmly-dash-root {
      display: flex;
      flex-direction: column;
      gap: 20px;
      font-family: inherit;
      color: #0f172a;
    }

    /* 1. TOP HEADER */
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
      gap: 12px;
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
      width: 230px;
    }
    .search-icon { color: #94a3b8; }
    .search-input-field {
      border: none;
      outline: none;
      background: transparent;
      font-size: 13px;
      width: 100%;
      color: #0f172a;
    }
    .bell-circle-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
      cursor: pointer;
      position: relative;
    }
    .bell-red-dot {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 8px;
      height: 8px;
      background: #ef4444;
      border-radius: 50%;
      border: 2px solid #ffffff;
    }
    .user-profile-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 9999px;
      padding: 4px 12px 4px 5px;
    }
    .user-avatar-circle {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #0f172a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-text-group {
      display: flex;
      flex-direction: column;
    }
    .u-name {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.1;
    }
    .u-handle {
      font-size: 10px;
      color: #64748b;
    }
    .persona-switch-pill {
      display: flex;
      background: #e2e8f0;
      padding: 3px;
      border-radius: 8px;
      gap: 2px;
    }
    .p-btn {
      border: none;
      background: transparent;
      padding: 5px 10px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 6px;
      color: #475569;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
    }
    .p-btn.active {
      background: #0f172a;
      color: #ffffff;
    }

    /* 2. TOP METRIC CARDS GRID */
    .top-cards-grid {
      display: grid;
      grid-template-columns: 1.3fr 1fr 1fr 1.3fr;
      gap: 16px;
    }
    @media (max-width: 1200px) {
      .top-cards-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 680px) {
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
    .green-soft { background: #ecfdf5; }
    .emerald-soft { background: #ecfdf5; }
    .yellow-soft { background: #fffbeb; }
    .purple-soft { background: #f5f3ff; }

    .trend-pill-green {
      background: #ecfdf5;
      color: #059669;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 9999px;
    }
    .trend-pill-yellow {
      background: #fef3c7;
      color: #d97706;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 9999px;
    }
    .trend-pill-purple {
      background: #f5f3ff;
      color: #7c3aed;
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
      color: #0f172a;
      margin: 4px 0 2px;
      letter-spacing: -0.02em;
    }
    .text-emerald { color: #059669; }
    .text-amber { color: #d97706; }
    .text-purple { color: #7c3aed; }
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
    .banner-overlay-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .banner-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .banner-headline {
      font-size: 14px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.3;
      margin: 0;
    }
    .btn-banner-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 6px;
      align-self: flex-start;
      background: #0284c7;
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 8px;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
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

    .analytics-chart-panel, .top-selling-panel {
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
      margin-bottom: 20px;
    }
    .panel-title-text {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
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
    }

    /* Capsule Chart Layout */
    .capsule-chart-viewport {
      display: flex;
      gap: 16px;
      height: 180px;
      align-items: flex-end;
    }
    .chart-y-axis {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 145px;
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      padding-bottom: 20px;
    }
    .capsule-bars-strip {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      height: 100%;
    }
    .capsule-bar-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      position: relative;
      height: 100%;
      justify-content: flex-end;
      cursor: pointer;
    }
    .capsule-track {
      width: 28px;
      height: 140px;
      background: #f1f5f9;
      border-radius: 9999px;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
    }
    .capsule-fill {
      width: 100%;
      background: #134e4a;
      border-radius: 9999px;
      transition: height 0.6s ease;
    }
    .capsule-striped {
      background: repeating-linear-gradient(
        45deg,
        #a3e635,
        #a3e635 6px,
        #134e4a 6px,
        #134e4a 12px
      ) !important;
    }
    .capsule-day-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
    }

    .bar-peak-badge {
      position: absolute;
      top: -38px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      padding: 4px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      white-space: nowrap;
      z-index: 10;
    }
    .peak-val {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
    }
    .peak-trend {
      font-size: 9px;
      font-weight: 800;
      color: #059669;
    }
    .peak-pointer {
      position: absolute;
      bottom: -4px;
      width: 8px;
      height: 8px;
      background: #ffffff;
      border-right: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
      transform: rotate(45deg);
    }

    /* Top Pillars Layout */
    .top-pillars-viewport {
      display: flex;
      gap: 16px;
      height: 180px;
      align-items: flex-end;
    }
    .pillars-y-axis {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 145px;
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      padding-bottom: 20px;
    }
    .pillars-container {
      flex: 1;
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 100%;
    }
    .vertical-medicine-pillar {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      height: 100%;
      justify-content: flex-end;
    }
    .pillar-tube {
      width: 44px;
      border-radius: 9999px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0 6px;
      position: relative;
    }
    .tube-orange { background: linear-gradient(180deg, #fb923c 0%, #ea580c 100%); }
    .tube-dark { background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); }
    .tube-lime { background: linear-gradient(180deg, #a3e635 0%, #65a30d 100%); }

    .pillar-vertical-name {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-size: 10px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }
    .pillar-round-badge {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      color: #0f172a;
    }
    .pillar-revenue-label {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
    }

    /* 4. LATEST ORDERS TABLE */
    .latest-orders-panel {
      background: #ffffff;
      border: 1px solid #eef2f6;
      border-radius: 18px;
      padding: 22px 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    }
    .orders-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .orders-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .table-count-tag {
      font-size: 11px;
      font-weight: 700;
      color: #059669;
      background: #ecfdf5;
      padding: 2px 8px;
      border-radius: 9999px;
    }
    .view-all-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      font-weight: 700;
      color: #059669;
      text-decoration: none;
    }
    .table-scroll-wrapper {
      overflow-x: auto;
    }
    .pharmly-orders-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }
    .pharmly-orders-table th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      font-size: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    .pharmly-orders-table th:first-child { border-top-left-radius: 10px; border-bottom-left-radius: 10px; }
    .pharmly-orders-table th:last-child { border-top-right-radius: 10px; border-bottom-right-radius: 10px; }

    .pharmly-orders-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #f8fafc;
      color: #334155;
    }
    .td-order-id { font-weight: 700; color: #475569; }
    .td-med-name { font-weight: 700; color: #0f172a; }
    .td-customer-name { color: #64748b; }
    .td-price-val { font-weight: 700; color: #0f172a; }

    .status-pill-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: capitalize;
    }
    .badge-delivered { background: #dcfce7; color: #15803d; }
    .badge-pending { background: #fef3c7; color: #b45309; }
    .badge-credit { background: #fee2e2; color: #b91c1c; }

    .order-action-group {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-order-icon {
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      padding: 5px;
      border-radius: 6px;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
    }
    .btn-order-icon:hover {
      color: #0f172a;
      background: #f1f5f9;
    }
    .table-empty {
      text-align: center;
      padding: 24px;
      color: #94a3b8;
    }
  `]
})
export class DashboardComponent implements OnInit {
  activeView = signal<'ADMIN' | 'PHARMACIST' | 'CASHIER'>('ADMIN');
  searchQuery: string = '';
  selectedPeriod = signal<string>('This Month');

  summary = signal<any>(null);
  valuation = signal<any>(null);
  plReport = signal<any>(null);
  cashierShift = signal<any>(null);
  customers = signal<any[]>([]);
  expiringBatches = signal<any[]>([]);
  salesList = signal<any[]>([]);
  alerts = signal<any[]>([]);

  // Monthly Capsule Bars for Analytics
  monthlyBars = signal<BarMetric[]>([
    { day: '01', value: 8400, heightPct: 35 },
    { day: '02', value: 16200, heightPct: 65 },
    { day: '03', value: 11400, heightPct: 45 },
    { day: '04', value: 9200, heightPct: 38 },
    { day: '05', value: 14800, heightPct: 60 },
    { day: '06', value: 18657, heightPct: 75 },
    { day: '07', value: 24200, heightPct: 95, highlighted: true },
    { day: '08', value: 17100, heightPct: 70 },
    { day: '09', value: 10500, heightPct: 42 },
    { day: '10', value: 12800, heightPct: 52 },
    { day: '11', value: 19500, heightPct: 78 },
    { day: '12', value: 15300, heightPct: 62 },
  ]);

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private printService: PrintService,
    private router: Router
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

  switchView(view: 'ADMIN' | 'PHARMACIST' | 'CASHIER'): void {
    this.activeView.set(view);
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

    this.http.get<any>(`${environment.apiUrl}/customers`).subscribe({
      next: (res) => this.customers.set(res.data || [])
    });

    this.http.get<any>(`${environment.apiUrl}/batches/expiring?days=90`).subscribe({
      next: (res) => this.expiringBatches.set(res.data || [])
    });

    this.http.get<any>(`${environment.apiUrl}/pos/sales`).subscribe({
      next: (res) => {
        const list = res.data || [];
        this.salesList.set(Array.isArray(list) ? list : []);
      }
    });

    this.http.get<any>(`${environment.apiUrl}/notifications`).subscribe({
      next: (res) => this.alerts.set(res.data || [])
    });
  }

  // Dynamic persona info
  currentPersona(): string {
    switch (this.activeView()) {
      case 'ADMIN': return 'Owner / Executive';
      case 'PHARMACIST': return 'Dispensary Pharmacist';
      case 'CASHIER': return 'Shift Cashier';
    }
  }

  getRoleTitle(): string {
    switch (this.activeView()) {
      case 'ADMIN': return 'Executive Financial & Sales Overview';
      case 'PHARMACIST': return 'FEFO Prioritization & Batch Queue';
      case 'CASHIER': return 'Live Shift Revenue & Checkout Queue';
    }
  }

  getSearchPlaceholder(): string {
    switch (this.activeView()) {
      case 'ADMIN': return 'Search sales, profit, clients...';
      case 'PHARMACIST': return 'Search drugs, FEFO batches...';
      case 'CASHIER': return 'Search receipts, shift invoices...';
    }
  }

  getAnalyticsChartTitle(): string {
    switch (this.activeView()) {
      case 'ADMIN': return 'Sales & Revenue Analytics';
      case 'PHARMACIST': return 'FEFO Dispensing & Expiry Velocity';
      case 'CASHIER': return 'Shift Hourly Checkout Volume';
    }
  }

  getRightPanelTitle(): string {
    switch (this.activeView()) {
      case 'ADMIN': return 'Top Revenue Medications';
      case 'PHARMACIST': return 'Fastest Moving Medications';
      case 'CASHIER': return 'Settlement Channels Share';
    }
  }

  getProfitMarginPercent(): number {
    const rev = this.summary()?.todayRevenue || this.plReport()?.totalRevenue;
    const prof = this.summary()?.todayProfit || this.plReport()?.grossProfit;
    if (!rev || rev === 0) return 32;
    return Math.round((prof / rev) * 100);
  }

  // Active Monthly Bars
  activeMonthlyBars = computed(() => {
    return this.monthlyBars();
  });

  // Right Pillar Metrics
  currentPillars = computed<PillarMetric[]>(() => {
    if (this.activeView() === 'CASHIER') {
      const shift = this.cashierShift();
      const cash = shift?.cashAmount || 26750;
      const telebirr = shift?.digitalAmount || 14600;
      const card = shift?.cardOrBankAmount || 7300;
      return [
        { label: 'Cash Drawer', sublabel: 'Physical Till', amount: cash, heightPct: 82, colorClass: 'tube-orange', iconName: 'banknote' },
        { label: 'Telebirr Mobile', sublabel: 'Mobile Money', amount: telebirr, heightPct: 62, colorClass: 'tube-dark', iconName: 'smartphone' },
        { label: 'Card / Bank', sublabel: 'Electronic POS', amount: card, heightPct: 45, colorClass: 'tube-lime', iconName: 'credit-card' },
      ];
    }

    if (this.activeView() === 'PHARMACIST') {
      return [
        { label: 'Amoxicillin 250mg', sublabel: 'Antibiotics', amount: 5000, heightPct: 85, colorClass: 'tube-orange', iconName: 'pill' },
        { label: 'Paracetamol 500mg', sublabel: 'Analgesics', amount: 3000, heightPct: 65, colorClass: 'tube-dark', iconName: 'activity' },
        { label: 'Azithromycin 500mg', sublabel: 'Antibiotics', amount: 1500, heightPct: 48, colorClass: 'tube-lime', iconName: 'boxes' },
      ];
    }

    // ADMIN
    return [
      { label: 'Amoxicillin 250mg', sublabel: 'Antibiotics', amount: 5000, heightPct: 82, colorClass: 'tube-orange', iconName: 'pill' },
      { label: 'Paracetamol 500mg', sublabel: 'Analgesics', amount: 3000, heightPct: 65, colorClass: 'tube-dark', iconName: 'activity' },
      { label: 'Azithromycin 500mg', sublabel: 'Antibiotics', amount: 1500, heightPct: 48, colorClass: 'tube-lime', iconName: 'boxes' },
    ];
  });

  // Filtered Sales for Admin / Cashier
  filteredSales = computed(() => {
    let list = this.salesList();
    if (list.length === 0) {
      // Fallback sample sales if no transactions yet
      list = [
        { id: 1, invoiceNumber: 'INV-2026-904', saleType: 'RETAIL', customerName: 'St. Paul Clinic', paymentMethod: 'CASH', grandTotal: 18.00, createdAt: new Date().toISOString() },
        { id: 2, invoiceNumber: 'INV-2026-903', saleType: 'WHOLESALE', customerName: 'Bethel Hospital', paymentMethod: 'TELEBIRR', grandTotal: 12.00, createdAt: new Date().toISOString() },
        { id: 3, invoiceNumber: 'INV-2026-902', saleType: 'RETAIL', customerName: 'Dr. Yonas Rx', paymentMethod: 'CARD', grandTotal: 27.00, createdAt: new Date().toISOString() },
        { id: 4, invoiceNumber: 'INV-2026-901', saleType: 'RETAIL', customerName: 'Walk-in Retail', paymentMethod: 'CASH', grandTotal: 35.00, createdAt: new Date().toISOString() },
      ];
    }
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(s => 
        s.invoiceNumber?.toLowerCase().includes(q) || 
        s.customerName?.toLowerCase().includes(q) ||
        s.paymentMethod?.toLowerCase().includes(q)
      );
    }
    return list.slice(0, 5);
  });

  // Filtered Expiring Batches for Pharmacist
  filteredExpiringBatches = computed(() => {
    let list = this.expiringBatches();
    if (list.length === 0) {
      list = [
        { id: 1, batchNumber: 'BT-2024-09B', drugName: 'Amoxicillin 250mg', expiryDate: '01-12-2024', quantityOnHand: 45, status: 'EXPIRING_SOON' },
        { id: 2, batchNumber: 'BT-2024-11E', drugName: 'Azithromycin 500mg', expiryDate: '10-11-2024', quantityOnHand: 18, status: 'EXPIRING_SOON' },
        { id: 3, batchNumber: 'BT-2023-88X', drugName: 'Ibuprofen 200mg', expiryDate: '15-11-2023', quantityOnHand: 25, status: 'EXPIRED' },
      ];
    }
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(b => 
        b.batchNumber?.toLowerCase().includes(q) || 
        b.drugName?.toLowerCase().includes(q)
      );
    }
    return list.slice(0, 5);
  });

  getPaymentClass(method: string): string {
    switch ((method || '').toUpperCase()) {
      case 'CASH': return 'badge-delivered';
      case 'TELEBIRR':
      case 'MOBILE_MONEY': return 'badge-pending';
      case 'CARD':
      case 'BANK_TRANSFER': return 'badge-delivered';
      case 'CREDIT': return 'badge-credit';
      default: return 'badge-delivered';
    }
  }

  highlightBar(index: number): void {
    const bars = [...this.monthlyBars()];
    bars.forEach((b, i) => b.highlighted = (i === index));
    this.monthlyBars.set(bars);
  }

  prevBarPage(): void {
    const bars = [...this.monthlyBars()];
    const first = bars.shift();
    if (first) bars.push(first);
    this.monthlyBars.set(bars);
  }

  nextBarPage(): void {
    const bars = [...this.monthlyBars()];
    const last = bars.pop();
    if (last) bars.unshift(last);
    this.monthlyBars.set(bars);
  }

  togglePeriod(): void {
    this.selectedPeriod.set(this.selectedPeriod() === 'This Month' ? 'This Week' : 'This Month');
  }

  reprintThermalReceipt(sale: any): void {
    this.printService.printThermalReceipt({
      invoiceNumber: sale.invoiceNumber,
      date: new Date(sale.createdAt || Date.now()),
      saleType: sale.saleType || 'RETAIL',
      customerName: sale.customerName || 'Walk-in Patient',
      customerPhone: '',
      cashierName: 'Cashier',
      branchName: 'HQ Main Store',
      items: sale.items || [{ drugName: 'Dispensed Prescription', quantity: 1, unitPrice: sale.grandTotal, totalPrice: sale.grandTotal }],
      subTotal: sale.grandTotal,
      taxAmount: 0,
      discountAmount: 0,
      grandTotal: sale.grandTotal,
      amountPaid: sale.grandTotal,
      changeReturned: 0,
      paymentMethod: sale.paymentMethod || 'CASH'
    });
  }

  printBatchLabel(batch: any): void {
    this.printService.printThermalReceipt({
      invoiceNumber: `BATCH-${batch.batchNumber}`,
      date: new Date(),
      saleType: 'FEFO BATCH IDENTIFIER',
      customerName: 'Dispensary Shelf',
      customerPhone: '',
      cashierName: 'Pharmacist',
      branchName: 'HQ Main Store',
      items: [{ drugName: batch.drugName, quantity: batch.quantityOnHand, unitPrice: 0, totalPrice: 0 }],
      subTotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      grandTotal: 0,
      amountPaid: 0,
      changeReturned: 0,
      paymentMethod: 'FEFO_VERIFIED'
    });
  }
}
