import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../core/services/notification.service';
import { environment } from '../../../environments/environment';
import { PaginationComponent, PaginatePipe } from '../../shared';

export interface SaleReturnItem {
  id: number;
  drugName: string;
  batchNumber: string;
  movementType: string;
  quantity: number;
  reason: string;
  referenceType: string;
  referenceId: number;
  performedByUsername: string;
  createdAt: string;
}

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
            Search transactions, preview 80mm thermal receipts, and audit customer returns & FEFO batch restocks
          </p>
        </div>

        <div style="display: flex; gap: 8px;">
          <button (click)="loadAllData()" class="btn btn-outline" style="padding: 8px 14px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon name="refresh-cw" [size]="14"></lucide-icon> Refresh Ledger
          </button>
        </div>
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

        <div class="card" style="border-left: 4px solid #ef4444;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Processed Returns</span>
            <lucide-icon name="undo-2" [size]="18" color="#ef4444"></lucide-icon>
          </div>
          <div style="font-size: 24px; font-weight: 800; color: #dc2626; margin: 6px 0 2px;">
            {{ returnsList.length }} Restocked
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Total items returned to FEFO inventory
          </div>
        </div>

        <div class="card" style="border-left: 4px solid #8b5cf6;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Payment Settlement</span>
            <lucide-icon name="credit-card" [size]="18" color="#7c3aed"></lucide-icon>
          </div>
          <div style="font-size: 15px; font-weight: 700; color: var(--slate-800); margin: 6px 0 2px;">
            Cash Till & Telebirr / Cards
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Automatic shift cashout deduction
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div style="display: flex; gap: 8px; border-bottom: 2px solid var(--slate-200); padding-bottom: 2px;">
        <button (click)="activeTab = 'sales'" [class.active-tab]="activeTab === 'sales'" class="tab-btn">
          <lucide-icon name="file-text" [size]="16"></lucide-icon>
          All Invoices & Fiscal Receipts ({{ salesList.length }})
        </button>
        <button (click)="activeTab = 'returns'; loadReturns()" [class.active-tab]="activeTab === 'returns'" class="tab-btn">
          <lucide-icon name="undo-2" [size]="16"></lucide-icon>
          Sales Returns & Restock Ledger ({{ returnsList.length }})
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 1: ALL SALES INVOICES & FISCAL RECEIPTS                               -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab === 'sales'" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Filters Toolbar -->
        <div class="card" style="padding: 14px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 260px; position: relative;">
            <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
            <input type="text" [(ngModel)]="searchInvoice" (input)="filterSales()"
                   class="form-control" style="padding-left: 36px;" placeholder="Search invoice #, customer name, or cashier..." />
          </div>

          <select [(ngModel)]="paymentFilter" (change)="loadSales()" aria-label="Filter sales by payment method" class="form-control" style="width: auto; min-width: 180px;">
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
                  <th style="padding: 12px 16px;">Status</th>
                  <th style="padding: 12px 16px;">Tender Method</th>
                  <th style="padding: 12px 16px; text-align: right;">Items</th>
                  <th style="padding: 12px 16px; text-align: right;">Grand Total</th>
                  <th style="padding: 12px 16px; text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of (filteredSales | paginate: page : pageSize)" style="border-bottom: 1px solid var(--slate-100);" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                  <td style="padding: 12px 16px; font-family: monospace; font-weight: 800; color: #0284c7;">
                    <div>{{ s.invoiceNumber }}</div>
                    <div *ngIf="s.refundStatus === 'FULLY_REFUNDED'" style="font-size: 10px; color: #dc2626; font-weight: 700;">
                      VOID / REFUNDED
                    </div>
                  </td>
                  <td style="padding: 12px 16px; color: var(--slate-500); font-size: 12px;">{{ s.createdAt | date:'medium' }}</td>
                  <td style="padding: 12px 16px; font-weight: 700; color: var(--slate-800);">{{ s.cashier?.fullName || s.cashier?.username || 'Cashier' }}</td>
                  <td style="padding: 12px 16px;">
                    <div style="font-weight: 700; color: var(--slate-900);">{{ s.customer ? s.customer.name : 'Walk-in Customer' }}</div>
                    <span class="badge badge-primary" style="font-size: 10px; padding: 2px 6px; margin-top: 2px;">{{ s.saleType || 'RETAIL' }}</span>
                  </td>
                  <td style="padding: 12px 16px;">
                    <span *ngIf="s.refundStatus === 'FULLY_REFUNDED'" class="badge" style="background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; display: inline-flex; align-items: center; gap: 4px; font-weight: 700;">
                      <lucide-icon name="rotate-ccw" [size]="11"></lucide-icon> FULLY REFUNDED
                    </span>
                    <span *ngIf="s.refundStatus === 'PARTIALLY_REFUNDED'" class="badge" style="background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; display: inline-flex; align-items: center; gap: 4px; font-weight: 700;">
                      <lucide-icon name="undo-2" [size]="11"></lucide-icon> PARTIAL REFUND
                    </span>
                    <span *ngIf="!s.refundStatus || s.refundStatus === 'COMPLETED'" class="badge badge-success" style="display: inline-flex; align-items: center; gap: 4px;">
                      <lucide-icon name="check-circle" [size]="11"></lucide-icon> SETTLED
                    </span>
                  </td>
                  <td style="padding: 12px 16px;">
                    <span class="badge" [ngClass]="s.paymentMethod === 'CASH' ? 'badge-success' : 'badge-primary'">
                      {{ s.paymentMethod }}
                    </span>
                  </td>
                  <td style="padding: 12px 16px; text-align: right; font-family: monospace;">{{ s.items?.length || 1 }}</td>
                  <td style="padding: 12px 16px; text-align: right; font-family: monospace; font-weight: 800; font-size: 14px; color: var(--slate-900);">
                    ETB {{ s.grandTotal | number:'1.2-2' }}
                    <div *ngIf="s.refundedAmount && s.refundedAmount > 0" style="font-size: 10px; color: #dc2626; font-weight: 600;">
                      -{{ s.refundedAmount | number:'1.2-2' }} refunded
                    </div>
                  </td>
                  <td style="padding: 12px 16px; text-align: center;">
                    <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
                      <button (click)="viewReceipt(s)" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;" title="View Thermal Receipt">
                        <lucide-icon name="printer" [size]="12"></lucide-icon> Receipt
                      </button>
                      <button 
                        *ngIf="s.refundStatus !== 'FULLY_REFUNDED' && hasRefundableItems(s)" 
                        (click)="openRefundModal(s)" 
                        class="btn btn-outline" 
                        style="padding: 4px 8px; font-size: 11px; color: #ef4444; border-color: #fecaca; display: inline-flex; align-items: center; gap: 4px;" 
                        title="Process Item Return / Partial or Full Refund">
                        <lucide-icon name="undo-2" [size]="12"></lucide-icon> {{ s.refundStatus === 'PARTIALLY_REFUNDED' ? 'Add’l Return' : 'Return / Refund' }}
                      </button>
                      <span *ngIf="s.refundStatus === 'FULLY_REFUNDED'" style="font-size: 11px; color: #94a3b8; font-weight: 700; padding: 4px 6px;">
                        Refunded
                      </span>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="filteredSales.length === 0">
                  <td colspan="9" style="text-align: center; padding: 36px; color: var(--slate-400);">No sales transactions match the specified filter.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 2: SALES RETURNS & RESTOCK LEDGER                                     -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab === 'returns'" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="card" style="padding: 16px; background: #fff; border-left: 4px solid #ef4444;">
          <h3 style="font-size: 15px; font-weight: 800; color: var(--slate-900); margin: 0;">Immutable Sales Return & Inventory Restock Audit</h3>
          <p style="font-size: 12px; color: var(--slate-500); margin: 4px 0 0;">
            Every refunded item is automatically restored to its FEFO batch with drawer cashout or credit adjustment logged in real-time.
          </p>
        </div>

        <div class="card" style="padding: 0; overflow: hidden;">
          <app-pagination
            [totalItems]="filteredReturns().length"
            [pageSize]="returnsPageSize"
            [currentPage]="returnsPage"
            (pageChange)="returnsPage = $event"
            (pageSizeChange)="returnsPageSize = $event; returnsPage = 1">
          </app-pagination>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
              <thead style="background: #f8fafc; border-bottom: 1px solid var(--slate-200); color: var(--slate-600); font-weight: 700;">
                <tr>
                  <th style="padding: 12px 16px;">Return Date</th>
                  <th style="padding: 12px 16px;">Medication & Restocked Batch</th>
                  <th style="padding: 12px 16px; text-align: center;">Returned Quantity</th>
                  <th style="padding: 12px 16px;">Return Reason</th>
                  <th style="padding: 12px 16px;">Cashier / Dispenser</th>
                  <th style="padding: 12px 16px;">Status & Movement</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ret of (filteredReturns() | paginate: returnsPage : returnsPageSize)" style="border-bottom: 1px solid var(--slate-100);">
                  <td style="padding: 12px 16px; font-weight: 600; color: var(--slate-600);">
                    {{ ret.createdAt | date:'medium' }}
                  </td>
                  <td style="padding: 12px 16px;">
                    <div style="font-weight: 700; color: var(--slate-900);">{{ ret.drugName }}</div>
                    <code style="font-size: 11px; color: #0f766e;">Batch: {{ ret.batchNumber }}</code>
                  </td>
                  <td style="padding: 12px 16px; text-align: center;">
                    <span class="badge badge-warning" style="font-size: 12px; font-weight: 800;">
                      +{{ ret.quantity }} Units Restocked
                    </span>
                  </td>
                  <td style="padding: 12px 16px; color: var(--slate-700); max-width: 260px;">
                    {{ ret.reason || 'Customer Return' }}
                  </td>
                  <td style="padding: 12px 16px; color: var(--slate-600);">
                    <code>&#64;{{ ret.performedByUsername }}</code>
                  </td>
                  <td style="padding: 12px 16px;">
                    <span class="badge badge-success" style="display: inline-flex; align-items: center; gap: 4px;">
                      <lucide-icon name="check-circle" [size]="11"></lucide-icon> FEFO RESTOCKED
                    </span>
                  </td>
                </tr>
                <tr *ngIf="returnsList.length === 0">
                  <td colspan="6" style="text-align: center; padding: 36px; color: var(--slate-400);">
                    No sales returns recorded yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
          
          <!-- Refund Banner on Receipt -->
          <div *ngIf="selectedReceipt.refundStatus === 'FULLY_REFUNDED'" style="margin-top: 6px; padding: 4px; background: #fee2e2; border: 1px dashed #ef4444; color: #b91c1c; font-weight: 800; font-size: 11px;">
            *** FULLY REFUNDED & RESTOCKED ***
          </div>
          <div *ngIf="selectedReceipt.refundStatus === 'PARTIALLY_REFUNDED'" style="margin-top: 6px; padding: 4px; background: #fef3c7; border: 1px dashed #f59e0b; color: #b45309; font-weight: 800; font-size: 11px;">
            *** PARTIALLY REFUNDED (-ETB {{ selectedReceipt.refundedAmount | number:'1.2-2' }}) ***
          </div>
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
              <div style="font-weight: 700; color: #0f172a;">{{ item.drugBatch?.drug?.name || item.drugName || 'Medication' }}</div>
              <div style="font-size: 10px; color: #64748b;">
                {{ item.quantity }} x {{ item.unitPrice | number:'1.2-2' }}
                <span *ngIf="item.refundedQuantity > 0" style="color: #dc2626; font-weight: 700;"> (Ret: {{ item.refundedQuantity }})</span>
              </div>
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
          <div *ngIf="selectedReceipt.refundedAmount && selectedReceipt.refundedAmount > 0" style="display: flex; justify-content: space-between; font-weight: 700; color: #dc2626;">
            <span>Total Refunded:</span><span>-ETB {{ selectedReceipt.refundedAmount | number:'1.2-2' }}</span>
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

    <!-- ========================================================================= -->
    <!-- ADVANCED REFUND MODAL (Full / Partial / Half Quick Select & Calculation)  -->
    <!-- ========================================================================= -->
    <div *ngIf="showRefundModal" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 520px; max-width: 100%; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 10px;">
          <div>
            <h3 style="font-size: 17px; font-weight: 800; color: var(--slate-900); margin: 0; display: flex; align-items: center; gap: 8px;">
              <lucide-icon name="undo-2" [size]="18" color="#dc2626"></lucide-icon>
              Process Return & Refund: {{ refundSale?.invoiceNumber }}
            </h3>
            <span style="font-size: 12px; color: var(--slate-500);">Customer: {{ refundSale?.customer?.name || 'Walk-in Retail' }}</span>
          </div>
          <button (click)="showRefundModal = false" style="background: none; border: none; cursor: pointer; color: var(--slate-400); font-size: 16px;">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Item Select -->
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">
              Select Medication Line Item *
            </label>
            <select [(ngModel)]="refundForm.saleItemId" (change)="onRefundItemChange()" class="form-control">
              <option *ngFor="let item of refundSale?.items" [ngValue]="item.id" [disabled]="getItemRemainingQty(item) <= 0">
                {{ item.drugBatch?.drug?.name || item.drugName || 'Medication' }} 
                (Bought: {{ item.quantity }} | Ret: {{ item.refundedQuantity || 0 }} | Available: {{ getItemRemainingQty(item) }})
              </option>
            </select>
          </div>

          <!-- Quick Return Options (1 Unit / Half / Full) -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700);">
                Quantity to Return (Available: {{ getSelectedPurchasedQty() }} Units) *
              </label>
              <div style="display: flex; gap: 4px;">
                <button type="button" (click)="setRefundQty(1)" class="btn-quick-qty" [disabled]="getSelectedPurchasedQty() < 1">1 Unit</button>
                <button type="button" (click)="setRefundQty(getHalfQty())" class="btn-quick-qty" [disabled]="getSelectedPurchasedQty() < 2">Half (50%)</button>
                <button type="button" (click)="setRefundQty(getSelectedPurchasedQty())" class="btn-quick-qty btn-full-qty" [disabled]="getSelectedPurchasedQty() < 1">Full (100%)</button>
              </div>
            </div>
            <input 
              type="number" 
              [(ngModel)]="refundForm.quantity" 
              [min]="1" 
              [max]="getSelectedPurchasedQty()" 
              class="form-control" 
              style="font-family: monospace; font-weight: 800; font-size: 15px;" />
          </div>

          <!-- Real-Time Calculation Card -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: var(--slate-600);">
              <span>Return Type:</span>
              <strong style="color: #0284c7;">{{ refundForm.quantity >= getSelectedPurchasedQty() ? 'FULL REMAINING RETURN (100%)' : 'PARTIAL RETURN (' + refundForm.quantity + '/' + getSelectedPurchasedQty() + ')' }}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: var(--slate-600);">
              <span>Unit Price:</span>
              <span>ETB {{ getSelectedUnitPrice() | number:'1.2-2' }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; color: #dc2626; border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: 6px;">
              <span>Total Refund Payout:</span>
              <span>ETB {{ getCalculatedRefundTotal() | number:'1.2-2' }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; color: #059669;">
              <span>Restock Action:</span>
              <span>+{{ refundForm.quantity }} units restored to FEFO Batch</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px; font-size: 11px; color: #7c3aed;">
              <span>Shift Register Action:</span>
              <span>{{ refundSale?.paymentMethod === 'CASH' ? 'CASH_OUT (Physical Drawer Payout)' : 'Customer Credit Reduction' }}</span>
            </div>
          </div>

          <!-- Reason & Quick Tags -->
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">
              Reason for Return *
            </label>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px;">
              <button type="button" (click)="refundForm.reason = 'Customer returned unopened sealed item'" class="btn-reason-tag">Unopened</button>
              <button type="button" (click)="refundForm.reason = 'Prescription altered by physician'" class="btn-reason-tag">Rx Changed</button>
              <button type="button" (click)="refundForm.reason = 'Incorrect item selected at checkout'" class="btn-reason-tag">Wrong Item</button>
              <button type="button" (click)="refundForm.reason = 'Packaging defect / damaged'" class="btn-reason-tag">Defect</button>
            </div>
            <input type="text" [(ngModel)]="refundForm.reason" class="form-control" placeholder="e.g. Customer returned unopened medication" />
          </div>

          <!-- Submit Buttons -->
          <div style="display: flex; gap: 10px; margin-top: 6px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
            <button (click)="showRefundModal = false" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button (click)="submitRefund()" class="btn btn-danger" [disabled]="getSelectedPurchasedQty() <= 0" style="flex: 2; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
              <lucide-icon name="check-circle" [size]="15"></lucide-icon>
              Confirm Restock & Refund (ETB {{ getCalculatedRefundTotal() | number:'1.2-2' }})
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 700;
      color: var(--slate-600);
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      color: #0284c7;
    }
    .active-tab {
      color: #0284c7;
      border-bottom-color: #0284c7;
    }
    .btn-quick-qty {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      padding: 3px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-quick-qty:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .btn-full-qty {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #dc2626;
    }
    .btn-full-qty:hover {
      background: #fecaca;
    }
    .btn-reason-tag {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      padding: 2px 8px;
      border-radius: 9999px;
      cursor: pointer;
    }
    .btn-reason-tag:hover {
      background: #e0f2fe;
      color: #0284c7;
      border-color: #bae6fd;
    }
  `]
})
export class SalesComponent implements OnInit {
  activeTab: 'sales' | 'returns' = 'sales';

  salesList: any[] = [];
  filteredSales: any[] = [];
  returnsList: SaleReturnItem[] = [];

  searchInvoice = '';
  paymentFilter = '';
  selectedReceipt: any = null;

  page = 1;
  pageSize = 10;
  returnsPage = 1;
  returnsPageSize = 10;

  showRefundModal = false;
  refundSale: any = null;
  refundForm = { saleItemId: null as number | null, quantity: 1, reason: '' };

  constructor(private http: HttpClient, private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loadSales();
    this.loadReturns();
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

  loadReturns(): void {
    this.http.get<any>(`${environment.apiUrl}/inventory/movements`).subscribe({
      next: (res) => {
        const movements: SaleReturnItem[] = res.data || [];
        this.returnsList = movements.filter(m => m.movementType === 'SALE_RETURN');
      }
    });
  }

  filteredReturns(): SaleReturnItem[] {
    return this.returnsList;
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

  hasRefundableItems(sale: any): boolean {
    if (!sale || !sale.items || sale.items.length === 0) return false;
    return sale.items.some((i: any) => this.getItemRemainingQty(i) > 0);
  }

  getItemRemainingQty(item: any): number {
    if (!item) return 0;
    const refunded = item.refundedQuantity || 0;
    return Math.max(0, (item.quantity || 0) - refunded);
  }

  openRefundModal(sale: any): void {
    this.refundSale = sale;
    const availableItems = (sale.items || []).filter((i: any) => this.getItemRemainingQty(i) > 0);
    const selected = availableItems.length > 0 ? availableItems[0] : (sale.items ? sale.items[0] : null);
    
    this.refundForm = {
      saleItemId: selected ? selected.id : null,
      quantity: selected ? this.getItemRemainingQty(selected) : 1,
      reason: 'Customer returned unopened sealed item'
    };
    this.showRefundModal = true;
  }

  onRefundItemChange(): void {
    const item = this.getSelectedItem();
    if (item) {
      this.refundForm.quantity = this.getItemRemainingQty(item);
    }
  }

  getSelectedItem(): any {
    if (!this.refundSale || !this.refundSale.items) return null;
    return this.refundSale.items.find((i: any) => i.id === this.refundForm.saleItemId) || this.refundSale.items[0];
  }

  getSelectedPurchasedQty(): number {
    const item = this.getSelectedItem();
    return this.getItemRemainingQty(item);
  }

  getHalfQty(): number {
    const max = this.getSelectedPurchasedQty();
    return Math.max(1, Math.floor(max / 2));
  }

  setRefundQty(qty: number): void {
    const max = this.getSelectedPurchasedQty();
    this.refundForm.quantity = Math.max(1, Math.min(max, qty));
  }

  getSelectedUnitPrice(): number {
    const item = this.getSelectedItem();
    return item ? (Number(item.unitPrice) || 0) : 0;
  }

  getCalculatedRefundTotal(): number {
    const unitPrice = this.getSelectedUnitPrice();
    const qty = this.refundForm.quantity || 1;
    return unitPrice * qty;
  }

  submitRefund(): void {
    if (!this.refundForm.saleItemId) {
      this.notificationService.warning('Please select an item to refund');
      return;
    }
    const maxAvail = this.getSelectedPurchasedQty();
    if (!this.refundForm.quantity || this.refundForm.quantity <= 0) {
      this.notificationService.warning('Please enter a valid return quantity');
      return;
    }
    if (this.refundForm.quantity > maxAvail) {
      this.notificationService.warning(`Quantity cannot exceed available refundable quantity (${maxAvail})`);
      return;
    }
    if (!this.refundForm.reason.trim()) {
      this.notificationService.warning('Please provide a reason for the return');
      return;
    }

    this.http.post<any>(`${environment.apiUrl}/pos/refund`, this.refundForm).subscribe({
      next: () => {
        this.notificationService.success(`Refund of ETB ${this.getCalculatedRefundTotal().toFixed(2)} processed and items restocked!`);
        this.showRefundModal = false;
        this.loadSales();
        this.loadReturns();
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Refund failed')
    });
  }
}
