import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { ValidationService } from '../../core/services/validation.service';
import { environment } from '../../../environments/environment';
import { PaginationComponent, PaginatePipe } from '../../shared';

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  taxNumber: string;
  address?: string;
  paymentTermsDays: number;
}

export interface PurchaseOrderItem {
  id?: number;
  drug?: {
    id: number;
    name: string;
    genericName?: string;
    dosageForm?: string;
    strength?: string;
    unitOfMeasure?: string;
    barcode?: string;
  };
  batchNumber?: string;
  expiryDate?: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplier?: Supplier;
  orderDate: string;
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED';
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  items?: PurchaseOrderItem[];
  createdAt?: string;
}

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent, PaginatePipe],
  template: `
    <div style="display: flex; flex-direction: column; gap: 18px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: var(--slate-900);">Procurement & Goods Received (GRN)</h1>
          <p style="font-size: 13px; color: var(--slate-500); margin-top: 2px;">
            Supplier purchase orders, itemized medication receiving, automated FEFO batch intake, and audit trail.
          </p>
        </div>

        <div style="display: flex; gap: 8px;">
          <button (click)="openSupplierModal()" class="btn btn-outline" style="display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon name="building-2" [size]="15"></lucide-icon> New Vendor
          </button>
          <button (click)="openCreatePoModal()" class="btn btn-primary" style="box-shadow: var(--shadow); display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon name="plus" [size]="15"></lucide-icon> Create Purchase Order
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
        <div class="card" style="border-left: 4px solid #0284c7; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Total POs Issued</span>
            <lucide-icon name="package" [size]="18" color="#0284c7"></lucide-icon>
          </div>
          <div style="font-size: 24px; font-weight: 800; color: var(--slate-900); margin: 6px 0 2px;">
            {{ orders().length }} Orders
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Historical procurement volume
          </div>
        </div>

        <div class="card" style="border-left: 4px solid #f59e0b; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Pending GRN Receiving</span>
            <lucide-icon name="truck" [size]="18" color="#d97706"></lucide-icon>
          </div>
          <div style="font-size: 24px; font-weight: 800; color: #d97706; margin: 6px 0 2px;">
            {{ getPendingOrdersCount() }} Shipments
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Awaiting physical warehouse delivery
          </div>
        </div>

        <div class="card" style="border-left: 4px solid #10b981; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Certified Vendors</span>
            <lucide-icon name="building-2" [size]="18" color="#059669"></lucide-icon>
          </div>
          <div style="font-size: 24px; font-weight: 800; color: #059669; margin: 6px 0 2px;">
            {{ suppliers().length }} Suppliers
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Authorized pharmaceutical partners
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div style="display: flex; gap: 8px; border-bottom: 2px solid var(--slate-200); padding-bottom: 8px; flex-wrap: wrap;">
        <button (click)="activeTab = 'orders'"
                [style.background]="activeTab === 'orders' ? '#0284c7' : 'transparent'"
                [style.color]="activeTab === 'orders' ? '#fff' : 'var(--slate-600)'"
                class="btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="package" [size]="15"></lucide-icon> Purchase Orders & GRN Receiving ({{ orders().length }})
        </button>

        <button (click)="activeTab = 'suppliers'"
                [style.background]="activeTab === 'suppliers' ? '#0284c7' : 'transparent'"
                [style.color]="activeTab === 'suppliers' ? '#fff' : 'var(--slate-600)'"
                class="btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="building-2" [size]="15"></lucide-icon> Suppliers Directory ({{ suppliers().length }})
        </button>
      </div>

      <!-- TAB 1: Orders & Goods Received Notes -->
      <div *ngIf="activeTab === 'orders'" style="display: flex; flex-direction: column; gap: 14px;">
        <!-- Filters Toolbar -->
        <div class="card" style="padding: 12px 16px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 260px; position: relative;">
            <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
            <input type="text" [(ngModel)]="orderSearchQuery" (input)="orderPage.set(1)"
                   class="form-control" style="padding-left: 36px;" placeholder="Search PO #, supplier, or purchased medication name..." />
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <select [(ngModel)]="orderStatusFilter" (change)="orderPage.set(1)" aria-label="Filter purchase orders by status" class="form-control" style="width: auto; min-width: 170px;">
              <option value="">All PO Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ORDERED">Ordered / Pending GRN</option>
              <option value="RECEIVED">Received & Stocked</option>
            </select>
            <button (click)="resetOrderFilters()" class="btn btn-outline" style="padding: 8px 12px; display: inline-flex; align-items: center; gap: 4px;">
              <lucide-icon name="rotate-ccw" [size]="13"></lucide-icon> Reset
            </button>
          </div>
        </div>

        <!-- Orders Table with Itemized Product Breakdown -->
        <div class="card" style="padding: 0; overflow: hidden;">
          <app-pagination
            [totalItems]="filteredOrders().length"
            [pageSize]="orderPageSize()"
            [currentPage]="orderPage()"
            (pageChange)="orderPage.set($event)"
            (pageSizeChange)="orderPageSize.set($event); orderPage.set(1)">
          </app-pagination>
          
          <div class="table-responsive">
            <table class="data-table" style="margin: 0;">
              <thead>
                <tr>
                  <th style="width: 40px; padding: 10px 8px; text-align: center;"></th>
                  <th style="padding: 10px 14px;">PO / GRN Number</th>
                  <th style="padding: 10px 14px;">Supplier / Vendor</th>
                  <th style="padding: 10px 14px;">Purchased Item(s) Detail</th>
                  <th style="padding: 10px 14px;">Order Date</th>
                  <th style="padding: 10px 14px; text-align: right;">Total Cost (ETB)</th>
                  <th style="padding: 10px 14px; text-align: center;">Status</th>
                  <th style="padding: 10px 14px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <ng-container *ngFor="let po of (filteredOrders() | paginate: orderPage() : orderPageSize())">
                  <!-- Main PO Row -->
                  <tr style="border-bottom: 1px solid #f1f5f9; cursor: pointer;" 
                      [style.background]="expandedPoId === po.id ? '#f8fafc' : 'transparent'"
                      (click)="toggleExpandRow(po.id)">
                    <!-- Chevron expand icon -->
                    <td style="padding: 10px 8px; text-align: center; color: #64748b;">
                      <lucide-icon [name]="expandedPoId === po.id ? 'chevron-down' : 'chevron-right'" [size]="15"></lucide-icon>
                    </td>

                    <!-- PO Number -->
                    <td style="padding: 10px 14px;">
                      <div style="font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #0284c7;">
                        {{ po.poNumber }}
                      </div>
                      <div *ngIf="po.notes" style="font-size: 11px; color: #64748b; margin-top: 1px;">
                        {{ po.notes }}
                      </div>
                    </td>

                    <!-- Supplier -->
                    <td style="padding: 10px 14px;">
                      <div style="font-weight: 700; color: #0f172a;">{{ po.supplier?.name || 'Authorized Vendor' }}</div>
                      <div style="font-size: 11px; color: #64748b;">{{ po.supplier?.phone || po.supplier?.taxNumber || 'Vendor Partner' }}</div>
                    </td>

                    <!-- Purchased Medications Summary -->
                    <td style="padding: 10px 14px;">
                      <div style="display: flex; flex-direction: column; gap: 4px;">
                        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                          <span *ngFor="let item of (po.items || []).slice(0, 2)" 
                                class="item-pill">
                            <lucide-icon name="pill" [size]="11" color="#0284c7"></lucide-icon>
                            <strong>{{ item.drug?.name || 'Medication' }}</strong>
                            <span style="color: #64748b;">({{ item.quantityOrdered }}x)</span>
                          </span>

                          <span *ngIf="(po.items || []).length > 2" 
                                style="font-size: 11px; color: #0284c7; font-weight: 700; background: #e0f2fe; padding: 2px 7px; border-radius: 6px;">
                            +{{ (po.items || []).length - 2 }} more
                          </span>

                          <span *ngIf="!po.items || po.items.length === 0" style="color: #94a3b8; font-size: 11.5px;">
                            Standard batch intake
                          </span>
                        </div>
                      </div>
                    </td>

                    <!-- Order Date -->
                    <td style="padding: 10px 14px; color: #475569; font-size: 12.5px;">
                      {{ po.orderDate | date:'mediumDate' }}
                    </td>

                    <!-- Total Amount -->
                    <td style="padding: 10px 14px; text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #0f172a; font-size: 13.5px;">
                      ETB {{ po.totalAmount | number:'1.2-2' }}
                    </td>

                    <!-- Status -->
                    <td style="padding: 10px 14px; text-align: center;">
                      <span [class]="po.status === 'RECEIVED' ? 'badge badge-success' : 'badge badge-warning'" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px;">
                        <lucide-icon [name]="po.status === 'RECEIVED' ? 'check-circle' : 'clock'" [size]="12"></lucide-icon>
                        {{ po.status === 'RECEIVED' ? 'Received & Stocked' : 'Ordered / Pending' }}
                      </span>
                    </td>

                    <!-- Actions -->
                    <td style="padding: 10px 14px; text-align: right;" (click)="$event.stopPropagation()">
                      <div style="display: inline-flex; align-items: center; gap: 5px;">
                        <button (click)="viewPoDetails(po)" class="btn btn-outline" style="padding: 4px 7px; font-size: 11.5px; display: inline-flex; align-items: center; gap: 3px;" title="View items & details">
                          <lucide-icon name="eye" [size]="12"></lucide-icon>
                          <span>View</span>
                        </button>
                        
                        <button *ngIf="po.status !== 'RECEIVED'" (click)="openEditPoModal(po)" class="btn btn-outline" style="padding: 4px 7px; font-size: 11.5px; display: inline-flex; align-items: center; gap: 3px; color: #0284c7; border-color: #bae6fd;" title="Edit Purchase Order">
                          <lucide-icon name="edit" [size]="12"></lucide-icon>
                          <span>Edit</span>
                        </button>

                        <button *ngIf="po.status !== 'RECEIVED'" (click)="receiveGoods(po.id)" class="btn btn-success" style="padding: 4px 9px; font-size: 11.5px; display: inline-flex; align-items: center; gap: 4px; font-weight: 700;" title="Receive GRN into inventory">
                          <lucide-icon name="package-check" [size]="12"></lucide-icon>
                          <span>Receive</span>
                        </button>

                        <button *ngIf="po.status !== 'RECEIVED'" (click)="deletePurchaseOrder(po)" class="btn btn-outline" style="padding: 4px 6px; font-size: 11.5px; display: inline-flex; align-items: center; color: #ef4444; border-color: #fecaca;" title="Delete Purchase Order">
                          <lucide-icon name="trash-2" [size]="12"></lucide-icon>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <!-- EXPANDED ROW: ITEM-BY-ITEM DETAILED SPECIFICATION -->
                  <tr *ngIf="expandedPoId === po.id" style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                    <td colspan="8" style="padding: 14px 20px 18px 48px;">
                      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <lucide-icon name="boxes" [size]="16" color="#0284c7"></lucide-icon>
                            <h4 style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin: 0;">
                              Itemized Medication Breakdown for {{ po.poNumber }}
                            </h4>
                          </div>
                          <span style="font-size: 11.5px; color: #64748b; font-weight: 600;">
                            {{ (po.items || []).length }} line item(s) ordered from {{ po.supplier?.name }}
                          </span>
                        </div>

                        <!-- Sub-table of medications -->
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                          <thead>
                            <tr style="background: #f1f5f9; color: #475569; font-weight: 700; border-bottom: 1px solid #e2e8f0;">
                              <th style="padding: 6px 10px;">Drug Name & Formulation</th>
                              <th style="padding: 6px 10px;">Generic Subtitle</th>
                              <th style="padding: 6px 10px; text-align: center;">Batch #</th>
                              <th style="padding: 6px 10px; text-align: center;">Expiry Date</th>
                              <th style="padding: 6px 10px; text-align: center;">Qty Ordered</th>
                              <th style="padding: 6px 10px; text-align: center;">Qty Received</th>
                              <th style="padding: 6px 10px; text-align: right;">Unit Cost (ETB)</th>
                              <th style="padding: 6px 10px; text-align: right;">Subtotal (ETB)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr *ngFor="let item of (po.items || [])" style="border-bottom: 1px solid #f8fafc;">
                              <td style="padding: 8px 10px;">
                                <strong style="color: #0f172a; font-size: 12.5px;">{{ item.drug?.name || 'Item #' + item.id }}</strong>
                                <span *ngIf="item.drug?.strength" style="color: #0284c7; font-size: 11px; margin-left: 4px;">{{ item.drug?.strength }}</span>
                              </td>
                              <td style="padding: 8px 10px; color: #64748b;">
                                {{ item.drug?.genericName || '—' }} ({{ item.drug?.dosageForm || 'Tab/Cap' }})
                              </td>
                              <td style="padding: 8px 10px; text-align: center;">
                                <code style="font-family: 'JetBrains Mono', monospace; padding: 2px 6px; background: #f1f5f9; border-radius: 4px; font-size: 11px;">
                                  {{ item.batchNumber || 'Auto-FEFO' }}
                                </code>
                              </td>
                              <td style="padding: 8px 10px; text-align: center; color: #475569;">
                                {{ item.expiryDate ? (item.expiryDate | date:'mediumDate') : '—' }}
                              </td>
                              <td style="padding: 8px 10px; text-align: center; font-weight: 700; font-family: 'JetBrains Mono', monospace;">
                                {{ item.quantityOrdered }} {{ item.drug?.unitOfMeasure || 'units' }}
                              </td>
                              <td style="padding: 8px 10px; text-align: center; font-weight: 800; color: #059669; font-family: 'JetBrains Mono', monospace;">
                                {{ item.quantityReceived || (po.status === 'RECEIVED' ? item.quantityOrdered : 0) }} {{ item.drug?.unitOfMeasure || 'units' }}
                              </td>
                              <td style="padding: 8px 10px; text-align: right; font-family: 'JetBrains Mono', monospace;">
                                ETB {{ item.unitCost | number:'1.2-2' }}
                              </td>
                              <td style="padding: 8px 10px; text-align: right; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: #0f172a;">
                                ETB {{ (item.subtotal || (item.quantityOrdered * item.unitCost)) | number:'1.2-2' }}
                              </td>
                            </tr>
                            <tr *ngIf="!po.items || po.items.length === 0">
                              <td colspan="8" style="text-align: center; padding: 16px; color: #94a3b8;">
                                No item records attached to this purchase order.
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                </ng-container>

                <tr *ngIf="filteredOrders().length === 0">
                  <td colspan="8" style="text-align: center; padding: 36px; color: var(--slate-400);">
                    No purchase orders found matching your filter criteria.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: Suppliers Directory -->
      <div *ngIf="activeTab === 'suppliers'" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <h3 style="font-size: 16px; font-weight: 800; color: var(--slate-800);">Pharmaceutical Vendor Partners</h3>
          <button (click)="openSupplierModal()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 4px;">
            <lucide-icon name="plus" [size]="14"></lucide-icon> Register Supplier
          </button>
        </div>

        <!-- Filters Toolbar -->
        <div class="card" style="padding: 14px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 260px; position: relative;">
            <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
            <input type="text" [(ngModel)]="supplierSearchQuery" (input)="supplierPage.set(1)"
                   class="form-control" style="padding-left: 36px;" placeholder="Search vendor name, contact person, phone, email, or TIN..." />
          </div>
          <button (click)="resetSupplierFilters()" class="btn btn-outline" style="padding: 8px 12px; display: inline-flex; align-items: center; gap: 4px;">
            <lucide-icon name="rotate-ccw" [size]="13"></lucide-icon> Reset
          </button>
        </div>

        <app-pagination
          [totalItems]="filteredSuppliers().length"
          [pageSize]="supplierPageSize()"
          [currentPage]="supplierPage()"
          (pageChange)="supplierPage.set($event)"
          (pageSizeChange)="supplierPageSize.set($event); supplierPage.set(1)">
        </app-pagination>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
          <div *ngFor="let s of (filteredSuppliers() | paginate: supplierPage() : supplierPageSize())" class="card" style="padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="font-weight: 800; font-size: 16px; color: var(--slate-900);">{{ s.name }}</div>
                <span class="badge badge-primary">{{ s.taxNumber || 'TIN-N/A' }}</span>
              </div>
              <div style="font-size: 12px; color: var(--slate-600); display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--slate-100); padding-top: 10px; margin-top: 8px;">
                <div><strong>Contact Person:</strong> {{ s.contactPerson || 'Representative' }}</div>
                <div><strong>Phone:</strong> <span style="font-family: monospace; font-weight: 600;">{{ s.phone || '—' }}</span></div>
                <div><strong>Email:</strong> <span style="color: #0284c7;">{{ s.email || '—' }}</span></div>
                <div *ngIf="s.address"><strong>Address:</strong> {{ s.address }}</div>
                <div><strong>Payment Terms:</strong> {{ s.paymentTermsDays || 30 }} days net</div>
              </div>
            </div>

            <div style="display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid var(--slate-100); padding-top: 10px;">
              <button (click)="openSupplierModal(s)" class="btn btn-outline" style="padding: 5px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;" title="Edit Supplier">
                <lucide-icon name="edit" [size]="13"></lucide-icon> Edit
              </button>
              <button (click)="deleteSupplier(s)" class="btn btn-outline" style="padding: 5px 10px; font-size: 12px; color: #ef4444; border-color: #fecaca; display: inline-flex; align-items: center; gap: 4px;" title="Delete Supplier">
                <lucide-icon name="trash-2" [size]="13"></lucide-icon> Delete
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="filteredSuppliers().length === 0" class="card" style="text-align: center; padding: 36px; color: var(--slate-400);">
          No suppliers found matching your query.
        </div>
      </div>
    </div>

    <!-- MODAL 1: VIEW FULL PURCHASE ORDER / GRN VOUCHER -->
    <div *ngIf="showViewPoModal && selectedPo" class="modal-overlay">
      <div class="card modal-content" style="width: 720px; max-width: 100%; padding: 24px; max-height: 90vh; overflow-y: auto;">
        <!-- Modal Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center;">
              <lucide-icon name="file-text" [size]="20"></lucide-icon>
            </div>
            <div>
              <h3 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0;">Goods Received Note (GRN) & PO Detail</h3>
              <p style="font-size: 12px; color: #64748b; margin: 1px 0 0;">PO: <strong>{{ selectedPo.poNumber }}</strong> • Date: {{ selectedPo.orderDate | date:'mediumDate' }}</p>
            </div>
          </div>
          <button (click)="showViewPoModal = false" style="background: none; border: none; cursor: pointer; color: #64748b; font-size: 16px;">✕</button>
        </div>

        <!-- Supplier & Delivery Meta -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 16px; font-size: 12.5px;">
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Vendor / Supplier</div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">{{ selectedPo.supplier?.name }}</div>
            <div style="color: #475569; margin-top: 2px;">Phone: {{ selectedPo.supplier?.phone || '—' }}</div>
            <div style="color: #475569;">TIN: {{ selectedPo.supplier?.taxNumber || '—' }}</div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Intake Status & Notes</div>
            <div style="margin-top: 3px;">
              <span [class]="selectedPo.status === 'RECEIVED' ? 'badge badge-success' : 'badge badge-warning'">
                {{ selectedPo.status === 'RECEIVED' ? 'RECEIVED & STOCKED' : 'PENDING RECEIVING' }}
              </span>
            </div>
            <div style="color: #475569; margin-top: 4px; font-size: 12px;">Notes: {{ selectedPo.notes || 'Standard pharmaceutical order' }}</div>
          </div>
        </div>

        <!-- Full Itemized Medications List -->
        <h4 style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin: 0 0 8px;">Purchased Medications & Received Stock</h4>
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
            <thead style="background: #f1f5f9; color: #475569; font-weight: 700;">
              <tr>
                <th style="padding: 8px 12px;">#</th>
                <th style="padding: 8px 12px;">Medication & Formulation</th>
                <th style="padding: 8px 12px; text-align: center;">Batch #</th>
                <th style="padding: 8px 12px; text-align: center;">Expiry Date</th>
                <th style="padding: 8px 12px; text-align: center;">Qty Ordered</th>
                <th style="padding: 8px 12px; text-align: center;">Qty Received</th>
                <th style="padding: 8px 12px; text-align: right;">Unit Cost</th>
                <th style="padding: 8px 12px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of (selectedPo.items || []); let i = index" style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 12px; color: #64748b;">{{ i + 1 }}</td>
                <td style="padding: 8px 12px;">
                  <strong style="color: #0f172a;">{{ item.drug?.name || 'Drug Item' }}</strong>
                  <div style="font-size: 11px; color: #64748b;">{{ item.drug?.genericName }} • {{ item.drug?.strength }}</div>
                </td>
                <td style="padding: 8px 12px; text-align: center;">
                  <code style="font-family: 'JetBrains Mono', monospace; font-size: 11px; background: #f8fafc; padding: 2px 6px; border: 1px solid #e2e8f0; border-radius: 4px;">
                    {{ item.batchNumber || 'Auto-FEFO' }}
                  </code>
                </td>
                <td style="padding: 8px 12px; text-align: center; color: #475569;">
                  {{ item.expiryDate ? (item.expiryDate | date:'mediumDate') : '—' }}
                </td>
                <td style="padding: 8px 12px; text-align: center; font-weight: 700; font-family: 'JetBrains Mono', monospace;">
                  {{ item.quantityOrdered }}
                </td>
                <td style="padding: 8px 12px; text-align: center; font-weight: 800; color: #059669; font-family: 'JetBrains Mono', monospace;">
                  {{ item.quantityReceived || (selectedPo.status === 'RECEIVED' ? item.quantityOrdered : 0) }}
                </td>
                <td style="padding: 8px 12px; text-align: right; font-family: 'JetBrains Mono', monospace;">
                  ETB {{ item.unitCost | number:'1.2-2' }}
                </td>
                <td style="padding: 8px 12px; text-align: right; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: #0f172a;">
                  ETB {{ (item.subtotal || (item.quantityOrdered * item.unitCost)) | number:'1.2-2' }}
                </td>
              </tr>
            </tbody>
            <tfoot style="background: #f8fafc; font-weight: 800; border-top: 2px solid #e2e8f0;">
              <tr>
                <td colspan="7" style="padding: 10px 12px; text-align: right; font-size: 13px; color: #0f172a;">Total Purchase Value:</td>
                <td style="padding: 10px 12px; text-align: right; font-size: 14px; font-family: 'JetBrains Mono', monospace; color: #0284c7;">
                  ETB {{ selectedPo.totalAmount | number:'1.2-2' }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 14px; flex-wrap: wrap; gap: 8px;">
          <button (click)="showViewPoModal = false" class="btn btn-outline">Close</button>
          
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button *ngIf="selectedPo.status !== 'RECEIVED'" (click)="deletePurchaseOrder(selectedPo)" class="btn btn-outline" style="color: #ef4444; border-color: #fecaca; display: inline-flex; align-items: center; gap: 4px;" title="Delete this PO">
              <lucide-icon name="trash-2" [size]="14"></lucide-icon>
              <span>Delete PO</span>
            </button>
            <button *ngIf="selectedPo.status !== 'RECEIVED'" (click)="openEditPoModal(selectedPo); showViewPoModal = false;" class="btn btn-outline" style="color: #0284c7; border-color: #bae6fd; display: inline-flex; align-items: center; gap: 4px;" title="Edit this PO">
              <lucide-icon name="edit" [size]="14"></lucide-icon>
              <span>Edit Order</span>
            </button>
            <button *ngIf="selectedPo.status !== 'RECEIVED'" (click)="receiveGoods(selectedPo.id); showViewPoModal = false;" class="btn btn-success" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700;">
              <lucide-icon name="package-check" [size]="15"></lucide-icon>
              <span>Confirm GRN Physical Intake</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 2: Create / Edit Purchase Order -->
    <div *ngIf="showPoModal" class="modal-overlay">
      <div class="card modal-content" style="width: 960px; max-width: 95vw; padding: 24px; max-height: 90vh; overflow-y: auto;">
        <!-- Modal Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; border-bottom: 1px solid var(--slate-200); padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center;">
              <lucide-icon name="package-plus" [size]="22"></lucide-icon>
            </div>
            <div>
              <h3 style="font-size: 18px; font-weight: 800; color: var(--slate-900); margin: 0;">
                {{ editingPoId ? 'Edit Purchase Order (' + editingPoNumber + ')' : 'Create Purchase Order (PO)' }}
              </h3>
              <p style="font-size: 12.5px; color: var(--slate-500); margin: 2px 0 0;">
                Specify vendor details, ordered medication quantities, buying unit costs (ETB), and intake batch details.
              </p>
            </div>
          </div>
          <button (click)="showPoModal = false" style="background: none; border: none; cursor: pointer; color: var(--slate-400); font-size: 18px;">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Vendor & PO Metadata Section -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #ffffff; border: 1px solid var(--slate-200); border-radius: 8px; padding: 14px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">
                Pharmaceutical Vendor / Supplier *
              </label>
              <select [(ngModel)]="poForm.supplierId" class="form-control" style="font-size: 13px; padding: 8px 10px;">
                <option [ngValue]="null">-- Select Supplier --</option>
                <option *ngFor="let s of suppliers()" [ngValue]="s.id">
                  {{ s.name }} (Phone: {{ s.phone || 'N/A' }} • TIN: {{ s.taxNumber || 'N/A' }})
                </option>
              </select>
            </div>

            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">
                PO Notes / Delivery Instructions
              </label>
              <input type="text" [(ngModel)]="poForm.notes" class="form-control" style="font-size: 13px; padding: 8px 10px;"
                     placeholder="e.g. Standard monthly replenishment, fragile ampoules, cold-chain storage" />
            </div>
          </div>

          <!-- Items Table Section with Clear Column Headers -->
          <div style="background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid var(--slate-200); display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
              <div>
                <strong style="font-size: 13px; text-transform: uppercase; color: var(--slate-800); display: flex; align-items: center; gap: 6px;">
                  <lucide-icon name="boxes" [size]="16" color="#0284c7"></lucide-icon>
                  Ordered Medications & Pricing Breakdown
                </strong>
                <span style="font-size: 11.5px; color: var(--slate-500);">
                  Enter ordered quantity and unit purchase cost (buying price in ETB) for each drug.
                </span>
              </div>
              <button (click)="addItemRow()" class="btn btn-outline" style="padding: 5px 12px; font-size: 12px; font-weight: 700; color: #0284c7; border-color: #bae6fd; display: inline-flex; align-items: center; gap: 4px; background: #fff;">
                <lucide-icon name="plus" [size]="14"></lucide-icon> Add Medication Item
              </button>
            </div>

            <!-- Table Container -->
            <div style="overflow-x: auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                <thead style="background: #f1f5f9; color: #475569; font-weight: 700; border-bottom: 2px solid #e2e8f0;">
                  <tr>
                    <th style="padding: 10px 12px; min-width: 230px;">1. Medication / Drug Name *</th>
                    <th style="padding: 10px 10px; width: 120px; text-align: center;">2. Quantity (Units) *</th>
                    <th style="padding: 10px 10px; width: 140px; text-align: right;">3. Buying Cost / Unit (ETB) *</th>
                    <th style="padding: 10px 10px; width: 130px; text-align: right;">Line Total (ETB)</th>
                    <th style="padding: 10px 10px; width: 115px;">Batch # (Optional)</th>
                    <th style="padding: 10px 10px; width: 125px;">Expiry Date</th>
                    <th style="padding: 10px 8px; width: 40px; text-align: center;"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of poForm.items; let i = index" style="border-bottom: 1px solid #f1f5f9;">
                    <!-- 1. Drug Selection -->
                    <td style="padding: 10px 12px; vertical-align: top;">
                      <select [(ngModel)]="item.drugId" (change)="onDrugSelected(item)" class="form-control" style="font-size: 12px; padding: 7px 8px; width: 100%;">
                        <option [ngValue]="null">-- Select Medication --</option>
                        <option *ngFor="let d of availableDrugs" [ngValue]="d.id">
                          {{ d.name }} {{ d.strength ? '(' + d.strength + ')' : '' }} {{ d.dosageForm ? '• ' + d.dosageForm : '' }}
                        </option>
                      </select>
                      <div *ngIf="getDrugDetails(item.drugId) as d" style="font-size: 10.5px; color: #0284c7; margin-top: 4px; display: flex; gap: 6px; flex-wrap: wrap;">
                        <span>Generic: <strong>{{ d.genericName || '—' }}</strong></span>
                        <span *ngIf="d.unitOfMeasure">• Packaging: <strong>{{ d.unitOfMeasure }}</strong></span>
                      </div>
                    </td>

                    <!-- 2. Quantity -->
                    <td style="padding: 10px 10px; vertical-align: top;">
                      <input type="number" [(ngModel)]="item.quantity" min="1" step="1"
                             class="form-control" style="font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; text-align: center; padding: 7px 6px;"
                             placeholder="e.g. 50" />
                      <div style="font-size: 10px; color: #64748b; text-align: center; margin-top: 3px;">
                        {{ getDrugDetails(item.drugId)?.unitOfMeasure || 'units / packs' }}
                      </div>
                    </td>

                    <!-- 3. Unit Buying Cost (ETB) -->
                    <td style="padding: 10px 10px; vertical-align: top;">
                      <div style="display: flex; align-items: center; gap: 4px;">
                        <span style="font-size: 11px; font-weight: 700; color: #64748b;">ETB</span>
                        <input type="number" [(ngModel)]="item.unitCost" min="0.01" step="0.5"
                               class="form-control" style="font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; text-align: right; padding: 7px 6px;"
                               placeholder="e.g. 120.00" />
                      </div>
                      <div style="font-size: 10px; color: #64748b; text-align: right; margin-top: 3px;">
                        per single unit
                      </div>
                    </td>

                    <!-- 4. Line Total Subtotal -->
                    <td style="padding: 10px 10px; vertical-align: top; text-align: right;">
                      <div style="font-size: 12.5px; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: #0f172a; padding-top: 7px;">
                        ETB {{ ((item.quantity || 0) * (item.unitCost || 0)) | number:'1.2-2' }}
                      </div>
                      <div *ngIf="item.quantity && item.unitCost" style="font-size: 10px; color: #64748b; margin-top: 2px;">
                        {{ item.quantity }} × {{ item.unitCost }}
                      </div>
                    </td>

                    <!-- 5. Batch Number -->
                    <td style="padding: 10px 10px; vertical-align: top;">
                      <input type="text" [(ngModel)]="item.batchNumber"
                             class="form-control" style="font-size: 11.5px; padding: 7px 6px; font-family: monospace;"
                             placeholder="e.g. BATCH-01" />
                      <div style="font-size: 9.5px; color: #94a3b8; margin-top: 3px;">Auto if empty</div>
                    </td>

                    <!-- 6. Expiry Date -->
                    <td style="padding: 10px 10px; vertical-align: top;">
                      <input type="date" [(ngModel)]="item.expiryDate"
                             class="form-control" style="font-size: 11px; padding: 6px 4px;" />
                    </td>

                    <!-- Remove Row -->
                    <td style="padding: 10px 8px; vertical-align: top; text-align: center;">
                      <button type="button" *ngIf="poForm.items.length > 1" (click)="removeItemRow(i)"
                              class="btn btn-outline" style="padding: 5px; color: #ef4444; border-color: #fecaca; margin-top: 2px;" title="Remove this line item">
                        <lucide-icon name="trash-2" [size]="13"></lucide-icon>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Grand Totals & Financial Summary Card -->
            <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; flex-wrap: wrap; gap: 12px;">
              <div style="display: flex; gap: 20px; font-size: 12.5px;">
                <div>
                  <span style="color: #64748b;">Total Line Items:</span>
                  <strong style="color: #0f172a; margin-left: 5px;">{{ poForm.items.length }} medication(s)</strong>
                </div>
                <div>
                  <span style="color: #64748b;">Total Units:</span>
                  <strong style="color: #0f172a; margin-left: 5px;">{{ getTotalOrderedQuantity() }} units</strong>
                </div>
              </div>

              <div style="display: flex; align-items: baseline; gap: 8px;">
                <span style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Estimated Total Cost:</span>
                <span style="font-size: 18px; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: #0284c7;">
                  ETB {{ calculatePoTotal() | number:'1.2-2' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Modal Action Buttons -->
          <div style="display: flex; gap: 10px; margin-top: 4px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
            <button (click)="showPoModal = false" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button (click)="submitPoForm()" class="btn btn-primary" style="flex: 2; font-weight: 700;">
              {{ editingPoId ? 'Save Purchase Order Changes' : 'Authorize & Create Purchase Order' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 3: Create / Edit Supplier -->
    <div *ngIf="showSupplierModal" class="modal-overlay">
      <div class="card modal-content" style="width: 460px; max-width: 100%; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 10px;">
          <h3 style="font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <lucide-icon name="building-2" [size]="20" color="#0284c7"></lucide-icon>
            {{ editingSupplierId ? 'Edit Supplier Details' : 'Register New Pharmaceutical Vendor' }}
          </h3>
          <button (click)="showSupplierModal = false" style="background: none; border: none; cursor: pointer; color: var(--slate-400);">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Supplier / Company Name *</label>
            <input type="text" [(ngModel)]="supplierForm.name" class="form-control" placeholder="e.g. Cadila Pharmaceuticals Ltd" />
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Contact Person</label>
            <input type="text" [(ngModel)]="supplierForm.contactPerson" class="form-control" placeholder="e.g. Almaz Bekele" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Phone Number *</label>
              <input type="text" [(ngModel)]="supplierForm.phone" class="form-control" placeholder="+251-911-000000" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Tax TIN #</label>
              <input type="text" [(ngModel)]="supplierForm.taxNumber" class="form-control" placeholder="TIN-0012345" />
            </div>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Email Address</label>
            <input type="email" [(ngModel)]="supplierForm.email" class="form-control" placeholder="orders@cadila.com" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Address / Location</label>
              <input type="text" [(ngModel)]="supplierForm.address" class="form-control" placeholder="Bole Subcity, Addis Ababa" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Payment Terms (Days)</label>
              <input type="number" [(ngModel)]="supplierForm.paymentTermsDays" min="0" class="form-control" placeholder="30" />
            </div>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 10px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
            <button (click)="showSupplierModal = false" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button (click)="saveSupplier()" class="btn btn-primary" style="flex: 2;">
              {{ editingSupplierId ? 'Save Changes' : 'Register Supplier' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .item-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 7px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 11px;
      color: #0f172a;
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
    .modal-content {
      animation: modalFadeIn 0.15s ease;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class PurchasesComponent implements OnInit {
  orders = signal<PurchaseOrder[]>([]);
  suppliers = signal<Supplier[]>([]);
  availableDrugs: any[] = [];
  activeTab: 'orders' | 'suppliers' = 'orders';

  orderPage = signal(1);
  orderPageSize = signal(10);
  supplierPage = signal(1);
  supplierPageSize = signal(9);

  orderSearchQuery = '';
  orderStatusFilter = '';
  supplierSearchQuery = '';

  expandedPoId: number | null = null;
  selectedPo: PurchaseOrder | null = null;
  showViewPoModal = false;
  showPoModal = false;
  showSupplierModal = false;
  editingSupplierId: number | null = null;
  editingPoId: number | null = null;
  editingPoNumber: string = '';

  poForm: { supplierId: number | null; notes: string; items: any[] } = {
    supplierId: null,
    notes: '',
    items: [{ drugId: null, quantity: null, unitCost: null, batchNumber: '', expiryDate: '' }]
  };

  supplierForm = { name: '', contactPerson: '', phone: '', email: '', taxNumber: '', address: '', paymentTermsDays: 30 };

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private validationService: ValidationService,
    private confirmationService: ConfirmationService
  ) {}

  filteredOrders(): PurchaseOrder[] {
    const q = this.orderSearchQuery.toLowerCase().trim();
    const status = this.orderStatusFilter;
    return this.orders().filter(po => {
      const matchSearch = !q ||
        po.poNumber?.toLowerCase().includes(q) ||
        po.supplier?.name?.toLowerCase().includes(q) ||
        (po.items && po.items.some(item => item.drug?.name?.toLowerCase().includes(q) || item.drug?.genericName?.toLowerCase().includes(q)));
      const matchStatus = !status || po.status === status;
      return matchSearch && matchStatus;
    });
  }

  resetOrderFilters(): void {
    this.orderSearchQuery = '';
    this.orderStatusFilter = '';
    this.orderPage.set(1);
  }

  filteredSuppliers(): Supplier[] {
    const q = this.supplierSearchQuery.toLowerCase().trim();
    if (!q) return this.suppliers();
    return this.suppliers().filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.contactPerson?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.taxNumber?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q)
    );
  }

  resetSupplierFilters(): void {
    this.supplierSearchQuery = '';
    this.supplierPage.set(1);
  }

  ngOnInit(): void {
    this.loadOrders();
    this.loadSuppliers();
    this.loadDrugs();
  }

  toggleExpandRow(poId: number): void {
    this.expandedPoId = this.expandedPoId === poId ? null : poId;
  }

  viewPoDetails(po: PurchaseOrder): void {
    this.selectedPo = po;
    this.showViewPoModal = true;
  }

  loadOrders(): void {
    this.http.get<any>(`${environment.apiUrl}/purchases`).subscribe({
      next: (res) => this.orders.set(res.data || [])
    });
  }

  loadSuppliers(): void {
    this.http.get<any>(`${environment.apiUrl}/suppliers`).subscribe({
      next: (res) => this.suppliers.set(res.data || [])
    });
  }

  loadDrugs(): void {
    this.http.get<any>(`${environment.apiUrl}/drugs?size=150`).subscribe({
      next: (res) => this.availableDrugs = res.data?.content || []
    });
  }

  getDrugDetails(drugId: number | null): any {
    if (!drugId) return null;
    return this.availableDrugs.find(d => d.id === Number(drugId));
  }

  onDrugSelected(item: any): void {
    if (!item.drugId) return;
    const drug = this.getDrugDetails(item.drugId);
    if (drug) {
      if (!item.unitCost) {
        if (drug.wholesalePrice && Number(drug.wholesalePrice) > 0) {
          item.unitCost = Number(drug.wholesalePrice);
        } else if (drug.retailPrice && Number(drug.retailPrice) > 0) {
          item.unitCost = Math.round(Number(drug.retailPrice) * 0.75 * 100) / 100;
        }
      }
      if (!item.quantity) {
        item.quantity = 10;
      }
    }
  }

  getTotalOrderedQuantity(): number {
    return this.poForm.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }

  getPendingOrdersCount(): number {
    return this.orders().filter(o => o.status !== 'RECEIVED').length;
  }

  openCreatePoModal() {
    this.editingPoId = null;
    this.editingPoNumber = '';
    this.poForm = {
      supplierId: this.suppliers().length > 0 ? this.suppliers()[0].id : null,
      notes: '',
      items: [{ drugId: null, quantity: null, unitCost: null, batchNumber: '', expiryDate: '' }]
    };
    this.showPoModal = true;
  }

  openEditPoModal(po: PurchaseOrder) {
    if (po.status === 'RECEIVED') {
      this.notificationService.warning('Cannot edit a Purchase Order that has already been received into stock.');
      return;
    }
    this.editingPoId = po.id;
    this.editingPoNumber = po.poNumber;
    this.poForm = {
      supplierId: po.supplier ? po.supplier.id : null,
      notes: po.notes || '',
      items: po.items && po.items.length > 0
        ? po.items.map(item => ({
            drugId: item.drug ? item.drug.id : null,
            quantity: item.quantityOrdered,
            unitCost: item.unitCost,
            batchNumber: item.batchNumber || '',
            expiryDate: item.expiryDate || ''
          }))
        : [{ drugId: null, quantity: null, unitCost: null, batchNumber: '', expiryDate: '' }]
    };
    this.showPoModal = true;
  }

  async deletePurchaseOrder(po: PurchaseOrder): Promise<void> {
    if (po.status === 'RECEIVED') {
      this.notificationService.warning('Cannot delete a Purchase Order that has already been received into stock.');
      return;
    }

    const ok = await this.confirmationService.confirm({
      title: 'Delete Purchase Order',
      message: `Are you sure you want to delete purchase order "${po.poNumber}" (${po.supplier?.name || 'Vendor'})? This action cannot be undone.`,
      confirmText: 'Delete PO',
      type: 'danger',
      icon: 'trash-2'
    });

    if (ok) {
      this.http.delete<any>(`${environment.apiUrl}/purchases/${po.id}`).subscribe({
        next: () => {
          this.notificationService.success('Purchase Order deleted successfully.');
          if (this.expandedPoId === po.id) this.expandedPoId = null;
          if (this.selectedPo?.id === po.id) this.showViewPoModal = false;
          this.loadOrders();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to delete purchase order')
      });
    }
  }

  addItemRow() {
    this.poForm.items.push({
      drugId: null,
      quantity: null,
      unitCost: null,
      batchNumber: '',
      expiryDate: ''
    });
  }

  removeItemRow(index: number) {
    this.poForm.items.splice(index, 1);
  }

  calculatePoTotal(): number {
    return this.poForm.items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)), 0);
  }

  submitPoForm() {
    const valResult = this.validationService.validatePurchaseOrder(this.poForm);
    if (!valResult.valid) {
      this.notificationService.warning(valResult.errors[0]);
      return;
    }

    if (this.editingPoId) {
      this.http.put<any>(`${environment.apiUrl}/purchases/${this.editingPoId}`, this.poForm).subscribe({
        next: () => {
          this.notificationService.success('Purchase Order updated successfully!');
          this.showPoModal = false;
          this.editingPoId = null;
          this.editingPoNumber = '';
          this.loadOrders();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to update purchase order')
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/purchases`, this.poForm).subscribe({
        next: () => {
          this.notificationService.success('Purchase Order created successfully!');
          this.showPoModal = false;
          this.loadOrders();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to create PO')
      });
    }
  }

  receiveGoods(poId: number): void {
    this.http.post<any>(`${environment.apiUrl}/purchases/${poId}/receive`, {}).subscribe({
      next: () => {
        this.notificationService.success('Goods received and batch inventory created successfully!');
        this.loadOrders();
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Failed to receive goods')
    });
  }

  openSupplierModal(supplier?: Supplier) {
    if (supplier) {
      this.editingSupplierId = supplier.id;
      this.supplierForm = {
        name: supplier.name,
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        taxNumber: supplier.taxNumber || '',
        address: supplier.address || '',
        paymentTermsDays: supplier.paymentTermsDays || 30
      };
    } else {
      this.editingSupplierId = null;
      this.supplierForm = { name: '', contactPerson: '', phone: '', email: '', taxNumber: '', address: '', paymentTermsDays: 30 };
    }
    this.showSupplierModal = true;
  }

  saveSupplier() {
    const valResult = this.validationService.validateSupplier(this.supplierForm);
    if (!valResult.valid) {
      this.notificationService.warning(valResult.errors[0]);
      return;
    }

    if (this.editingSupplierId) {
      this.http.put<any>(`${environment.apiUrl}/suppliers/${this.editingSupplierId}`, this.supplierForm).subscribe({
        next: () => {
          this.notificationService.success('Supplier updated successfully!');
          this.showSupplierModal = false;
          this.loadSuppliers();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to update supplier')
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/suppliers`, this.supplierForm).subscribe({
        next: () => {
          this.notificationService.success('Supplier added successfully!');
          this.showSupplierModal = false;
          this.loadSuppliers();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to save supplier')
      });
    }
  }

  async deleteSupplier(supplier: Supplier): Promise<void> {
    const ok = await this.confirmationService.confirm({
      title: 'Delete Vendor / Supplier',
      message: `Are you sure you want to delete supplier "${supplier.name}"? Suppliers with active purchase orders cannot be removed.`,
      confirmText: 'Delete Supplier',
      type: 'danger',
      icon: 'trash-2'
    });

    if (ok) {
      this.http.delete<any>(`${environment.apiUrl}/suppliers/${supplier.id}`).subscribe({
        next: () => {
          this.notificationService.success('Supplier removed successfully.');
          this.loadSuppliers();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Cannot delete supplier with active orders')
      });
    }
  }
}
