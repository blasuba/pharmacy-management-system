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

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent, PaginatePipe],
  template: `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: var(--slate-900);">Procurement & Goods Received (GRN)</h1>
          <p style="font-size: 13px; color: var(--slate-500); margin-top: 2px;">
            Supplier purchase orders, editable vendor directory, automated FEFO batch intake, and GRN audit trail
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
        <div class="card" style="border-left: 4px solid #0284c7;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Total POs Issued</span>
            <lucide-icon name="package" [size]="18" color="#0284c7"></lucide-icon>
          </div>
          <div style="font-size: 24px; font-weight: 800; color: var(--slate-900); margin: 6px 0 2px;">
            {{ orders().length }} Orders
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Historical procurement volume
          </div>
        </div>

        <div class="card" style="border-left: 4px solid #f59e0b;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Pending GRN Receiving</span>
            <lucide-icon name="truck" [size]="18" color="#d97706"></lucide-icon>
          </div>
          <div style="font-size: 24px; font-weight: 800; color: #d97706; margin: 6px 0 2px;">
            {{ getPendingOrdersCount() }} Shipments
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Awaiting physical warehouse delivery
          </div>
        </div>

        <div class="card" style="border-left: 4px solid #10b981;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Certified Vendors</span>
            <lucide-icon name="building-2" [size]="18" color="#059669"></lucide-icon>
          </div>
          <div style="font-size: 24px; font-weight: 800; color: #059669; margin: 6px 0 2px;">
            {{ suppliers().length }} Suppliers
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Editable authorized pharmaceutical partners
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div style="display: flex; gap: 8px; border-bottom: 2px solid var(--slate-200); padding-bottom: 8px; flex-wrap: wrap;">
        <button (click)="activeTab = 'orders'"
                [style.background]="activeTab === 'orders' ? '#0284c7' : 'transparent'"
                [style.color]="activeTab === 'orders' ? '#fff' : 'var(--slate-600)'"
                class="btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="package" [size]="15"></lucide-icon> Purchase Orders ({{ orders().length }})
        </button>

        <button (click)="activeTab = 'suppliers'"
                [style.background]="activeTab === 'suppliers' ? '#0284c7' : 'transparent'"
                [style.color]="activeTab === 'suppliers' ? '#fff' : 'var(--slate-600)'"
                class="btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="building-2" [size]="15"></lucide-icon> Suppliers Directory ({{ suppliers().length }})
        </button>
      </div>

      <!-- TAB 1: Orders -->
      <div *ngIf="activeTab === 'orders'" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Filters Toolbar -->
        <div class="card" style="padding: 14px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 260px; position: relative;">
            <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
            <input type="text" [(ngModel)]="orderSearchQuery" (input)="orderPage.set(1)"
                   class="form-control" style="padding-left: 36px;" placeholder="Search PO number or supplier name..." />
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <select [(ngModel)]="orderStatusFilter" (change)="orderPage.set(1)" class="form-control" style="width: auto; min-width: 170px;">
              <option value="">All PO Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ORDERED">Ordered / Pending</option>
              <option value="RECEIVED">Received & Stocked</option>
            </select>
            <button (click)="resetOrderFilters()" class="btn btn-outline" style="padding: 8px 12px; display: inline-flex; align-items: center; gap: 4px;">
              <lucide-icon name="rotate-ccw" [size]="13"></lucide-icon> Reset
            </button>
          </div>
        </div>

        <!-- Orders Table -->
        <div class="card" style="padding: 0; overflow: hidden;">
          <app-pagination
            [totalItems]="filteredOrders().length"
            [pageSize]="orderPageSize()"
            [currentPage]="orderPage()"
            (pageChange)="orderPage.set($event)"
            (pageSizeChange)="orderPageSize.set($event); orderPage.set(1)">
          </app-pagination>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
              <thead style="background: #f8fafc; border-bottom: 1px solid var(--slate-200); color: var(--slate-600); font-weight: 700;">
                <tr>
                  <th style="padding: 12px 16px;">PO Number</th>
                  <th style="padding: 12px 16px;">Supplier / Vendor</th>
                  <th style="padding: 12px 16px;">Order Date</th>
                  <th style="padding: 12px 16px; text-align: center;">Line Items</th>
                  <th style="padding: 12px 16px; text-align: right;">Total Cost (ETB)</th>
                  <th style="padding: 12px 16px; text-align: center;">Status</th>
                  <th style="padding: 12px 16px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let po of (filteredOrders() | paginate: orderPage() : orderPageSize())" style="border-bottom: 1px solid var(--slate-100);" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                  <td style="padding: 12px 16px; font-family: monospace; font-weight: 800; color: var(--slate-900);">{{ po.poNumber }}</td>
                  <td style="padding: 12px 16px; font-weight: 700; color: var(--slate-800);">{{ po.supplier?.name || 'Authorized Vendor' }}</td>
                  <td style="padding: 12px 16px; color: var(--slate-500); font-size: 12px;">{{ po.orderDate }}</td>
                  <td style="padding: 12px 16px; text-align: center;">
                    <span class="badge badge-primary">{{ po.items?.length || 1 }} items</span>
                  </td>
                  <td style="padding: 12px 16px; text-align: right; font-family: monospace; font-weight: 800; color: var(--slate-900);">
                    ETB {{ po.totalAmount | number:'1.2-2' }}
                  </td>
                  <td style="padding: 12px 16px; text-align: center;">
                    <span class="badge" [ngClass]="po.status === 'RECEIVED' ? 'badge-success' : 'badge-warning'" style="text-transform: uppercase;">
                      {{ po.status }}
                    </span>
                  </td>
                  <td style="padding: 12px 16px; text-align: right;">
                    <button *ngIf="po.status !== 'RECEIVED'" (click)="receiveGoods(po.id)" class="btn btn-success" style="padding: 5px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
                      <lucide-icon name="package-check" [size]="13"></lucide-icon> Receive GRN
                    </button>
                    <span *ngIf="po.status === 'RECEIVED'" style="color: #059669; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
                      <lucide-icon name="check-circle" [size]="13"></lucide-icon> Stocked in Batches
                    </span>
                  </td>
                </tr>
                <tr *ngIf="filteredOrders().length === 0">
                  <td colspan="7" style="text-align: center; padding: 36px; color: var(--slate-400);">No purchase orders found matching your filter criteria.</td>
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

    <!-- MODAL: Create Purchase Order -->
    <div *ngIf="showPoModal" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 580px; max-width: 100%; padding: 24px; max-height: 90vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 10px;">
          <h3 style="font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <lucide-icon name="package" [size]="20" color="#0284c7"></lucide-icon> Create Purchase Order (PO)
          </h3>
          <button (click)="showPoModal = false" style="background: none; border: none; cursor: pointer; color: var(--slate-400);">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">Select Supplier *</label>
            <select [(ngModel)]="poForm.supplierId" class="form-control">
              <option [ngValue]="null">Choose a supplier...</option>
              <option *ngFor="let s of suppliers()" [ngValue]="s.id">{{ s.name }} ({{ s.phone }})</option>
            </select>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700); display: block; margin-bottom: 4px;">PO Notes / Delivery Instructions</label>
            <input type="text" [(ngModel)]="poForm.notes" class="form-control" placeholder="e.g. Standard monthly replenishment with cold chain storage" />
          </div>

          <!-- Items Table in Modal -->
          <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid var(--slate-200); display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="font-size: 12px; text-transform: uppercase; color: var(--slate-700);">Order Line Items</strong>
              <button (click)="addItemRow()" class="btn btn-outline" style="padding: 3px 8px; font-size: 11px;">+ Add Drug Item</button>
            </div>

            <div *ngFor="let item of poForm.items; let i = index" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 30px; gap: 6px; align-items: center; background: #fff; padding: 8px; border-radius: 6px; border: 1px solid var(--slate-200);">
              <select [(ngModel)]="item.drugId" class="form-control" style="padding: 6px 8px; font-size: 12px;">
                <option [ngValue]="null">Select Drug</option>
                <option *ngFor="let d of availableDrugs" [ngValue]="d.id">{{ d.name }} ({{ d.strength }})</option>
              </select>

              <input type="number" [(ngModel)]="item.quantity" min="1" placeholder="Qty" class="form-control" style="padding: 6px 8px; font-size: 12px; font-family: monospace;" />

              <input type="number" [(ngModel)]="item.unitCost" min="0.1" step="5" placeholder="Unit Cost" class="form-control" style="padding: 6px 8px; font-size: 12px; font-family: monospace;" />

              <div style="font-size: 12px; font-family: monospace; font-weight: 700; text-align: right;">
                ETB {{ ((item.quantity || 0) * (item.unitCost || 0)) | number:'1.2-2' }}
              </div>

              <button *ngIf="poForm.items.length > 1" (click)="removeItemRow(i)" style="background: none; border: none; color: #ef4444; font-weight: 700; cursor: pointer;">✕</button>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; border-top: 1px solid var(--slate-200); padding-top: 8px;">
              <span>Total PO Estimated Cost:</span>
              <span style="color: #0284c7; font-family: monospace;">ETB {{ calculatePoTotal() | number:'1.2-2' }}</span>
            </div>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 10px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
            <button (click)="showPoModal = false" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button (click)="submitCreatePo()" class="btn btn-primary" style="flex: 2;">Authorize & Save Purchase Order</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Create / Edit Supplier -->
    <div *ngIf="showSupplierModal" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 460px; max-width: 100%; padding: 24px;">
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
  `
})
export class PurchasesComponent implements OnInit {
  orders = signal<any[]>([]);
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

  showPoModal = false;
  showSupplierModal = false;
  editingSupplierId: number | null = null;

  poForm: { supplierId: number | null; notes: string; items: any[] } = {
    supplierId: null,
    notes: '',
    items: [{ drugId: null, quantity: 50, unitCost: 100, batchNumber: '', expiryDate: '' }]
  };

  supplierForm = { name: '', contactPerson: '', phone: '', email: '', taxNumber: '', address: '', paymentTermsDays: 30 };

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private validationService: ValidationService,
    private confirmationService: ConfirmationService
  ) {}

  filteredOrders(): any[] {
    const q = this.orderSearchQuery.toLowerCase().trim();
    const status = this.orderStatusFilter;
    return this.orders().filter(po => {
      const matchSearch = !q ||
        po.poNumber?.toLowerCase().includes(q) ||
        po.supplier?.name?.toLowerCase().includes(q);
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
    this.http.get<any>(`${environment.apiUrl}/drugs?size=100`).subscribe({
      next: (res) => this.availableDrugs = res.data?.content || []
    });
  }

  getPendingOrdersCount(): number {
    return this.orders().filter(o => o.status !== 'RECEIVED').length;
  }

  openCreatePoModal() {
    this.poForm = {
      supplierId: this.suppliers().length > 0 ? this.suppliers()[0].id : null,
      notes: '',
      items: [{ drugId: this.availableDrugs.length > 0 ? this.availableDrugs[0].id : null, quantity: 50, unitCost: 120, batchNumber: '', expiryDate: '' }]
    };
    this.showPoModal = true;
  }

  addItemRow() {
    this.poForm.items.push({
      drugId: this.availableDrugs.length > 0 ? this.availableDrugs[0].id : null,
      quantity: 50,
      unitCost: 100,
      batchNumber: '',
      expiryDate: ''
    });
  }

  removeItemRow(index: number) {
    this.poForm.items.splice(index, 1);
  }

  calculatePoTotal(): number {
    return this.poForm.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitCost || 0)), 0);
  }

  submitCreatePo() {
    const valResult = this.validationService.validatePurchaseOrder(this.poForm);
    if (!valResult.valid) {
      this.notificationService.warning(valResult.errors[0]);
      return;
    }

    this.http.post<any>(`${environment.apiUrl}/purchases`, this.poForm).subscribe({
      next: () => {
        this.notificationService.success('Purchase Order created successfully!');
        this.showPoModal = false;
        this.loadOrders();
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Failed to create PO')
    });
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
