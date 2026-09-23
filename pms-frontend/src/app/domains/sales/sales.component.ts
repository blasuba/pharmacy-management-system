import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../core/services/notification.service';
import { environment } from '../../../environments/environment';
import { PaginationComponent, PaginatePipe } from '../../shared';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent, PaginatePipe],
  template: `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: var(--slate-900);">Sales Invoices & Fiscal Receipts</h1>
          <p style="font-size: 13px; color: var(--slate-500); margin-top: 2px;">
            Search transactions, preview 80mm thermal receipts, and process customer returns & FEFO batch restocks
          </p>
        </div>

        <button (click)="loadSales()" class="btn btn-outline" style="padding: 8px 14px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="refresh-cw" [size]="14"></lucide-icon> Refresh Ledger
        </button>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
        <div class="card" style="border-left: 4px solid #0284c7;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Total Invoices</span>
            <lucide-icon name="file-text" [size]="18" color="#0284c7"></lucide-icon>
          </div>
          <div style="font-size: 24px; font-weight: 800; color: var(--slate-900); margin: 6px 0 2px;">
            {{ filteredSales.length }} Completed
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Recorded sales receipts
          </div>
        </div>

        <div class="card" style="border-left: 4px solid #10b981;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Gross Sales Volume</span>
            <lucide-icon name="wallet" [size]="18" color="#059669"></lucide-icon>
          </div>
          <div style="font-size: 24px; font-weight: 800; color: #059669; margin: 6px 0 2px; font-family: monospace;">
            ETB {{ getTotalRevenue() | number:'1.2-2' }}
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Avg ticket: ETB {{ getAverageBasket() | number:'1.2-2' }}
          </div>
        </div>

        <div class="card" style="border-left: 4px solid #8b5cf6;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Payment Breakdown</span>
            <lucide-icon name="credit-card" [size]="18" color="#7c3aed"></lucide-icon>
          </div>
          <div style="font-size: 15px; font-weight: 700; color: var(--slate-800); margin: 6px 0 2px;">
            Cash Till & Telebirr / Cards
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Multi-tender accounting reconciliation
          </div>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="card" style="padding: 14px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 260px; position: relative;">
          <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
          <input type="text" [(ngModel)]="searchInvoice" (input)="filterSales()"
                 class="form-control" style="padding-left: 36px;" placeholder="Search invoice #, customer name, or cashier..." />
        </div>

        <select [(ngModel)]="paymentFilter" (change)="loadSales()" class="form-control" style="width: auto; min-width: 180px;">
          <option value="">All Payment Methods</option>
          <option value="CASH">Cash Till</option>
          <option value="MOBILE_MONEY">Telebirr / CBE Birr</option>
          <option value="CARD">Debit / Credit Card</option>
          <option value="CREDIT_ACCOUNT">On Credit Account</option>
        </select>
      </div>

      <!-- Sales Table -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <app-pagination
          [totalItems]="filteredSales.length"
          [pageSize]="pageSize"
          [currentPage]="page"
          (pageChange)="page = $event"
          (pageSizeChange)="pageSize = $event; page = 1">
        </app-pagination>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
            <thead style="background: #f8fafc; border-bottom: 1px solid var(--slate-200); color: var(--slate-600); font-weight: 700;">
              <tr>
                <th style="padding: 12px 16px;">Invoice #</th>
                <th style="padding: 12px 16px;">Date & Time</th>
                <th style="padding: 12px 16px;">Cashier</th>
                <th style="padding: 12px 16px;">Customer Account</th>
                <th style="padding: 12px 16px;">Tender Method</th>
                <th style="padding: 12px 16px; text-align: right;">Items</th>
                <th style="padding: 12px 16px; text-align: right;">Grand Total</th>
                <th style="padding: 12px 16px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of (filteredSales | paginate: page : pageSize)" style="border-bottom: 1px solid var(--slate-100);" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                <td style="padding: 12px 16px; font-family: monospace; font-weight: 800; color: #0284c7;">{{ s.invoiceNumber }}</td>
                <td style="padding: 12px 16px; color: var(--slate-500); font-size: 12px;">{{ s.createdAt | date:'medium' }}</td>
                <td style="padding: 12px 16px; font-weight: 700; color: var(--slate-800);">{{ s.cashier?.fullName || s.cashier?.username || 'Cashier' }}</td>
                <td style="padding: 12px 16px;">
                  <div style="font-weight: 700; color: var(--slate-900);">{{ s.customer ? s.customer.name : 'Walk-in Customer' }}</div>
                  <span class="badge badge-primary" style="font-size: 10px; padding: 2px 6px; margin-top: 2px;">{{ s.saleType || 'RETAIL' }}</span>
                </td>
                <td style="padding: 12px 16px;">
                  <span class="badge" [ngClass]="s.paymentMethod === 'CASH' ? 'badge-success' : 'badge-primary'">
                    {{ s.paymentMethod }}
                  </span>
                </td>
                <td style="padding: 12px 16px; text-align: right; font-family: monospace;">{{ s.items?.length || 1 }}</td>
                <td style="padding: 12px 16px; text-align: right; font-family: monospace; font-weight: 800; font-size: 14px; color: var(--slate-900);">
                  ETB {{ s.grandTotal | number:'1.2-2' }}
                </td>
                <td style="padding: 12px 16px; text-align: center;">
                  <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
                    <button (click)="viewReceipt(s)" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">
                      <lucide-icon name="printer" [size]="12"></lucide-icon> Receipt
                    </button>
                    <button *ngIf="s.items && s.items.length > 0" (click)="openRefundModal(s)" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; color: #ef4444; border-color: #fecaca; display: inline-flex; align-items: center; gap: 4px;">
                      <lucide-icon name="undo-2" [size]="12"></lucide-icon> Refund
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredSales.length === 0">
                <td colspan="8" style="text-align: center; padding: 36px; color: var(--slate-400);">No sales transactions match the specified filter.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL: Thermal Receipt Preview -->
    <div *ngIf="selectedReceipt" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card printable-area" style="width: 360px; max-width: 100%; padding: 22px; font-family: monospace; font-size: 12px;">
        <div style="text-align: center; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; margin-bottom: 10px;">
          <h2 style="font-size: 15px; font-weight: 800; color: #0f172a;">APEX CENTRAL PHARMACY</h2>
          <div style="color: #64748b; font-size: 11px;">Bole Medhanialem Suite 402, Addis Ababa</div>
          <div style="color: #94a3b8; font-size: 10px;">TIN: TIN-0098712345 • Tel: +251-911-000000</div>
          <div style="font-weight: 800; font-size: 12px; margin-top: 6px; color: var(--slate-800);">OFFICIAL FISCAL RECEIPT</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 4px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; margin-bottom: 8px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between;"><span>Invoice:</span><strong>{{ selectedReceipt.invoiceNumber }}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Date:</span><span>{{ selectedReceipt.createdAt | date:'medium' }}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Cashier:</span><span>{{ selectedReceipt.cashier?.fullName || selectedReceipt.cashier?.username || 'Cashier' }}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Customer:</span><span>{{ selectedReceipt.customer?.name || 'Walk-in Customer' }}</span></div>
          <div *ngIf="selectedReceipt.prescriptionNumber" style="display: flex; justify-content: space-between;"><span>Rx #:</span><span>{{ selectedReceipt.prescriptionNumber }}</span></div>
        </div>

        <!-- Line items -->
        <div style="display: flex; flex-direction: column; gap: 6px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 10px; color: var(--slate-500); text-transform: uppercase;">
            <span>Item (Qty x Price)</span>
            <span>Total</span>
          </div>
          <div *ngFor="let item of selectedReceipt.items" style="display: flex; justify-content: space-between;">
            <div>
              <div style="font-weight: 700; color: #0f172a;">{{ item.drugBatch?.drug?.name || 'Medication' }}</div>
              <div style="font-size: 10px; color: #64748b;">{{ item.quantity }} x {{ item.unitPrice | number:'1.2-2' }}</div>
            </div>
            <div style="font-weight: 700;">{{ item.subtotal | number:'1.2-2' }}</div>
          </div>
        </div>

        <!-- Totals -->
        <div style="display: flex; flex-direction: column; gap: 4px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>ETB {{ selectedReceipt.subtotal | number:'1.2-2' }}</span></div>
          <div *ngIf="selectedReceipt.discountAmount > 0" style="display: flex; justify-content: space-between; color: #059669;">
            <span>Discount:</span><span>-ETB {{ selectedReceipt.discountAmount | number:'1.2-2' }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 14px; border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 4px; color: #0f172a;">
            <span>GRAND TOTAL:</span><span>ETB {{ selectedReceipt.grandTotal | number:'1.2-2' }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: #64748b;"><span>Tender Method:</span><span>{{ selectedReceipt.paymentMethod }}</span></div>
          <div style="display: flex; justify-content: space-between; color: #64748b;"><span>Amount Paid:</span><span>ETB {{ selectedReceipt.paidAmount | number:'1.2-2' }}</span></div>
          <div *ngIf="selectedReceipt.changeAmount > 0" style="display: flex; justify-content: space-between; font-weight: 700; color: #059669;">
            <span>Change Due:</span><span>ETB {{ selectedReceipt.changeAmount | number:'1.2-2' }}</span>
          </div>
        </div>

        <div style="text-align: center; font-size: 10px; color: #94a3b8; margin-bottom: 10px;">
          <div>Thank you for choosing Apex Pharmacy!</div>
          <div>Returns accepted within 48h with original seal.</div>
        </div>

        <div style="display: flex; gap: 8px;" class="not-printable">
          <button (click)="selectedReceipt = null" class="btn btn-outline" style="flex: 1;">Close</button>
          <button (click)="printReceipt()" class="btn btn-primary" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            <lucide-icon name="printer" [size]="14"></lucide-icon> Print 80mm
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: Refund Item -->
    <div *ngIf="showRefundModal" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 440px; max-width: 100%; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 10px;">
          <h3 style="font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <lucide-icon name="undo-2" [size]="20" color="#dc2626"></lucide-icon> Process Item Return & Restock
          </h3>
          <button (click)="showRefundModal = false" style="background: none; border: none; cursor: pointer; color: var(--slate-400);">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Select Item to Return *</label>
            <select [(ngModel)]="refundForm.saleItemId" class="form-control">
              <option *ngFor="let item of refundSale?.items" [ngValue]="item.id">
                {{ item.drugBatch?.drug?.name }} (Qty: {{ item.quantity }}, Unit: {{ item.unitPrice }} ETB)
              </option>
            </select>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Quantity to Return *</label>
            <input type="number" [(ngModel)]="refundForm.quantity" min="1" max="100" class="form-control" style="font-family: monospace; font-weight: 700;" />
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Reason for Return *</label>
            <input type="text" [(ngModel)]="refundForm.reason" class="form-control" placeholder="e.g. Customer returned unopened medication" />
          </div>

          <div style="display: flex; gap: 10px; margin-top: 10px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
            <button (click)="showRefundModal = false" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button (click)="submitRefund()" class="btn btn-danger" style="flex: 2;">Confirm Restock & Refund</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SalesComponent implements OnInit {
  salesList: any[] = [];
  filteredSales: any[] = [];
  searchInvoice = '';
  paymentFilter = '';
  selectedReceipt: any = null;

  page = 1;
  pageSize = 10;

  showRefundModal = false;
  refundSale: any = null;
  refundForm = { saleItemId: null, quantity: 1, reason: '' };

  constructor(private http: HttpClient, private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadSales();
  }

  loadSales(): void {
    let url = `${environment.apiUrl}/pos/sales`;
    if (this.paymentFilter) {
      url += `?paymentMethod=${this.paymentFilter}`;
    }
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.salesList = res.data || [];
        this.page = 1;
        this.filterSales();
      }
    });
  }

  getTotalRevenue(): number {
    return this.filteredSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
  }

  getAverageBasket(): number {
    if (this.filteredSales.length === 0) return 0;
    return this.getTotalRevenue() / this.filteredSales.length;
  }

  filterSales(): void {
    this.page = 1;
    const q = this.searchInvoice.toLowerCase().trim();
    if (!q) {
      this.filteredSales = this.salesList;
      return;
    }
    this.filteredSales = this.salesList.filter(s =>
      s.invoiceNumber?.toLowerCase().includes(q) ||
      s.customer?.name?.toLowerCase().includes(q) ||
      s.cashier?.fullName?.toLowerCase().includes(q)
    );
  }

  viewReceipt(sale: any): void {
    this.selectedReceipt = sale;
  }

  printReceipt(): void {
    window.print();
  }

  openRefundModal(sale: any): void {
    this.refundSale = sale;
    this.refundForm = {
      saleItemId: sale.items && sale.items.length > 0 ? sale.items[0].id : null,
      quantity: 1,
      reason: ''
    };
    this.showRefundModal = true;
  }

  submitRefund(): void {
    if (!this.refundForm.saleItemId) {
      this.notificationService.warning('Please select an item to refund');
      return;
    }
    if (!this.refundForm.reason) {
      this.notificationService.warning('Please provide a reason for the return');
      return;
    }
    this.http.post<any>(`${environment.apiUrl}/pos/refund`, this.refundForm).subscribe({
      next: () => {
        this.notificationService.success('Item returned and restocked in inventory!');
        this.showRefundModal = false;
        this.loadSales();
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Refund failed')
    });
  }
}
