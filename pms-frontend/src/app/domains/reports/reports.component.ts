import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: var(--slate-900);">Enterprise Analytics, Visual Charts & Reports</h1>
          <p style="font-size: 13px; color: var(--slate-500); margin-top: 2px;">
            Visual breakdown of Purchases, Sells, Inventory Valuations, Expiry Risks & Donut Distributions
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button (click)="downloadPdf()" class="btn btn-primary" style="box-shadow: var(--shadow); display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon name="file-down" [size]="16"></lucide-icon> Download Official Sales PDF
          </button>
        </div>
      </div>

      <!-- Date Range Selector -->
      <div class="card" style="padding: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <label style="font-size: 12px; font-weight: 700; color: var(--slate-600); display: flex; align-items: center; gap: 4px;">
            <lucide-icon name="calendar" [size]="14"></lucide-icon> Analysis Period:
          </label>
          <input type="date" [(ngModel)]="startDate" (change)="loadReports()" class="form-control" style="width: auto;" />
          <span style="color: var(--slate-400);">to</span>
          <input type="date" [(ngModel)]="endDate" (change)="loadReports()" class="form-control" style="width: auto;" />
          <button (click)="setRange('TODAY')" class="btn btn-outline" style="padding: 6px 12px; font-size: 12px;">Today</button>
          <button (click)="setRange('7D')" class="btn btn-outline" style="padding: 6px 12px; font-size: 12px;">Last 7 Days</button>
          <button (click)="setRange('30D')" class="btn btn-outline" style="padding: 6px 12px; font-size: 12px;">Last 30 Days</button>
        </div>
        <button (click)="loadReports()" class="btn btn-primary" style="padding: 8px 16px; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="refresh-cw" [size]="14"></lucide-icon> Recalculate
        </button>
      </div>

      <!-- Top Financial KPIs -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 16px;">
        <div class="card" style="border-left: 4px solid #0284c7;">
          <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
            <lucide-icon name="dollar-sign" [size]="13" color="#0284c7"></lucide-icon> Total Sales (Period)
          </div>
          <div style="font-size: 26px; font-weight: 800; color: var(--slate-900); margin: 6px 0;">
            ETB {{ pnl()?.totalRevenue | number:'1.2-2' }}
          </div>
          <div style="font-size: 12px; color: var(--slate-500);">{{ pnl()?.totalSalesCount || 0 }} completed invoices</div>
        </div>

        <div class="card" style="border-left: 4px solid #ef4444;">
          <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
            <lucide-icon name="trending-down" [size]="13" color="#ef4444"></lucide-icon> Cost of Goods Sold (COGS)
          </div>
          <div style="font-size: 26px; font-weight: 800; color: #dc2626; margin: 6px 0;">
            ETB {{ pnl()?.totalCostOfGoodsSold | number:'1.2-2' }}
          </div>
          <div style="font-size: 12px; color: var(--slate-500);">Wholesale batch purchase cost</div>
        </div>

        <div class="card" style="border-left: 4px solid #10b981;">
          <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
            <lucide-icon name="trending-up" [size]="13" color="#10b981"></lucide-icon> Net Gross Profit
          </div>
          <div style="font-size: 26px; font-weight: 800; color: #059669; margin: 6px 0;">
            ETB {{ pnl()?.grossProfit | number:'1.2-2' }}
          </div>
          <div style="font-size: 12px; color: #059669; font-weight: 700;">
            Margin: {{ pnl()?.profitMarginPercentage | number:'1.1-2' }}%
          </div>
        </div>

        <div class="card" style="border-left: 4px solid #8b5cf6;">
          <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
            <lucide-icon name="boxes" [size]="13" color="#8b5cf6"></lucide-icon> Total Stock Valuation
          </div>
          <div style="font-size: 26px; font-weight: 800; color: #7c3aed; margin: 6px 0;">
            ETB {{ valuation()?.totalCostValuation | number:'1.2-2' }}
          </div>
          <div style="font-size: 12px; color: var(--slate-500);">Retail potential: ETB {{ valuation()?.totalRetailValuation | number:'1.2-2' }}</div>
        </div>
      </div>

      <!-- Visual Charts Section: P&L Bar Chart + Payment Method Donut Chart -->
      <div style="display: grid; grid-template-columns: 3fr 2fr; gap: 20px;">
        <!-- Comparative Bar Chart: Revenue vs Cost vs Profit -->
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--slate-900); display: flex; align-items: center; gap: 8px;">
                <lucide-icon name="bar-chart-3" [size]="18" color="#0284c7"></lucide-icon> Sales Revenue vs COGS vs Gross Profit Comparison
              </h3>
              <span class="badge badge-primary">Period Margin</span>
            </div>

            <!-- Bar comparison visual -->
            <div style="display: flex; flex-direction: column; gap: 16px; padding: 10px 0;">
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 4px;">
                  <span>Gross Sales Revenue (100%)</span>
                  <span>ETB {{ pnl()?.totalRevenue | number:'1.2-2' }}</span>
                </div>
                <div style="height: 18px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                  <div style="height: 100%; width: 100%; background: #0284c7; border-radius: 6px;"></div>
                </div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 4px;">
                  <span>Cost of Goods Sold ({{ getCostPercent() }}%)</span>
                  <span style="color: #dc2626;">ETB {{ pnl()?.totalCostOfGoodsSold | number:'1.2-2' }}</span>
                </div>
                <div style="height: 18px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                  <div [style.width.%]="getCostPercent()" style="height: 100%; background: #ef4444; border-radius: 6px; transition: width 0.5s ease;"></div>
                </div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 4px;">
                  <span>Net Gross Profit ({{ getProfitPercent() }}%)</span>
                  <span style="color: #059669;">ETB {{ pnl()?.grossProfit | number:'1.2-2' }}</span>
                </div>
                <div style="height: 18px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
                  <div [style.width.%]="getProfitPercent()" style="height: 100%; background: #10b981; border-radius: 6px; transition: width 0.5s ease;"></div>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--slate-100); display: flex; justify-content: space-between; font-size: 12px; color: var(--slate-500);">
            <span>Calculated from verified immutable sale item records</span>
            <strong style="color: #059669;">{{ pnl()?.profitMarginPercentage | number:'1.1-2' }}% Net Profitability</strong>
          </div>
        </div>

        <!-- Payment Methods Donut Chart Visual -->
        <div class="card">
          <h3 style="font-size: 15px; font-weight: 800; color: var(--slate-900); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <lucide-icon name="pie-chart" [size]="18" color="#8b5cf6"></lucide-icon> Payment Tender Distribution
          </h3>

          <div style="display: flex; align-items: center; justify-content: center; gap: 20px; padding: 10px 0;">
            <!-- SVG Donut Chart -->
            <svg width="140" height="140" viewBox="0 0 42 42" style="transform: rotate(-90deg);">
              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e2e8f0" stroke-width="6"></circle>
              <!-- Cash (Primary - Blue) -->
              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#0284c7" stroke-width="6"
                      [attr.stroke-dasharray]="getCashDonutArray()" stroke-dashoffset="0"></circle>
              <!-- Telebirr/Digital (Purple) -->
              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#8b5cf6" stroke-width="6"
                      [attr.stroke-dasharray]="getDigitalDonutArray()" [attr.stroke-dashoffset]="getCashDonutOffset()"></circle>
              <!-- Card/Bank (Orange) -->
              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f59e0b" stroke-width="6"
                      [attr.stroke-dasharray]="getCardDonutArray()" [attr.stroke-dashoffset]="getCardDonutOffset()"></circle>
            </svg>

            <!-- Legend -->
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 12px; height: 12px; border-radius: 3px; background: #0284c7;"></span>
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <lucide-icon name="banknote" [size]="13"></lucide-icon> Cash ({{ getCashPercent() }}%)
                </span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 12px; height: 12px; border-radius: 3px; background: #8b5cf6;"></span>
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <lucide-icon name="smartphone" [size]="13"></lucide-icon> Telebirr / Digital ({{ getDigitalPercent() }}%)
                </span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 12px; height: 12px; border-radius: 3px; background: #f59e0b;"></span>
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <lucide-icon name="credit-card" [size]="13"></lucide-icon> Card / Bank ({{ getCardPercent() }}%)
                </span>
              </div>
            </div>
          </div>

          <div style="margin-top: 10px; font-size: 12px; color: var(--slate-600); text-align: center; background: #f8fafc; padding: 8px; border-radius: 6px;">
            Total Shift Volume: <strong>ETB {{ cashierShift()?.totalRevenue | number:'1.2-2' }}</strong>
          </div>
        </div>
      </div>

      <!-- Second Row: Inventory Valuation vs Expiry Risk Horizon Charts -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Inventory Asset Valuation Progress Breakdown -->
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <h3 style="font-size: 15px; font-weight: 800; color: var(--slate-900); display: flex; align-items: center; gap: 8px;">
              <lucide-icon name="boxes" [size]="18" color="#059669"></lucide-icon> Inventory Stock Valuation & Margin Potential
            </h3>
            <span class="badge badge-success">Asset Portfolio</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div style="padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid var(--slate-200);">
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--slate-600); margin-bottom: 4px;">
                <span>Total Buying Asset Worth</span>
                <strong style="color: var(--slate-900);">ETB {{ valuation()?.totalCostValuation | number:'1.2-2' }}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--slate-600); margin-bottom: 4px;">
                <span>Projected Retail Potential</span>
                <strong style="color: #059669;">ETB {{ valuation()?.totalRetailValuation | number:'1.2-2' }}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #0284c7; padding-top: 6px; border-top: 1px solid var(--slate-200);">
                <span>Projected Gross Margin</span>
                <strong>ETB {{ valuation()?.potentialGrossProfit | number:'1.2-2' }}</strong>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div style="padding: 10px; background: #f1f5f9; border-radius: 6px; text-align: center;">
                <div style="font-size: 11px; color: var(--slate-500); font-weight: 700;">TOTAL STOCK UNITS</div>
                <div style="font-size: 20px; font-weight: 800; color: var(--slate-900); margin-top: 2px;">
                  {{ valuation()?.totalUnitsInStock || 0 }}
                </div>
              </div>
              <div style="padding: 10px; background: #f1f5f9; border-radius: 6px; text-align: center;">
                <div style="font-size: 11px; color: var(--slate-500); font-weight: 700;">ACTIVE BATCHES</div>
                <div style="font-size: 20px; font-weight: 800; color: var(--slate-900); margin-top: 2px;">
                  {{ valuation()?.activeBatchesCount || 0 }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Expiry Horizon Donut & Risk Analysis -->
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <h3 style="font-size: 15px; font-weight: 800; color: var(--slate-900); display: flex; align-items: center; gap: 8px;">
              <lucide-icon name="alert-triangle" [size]="18" color="#d97706"></lucide-icon> Expiry Risk & Waste Mitigation Matrix
            </h3>
            <span class="badge badge-warning">FEFO Protocol</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #fff1f2; border-radius: 8px; border-left: 4px solid #ef4444;">
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #991b1b;">Expired Stock (Immediate Write-off)</div>
                <div style="font-size: 11px; color: #b91c1c;">Loss Exposure: ETB {{ expiry()?.expiredLossValuation | number:'1.2-2' }}</div>
              </div>
              <strong style="font-size: 16px; color: #dc2626;">{{ expiry()?.expiredCount || 0 }} Batches</strong>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #fefce8; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #854d0e;">High Risk (&lt; 30 Days Expiry)</div>
                <div style="font-size: 11px; color: #a16207;">At-risk Value: ETB {{ expiry()?.expiring30DaysValuation | number:'1.2-2' }}</div>
              </div>
              <strong style="font-size: 16px; color: #d97706;">{{ expiry()?.expiring30DaysCount || 0 }} Batches</strong>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #0284c7;">
              <div style="font-size: 13px; font-weight: 700; color: var(--slate-700);">Medium Risk (30 - 60 Days Expiry)</div>
              <strong style="font-size: 16px; color: #0284c7;">{{ expiry()?.expiring60DaysCount || 0 }} Batches</strong>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #10b981;">
              <div style="font-size: 13px; font-weight: 700; color: var(--slate-700);">Notice Watch (60 - 90 Days Expiry)</div>
              <strong style="font-size: 16px; color: #059669;">{{ expiry()?.expiring90DaysCount || 0 }} Batches</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  pnl = signal<any>(null);
  valuation = signal<any>(null);
  expiry = signal<any>(null);
  cashierShift = signal<any>(null);

  startDate = '';
  endDate = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.setRange('30D');
    this.loadReports();
  }

  setRange(type: 'TODAY' | '7D' | '30D'): void {
    const end = new Date();
    let start = new Date();

    if (type === 'TODAY') {
      start = new Date();
    } else if (type === '7D') {
      start.setDate(end.getDate() - 7);
    } else if (type === '30D') {
      start.setDate(end.getDate() - 30);
    }

    this.startDate = start.toISOString().split('T')[0];
    this.endDate = end.toISOString().split('T')[0];
    this.loadReports();
  }

  loadReports(): void {
    const params = `?startDate=${this.startDate}&endDate=${this.endDate}`;

    this.http.get<any>(`${environment.apiUrl}/reports/profit-loss${params}`).subscribe({
      next: (res) => this.pnl.set(res.data)
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

  downloadPdf(): void {
    const params = `?startDate=${this.startDate}&endDate=${this.endDate}`;
    window.open(`${environment.apiUrl}/reports/sales/pdf${params}`, '_blank');
  }

  getCostPercent(): number {
    const rev = this.pnl()?.totalRevenue || 0;
    const cost = this.pnl()?.totalCostOfGoodsSold || 0;
    if (rev <= 0) return 0;
    return Math.min(100, Math.round((cost / rev) * 100));
  }

  getProfitPercent(): number {
    const rev = this.pnl()?.totalRevenue || 0;
    const prof = this.pnl()?.grossProfit || 0;
    if (rev <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((prof / rev) * 100)));
  }

  getCashPercent(): number {
    const total = this.cashierShift()?.totalRevenue || 0;
    const cash = this.cashierShift()?.cashAmount || 0;
    if (total <= 0) return 70; // default benchmark
    return Math.round((cash / total) * 100);
  }

  getDigitalPercent(): number {
    const total = this.cashierShift()?.totalRevenue || 0;
    const digital = this.cashierShift()?.digitalAmount || 0;
    if (total <= 0) return 20; // default benchmark
    return Math.round((digital / total) * 100);
  }

  getCardPercent(): number {
    const total = this.cashierShift()?.totalRevenue || 0;
    const card = this.cashierShift()?.cardOrBankAmount || 0;
    if (total <= 0) return 10; // default benchmark
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
}
