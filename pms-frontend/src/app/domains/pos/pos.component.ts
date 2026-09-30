import { Component, OnInit, OnDestroy, HostListener, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../core/services/notification.service';
import { ValidationService } from '../../core/services/validation.service';
import { PrintService } from '../../core/services/print.service';
import { SettingsService } from '../../core/services/settings.service';
import { environment } from '../../../environments/environment';

export interface CartItem {
  drugId: number;
  drugName: string;
  genericName: string;
  dosageForm?: string;
  strength?: string;
  quantity: number;
  unitPrice: number;
  availableStock: number;
  discountPercent: number;
  prescriptionRequired?: boolean;
}

export interface ParkedSale {
  id: string;
  parkedAt: Date;
  customerName: string;
  customerId: number | null;
  customerType: string;
  items: CartItem[];
  subtotal: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div style="display: flex; flex-direction: column; gap: 14px; user-select: none;">
      
      <!-- 1. TOP CONTROL & ACTION RIBBON -->
      <div class="card" style="padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; background: #ffffff; border-left: 4px solid #0284c7;">
        
        <!-- Left: Shift & Register Indicator -->
        <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
          <div *ngIf="activeShift" style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);" class="animate-pulse"></span>
            <span style="font-size: 13px; font-weight: 700; color: #0f172a;">Shift #{{ activeShift.id }} Active</span>
            <span style="font-size: 11px; padding: 2px 7px; background: #e0f2fe; color: #0369a1; border-radius: 5px; font-weight: 700;">
              Drawer Float: ETB {{ (activeShift.openingFloat || 0) | number:'1.2-2' }}
            </span>
          </div>

          <div *ngIf="!activeShift" style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: #f59e0b;"></span>
            <span style="font-size: 12.5px; font-weight: 700; color: #b45309;">No Active Shift Float</span>
            <a [routerLink]="['/cash']" class="btn btn-warning" style="padding: 3px 10px; font-size: 11px; font-weight: 700;">
              Open Shift
            </a>
          </div>
        </div>

        <!-- Center / Right: Quick Actions (Parked Sales, Last Bill, Hotkeys) -->
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <!-- Parked / Held Sales Button -->
          <button (click)="openParkedSalesModal()" 
                  [class.btn-warning]="parkedSales.length > 0"
                  [class.btn-outline]="parkedSales.length === 0"
                  style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 12px; font-weight: 700; border-radius: 7px;">
            <lucide-icon name="pause" [size]="13"></lucide-icon>
            <span>Parked Sales</span>
            <span *ngIf="parkedSales.length > 0" style="padding: 1px 6px; background: #b45309; color: #ffffff; border-radius: 10px; font-size: 10.5px; margin-left: 2px;">
              {{ parkedSales.length }}
            </span>
            <span style="font-size: 10px; opacity: 0.7; margin-left: 4px;">[F8]</span>
          </button>

          <!-- Re-print Last Receipt Button -->
          <button *ngIf="lastCompletedReceipt" (click)="reprintLastReceipt()" 
                  class="btn btn-outline" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 12px; font-weight: 600; color: #475569;">
            <lucide-icon name="printer" [size]="13"></lucide-icon>
            <span>Last Bill ({{ lastCompletedReceipt.invoiceNumber }})</span>
            <span style="font-size: 10px; opacity: 0.7;">[F10]</span>
          </button>

          <!-- Hotkeys Help Button -->
          <button (click)="showShortcutsModal = true" class="btn btn-outline" style="display: inline-flex; align-items: center; gap: 5px; padding: 6px 10px; font-size: 12px; color: #64748b;" title="Keyboard shortcuts">
            <lucide-icon name="help-circle" [size]="13"></lucide-icon>
            <span>Hotkeys</span>
          </button>
        </div>
      </div>

      <!-- 2. MAIN POS WORKSPACE: DUAL PANE LAYOUT (Catalog Left, Cart Right) -->
      <div style="display: grid; grid-template-columns: 1fr 410px; gap: 16px; align-items: start;">
        
        <!-- LEFT PANE: CATALOG, BARCODE SCAN & SEARCH -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
          
          <!-- Search & Fast Barcode Action Bar -->
          <div class="card" style="padding: 12px 16px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <!-- Smart Search / Barcode input -->
              <div style="flex: 1; min-width: 260px; position: relative;">
                <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; top: 11px; color: #94a3b8; pointer-events: none;"></lucide-icon>
                <input #searchInput type="text" [(ngModel)]="searchQuery" (input)="onSearchInput()" (keydown.enter)="handleBarcodeEnter()"
                       class="form-control" style="padding-left: 36px; padding-right: 70px; height: 38px; font-size: 13.5px; font-weight: 600;" 
                       placeholder="Scan barcode or search medication, generic, formulation... [F2]" autofocus />
                <span style="position: absolute; right: 8px; top: 8px; font-size: 11px; background: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 4px; font-weight: 700; border: 1px solid #e2e8f0;">F2</span>
              </div>

              <!-- Customer Selector -->
              <div style="display: flex; align-items: center; gap: 6px; min-width: 200px;">
                <select [(ngModel)]="selectedCustomerId" (change)="onCustomerSelected()" class="form-control" style="height: 38px; font-size: 12.5px; font-weight: 600;">
                  <option [ngValue]="null">👤 Walk-in Patient</option>
                  <option *ngFor="let c of customers" [ngValue]="c.id">
                    {{ c.name }} ({{ c.phone || 'No phone' }})
                  </option>
                </select>
              </div>

              <!-- Price Tier -->
              <select [(ngModel)]="customerType" (change)="onCustomerTypeChange()" class="form-control" style="width: auto; height: 38px; font-size: 12.5px; font-weight: 600;">
                <option value="RETAIL">Retail Tier</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>

              <!-- View Switcher (Grid vs Table) -->
              <div style="display: flex; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #f8fafc;">
                <button (click)="viewMode = 'grid'" [class.active-view]="viewMode === 'grid'" class="view-btn" title="Touch Tiles Grid View">
                  <lucide-icon name="layout-grid" [size]="15"></lucide-icon>
                </button>
                <button (click)="viewMode = 'table'" [class.active-view]="viewMode === 'table'" class="view-btn" title="Clinical Dense Table View">
                  <lucide-icon name="list" [size]="15"></lucide-icon>
                </button>
              </div>
            </div>

            <!-- Category Pills & Stock Quick Filters -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; border-top: 1px solid #f1f5f9; padding-top: 8px; overflow-x: auto;">
              <!-- Category Pills -->
              <div style="display: flex; gap: 6px; align-items: center; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none;">
                <button *ngFor="let cat of availableCategories" 
                        (click)="selectCategory(cat)"
                        [class.active-category-pill]="selectedCategory === cat"
                        class="category-pill">
                  {{ cat }}
                </button>
              </div>

              <!-- Rx & Stock Toggle -->
              <div style="display: flex; gap: 6px; align-items: center; flex-shrink: 0;">
                <button (click)="toggleRxOnlyFilter()" 
                        [class.active-filter-badge]="filterRxOnly"
                        class="filter-badge" title="Filter prescription drugs">
                  Rx Only
                </button>
                <button (click)="toggleInStockFilter()" 
                        [class.active-filter-badge]="filterInStockOnly"
                        class="filter-badge" title="Filter in-stock drugs only">
                  In-Stock
                </button>
              </div>
            </div>
          </div>

          <!-- Catalog Products: GRID VIEW -->
          <div *ngIf="viewMode === 'grid'" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; max-height: calc(100vh - 275px); overflow-y: auto; padding-right: 4px;">
            <div *ngFor="let drug of filteredDrugs()" 
                 (click)="addToCart(drug)" 
                 class="drug-tile"
                 [class.drug-tile-out]="drug.totalStock <= 0">
              <div style="display: flex; flex-direction: column; height: 100%; justify-content: space-between;">
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; margin-bottom: 4px;">
                    <h4 style="font-size: 13.5px; font-weight: 800; color: #0f172a; line-height: 1.25; margin: 0;">
                      {{ drug.name }}
                    </h4>
                    <span [class]="getStockBadgeClass(drug.totalStock, drug.reorderThreshold)" style="font-size: 10.5px; padding: 2px 6px; border-radius: 5px; font-weight: 700; white-space: nowrap;">
                      {{ drug.totalStock }} {{ drug.unitOfMeasure || 'units' }}
                    </span>
                  </div>

                  <p style="font-size: 11.5px; color: #64748b; margin: 0; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;">
                    {{ drug.genericName || 'Standard Formulation' }}
                  </p>

                  <div style="display: flex; align-items: center; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
                    <span style="font-size: 10.5px; color: #0284c7; font-weight: 700; background: #e0f2fe; padding: 1px 6px; border-radius: 4px;">
                      {{ drug.dosageForm || 'Tab' }} {{ drug.strength ? '• ' + drug.strength : '' }}
                    </span>
                    <span *ngIf="drug.prescriptionRequired" style="font-size: 10px; font-weight: 800; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; border-radius: 4px; padding: 1px 5px;">
                      Rx
                    </span>
                  </div>
                </div>

                <div style="margin-top: 10px; border-top: 1px solid #f1f5f9; padding-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-size: 10px; color: #94a3b8; display: block; line-height: 1;">Unit Price</span>
                    <span style="font-size: 14.5px; font-weight: 800; color: #0f172a; font-family: 'JetBrains Mono', monospace;">
                      ETB {{ getPrice(drug) | number:'1.2-2' }}
                    </span>
                  </div>
                  <button [disabled]="drug.totalStock <= 0" 
                          class="btn btn-primary" 
                          style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px;">
                    <lucide-icon name="plus" [size]="12"></lucide-icon>
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="filteredDrugs().length === 0" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #64748b; background: #ffffff; border-radius: 12px; border: 1px dashed #cbd5e1;">
              <lucide-icon name="boxes" [size]="32" color="#94a3b8" style="margin-bottom: 8px;"></lucide-icon>
              <h4 style="font-size: 14px; font-weight: 700; color: #334155; margin: 0;">No medications match the search filters</h4>
              <p style="font-size: 12px; color: #94a3b8; margin: 4px 0 0;">Try adjusting your query or category selection.</p>
            </div>
          </div>

          <!-- Catalog Products: DENSE TABLE VIEW -->
          <div *ngIf="viewMode === 'table'" class="card" style="padding: 0; overflow: hidden; max-height: calc(100vh - 275px); display: flex; flex-direction: column;">
            <div class="table-responsive" style="overflow-y: auto;">
              <table class="data-table" style="margin: 0; font-size: 12.5px;">
                <thead style="position: sticky; top: 0; background: #f8fafc; z-index: 10;">
                  <tr>
                    <th style="padding: 8px 12px;">Medication & Formulation</th>
                    <th style="padding: 8px 12px;">Category</th>
                    <th style="padding: 8px 12px; text-align: center;">Stock</th>
                    <th style="padding: 8px 12px; text-align: right;">Unit Price</th>
                    <th style="padding: 8px 12px; text-align: center;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let drug of filteredDrugs()" (click)="addToCart(drug)" style="cursor: pointer;">
                    <td style="padding: 8px 12px;">
                      <div style="font-weight: 800; color: #0f172a;">{{ drug.name }}</div>
                      <div style="font-size: 11px; color: #64748b;">{{ drug.genericName }} • {{ drug.strength }} ({{ drug.dosageForm }})</div>
                    </td>
                    <td style="padding: 8px 12px; color: #475569; font-size: 11.5px;">
                      {{ drug.categoryName || 'General' }}
                    </td>
                    <td style="padding: 8px 12px; text-align: center;">
                      <span [class]="getStockBadgeClass(drug.totalStock, drug.reorderThreshold)" style="font-size: 11px; padding: 2px 7px; border-radius: 5px; font-weight: 700;">
                        {{ drug.totalStock }} {{ drug.unitOfMeasure }}
                      </span>
                    </td>
                    <td style="padding: 8px 12px; text-align: right; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: #0f172a;">
                      ETB {{ getPrice(drug) | number:'1.2-2' }}
                    </td>
                    <td style="padding: 8px 12px; text-align: center;">
                      <button [disabled]="drug.totalStock <= 0" class="btn btn-primary" style="padding: 3px 8px; font-size: 11px; font-weight: 700;">
                        + Add
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="filteredDrugs().length === 0">
                    <td colspan="5" style="text-align: center; padding: 30px; color: #64748b;">
                      No drugs match the filter.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- RIGHT PANE: THE POWER CART & QUICK TENDER PANEL -->
        <div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 12px; position: sticky; top: 75px; background: #ffffff; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.06); border-top: 3px solid #0284c7;">
          
          <!-- Cart Header Bar -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 28px; height: 28px; border-radius: 7px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center;">
                <lucide-icon name="shopping-cart" [size]="15"></lucide-icon>
              </div>
              <h3 style="font-size: 14.5px; font-weight: 800; color: #0f172a; margin: 0;">
                Cart ({{ cartTotalQuantity() }} units)
              </h3>
            </div>

            <div style="display: flex; align-items: center; gap: 6px;">
              <!-- Park Current Cart Button -->
              <button *ngIf="cart().length > 0" (click)="parkCurrentSale()" class="btn btn-outline" style="padding: 3px 8px; font-size: 11px; color: #b45309; border-color: #fde68a;" title="Hold this sale [F8]">
                <lucide-icon name="pause" [size]="11"></lucide-icon>
                <span>Hold</span>
              </button>
              
              <!-- Clear Cart -->
              <button *ngIf="cart().length > 0" (click)="clearCart()" class="btn btn-outline" style="padding: 3px 8px; font-size: 11px; color: #ef4444; border-color: #fecaca;" title="Clear entire cart">
                <lucide-icon name="trash-2" [size]="11"></lucide-icon>
                <span>Clear</span>
              </button>
            </div>
          </div>

          <!-- Cart Items Scrollable List -->
          <div style="display: flex; flex-direction: column; gap: 8px; max-height: calc(100vh - 460px); min-height: 180px; overflow-y: auto; padding-right: 2px;">
            <div *ngFor="let item of cart(); let idx = index" class="cart-item-row">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;">
                <div style="min-width: 0;">
                  <div style="font-size: 13px; font-weight: 800; color: #0f172a; line-height: 1.25;">
                    {{ item.drugName }}
                  </div>
                  <div style="font-size: 11px; color: #64748b; margin-top: 1px;">
                    {{ item.genericName }} • ETB {{ item.unitPrice | number:'1.2-2' }}/ea
                  </div>
                </div>
                <div style="text-align: right; flex-shrink: 0;">
                  <span style="font-family: 'JetBrains Mono', monospace; font-size: 13.5px; font-weight: 800; color: #0f172a;">
                    ETB {{ (item.unitPrice * item.quantity * (1 - (item.discountPercent || 0)/100)) | number:'1.2-2' }}
                  </span>
                </div>
              </div>

              <!-- Controls: Qty Stepper, Line Discount, Delete -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0;">
                <div style="display: flex; align-items: center; gap: 5px;">
                  <button (click)="changeQty(idx, -1)" class="qty-btn">-</button>
                  <input type="number" [(ngModel)]="item.quantity" (change)="onQtyInputChange(idx)" min="1" [max]="item.availableStock"
                         class="qty-input" />
                  <button (click)="changeQty(idx, 1)" class="qty-btn">+</button>
                  <span style="font-size: 10px; color: #94a3b8; margin-left: 2px;">max {{ item.availableStock }}</span>
                </div>

                <div style="display: flex; align-items: center; gap: 8px;">
                  <button (click)="removeItem(idx)" style="background: none; border: none; color: #ef4444; font-size: 11.5px; cursor: pointer; font-weight: 600; padding: 2px 4px;">
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty Cart Placeholder -->
            <div *ngIf="cart().length === 0" style="text-align: center; color: #94a3b8; padding: 40px 10px; font-size: 12.5px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
              <lucide-icon name="shopping-bag" [size]="28" color="#cbd5e1"></lucide-icon>
              <span>Scan medication barcode or click items to add to cart.</span>
            </div>
          </div>

          <!-- Rx Required Alert / Input Section -->
          <div *ngIf="hasPrescriptionItem()" style="padding: 10px 12px; border-radius: 8px; background: #fffbeb; border: 1px solid #fde68a; font-size: 12px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-weight: 700; color: #92400e; display: flex; align-items: center; gap: 5px;">
              <lucide-icon name="alert-triangle" [size]="13" color="#d97706"></lucide-icon>
              <span>Prescription Rx Required for 1+ items</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
              <input type="text" [(ngModel)]="prescriptionNumber" placeholder="Rx # e.g. RX-2026-99" class="form-control" style="padding: 4px 8px; font-size: 11.5px;" />
              <input type="text" [(ngModel)]="doctorName" placeholder="Prescribing Doctor" class="form-control" style="padding: 4px 8px; font-size: 11.5px;" />
            </div>
          </div>

          <!-- Totals Breakdown -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; flex-direction: column; gap: 5px;">
            <div style="display: flex; justify-content: space-between; font-size: 12.5px; color: #64748b;">
              <span>Subtotal:</span>
              <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #334155;">
                ETB {{ calculateSubtotal() | number:'1.2-2' }}
              </span>
            </div>

            <div *ngIf="orderDiscount > 0" style="display: flex; justify-content: space-between; font-size: 12.5px; color: #ef4444;">
              <span>Discount:</span>
              <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700;">
                - ETB {{ orderDiscount | number:'1.2-2' }}
              </span>
            </div>

            <!-- Grand Total -->
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 4px; padding-top: 6px; border-top: 1px solid #f1f5f9;">
              <span style="font-size: 14px; font-weight: 800; color: #0f172a;">Total Payable:</span>
              <span style="font-size: 22px; font-weight: 900; color: #0284c7; font-family: 'JetBrains Mono', monospace;">
                ETB {{ calculateGrandTotal() | number:'1.2-2' }}
              </span>
            </div>
          </div>

          <!-- ONE-TOUCH QUICK TENDER BAR -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 2px;">
            <button (click)="quickTender('CASH')" [disabled]="cart().length === 0" class="tender-btn" title="Exact Cash Checkout">
              <lucide-icon name="banknote" [size]="14"></lucide-icon>
              <span>Cash</span>
            </button>
            <button (click)="quickTender('MOBILE_MONEY')" [disabled]="cart().length === 0" class="tender-btn" title="Telebirr / CBE Birr">
              <lucide-icon name="smartphone" [size]="14"></lucide-icon>
              <span>Telebirr</span>
            </button>
            <button (click)="quickTender('CARD')" [disabled]="cart().length === 0" class="tender-btn" title="Card POS Terminal">
              <lucide-icon name="credit-card" [size]="14"></lucide-icon>
              <span>Card</span>
            </button>
            <button (click)="quickTender('CREDIT_ACCOUNT')" [disabled]="cart().length === 0 || !selectedCustomerId" class="tender-btn" title="On-Account Credit">
              <lucide-icon name="file-text" [size]="14"></lucide-icon>
              <span>Credit</span>
            </button>
          </div>

          <!-- PRIMARY CHECKOUT BUTTON -->
          <button [disabled]="cart().length === 0 || checkoutInProgress" 
                  (click)="openPaymentModal()" 
                  class="btn btn-success" 
                  style="width: 100%; padding: 12px; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 8px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
            <lucide-icon name="zap" [size]="16"></lucide-icon>
            <span>Proceed to Payment [F9]</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 1: PAYMENT & TENDER CHECKOUT -->
    <div *ngIf="showPaymentModal()" class="modal-overlay">
      <div class="card modal-content" style="width: 480px; max-width: 100%; padding: 22px; animation: modalFadeIn 0.15s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center;">
              <lucide-icon name="credit-card" [size]="18"></lucide-icon>
            </div>
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0;">Complete POS Checkout</h3>
              <p style="font-size: 11.5px; color: #64748b; margin: 1px 0 0;">{{ cartTotalQuantity() }} items in order</p>
            </div>
          </div>
          <button (click)="showPaymentModal.set(false)" class="btn-close">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Payment Method Radios -->
          <div>
            <label style="font-size: 11.5px; font-weight: 700; color: #475569; display: block; margin-bottom: 6px;">Payment Method</label>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
              <label class="pay-method-option" [class.selected-pay-method]="paymentMethod === 'CASH'">
                <input type="radio" [(ngModel)]="paymentMethod" value="CASH" name="payMethod" style="display: none;" />
                <lucide-icon name="banknote" [size]="16" color="#059669"></lucide-icon>
                <span>Cash Drawer</span>
              </label>
              <label class="pay-method-option" [class.selected-pay-method]="paymentMethod === 'MOBILE_MONEY'">
                <input type="radio" [(ngModel)]="paymentMethod" value="MOBILE_MONEY" name="payMethod" style="display: none;" />
                <lucide-icon name="smartphone" [size]="16" color="#0284c7"></lucide-icon>
                <span>Telebirr / CBE</span>
              </label>
              <label class="pay-method-option" [class.selected-pay-method]="paymentMethod === 'CARD'">
                <input type="radio" [(ngModel)]="paymentMethod" value="CARD" name="payMethod" style="display: none;" />
                <lucide-icon name="credit-card" [size]="16" color="#8b5cf6"></lucide-icon>
                <span>POS Card Terminal</span>
              </label>
              <label class="pay-method-option" [class.selected-pay-method]="paymentMethod === 'CREDIT_ACCOUNT'">
                <input type="radio" [(ngModel)]="paymentMethod" value="CREDIT_ACCOUNT" name="payMethod" style="display: none;" />
                <lucide-icon name="file-text" [size]="16" color="#d97706"></lucide-icon>
                <span>Customer Credit</span>
              </label>
            </div>
          </div>

          <!-- Total Due Box -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; font-weight: 600; color: #475569;">Total Due:</span>
            <span style="font-size: 20px; font-weight: 900; color: #0f172a; font-family: 'JetBrains Mono', monospace;">
              ETB {{ calculateGrandTotal() | number:'1.2-2' }}
            </span>
          </div>

          <!-- Paid Amount Input with Quick Cash Chips -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
              <label style="font-size: 11.5px; font-weight: 700; color: #475569;">Amount Tendered / Paid (ETB) *</label>
              <span *ngIf="paymentMethod === 'CASH' && paidAmount > calculateGrandTotal()" style="font-size: 12px; font-weight: 800; color: #059669;">
                Change: ETB {{ (paidAmount - calculateGrandTotal()) | number:'1.2-2' }}
              </span>
            </div>
            <input #paidInput type="number" [(ngModel)]="paidAmount" min="0" step="10" 
                   class="form-control" style="font-size: 22px; font-weight: 900; height: 46px; font-family: 'JetBrains Mono', monospace;" />

            <!-- Quick Cash Chips -->
            <div *ngIf="paymentMethod === 'CASH'" style="display: flex; gap: 6px; align-items: center; margin-top: 8px; flex-wrap: wrap;">
              <span style="font-size: 11px; font-weight: 700; color: #94a3b8;">Preset:</span>
              <button *ngFor="let note of [100, 200, 500, 1000, 2000]" (click)="paidAmount = note" class="btn btn-outline" style="padding: 2px 8px; font-size: 11px; font-weight: 700;">
                {{ note }}
              </button>
              <button (click)="paidAmount = calculateGrandTotal()" class="btn btn-outline" style="padding: 2px 8px; font-size: 11px; color: #0284c7; font-weight: 800;">
                Exact [F12]
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div style="display: flex; gap: 10px; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            <button type="button" (click)="showPaymentModal.set(false)" class="btn btn-outline" style="flex: 1;">Cancel [Esc]</button>
            <button type="button" (click)="finalizeCheckout()" [disabled]="checkoutInProgress" class="btn btn-primary" style="flex: 2; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
              <lucide-icon name="check-circle-2" [size]="16"></lucide-icon>
              <span>{{ checkoutInProgress ? 'Processing...' : 'Confirm & Print [Enter]' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 2: PARKED (HELD) SALES MANAGER -->
    <div *ngIf="showParkedModal" class="modal-overlay">
      <div class="card modal-content" style="width: 520px; max-width: 100%; padding: 22px; animation: modalFadeIn 0.15s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center;">
              <lucide-icon name="pause" [size]="18"></lucide-icon>
            </div>
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0;">Parked (Held) Sales Queue</h3>
              <p style="font-size: 11.5px; color: #64748b; margin: 1px 0 0;">{{ parkedSales.length }} sales currently held</p>
            </div>
          </div>
          <button (click)="showParkedModal = false" class="btn-close">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; max-height: 340px; overflow-y: auto;">
          <div *ngFor="let ps of parkedSales; let pIdx = index" 
               style="padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
            <div>
              <div style="font-weight: 800; color: #0f172a; font-size: 13.5px;">{{ ps.customerName }}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                {{ ps.items.length }} line items • Held at {{ ps.parkedAt | date:'shortTime' }}
              </div>
              <div style="font-size: 13px; font-weight: 800; color: #0284c7; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">
                ETB {{ ps.subtotal | number:'1.2-2' }}
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 6px;">
              <button (click)="recallParkedSale(pIdx)" class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                <lucide-icon name="play" [size]="12"></lucide-icon>
                <span>Resume</span>
              </button>
              <button (click)="deleteParkedSale(pIdx)" class="btn btn-outline" style="padding: 6px 8px; font-size: 12px; color: #ef4444;" title="Discard held sale">
                <lucide-icon name="trash-2" [size]="13"></lucide-icon>
              </button>
            </div>
          </div>

          <div *ngIf="parkedSales.length === 0" style="text-align: center; padding: 30px; color: #94a3b8; font-size: 13px;">
            No held sales at this moment.
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
          <button (click)="showParkedModal = false" class="btn btn-outline">Close</button>
        </div>
      </div>
    </div>

    <!-- MODAL 3: CHECKOUT SUCCESS & RECEIPT ACTIONS -->
    <div *ngIf="showSuccessModal" class="modal-overlay">
      <div class="card modal-content" style="width: 440px; max-width: 100%; padding: 24px; text-align: center; animation: modalFadeIn 0.15s ease;">
        <div style="width: 56px; height: 56px; border-radius: 16px; background: #dcfce7; color: #16a34a; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
          <lucide-icon name="check-circle" [size]="30"></lucide-icon>
        </div>

        <h3 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px;">Sale Completed Successfully!</h3>
        <p style="font-size: 13px; color: #64748b; margin: 0 0 16px;">
          Invoice: <strong style="color: #0f172a; font-family: 'JetBrains Mono', monospace;">{{ lastCompletedReceipt?.invoiceNumber }}</strong>
        </p>

        <div style="background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; padding: 14px; margin-bottom: 18px; display: flex; flex-direction: column; gap: 6px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Total Amount:</span>
            <strong style="font-family: 'JetBrains Mono', monospace;">ETB {{ lastCompletedReceipt?.totalAmount | number:'1.2-2' }}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Paid ({{ lastCompletedReceipt?.paymentMethod }}):</span>
            <strong style="font-family: 'JetBrains Mono', monospace;">ETB {{ lastCompletedReceipt?.paidAmount | number:'1.2-2' }}</strong>
          </div>
          <div *ngIf="(lastCompletedReceipt?.changeDue || 0) > 0" style="display: flex; justify-content: space-between; color: #16a34a; font-weight: 800; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <span>Change Due:</span>
            <span style="font-family: 'JetBrains Mono', monospace;">ETB {{ lastCompletedReceipt?.changeDue | number:'1.2-2' }}</span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; gap: 8px;">
            <button (click)="printThermal()" class="btn btn-primary" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px;">
              <lucide-icon name="printer" [size]="15"></lucide-icon>
              <span>Thermal Receipt</span>
            </button>
            <button (click)="printA4()" class="btn btn-outline" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px;">
              <lucide-icon name="file-text" [size]="15"></lucide-icon>
              <span>A4 Invoice</span>
            </button>
          </div>
          <button (click)="startNewSale()" class="btn btn-outline" style="width: 100%; padding: 10px; font-weight: 700; color: #0284c7; border-color: #bae6fd;">
            Start Next Sale (Enter / Space)
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 4: KEYBOARD SHORTCUTS CHEAT SHEET -->
    <div *ngIf="showShortcutsModal" class="modal-overlay">
      <div class="card modal-content" style="width: 440px; max-width: 100%; padding: 22px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
          <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0;">POS Keyboard Shortcuts</h3>
          <button (click)="showShortcutsModal = false" class="btn-close">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12.5px;">
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
            <span style="color: #475569;">Focus Barcode / Drug Search</span>
            <kbd class="kbd-badge">F2</kbd>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
            <span style="color: #475569;">Park / Hold Current Sale</span>
            <kbd class="kbd-badge">F8</kbd>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
            <span style="color: #475569;">Proceed to Checkout / Tender</span>
            <kbd class="kbd-badge">F9</kbd>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
            <span style="color: #475569;">Reprint Last Bill / Receipt</span>
            <kbd class="kbd-badge">F10</kbd>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
            <span style="color: #475569;">Quick Exact Cash Tender</span>
            <kbd class="kbd-badge">F12</kbd>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0;">
            <span style="color: #475569;">Close Active Modal / Clear Input</span>
            <kbd class="kbd-badge">Esc</kbd>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
          <button (click)="showShortcutsModal = false" class="btn btn-primary" style="padding: 6px 14px;">Got It</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .drug-tile {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .drug-tile:hover {
      border-color: #0284c7;
      box-shadow: 0 4px 12px -2px rgba(2, 132, 199, 0.15);
      transform: translateY(-1px);
    }
    .drug-tile-out {
      opacity: 0.55;
      background: #f8fafc;
      cursor: not-allowed;
    }
    .view-btn {
      padding: 6px 10px;
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .active-view {
      background: #0284c7 !important;
      color: #ffffff !important;
    }
    .category-pill {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11.5px;
      font-weight: 600;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .category-pill:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .active-category-pill {
      background: #0284c7 !important;
      color: #ffffff !important;
      border-color: #0284c7 !important;
      font-weight: 700;
    }
    .filter-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      background: #f8fafc;
      color: #64748b;
      border: 1px solid #cbd5e1;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .active-filter-badge {
      background: #e0f2fe !important;
      color: #0284c7 !important;
      border-color: #38bdf8 !important;
    }
    .cart-item-row {
      padding: 9px 10px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .qty-btn {
      width: 24px;
      height: 24px;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      background: #ffffff;
      color: #0f172a;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
    }
    .qty-btn:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    .qty-input {
      width: 36px;
      height: 24px;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      text-align: center;
      font-weight: 800;
      font-size: 12.5px;
      font-family: 'JetBrains Mono', monospace;
      padding: 0;
    }
    .tender-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 8px 4px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 7px;
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .tender-btn:hover:not(:disabled) {
      background: #e0f2fe;
      color: #0284c7;
      border-color: #38bdf8;
    }
    .tender-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .pay-method-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12.5px;
      font-weight: 700;
      color: #334155;
      transition: all 0.15s ease;
    }
    .pay-method-option:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    .selected-pay-method {
      background: #f0fdf4 !important;
      border-color: #22c55e !important;
      color: #15803d !important;
    }
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
    .btn-close {
      background: none;
      border: none;
      cursor: pointer;
      color: #64748b;
      font-size: 16px;
      padding: 4px;
    }
    .kbd-badge {
      font-family: 'JetBrains Mono', monospace;
      padding: 2px 6px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class PosComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('paidInput') paidInput!: ElementRef<HTMLInputElement>;

  searchQuery = '';
  customerType = 'RETAIL';
  selectedCustomerId: number | null = null;
  paymentMethod = 'CASH';
  paidAmount = 0;
  orderDiscount = 0;
  prescriptionNumber = '';
  doctorName = '';

  viewMode: 'grid' | 'table' = 'grid';
  selectedCategory = 'All';
  filterRxOnly = false;
  filterInStockOnly = false;

  activeShift: any = null;
  customers: any[] = [];
  drugs = signal<any[]>([]);
  cart = signal<CartItem[]>([]);
  parkedSales: ParkedSale[] = [];
  lastCompletedReceipt: any = null;

  showPaymentModal = signal(false);
  showParkedModal = false;
  showSuccessModal = false;
  showShortcutsModal = false;
  checkoutInProgress = false;

  availableCategories: string[] = ['All', 'Antibiotics', 'Analgesics & Antipyretics', 'Cough & Cold', 'Vitamins & Supplements', 'Cardiovascular', 'Topical', 'Prescription'];

  cartTotalQuantity = computed(() => {
    return this.cart().reduce((sum, item) => sum + item.quantity, 0);
  });

  filteredDrugs = computed(() => {
    let list = this.drugs();

    if (this.selectedCategory !== 'All') {
      list = list.filter(d => d.categoryName?.toLowerCase().includes(this.selectedCategory.toLowerCase()) || d.category?.name?.toLowerCase().includes(this.selectedCategory.toLowerCase()));
    }

    if (this.filterRxOnly) {
      list = list.filter(d => d.prescriptionRequired);
    }

    if (this.filterInStockOnly) {
      list = list.filter(d => d.totalStock > 0);
    }

    return list;
  });

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private printService: PrintService,
    private validationService: ValidationService,
    public settingsService: SettingsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.checkActiveShift();
    this.loadCustomers();
    this.loadCategories();
    this.searchDrugs();

    this.route.queryParams.subscribe(params => {
      if (params['customerId']) {
        this.selectedCustomerId = Number(params['customerId']);
        this.onCustomerSelected();
      }
    });
  }

  ngOnDestroy(): void {}

  // ==================== KEYBOARD SHORTCUTS ENGINE ====================
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    // F2: Focus Search / Scan
    if (event.key === 'F2') {
      event.preventDefault();
      this.focusSearch();
      return;
    }

    // F8: Park Sale
    if (event.key === 'F8') {
      event.preventDefault();
      if (this.cart().length > 0) {
        this.parkCurrentSale();
      } else if (this.parkedSales.length > 0) {
        this.openParkedSalesModal();
      }
      return;
    }

    // F9: Open Payment Checkout
    if (event.key === 'F9') {
      event.preventDefault();
      if (this.cart().length > 0) {
        this.openPaymentModal();
      }
      return;
    }

    // F10: Reprint Last Bill
    if (event.key === 'F10') {
      event.preventDefault();
      if (this.lastCompletedReceipt) {
        this.reprintLastReceipt();
      }
      return;
    }

    // F12: Exact Cash Tender
    if (event.key === 'F12') {
      event.preventDefault();
      if (this.cart().length > 0) {
        this.quickTender('CASH');
      }
      return;
    }

    // Escape: Close any open modal
    if (event.key === 'Escape') {
      if (this.showPaymentModal()) this.showPaymentModal.set(false);
      if (this.showParkedModal) this.showParkedModal = false;
      if (this.showSuccessModal) this.showSuccessModal = false;
      if (this.showShortcutsModal) this.showShortcutsModal = false;
      return;
    }

    // Enter while Success Modal is active starts a new sale
    if (this.showSuccessModal && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.startNewSale();
    }
  }

  focusSearch(): void {
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
        this.searchInput.nativeElement.select();
      }
    }, 50);
  }

  // ==================== DATA LOADING ====================
  checkActiveShift(): void {
    this.http.get<any>(`${environment.apiUrl}/cash/shifts/current`).subscribe({
      next: (res) => this.activeShift = res.data,
      error: () => this.activeShift = null
    });
  }

  loadCustomers(): void {
    this.http.get<any>(`${environment.apiUrl}/customers`).subscribe({
      next: (res) => {
        this.customers = res.data || [];
        if (this.selectedCustomerId) {
          this.onCustomerSelected();
        }
      }
    });
  }

  loadCategories(): void {
    this.http.get<any>(`${environment.apiUrl}/categories`).subscribe({
      next: (res) => {
        if (res.data && Array.isArray(res.data)) {
          const names = res.data.map((c: any) => c.name);
          this.availableCategories = ['All', ...names.slice(0, 8)];
        }
      },
      error: () => {}
    });
  }

  searchDrugs(): void {
    this.http.get<any>(`${environment.apiUrl}/drugs?query=${this.searchQuery}&size=60`).subscribe({
      next: (res) => {
        this.drugs.set(res.data?.content || []);
      }
    });
  }

  onSearchInput(): void {
    this.searchDrugs();
  }

  handleBarcodeEnter(): void {
    const raw = this.searchQuery.trim();
    if (!raw) return;

    // Check exact barcode match first
    const match = this.drugs().find(d => d.barcode === raw || d.name.toLowerCase() === raw.toLowerCase());
    if (match) {
      this.addToCart(match);
      this.searchQuery = '';
      this.searchDrugs();
    }
  }

  selectCategory(cat: string): void {
    this.selectedCategory = cat;
  }

  toggleRxOnlyFilter(): void {
    this.filterRxOnly = !this.filterRxOnly;
  }

  toggleInStockFilter(): void {
    this.filterInStockOnly = !this.filterInStockOnly;
  }

  // ==================== CUSTOMER & PRICING ====================
  onCustomerSelected(): void {
    if (this.selectedCustomerId) {
      const found = this.customers.find(c => Number(c.id) === Number(this.selectedCustomerId));
      if (found) {
        this.customerType = found.customerType || 'RETAIL';
      }
    } else {
      this.customerType = 'RETAIL';
    }
    this.recalculateCartPrices();
  }

  onCustomerTypeChange(): void {
    this.recalculateCartPrices();
  }

  getPrice(drug: any): number {
    if (this.customerType === 'WHOLESALE' && drug.wholesalePrice > 0) {
      return Number(drug.wholesalePrice);
    }
    if (this.customerType === 'DISTRIBUTOR' && drug.distributorPrice > 0) {
      return Number(drug.distributorPrice);
    }
    if (drug.retailPrice > 0) {
      return Number(drug.retailPrice);
    }
    // Fallback seed calculation
    if (drug.name?.includes('Panadol')) return 55;
    if (drug.name?.includes('Zithromax')) return 450;
    return 250;
  }

  recalculateCartPrices(): void {
    const current = this.cart();
    const updated = current.map(item => {
      const drug = this.drugs().find(d => d.id === item.drugId);
      if (drug) {
        item.unitPrice = this.getPrice(drug);
      }
      return item;
    });
    this.cart.set([...updated]);
  }

  getStockBadgeClass(totalStock: number, reorderThreshold: number): string {
    if (totalStock <= 0) return 'badge badge-danger';
    if (totalStock <= (reorderThreshold || 20)) return 'badge badge-warning';
    return 'badge badge-success';
  }

  // ==================== CART ACTIONS ====================
  addToCart(drug: any): void {
    if (drug.totalStock <= 0) {
      this.notificationService.error(`${drug.name} is currently Out of Stock!`);
      return;
    }

    const current = this.cart();
    const existingIndex = current.findIndex(i => i.drugId === drug.id);
    const price = this.getPrice(drug);

    if (existingIndex > -1) {
      if (current[existingIndex].quantity + 1 > drug.totalStock) {
        this.notificationService.warning(`Cannot add more than available stock (${drug.totalStock})!`);
        return;
      }
      current[existingIndex].quantity += 1;
      this.cart.set([...current]);
    } else {
      this.cart.set([...current, {
        drugId: drug.id,
        drugName: drug.name,
        genericName: drug.genericName,
        dosageForm: drug.dosageForm,
        strength: drug.strength,
        quantity: 1,
        unitPrice: price,
        availableStock: drug.totalStock,
        discountPercent: 0,
        prescriptionRequired: drug.prescriptionRequired
      }]);
    }
  }

  changeQty(index: number, delta: number): void {
    const current = this.cart();
    const newQty = current[index].quantity + delta;
    if (newQty <= 0) {
      this.removeItem(index);
    } else if (newQty > current[index].availableStock) {
      this.notificationService.warning(`Requested quantity exceeds on-hand stock (${current[index].availableStock})!`);
    } else {
      current[index].quantity = newQty;
      this.cart.set([...current]);
    }
  }

  onQtyInputChange(index: number): void {
    const current = this.cart();
    if (current[index].quantity <= 0) {
      this.removeItem(index);
    } else if (current[index].quantity > current[index].availableStock) {
      current[index].quantity = current[index].availableStock;
      this.notificationService.warning(`Adjusted to maximum available stock (${current[index].availableStock})`);
      this.cart.set([...current]);
    }
  }

  removeItem(index: number): void {
    const current = this.cart();
    current.splice(index, 1);
    this.cart.set([...current]);
  }

  clearCart(): void {
    this.cart.set([]);
    this.prescriptionNumber = '';
    this.doctorName = '';
  }

  hasPrescriptionItem(): boolean {
    return this.cart().some(i => i.prescriptionRequired);
  }

  calculateSubtotal(): number {
    return this.cart().reduce((sum, item) => {
      const lineTotal = item.unitPrice * item.quantity * (1 - (item.discountPercent || 0) / 100);
      return sum + lineTotal;
    }, 0);
  }

  calculateGrandTotal(): number {
    const sub = this.calculateSubtotal();
    return Math.max(0, sub - this.orderDiscount);
  }

  // ==================== PARK / HOLD SALES ====================
  parkCurrentSale(): void {
    if (this.cart().length === 0) return;

    let custName = 'Walk-in Patient';
    if (this.selectedCustomerId) {
      const c = this.customers.find(x => x.id === this.selectedCustomerId);
      if (c) custName = c.name;
    }

    const parked: ParkedSale = {
      id: 'PARK-' + Date.now(),
      parkedAt: new Date(),
      customerName: custName,
      customerId: this.selectedCustomerId,
      customerType: this.customerType,
      items: [...this.cart()],
      subtotal: this.calculateGrandTotal()
    };

    this.parkedSales.unshift(parked);
    this.clearCart();
    this.notificationService.info(`Sale for "${custName}" parked. Order saved.`);
  }

  openParkedSalesModal(): void {
    this.showParkedModal = true;
  }

  recallParkedSale(index: number): void {
    const sale = this.parkedSales[index];
    this.cart.set([...sale.items]);
    this.selectedCustomerId = sale.customerId;
    this.customerType = sale.customerType;
    this.parkedSales.splice(index, 1);
    this.showParkedModal = false;
    this.notificationService.success(`Resumed held sale for "${sale.customerName}".`);
  }

  deleteParkedSale(index: number): void {
    this.parkedSales.splice(index, 1);
    this.notificationService.info('Held sale removed from queue.');
  }

  // ==================== CHECKOUT & TENDER ====================
  quickTender(method: string): void {
    this.paymentMethod = method;
    this.paidAmount = this.calculateGrandTotal();
    this.openPaymentModal();
  }

  openPaymentModal(): void {
    this.paidAmount = this.calculateGrandTotal();
    this.showPaymentModal.set(true);
    setTimeout(() => {
      if (this.paidInput) {
        this.paidInput.nativeElement.focus();
        this.paidInput.nativeElement.select();
      }
    }, 100);
  }

  finalizeCheckout(): void {
    if (this.cart().length === 0) {
      this.notificationService.warning('Cart is empty.');
      return;
    }

    if (this.settingsService.systemSettings()?.requireShiftOpen && !this.activeShift) {
      this.notificationService.error('Active Cash Shift is required by pharmacy policy before completing sales. Please open a shift in Cash Management.');
      return;
    }

    const total = this.calculateGrandTotal();
    if (!this.validationService.isPositiveNumber(this.paidAmount, true)) {
      this.notificationService.warning('Paid amount must be a non-negative number.');
      return;
    }

    if (this.paymentMethod === 'CASH' && this.paidAmount < total) {
      this.notificationService.warning(`Paid amount (ETB ${this.paidAmount}) is less than total sale amount (ETB ${total}).`);
      return;
    }

    this.checkoutInProgress = true;

    const payload = {
      customerId: this.selectedCustomerId,
      saleType: this.customerType,
      paymentMethod: this.paymentMethod,
      paidAmount: this.paidAmount,
      overallDiscount: this.orderDiscount,
      prescriptionNumber: this.prescriptionNumber,
      doctorName: this.doctorName,
      items: this.cart().map(item => ({
        drugId: item.drugId,
        quantity: item.quantity,
        customUnitPrice: item.unitPrice,
        discountAmount: (item.unitPrice * item.quantity * (item.discountPercent || 0)) / 100
      }))
    };

    this.http.post<any>(`${environment.apiUrl}/pos/checkout`, payload).subscribe({
      next: (res) => {
        this.checkoutInProgress = false;
        this.showPaymentModal.set(false);
        this.lastCompletedReceipt = res.data;
        this.showSuccessModal = true;
        this.cart.set([]);
        this.orderDiscount = 0;
        this.prescriptionNumber = '';
        this.doctorName = '';
        this.searchDrugs();
        this.checkActiveShift();
        this.notificationService.success(`Checkout completed! Invoice: ${res.data.invoiceNumber}`);

        if (this.settingsService.systemSettings()?.autoPrintReceipt) {
          const printer = this.settingsService.systemSettings()?.receiptPrinter;
          if (printer && printer.includes('THERMAL')) {
            this.printThermal();
          } else {
            this.printA4();
          }
        }
      },
      error: (err) => {
        this.checkoutInProgress = false;
        this.notificationService.error(err.error?.message || 'Checkout failed');
      }
    });
  }

  startNewSale(): void {
    this.showSuccessModal = false;
    this.focusSearch();
  }

  printThermal(): void {
    if (this.lastCompletedReceipt) {
      this.printService.printThermalReceipt(this.lastCompletedReceipt);
    }
  }

  printA4(): void {
    if (this.lastCompletedReceipt) {
      this.printService.printA4Invoice(this.lastCompletedReceipt);
    }
  }

  reprintLastReceipt(): void {
    if (this.lastCompletedReceipt) {
      this.printThermal();
    }
  }
}
