import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../core/services/notification.service';
import { ValidationService } from '../../core/services/validation.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { environment } from '../../../environments/environment';
import { PaginationComponent, PaginatePipe, FilterToolbarComponent } from '../../shared';

export interface DrugItem {
  id: number;
  name: string;
  genericName: string;
  categoryName: string;
  categoryId: number;
  dosageForm: string;
  strength: string;
  unitOfMeasure: string;
  barcode: string;
  reorderThreshold: number;
  prescriptionRequired: boolean;
  totalStock: number;
}

export interface BatchItem {
  id: number;
  drugId: number;
  drugName: string;
  genericName?: string;
  dosageForm?: string;
  unitOfMeasure?: string;
  barcode?: string;
  batchNumber: string;
  expiryDate: string;
  manufacturingDate?: string;
  quantityOnHand: number;
  buyingPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  distributorPrice: number;
  supplierName?: string;
  supplierId?: number;
  status?: string;
  expired?: boolean;
  expiringSoon?: boolean;
}

export interface CategoryItem {
  id: number;
  name: string;
  description: string;
}

export interface SupplierItem {
  id: number;
  name: string;
  phone: string;
}

export interface MovementItem {
  id: number;
  drugName: string;
  batchNumber: string;
  movementType: string;
  quantity: number;
  reason: string;
  referenceType: string;
  performedByUsername: string;
  createdAt: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent, PaginatePipe, FilterToolbarComponent],
  template: `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: var(--slate-900);">Pharmaceutical Inventory & FEFO Ledger</h1>
          <p style="font-size: 13px; color: var(--slate-500);">Complete drug catalog CRUD, FEFO batch intake, stock adjustments, and categories</p>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button (click)="openDrugModal()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon name="plus" [size]="15"></lucide-icon> New Drug Catalog
          </button>
          <button (click)="openBatchModal()" class="btn btn-success" style="display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon name="package-plus" [size]="15"></lucide-icon> Register Batch Intake
          </button>
          <button (click)="openAdjustModal()" class="btn btn-outline" style="color: #d97706; border-color: #fcd34d; display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon name="sliders" [size]="15"></lucide-icon> Stock Adjustment
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div style="display: flex; gap: 8px; border-bottom: 2px solid var(--slate-200); padding-bottom: 8px; flex-wrap: wrap;">
        <button (click)="activeTab.set('DRUGS')"
                [style.background]="activeTab() === 'DRUGS' ? '#0284c7' : 'transparent'"
                [style.color]="activeTab() === 'DRUGS' ? '#fff' : 'var(--slate-600)'"
                class="btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="pill" [size]="15"></lucide-icon> Drug Catalog ({{ drugs().length }})
        </button>

        <button (click)="activeTab.set('BATCHES')"
                [style.background]="activeTab() === 'BATCHES' ? '#0284c7' : 'transparent'"
                [style.color]="activeTab() === 'BATCHES' ? '#fff' : 'var(--slate-600)'"
                class="btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="boxes" [size]="15"></lucide-icon> FEFO Batch Ledger
        </button>

        <button (click)="activeTab.set('MOVEMENTS')"
                [style.background]="activeTab() === 'MOVEMENTS' ? '#0284c7' : 'transparent'"
                [style.color]="activeTab() === 'MOVEMENTS' ? '#fff' : 'var(--slate-600)'"
                class="btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="activity" [size]="15"></lucide-icon> Stock Ledger & Movements
        </button>

        <button (click)="activeTab.set('CATEGORIES')"
                [style.background]="activeTab() === 'CATEGORIES' ? '#0284c7' : 'transparent'"
                [style.color]="activeTab() === 'CATEGORIES' ? '#fff' : 'var(--slate-600)'"
                class="btn" style="padding: 8px 16px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="tag" [size]="15"></lucide-icon> Categories ({{ categories().length }})
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 1: DRUG CATALOG                                                      -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'DRUGS'" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Search & Filter -->
        <div class="card" style="padding: 14px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 280px; position: relative;">
            <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
            <input type="text" [(ngModel)]="searchQuery" (input)="loadDrugs()"
                   class="form-control" style="padding-left: 36px;" placeholder="Search catalog by drug name, generic formulation, or barcode..." />
          </div>
          <select [(ngModel)]="selectedCategoryFilter" (change)="applyCategoryFilter()" class="form-control" style="width: auto; min-width: 180px;">
            <option value="">All Categories</option>
            <option *ngFor="let c of categories()" [value]="c.name">{{ c.name }}</option>
          </select>
        </div>

        <!-- Drugs Table -->
        <div class="card" style="padding: 0; overflow: hidden;">
          <app-pagination
            [totalItems]="filteredDrugs().length"
            [pageSize]="drugPageSize()"
            [currentPage]="drugPage()"
            (pageChange)="drugPage.set($event)"
            (pageSizeChange)="drugPageSize.set($event); drugPage.set(1)">
          </app-pagination>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
            <thead style="background: #f8fafc; border-bottom: 1px solid var(--slate-200); color: var(--slate-600); font-weight: 700;">
              <tr>
                <th style="padding: 12px 16px;">Brand & Generic Name</th>
                <th style="padding: 12px 16px;">Category</th>
                <th style="padding: 12px 16px;">Dosage & Strength</th>
                <th style="padding: 12px 16px;">Barcode</th>
                <th style="padding: 12px 16px;">Reorder Level</th>
                <th style="padding: 12px 16px;">Available Stock</th>
                <th style="padding: 12px 16px;">Status</th>
                <th style="padding: 12px 16px; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let drug of (filteredDrugs() | paginate: drugPage() : drugPageSize())" style="border-bottom: 1px solid var(--slate-100);" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                <td style="padding: 12px 16px;">
                  <div style="font-weight: 800; color: var(--slate-900);">{{ drug.name }}</div>
                  <div style="font-size: 11px; color: var(--slate-500);">{{ drug.genericName }}</div>
                </td>
                <td style="padding: 12px 16px;">
                  <span class="badge badge-primary">{{ drug.categoryName }}</span>
                </td>
                <td style="padding: 12px 16px; color: var(--slate-700);">
                  {{ drug.dosageForm }} ({{ drug.strength }})
                </td>
                <td style="padding: 12px 16px;">
                  <code>{{ drug.barcode }}</code>
                </td>
                <td style="padding: 12px 16px; color: var(--slate-600);">
                  {{ drug.reorderThreshold }} {{ drug.unitOfMeasure }}
                </td>
                <td style="padding: 12px 16px; font-weight: 800; font-size: 14px;">
                  {{ drug.totalStock }} {{ drug.unitOfMeasure }}
                </td>
                <td style="padding: 12px 16px;">
                  <span class="badge" [ngClass]="drug.totalStock > drug.reorderThreshold ? 'badge-success' : (drug.totalStock === 0 ? 'badge-danger' : 'badge-warning')">
                    {{ drug.totalStock > drug.reorderThreshold ? 'Optimal' : (drug.totalStock === 0 ? 'Out of Stock' : 'Low Stock') }}
                  </span>
                </td>
                <td style="padding: 12px 16px; text-align: right;">
                  <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                    <button (click)="openEditDrugModal(drug)" class="btn btn-outline" style="padding: 4px 8px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
                      <lucide-icon name="edit-2" [size]="13"></lucide-icon> Edit
                    </button>
                    <button (click)="confirmDeleteDrug(drug)" class="btn btn-outline" style="padding: 4px 8px; font-size: 12px; color: #ef4444; display: inline-flex; align-items: center;">
                      <lucide-icon name="trash-2" [size]="13"></lucide-icon>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredDrugs().length === 0">
                <td colspan="8" style="text-align: center; padding: 36px; color: var(--slate-400);">
                  No drug catalog entries found matching your query.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 2: FEFO BATCH LEDGER                                                 -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'BATCHES'" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Batch KPI Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px;">
          <div class="card" style="border-left: 4px solid #0284c7; padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Active Batches</span>
              <lucide-icon name="boxes" [size]="16" color="#0284c7"></lucide-icon>
            </div>
            <div style="font-size: 22px; font-weight: 800; color: var(--slate-900); margin: 4px 0 2px;">
              {{ filteredBatches().length }} Batches
            </div>
            <div style="font-size: 11px; color: var(--slate-500);">
              {{ getTotalBatchUnits() }} total stock units
            </div>
          </div>

          <div class="card" style="border-left: 4px solid #10b981; padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Retail Valuation</span>
              <lucide-icon name="wallet" [size]="16" color="#059669"></lucide-icon>
            </div>
            <div style="font-size: 22px; font-weight: 800; color: #059669; margin: 4px 0 2px; font-family: monospace;">
              ETB {{ getTotalBatchRetailValue() | number:'1.2-2' }}
            </div>
            <div style="font-size: 11px; color: var(--slate-500);">
              Cost value: ETB {{ getTotalBatchCostValue() | number:'1.2-2' }}
            </div>
          </div>

          <div class="card" style="border-left: 4px solid #8b5cf6; padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Profit Headroom</span>
              <lucide-icon name="trending-up" [size]="16" color="#7c3aed"></lucide-icon>
            </div>
            <div style="font-size: 22px; font-weight: 800; color: #7c3aed; margin: 4px 0 2px; font-family: monospace;">
              ETB {{ getPotentialBatchProfit() | number:'1.2-2' }}
            </div>
            <div style="font-size: 11px; color: var(--slate-500);">
              Potential gross profit margin
            </div>
          </div>

          <div class="card" style="border-left: 4px solid #f59e0b; padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Expiry Risk Alerts</span>
              <lucide-icon name="alert-triangle" [size]="16" color="#d97706"></lucide-icon>
            </div>
            <div style="font-size: 22px; font-weight: 800; color: #d97706; margin: 4px 0 2px;">
              {{ getNearExpiryCount() }} Near / {{ getExpiredCount() }} Expired
            </div>
            <div style="font-size: 11px; color: var(--slate-500);">
              FEFO inspection required
            </div>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="card" style="padding: 14px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 240px; position: relative;">
            <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
            <input type="text" [(ngModel)]="batchSearchQuery"
                   class="form-control" style="padding-left: 36px;" placeholder="Search batch #, drug name, generic formulation, or supplier..." />
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <select [(ngModel)]="selectedDrugForBatches" (change)="loadBatchesForSelectedDrug()" class="form-control" style="width: auto; min-width: 220px;">
              <option value="ALL">📦 All Drugs (Complete Stock Ledger)</option>
              <option *ngFor="let d of drugs()" [value]="d.id">{{ d.name }} ({{ d.genericName }})</option>
            </select>

            <select [(ngModel)]="batchStatusFilter" class="form-control" style="width: auto; min-width: 150px;">
              <option value="">All Statuses</option>
              <option value="OPTIMAL">Optimal / Safe</option>
              <option value="NEAR_EXPIRY">Expiring Soon (&lt;90d)</option>
              <option value="EXPIRED">Expired Batches</option>
            </select>

            <button (click)="openBatchModal()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px;">
              <lucide-icon name="boxes" [size]="15"></lucide-icon> Register Batch Intake
            </button>

            <button (click)="printFullBatchLedger()" class="btn btn-outline" style="padding: 8px 14px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;" title="Print Complete Ledger Report">
              <lucide-icon name="printer" [size]="14"></lucide-icon> Print Ledger
            </button>
          </div>
        </div>

        <!-- Batches Table -->
        <div class="card" style="padding: 0; overflow: hidden;">
          <app-pagination
            [totalItems]="filteredBatches().length"
            [pageSize]="batchPageSize()"
            [currentPage]="batchPage()"
            (pageChange)="batchPage.set($event)"
            (pageSizeChange)="batchPageSize.set($event); batchPage.set(1)">
          </app-pagination>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
              <thead style="background: #f8fafc; border-bottom: 1px solid var(--slate-200); color: var(--slate-600); font-weight: 700;">
                <tr>
                  <th style="padding: 12px 16px;">Drug & Generic Formulation</th>
                  <th style="padding: 12px 16px;">Batch #</th>
                  <th style="padding: 12px 16px;">Expiry Date</th>
                  <th style="padding: 12px 16px; text-align: right;">Qty on Hand</th>
                  <th style="padding: 12px 16px; text-align: right;">Cost Price</th>
                  <th style="padding: 12px 16px; text-align: right;">Retail Price</th>
                  <th style="padding: 12px 16px; text-align: right;">Total Retail Value</th>
                  <th style="padding: 12px 16px;">Status</th>
                  <th style="padding: 12px 16px; text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let b of (filteredBatches() | paginate: batchPage() : batchPageSize())" style="border-bottom: 1px solid var(--slate-100);" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                  <td style="padding: 12px 16px;">
                    <div style="font-weight: 800; color: var(--slate-900);">{{ b.drugName }}</div>
                    <div style="font-size: 11px; color: var(--slate-500);">{{ b.genericName || 'Pharmaceutical' }} • {{ b.unitOfMeasure || 'Units' }}</div>
                  </td>
                  <td style="padding: 12px 16px; font-weight: 700;">
                    <span style="font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0; color: #0284c7;">
                      {{ b.batchNumber }}
                    </span>
                  </td>
                  <td style="padding: 12px 16px;">
                    <div style="font-weight: 600; color: var(--slate-800);">{{ b.expiryDate }}</div>
                    <div style="font-size: 10px; font-weight: 700;" [style.color]="getDaysUntilExpiry(b.expiryDate) < 0 ? '#dc2626' : (getDaysUntilExpiry(b.expiryDate) <= 90 ? '#d97706' : '#059669')">
                      {{ getDaysUntilExpiry(b.expiryDate) < 0 ? 'Expired' : getDaysUntilExpiry(b.expiryDate) + 'd left' }}
                    </div>
                  </td>
                  <td style="padding: 12px 16px; text-align: right; font-weight: 800; font-size: 14px; color: var(--slate-900);">
                    {{ b.quantityOnHand }}
                  </td>
                  <td style="padding: 12px 16px; text-align: right; font-family: monospace; color: var(--slate-600);">
                    ETB {{ b.buyingPrice | number:'1.2-2' }}
                  </td>
                  <td style="padding: 12px 16px; text-align: right; font-family: monospace; font-weight: 700; color: #059669;">
                    ETB {{ b.retailPrice | number:'1.2-2' }}
                  </td>
                  <td style="padding: 12px 16px; text-align: right; font-family: monospace; font-weight: 800; color: var(--slate-900);">
                    ETB {{ (b.quantityOnHand * b.retailPrice) | number:'1.2-2' }}
                  </td>
                  <td style="padding: 12px 16px;">
                    <span class="badge" [ngClass]="getBatchStatus(b) === 'EXPIRED' ? 'badge-danger' : (getBatchStatus(b) === 'NEAR_EXPIRY' ? 'badge-warning' : 'badge-success')">
                      {{ getBatchStatus(b) }}
                    </span>
                  </td>
                  <td style="padding: 12px 16px; text-align: center;">
                    <div style="display: flex; gap: 4px; justify-content: center; align-items: center;">
                      <button (click)="viewBatchDetails(b)" class="btn btn-outline" style="padding: 4px 6px; font-size: 11px; color: #0284c7; border-color: #bae6fd;" title="View Complete Dossier">
                        <lucide-icon name="eye" [size]="13"></lucide-icon>
                      </button>
                      <button (click)="printBatchTag(b)" class="btn btn-outline" style="padding: 4px 6px; font-size: 11px; color: #059669; border-color: #a7f3d0;" title="Print Stock Tag">
                        <lucide-icon name="printer" [size]="13"></lucide-icon>
                      </button>
                      <button (click)="openEditBatchModal(b)" class="btn btn-outline" style="padding: 4px 6px; font-size: 11px;" title="Edit Pricing & Expiry">
                        <lucide-icon name="edit-2" [size]="13"></lucide-icon>
                      </button>
                      <button (click)="confirmDeleteBatch(b)" class="btn btn-outline" style="padding: 4px 6px; font-size: 11px; color: #ef4444; border-color: #fecaca;" title="Delete Batch">
                        <lucide-icon name="trash-2" [size]="13"></lucide-icon>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="filteredBatches().length === 0">
                  <td colspan="9" style="text-align: center; padding: 36px; color: var(--slate-400);">
                    No batches match the specified drug or filter criteria. Click "Register Batch Intake" above to add new stock.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 3: STOCK ADJUSTMENTS & MOVEMENTS                                     -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'MOVEMENTS'" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Movements Filters Toolbar -->
        <div class="card" style="padding: 14px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 260px; position: relative;">
            <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
            <input type="text" [(ngModel)]="movementSearchQuery" (input)="movementPage.set(1)"
                   class="form-control" style="padding-left: 36px;" placeholder="Search movement by drug, batch #, reason, or staff..." />
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <select [(ngModel)]="movementTypeFilter" (change)="movementPage.set(1)" class="form-control" style="width: auto; min-width: 170px;">
              <option value="">All Movement Types</option>
              <option value="PURCHASE_RECEIPT">Purchase Receipt</option>
              <option value="SALE_DEDUCTION">Sale Deduction</option>
              <option value="PHYSICAL_COUNT">Physical Count</option>
              <option value="DAMAGED_EXPIRED">Damaged / Expired</option>
              <option value="RETURN_RESTOCK">Return Restock</option>
            </select>
            <button (click)="resetMovementFilters()" class="btn btn-outline" style="padding: 8px 12px; display: inline-flex; align-items: center; gap: 4px;">
              <lucide-icon name="rotate-ccw" [size]="13"></lucide-icon> Reset
            </button>
          </div>
        </div>

        <div class="card" style="padding: 0; overflow: hidden;">
          <div style="padding: 14px 18px; border-bottom: 1px solid var(--slate-200); background: #f8fafc; font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <lucide-icon name="activity" [size]="16" color="#0284c7"></lucide-icon> Immutable Stock Movement & Audit Log
          </div>
          <app-pagination
            [totalItems]="filteredMovements().length"
            [pageSize]="movementPageSize()"
            [currentPage]="movementPage()"
            (pageChange)="movementPage.set($event)"
            (pageSizeChange)="movementPageSize.set($event); movementPage.set(1)">
          </app-pagination>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
            <thead style="background: #f8fafc; color: var(--slate-600);">
              <tr>
                <th style="padding: 10px 16px;">Timestamp</th>
                <th style="padding: 10px 16px;">Drug & Batch</th>
                <th style="padding: 10px 16px;">Type</th>
                <th style="padding: 10px 16px;">Quantity</th>
                <th style="padding: 10px 16px;">Reason</th>
                <th style="padding: 10px 16px;">Staff User</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of (filteredMovements() | paginate: movementPage() : movementPageSize())" style="border-bottom: 1px solid var(--slate-100);">
                <td style="padding: 10px 16px; color: var(--slate-500);">{{ m.createdAt | date:'short' }}</td>
                <td style="padding: 10px 16px; font-weight: 700;">{{ m.drugName }} ({{ m.batchNumber }})</td>
                <td style="padding: 10px 16px;"><span class="badge badge-primary">{{ m.movementType }}</span></td>
                <td style="padding: 10px 16px; font-weight: 800;" [style.color]="m.quantity >= 0 ? '#059669' : '#dc2626'">
                  {{ m.quantity > 0 ? '+' : '' }}{{ m.quantity }}
                </td>
                <td style="padding: 10px 16px; color: var(--slate-600);">{{ m.reason }}</td>
                <td style="padding: 10px 16px;"><code>&#64;{{ m.performedByUsername }}</code></td>
              </tr>
              <tr *ngIf="filteredMovements().length === 0">
                <td colspan="6" style="text-align: center; padding: 24px; color: var(--slate-400);">
                  No stock adjustments logged matching query.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 4: CATEGORIES MANAGEMENT                                             -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'CATEGORIES'" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <h3 style="font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <lucide-icon name="tag" [size]="18" color="#0284c7"></lucide-icon> Drug Classification Categories
          </h3>
          <button (click)="openCreateCategoryModal()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon name="plus" [size]="14"></lucide-icon> Add Category
          </button>
        </div>

        <!-- Categories Filters Toolbar -->
        <div class="card" style="padding: 14px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 260px; position: relative;">
            <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
            <input type="text" [(ngModel)]="categorySearchQuery" (input)="categoryPage.set(1)"
                   class="form-control" style="padding-left: 36px;" placeholder="Search category by name or description..." />
          </div>
          <button (click)="resetCategoryFilters()" class="btn btn-outline" style="padding: 8px 12px; display: inline-flex; align-items: center; gap: 4px;">
            <lucide-icon name="rotate-ccw" [size]="13"></lucide-icon> Reset
          </button>
        </div>

        <app-pagination
          [totalItems]="filteredCategories().length"
          [pageSize]="categoryPageSize()"
          [currentPage]="categoryPage()"
          (pageChange)="categoryPage.set($event)"
          (pageSizeChange)="categoryPageSize.set($event); categoryPage.set(1)">
        </app-pagination>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
          <div *ngFor="let cat of (filteredCategories() | paginate: categoryPage() : categoryPageSize())" class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <h4 style="font-size: 15px; font-weight: 700; color: var(--slate-900);">{{ cat.name }}</h4>
                <span class="badge badge-primary">Category #{{ cat.id }}</span>
              </div>
              <p style="font-size: 12px; color: var(--slate-600);">{{ cat.description || 'No description provided.' }}</p>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; border-top: 1px solid var(--slate-100); padding-top: 10px; align-items: center;">
              <button (click)="openEditCategoryModal(cat)" class="btn btn-outline" style="padding: 4px 8px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
                <lucide-icon name="edit-2" [size]="13"></lucide-icon> Edit
              </button>
              <button (click)="deleteCategory(cat)" class="btn btn-outline" style="padding: 4px 8px; font-size: 12px; color: #ef4444; display: inline-flex; align-items: center; gap: 4px;">
                <lucide-icon name="trash-2" [size]="13"></lucide-icon> Delete
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="filteredCategories().length === 0" class="card" style="text-align: center; padding: 36px; color: var(--slate-400);">
          No categories found matching your query.
        </div>
      </div>

    </div>

    <!-- ========================================================================= -->
    <!-- MODAL: ADD / EDIT DRUG                                                    -->
    <!-- ========================================================================= -->
    <div *ngIf="showDrugModal()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 580px; max-width: 100%; padding: 26px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 800;">
            {{ isEditingDrug() ? 'Edit Drug Details' : 'Register New Pharmaceutical Drug' }}
          </h3>
          <button (click)="showDrugModal.set(false)" style="background: none; border: none; cursor: pointer; color: var(--slate-400); display: flex; align-items: center;">
            <lucide-icon name="x" [size]="18"></lucide-icon>
          </button>
        </div>

        <form (ngSubmit)="saveDrug()" style="display: flex; flex-direction: column; gap: 12px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 12px; font-weight: 700;">Brand / Trade Name *</label>
              <input type="text" [(ngModel)]="drugForm.name" name="name" required class="form-control" placeholder="e.g. Amoxil 500mg" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700;">Generic Formulation *</label>
              <input type="text" [(ngModel)]="drugForm.genericName" name="genericName" required class="form-control" placeholder="e.g. Amoxicillin Trihydrate" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 12px; font-weight: 700;">Category *</label>
              <select [(ngModel)]="drugForm.categoryId" name="categoryId" required class="form-control">
                <option *ngFor="let c of categories()" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700;">Dosage Form *</label>
              <select [(ngModel)]="drugForm.dosageForm" name="dosageForm" class="form-control">
                <option value="TABLET">TABLET</option>
                <option value="CAPSULE">CAPSULE</option>
                <option value="SYRUP">SYRUP</option>
                <option value="INJECTION">INJECTION</option>
                <option value="OINTMENT">OINTMENT</option>
                <option value="DROPS">DROPS</option>
                <option value="INHALER">INHALER</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 12px; font-weight: 700;">Strength</label>
              <input type="text" [(ngModel)]="drugForm.strength" name="strength" class="form-control" placeholder="500mg" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700;">Unit of Measure</label>
              <input type="text" [(ngModel)]="drugForm.unitOfMeasure" name="unitOfMeasure" class="form-control" placeholder="BOX, BOTTLE" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700;">Reorder Level</label>
              <input type="number" [(ngModel)]="drugForm.reorderThreshold" name="reorderThreshold" class="form-control" />
            </div>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700;">Barcode / GTIN</label>
            <input type="text" [(ngModel)]="drugForm.barcode" name="barcode" class="form-control" placeholder="Scan or enter barcode..." />
          </div>

          <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
            <input type="checkbox" [(ngModel)]="drugForm.prescriptionRequired" name="prescriptionRequired" id="rxReq" />
            <label for="rxReq" style="font-size: 13px; font-weight: 600; cursor: pointer;">Prescription Required (Rx Only)</label>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 14px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
            <button type="button" (click)="showDrugModal.set(false)" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button type="submit" class="btn btn-primary" style="flex: 2;">
              {{ isEditingDrug() ? 'Update Drug Catalog' : 'Save & Register' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL: REGISTER / EDIT BATCH                                              -->
    <!-- ========================================================================= -->
    <div *ngIf="showBatchModal()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 540px; max-width: 100%; padding: 26px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 800;">
            {{ isEditingBatch() ? 'Edit Batch Pricing & Expiry' : 'Register Drug Batch (FEFO Intake)' }}
          </h3>
          <button (click)="showBatchModal.set(false)" style="background: none; border: none; cursor: pointer; color: var(--slate-400); display: flex; align-items: center;">
            <lucide-icon name="x" [size]="18"></lucide-icon>
          </button>
        </div>

        <form (ngSubmit)="saveBatch()" style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="font-size: 12px; font-weight: 700;">Select Drug *</label>
            <select [(ngModel)]="batchForm.drugId" name="drugId" [disabled]="isEditingBatch()" required class="form-control">
              <option *ngFor="let d of drugs()" [value]="d.id">{{ d.name }} ({{ d.genericName }})</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 12px; font-weight: 700;">Batch Number *</label>
              <input type="text" [(ngModel)]="batchForm.batchNumber" name="batchNumber" required class="form-control" placeholder="e.g. BAT-2026-99" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700;">Expiry Date *</label>
              <input type="date" [(ngModel)]="batchForm.expiryDate" name="expiryDate" required class="form-control" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
            <div *ngIf="!isEditingBatch()">
              <label style="font-size: 12px; font-weight: 700;">Quantity *</label>
              <input type="number" [(ngModel)]="batchForm.quantity" name="quantity" required class="form-control" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700;">Cost Price (ETB) *</label>
              <input type="number" [(ngModel)]="batchForm.buyingPrice" name="buyingPrice" required class="form-control" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700;">Retail Price (ETB) *</label>
              <input type="number" [(ngModel)]="batchForm.retailPrice" name="retailPrice" required class="form-control" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 12px; font-weight: 700;">Wholesale Price (ETB)</label>
              <input type="number" [(ngModel)]="batchForm.wholesalePrice" name="wholesalePrice" class="form-control" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700;">Distributor Price (ETB)</label>
              <input type="number" [(ngModel)]="batchForm.distributorPrice" name="distributorPrice" class="form-control" />
            </div>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700;">Supplier</label>
            <select [(ngModel)]="batchForm.supplierId" name="supplierId" class="form-control">
              <option [ngValue]="null">None / Local Intake</option>
              <option *ngFor="let s of suppliers()" [value]="s.id">{{ s.name }}</option>
            </select>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 14px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
            <button type="button" (click)="showBatchModal.set(false)" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button type="submit" class="btn btn-primary" style="flex: 2;">
              {{ isEditingBatch() ? 'Update Batch' : 'Save & Update Ledger' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL: STOCK ADJUSTMENT                                                   -->
    <!-- ========================================================================= -->
    <div *ngIf="showAdjustModal()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 500px; max-width: 100%; padding: 26px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <h3 style="font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <lucide-icon name="sliders" [size]="20" color="#d97706"></lucide-icon> Record Stock Adjustment
          </h3>
          <button (click)="showAdjustModal.set(false)" style="background: none; border: none; cursor: pointer; color: var(--slate-400); display: flex; align-items: center;">
            <lucide-icon name="x" [size]="18"></lucide-icon>
          </button>
        </div>
        <p style="font-size: 12px; color: var(--slate-500); margin-bottom: 16px;">Adjust quantity for damaged stock, physical count variance, or expired goods</p>

        <form (ngSubmit)="saveAdjustment()" style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="font-size: 12px; font-weight: 700;">Select Batch to Adjust *</label>
            <select [(ngModel)]="adjustForm.batchId" name="batchId" required class="form-control">
              <option [ngValue]="null" disabled>-- Select a drug batch --</option>
              <option *ngFor="let b of allBatches()" [ngValue]="b.id">
                {{ b.drugName }} - Batch #{{ b.batchNumber }} (Current Qty: {{ b.quantityOnHand }})
              </option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 12px; font-weight: 700;">Adjustment Qty (+ or -) *</label>
              <input type="number" [(ngModel)]="adjustForm.quantityAdjusted" name="quantityAdjusted" required class="form-control" placeholder="-5 or +10" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700;">Reason Code *</label>
              <select [(ngModel)]="adjustForm.reason" name="reason" class="form-control">
                <option value="DAMAGED_EXPIRED">Damaged or Expired Stock</option>
                <option value="INVENTORY_COUNT_VARIANCE">Physical Count Variance</option>
                <option value="RETURN_TO_SUPPLIER">Return to Supplier</option>
                <option value="OTHER">Other Operational Reason</option>
              </select>
            </div>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700;">Audit Notes / Justification</label>
            <textarea [(ngModel)]="adjustForm.notes" name="notes" class="form-control" rows="2" placeholder="Explain the cause of adjustment..."></textarea>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 14px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
            <button type="button" (click)="showAdjustModal.set(false)" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button type="submit" class="btn btn-primary" style="flex: 2;">Apply & Record to Audit Log</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL: CREATE / EDIT CATEGORY                                             -->
    <!-- ========================================================================= -->
    <div *ngIf="showCategoryModal()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 440px; max-width: 100%; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h3 style="font-size: 17px; font-weight: 800;">
            {{ isEditingCategory() ? 'Edit Category' : 'Create Drug Category' }}
          </h3>
          <button (click)="showCategoryModal.set(false)" style="background: none; border: none; cursor: pointer; color: var(--slate-400); display: flex; align-items: center;">
            <lucide-icon name="x" [size]="18"></lucide-icon>
          </button>
        </div>

        <form (ngSubmit)="saveCategory()" style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="font-size: 12px; font-weight: 700;">Category Name *</label>
            <input type="text" [(ngModel)]="categoryForm.name" name="name" required class="form-control" placeholder="e.g. Antihypertensives" />
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 700;">Description</label>
            <input type="text" [(ngModel)]="categoryForm.description" name="description" class="form-control" placeholder="e.g. Cardiovascular medications" />
          </div>

          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <button type="button" (click)="showCategoryModal.set(false)" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button type="submit" class="btn btn-primary" style="flex: 2;">Save Category</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- MODAL: VIEW BATCH DETAILS                                                 -->
    <!-- ========================================================================= -->
    <div *ngIf="showViewBatchModal() && selectedBatchForView" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 580px; max-width: 100%; padding: 26px; max-height: 90vh; overflow-y: auto;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h3 style="font-size: 18px; font-weight: 800; color: var(--slate-900);">Batch Details & Dossier</h3>
              <span class="badge" [ngClass]="getBatchStatus(selectedBatchForView) === 'EXPIRED' ? 'badge-danger' : (getBatchStatus(selectedBatchForView) === 'NEAR_EXPIRY' ? 'badge-warning' : 'badge-success')">
                {{ getBatchStatus(selectedBatchForView) }}
              </span>
            </div>
            <p style="font-size: 12px; color: var(--slate-500); margin-top: 2px;">Batch #{{ selectedBatchForView.batchNumber }}</p>
          </div>
          <button (click)="showViewBatchModal.set(false)" style="background: none; border: none; cursor: pointer; color: var(--slate-400); display: flex; align-items: center;">
            <lucide-icon name="x" [size]="20"></lucide-icon>
          </button>
        </div>

        <!-- Drug & Batch Info Cards -->
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Medication Summary -->
          <div style="background: #f8fafc; border: 1px solid var(--slate-200); border-radius: 10px; padding: 14px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Drug Formulation</div>
            <div style="font-size: 16px; font-weight: 800; color: var(--slate-900); margin-top: 2px;">{{ selectedBatchForView.drugName }}</div>
            <div style="font-size: 12px; color: var(--slate-600); margin-top: 2px;">{{ selectedBatchForView.genericName || 'Pharmaceutical formulation' }}</div>
            <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
              <span *ngIf="selectedBatchForView.dosageForm" class="badge badge-primary">{{ selectedBatchForView.dosageForm }}</span>
              <span *ngIf="selectedBatchForView.unitOfMeasure" class="badge" style="background: #e2e8f0; color: #334155;">{{ selectedBatchForView.unitOfMeasure }}</span>
              <span *ngIf="selectedBatchForView.barcode" class="badge" style="background: #f1f5f9; color: #475569; font-family: monospace;">Barcode: {{ selectedBatchForView.barcode }}</span>
            </div>
          </div>

          <!-- Expiry & Logistics Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="background: #f8fafc; border: 1px solid var(--slate-200); border-radius: 8px; padding: 12px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--slate-500);">EXPIRY DATE</div>
              <div style="font-size: 14px; font-weight: 800; color: var(--slate-900); margin-top: 2px;">{{ selectedBatchForView.expiryDate }}</div>
              <div style="font-size: 11px; font-weight: 600; margin-top: 4px;" [style.color]="getDaysUntilExpiry(selectedBatchForView.expiryDate) < 0 ? '#dc2626' : (getDaysUntilExpiry(selectedBatchForView.expiryDate) <= 90 ? '#d97706' : '#059669')">
                {{ getDaysUntilExpiry(selectedBatchForView.expiryDate) < 0 ? 'Expired past due' : getDaysUntilExpiry(selectedBatchForView.expiryDate) + ' days remaining' }}
              </div>
            </div>

            <div style="background: #f8fafc; border: 1px solid var(--slate-200); border-radius: 8px; padding: 12px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--slate-500);">CURRENT STOCK</div>
              <div style="font-size: 18px; font-weight: 800; color: #0284c7; margin-top: 2px;">{{ selectedBatchForView.quantityOnHand }} {{ selectedBatchForView.unitOfMeasure || 'Units' }}</div>
              <div style="font-size: 11px; color: var(--slate-500); margin-top: 4px;">Available for POS Dispensing</div>
            </div>
          </div>

          <!-- Pricing & Financial Valuation -->
          <div style="background: #fff; border: 1px solid var(--slate-200); border-radius: 10px; padding: 14px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--slate-500); text-transform: uppercase; margin-bottom: 8px;">Pricing Structure & Batch Valuation</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
              <div style="padding: 8px; background: #f8fafc; border-radius: 6px;">
                <div style="font-size: 10px; color: var(--slate-500); font-weight: 700;">COST PRICE</div>
                <div style="font-size: 13px; font-weight: 800; color: var(--slate-900);">ETB {{ selectedBatchForView.buyingPrice | number:'1.2-2' }}</div>
                <div style="font-size: 10px; color: var(--slate-500);">Total: ETB {{ (selectedBatchForView.quantityOnHand * selectedBatchForView.buyingPrice) | number:'1.2-2' }}</div>
              </div>
              <div style="padding: 8px; background: #f0fdf4; border-radius: 6px; border: 1px solid #bbf7d0;">
                <div style="font-size: 10px; color: #166534; font-weight: 700;">RETAIL PRICE</div>
                <div style="font-size: 13px; font-weight: 800; color: #15803d;">ETB {{ selectedBatchForView.retailPrice | number:'1.2-2' }}</div>
                <div style="font-size: 10px; color: #166534;">Total: ETB {{ (selectedBatchForView.quantityOnHand * selectedBatchForView.retailPrice) | number:'1.2-2' }}</div>
              </div>
              <div style="padding: 8px; background: #f8fafc; border-radius: 6px;">
                <div style="font-size: 10px; color: var(--slate-500); font-weight: 700;">WHOLESALE</div>
                <div style="font-size: 13px; font-weight: 800; color: var(--slate-900);">ETB {{ selectedBatchForView.wholesalePrice | number:'1.2-2' }}</div>
                <div style="font-size: 10px; color: var(--slate-500);">Dist: ETB {{ selectedBatchForView.distributorPrice | number:'1.2-2' }}</div>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--slate-200); font-size: 12px;">
              <span style="color: var(--slate-600); font-weight: 600;">Potential Gross Profit for Batch:</span>
              <strong style="color: #059669; font-size: 13px;">ETB {{ ((selectedBatchForView.quantityOnHand * selectedBatchForView.retailPrice) - (selectedBatchForView.quantityOnHand * selectedBatchForView.buyingPrice)) | number:'1.2-2' }}</strong>
            </div>
          </div>

          <!-- Supplier / Origin -->
          <div *ngIf="selectedBatchForView.supplierName" style="background: #f8fafc; border: 1px solid var(--slate-200); border-radius: 8px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
            <span style="color: var(--slate-600);">Procurement Supplier:</span>
            <strong>{{ selectedBatchForView.supplierName }}</strong>
          </div>

          <!-- Actions -->
          <div style="display: flex; gap: 10px; margin-top: 6px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
            <button (click)="printBatchTag(selectedBatchForView)" class="btn btn-primary" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
              <lucide-icon name="printer" [size]="14"></lucide-icon> Print Stock Tag
            </button>
            <button (click)="openEditBatchModal(selectedBatchForView); showViewBatchModal.set(false)" class="btn btn-outline" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
              <lucide-icon name="edit-2" [size]="14"></lucide-icon> Edit Batch
            </button>
            <button (click)="showViewBatchModal.set(false)" class="btn btn-outline" style="padding: 8px 16px;">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- PRINTABLE: SINGLE BATCH STOCK TAG / STICKER                               -->
    <!-- ========================================================================= -->
    <div *ngIf="selectedBatchForPrint" class="printable-area" style="padding: 20px; font-family: monospace; max-width: 400px; margin: auto;">
      <div style="border: 2px solid #000; padding: 16px; border-radius: 8px; background: #fff;">
        <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 10px;">
          <h2 style="font-size: 16px; font-weight: 800;">APEX CENTRAL PHARMACY</h2>
          <div style="font-size: 11px;">FEFO Stock Bin & Dispensing Tag</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
          <div><strong>DRUG:</strong> {{ selectedBatchForPrint.drugName }}</div>
          <div><strong>GENERIC:</strong> {{ selectedBatchForPrint.genericName || 'N/A' }}</div>
          <div><strong>BATCH #:</strong> <span style="font-size: 14px; font-weight: 800;">{{ selectedBatchForPrint.batchNumber }}</span></div>
          <div><strong>EXPIRY DATE:</strong> <span style="font-size: 14px; font-weight: 800;">{{ selectedBatchForPrint.expiryDate }}</span></div>
          <div><strong>QTY ON HAND:</strong> {{ selectedBatchForPrint.quantityOnHand }} {{ selectedBatchForPrint.unitOfMeasure || 'Units' }}</div>
          <div><strong>RETAIL PRICE:</strong> ETB {{ selectedBatchForPrint.retailPrice | number:'1.2-2' }}</div>
          <div *ngIf="selectedBatchForPrint.barcode"><strong>BARCODE:</strong> {{ selectedBatchForPrint.barcode }}</div>
          <div *ngIf="selectedBatchForPrint.supplierName"><strong>SUPPLIER:</strong> {{ selectedBatchForPrint.supplierName }}</div>
        </div>
        <div style="text-align: center; border-top: 1px dashed #000; margin-top: 10px; padding-top: 8px; font-size: 10px;">
          Store at controlled room temperature (15°C - 25°C). FEFO priority dispatch.
        </div>
      </div>
      <div style="margin-top: 12px; text-align: center;" class="not-printable">
        <button (click)="closePrintView()" class="btn btn-outline" style="padding: 6px 14px;">Done / Back</button>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- PRINTABLE: COMPLETE BATCH LEDGER REPORT (A4)                              -->
    <!-- ========================================================================= -->
    <div *ngIf="isPrintingFullLedger" class="printable-area a4-invoice" style="font-family: sans-serif; font-size: 12px; color: #000; background: #fff;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <h1 style="font-size: 20px; font-weight: 800; margin-bottom: 4px;">APEX CENTRAL PHARMACY & DISTRIBUTION</h1>
          <div style="font-size: 12px; color: #444;">Bole Medhanialem Suite 402, Addis Ababa • Tel: +251-911-000000</div>
          <div style="font-size: 11px; color: #666;">TIN: TIN-0098712345 • License: PH-ET-2026-88910</div>
        </div>
        <div style="text-align: right;">
          <h2 style="font-size: 15px; font-weight: 800; text-transform: uppercase;">FEFO BATCH INVENTORY LEDGER</h2>
          <div style="font-size: 11px; margin-top: 4px;">Date: {{ today | date:'medium' }}</div>
          <div style="font-size: 11px;">Scope: {{ selectedDrugForBatches === 'ALL' || !selectedDrugForBatches ? 'All Catalog Drugs' : 'Filtered Drug' }}</div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px; margin-bottom: 16px;">
        <thead>
          <tr style="border-bottom: 2px solid #000; border-top: 1px solid #000;">
            <th style="padding: 6px 4px;">#</th>
            <th style="padding: 6px 4px;">Drug Name</th>
            <th style="padding: 6px 4px;">Batch #</th>
            <th style="padding: 6px 4px;">Expiry Date</th>
            <th style="padding: 6px 4px; text-align: right;">Qty</th>
            <th style="padding: 6px 4px; text-align: right;">Cost Price</th>
            <th style="padding: 6px 4px; text-align: right;">Retail Price</th>
            <th style="padding: 6px 4px; text-align: right;">Total Cost</th>
            <th style="padding: 6px 4px; text-align: right;">Total Retail</th>
            <th style="padding: 6px 4px; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let b of filteredBatches(); let i = index" style="border-bottom: 1px solid #ddd;">
            <td style="padding: 5px 4px;">{{ i + 1 }}</td>
            <td style="padding: 5px 4px; font-weight: 700;">{{ b.drugName }}</td>
            <td style="padding: 5px 4px; font-family: monospace;">{{ b.batchNumber }}</td>
            <td style="padding: 5px 4px;">{{ b.expiryDate }}</td>
            <td style="padding: 5px 4px; text-align: right; font-weight: 700;">{{ b.quantityOnHand }}</td>
            <td style="padding: 5px 4px; text-align: right;">{{ b.buyingPrice | number:'1.2-2' }}</td>
            <td style="padding: 5px 4px; text-align: right;">{{ b.retailPrice | number:'1.2-2' }}</td>
            <td style="padding: 5px 4px; text-align: right;">{{ (b.quantityOnHand * b.buyingPrice) | number:'1.2-2' }}</td>
            <td style="padding: 5px 4px; text-align: right; font-weight: 700;">{{ (b.quantityOnHand * b.retailPrice) | number:'1.2-2' }}</td>
            <td style="padding: 5px 4px; text-align: center;">{{ getBatchStatus(b) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="border-top: 2px solid #000; font-weight: 800;">
            <td colspan="4" style="padding: 8px 4px;">TOTALS ({{ filteredBatches().length }} Batches)</td>
            <td style="padding: 8px 4px; text-align: right;">{{ getTotalBatchUnits() }}</td>
            <td colspan="2"></td>
            <td style="padding: 8px 4px; text-align: right;">ETB {{ getTotalBatchCostValue() | number:'1.2-2' }}</td>
            <td style="padding: 8px 4px; text-align: right;">ETB {{ getTotalBatchRetailValue() | number:'1.2-2' }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <div style="display: flex; justify-content: space-between; margin-top: 36px; padding-top: 16px; border-top: 1px solid #000;">
        <div>
          <div>Prepared By: ___________________________</div>
          <div style="font-size: 10px; color: #555; margin-top: 2px;">Inventory Pharmacist / Storekeeper</div>
        </div>
        <div>
          <div>Approved By: ___________________________</div>
          <div style="font-size: 10px; color: #555; margin-top: 2px;">Chief Pharmacist / Operations Manager</div>
        </div>
      </div>

      <div style="margin-top: 16px; text-align: center;" class="not-printable">
        <button (click)="closePrintView()" class="btn btn-outline" style="padding: 6px 14px;">Done / Back</button>
      </div>
    </div>
  `
})
export class InventoryComponent implements OnInit {
  activeTab = signal<'DRUGS' | 'BATCHES' | 'MOVEMENTS' | 'CATEGORIES'>('DRUGS');

  drugs = signal<DrugItem[]>([]);
  categories = signal<CategoryItem[]>([]);
  suppliers = signal<SupplierItem[]>([]);
  movements = signal<MovementItem[]>([]);
  allBatches = signal<BatchItem[]>([]);
  currentDrugBatches = signal<BatchItem[]>([]);

  searchQuery = '';
  selectedCategoryFilter = '';
  selectedDrugForBatches: any = 'ALL';
  batchSearchQuery = '';
  batchStatusFilter = '';
  movementSearchQuery = '';
  movementTypeFilter = '';
  categorySearchQuery = '';

  // Pagination state
  drugPage = signal(1);
  drugPageSize = signal(10);
  batchPage = signal(1);
  batchPageSize = signal(10);
  movementPage = signal(1);
  movementPageSize = signal(10);
  categoryPage = signal(1);
  categoryPageSize = signal(9);

  Math = Math;
  today = new Date();

  // Modals
  showDrugModal = signal(false);
  isEditingDrug = signal(false);
  editingDrugId: number | null = null;

  showBatchModal = signal(false);
  isEditingBatch = signal(false);
  editingBatchId: number | null = null;

  showViewBatchModal = signal(false);
  selectedBatchForView: BatchItem | null = null;
  selectedBatchForPrint: BatchItem | null = null;
  isPrintingFullLedger = false;

  showAdjustModal = signal(false);
  showCategoryModal = signal(false);
  isEditingCategory = signal(false);
  editingCategoryId: number | null = null;

  drugForm: any = {
    name: '',
    genericName: '',
    categoryId: null,
    dosageForm: 'TABLET',
    strength: '500mg',
    unitOfMeasure: 'BOX',
    barcode: '',
    reorderThreshold: 20,
    prescriptionRequired: false
  };

  batchForm: any = {
    drugId: null,
    batchNumber: '',
    expiryDate: '',
    quantity: 100,
    buyingPrice: 100,
    retailPrice: 150,
    wholesalePrice: 130,
    distributorPrice: 120,
    supplierId: null
  };

  adjustForm: any = {
    batchId: null,
    quantityAdjusted: -1,
    reason: 'DAMAGED_EXPIRED',
    notes: ''
  };

  categoryForm: any = {
    name: '',
    description: ''
  };

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private validationService: ValidationService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDrugs();
    this.loadCategories();
    this.loadSuppliers();
    this.loadMovements();
  }

  loadDrugs(): void {
    const q = this.searchQuery ? `?query=${encodeURIComponent(this.searchQuery)}` : '';
    this.http.get<any>(`${environment.apiUrl}/drugs${q}`).subscribe({
      next: (res) => {
        const list = res.data?.content || [];
        this.drugs.set(list);
        if (!this.selectedDrugForBatches) {
          this.selectedDrugForBatches = 'ALL';
        }
        this.loadBatchesForSelectedDrug();
      }
    });
  }

  loadCategories(): void {
    this.http.get<any>(`${environment.apiUrl}/drugs/categories`).subscribe({
      next: (res) => {
        this.categories.set(res.data || []);
        if (res.data && res.data.length > 0 && !this.drugForm.categoryId) {
          this.drugForm.categoryId = res.data[0].id;
        }
      }
    });
  }

  loadSuppliers(): void {
    this.http.get<any>(`${environment.apiUrl}/suppliers`).subscribe({
      next: (res) => this.suppliers.set(res.data || [])
    });
  }

  loadMovements(): void {
    this.http.get<any>(`${environment.apiUrl}/inventory/movements`).subscribe({
      next: (res) => this.movements.set(res.data || [])
    });
  }

  loadBatchesForSelectedDrug(): void {
    if (this.selectedDrugForBatches === 'ALL' || !this.selectedDrugForBatches) {
      this.http.get<any>(`${environment.apiUrl}/batches`).subscribe({
        next: (res) => this.currentDrugBatches.set(res.data || [])
      });
    } else {
      this.http.get<any>(`${environment.apiUrl}/batches/drug/${this.selectedDrugForBatches}`).subscribe({
        next: (res) => this.currentDrugBatches.set(res.data || [])
      });
    }
  }

  getBatchStatus(b: BatchItem): 'EXPIRED' | 'NEAR_EXPIRY' | 'OPTIMAL' {
    if (b.expired || (b.expiryDate && new Date(b.expiryDate) < new Date())) {
      return 'EXPIRED';
    }
    if (b.expiringSoon || this.getDaysUntilExpiry(b.expiryDate) <= 90) {
      return 'NEAR_EXPIRY';
    }
    return 'OPTIMAL';
  }

  getDaysUntilExpiry(expiryDate?: string): number {
    if (!expiryDate) return 0;
    const target = new Date(expiryDate).getTime();
    const now = new Date().getTime();
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  }

  filteredBatches(): BatchItem[] {
    const q = this.batchSearchQuery.toLowerCase().trim();
    const status = this.batchStatusFilter;
    return this.currentDrugBatches().filter(b => {
      const matchesSearch = !q ||
        b.batchNumber?.toLowerCase().includes(q) ||
        b.drugName?.toLowerCase().includes(q) ||
        b.genericName?.toLowerCase().includes(q) ||
        b.supplierName?.toLowerCase().includes(q);
      
      const bStatus = this.getBatchStatus(b);
      const matchesStatus = !status || bStatus === status;

      return matchesSearch && matchesStatus;
    });
  }

  getTotalBatchUnits(): number {
    return this.filteredBatches().reduce((sum, b) => sum + (b.quantityOnHand || 0), 0);
  }

  getTotalBatchCostValue(): number {
    return this.filteredBatches().reduce((sum, b) => sum + ((b.quantityOnHand || 0) * (b.buyingPrice || 0)), 0);
  }

  getTotalBatchRetailValue(): number {
    return this.filteredBatches().reduce((sum, b) => sum + ((b.quantityOnHand || 0) * (b.retailPrice || 0)), 0);
  }

  getPotentialBatchProfit(): number {
    return this.getTotalBatchRetailValue() - this.getTotalBatchCostValue();
  }

  getNearExpiryCount(): number {
    return this.currentDrugBatches().filter(b => this.getBatchStatus(b) === 'NEAR_EXPIRY').length;
  }

  getExpiredCount(): number {
    return this.currentDrugBatches().filter(b => this.getBatchStatus(b) === 'EXPIRED').length;
  }

  filteredMovements(): MovementItem[] {
    const q = this.movementSearchQuery.toLowerCase().trim();
    const type = this.movementTypeFilter;
    return this.movements().filter(m => {
      const matchSearch = !q ||
        m.drugName?.toLowerCase().includes(q) ||
        m.batchNumber?.toLowerCase().includes(q) ||
        m.reason?.toLowerCase().includes(q) ||
        m.performedByUsername?.toLowerCase().includes(q);
      const matchType = !type || m.movementType === type;
      return matchSearch && matchType;
    });
  }

  resetMovementFilters(): void {
    this.movementSearchQuery = '';
    this.movementTypeFilter = '';
    this.movementPage.set(1);
  }

  filteredCategories(): CategoryItem[] {
    const q = this.categorySearchQuery.toLowerCase().trim();
    if (!q) return this.categories();
    return this.categories().filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  }

  resetCategoryFilters(): void {
    this.categorySearchQuery = '';
    this.categoryPage.set(1);
  }

  viewBatchDetails(batch: BatchItem): void {
    this.selectedBatchForView = batch;
    this.showViewBatchModal.set(true);
  }

  printBatchTag(batch: BatchItem): void {
    this.selectedBatchForPrint = batch;
    this.isPrintingFullLedger = false;
    setTimeout(() => {
      window.print();
    }, 50);
  }

  printFullBatchLedger(): void {
    this.isPrintingFullLedger = true;
    this.selectedBatchForPrint = null;
    setTimeout(() => {
      window.print();
    }, 50);
  }

  closePrintView(): void {
    this.selectedBatchForPrint = null;
    this.isPrintingFullLedger = false;
  }

  filteredDrugs(): DrugItem[] {
    if (!this.selectedCategoryFilter) return this.drugs();
    return this.drugs().filter(d => d.categoryName === this.selectedCategoryFilter);
  }

  applyCategoryFilter(): void {}

  // Drug CRUD
  openDrugModal(): void {
    this.isEditingDrug.set(false);
    this.editingDrugId = null;
    this.drugForm = {
      name: '',
      genericName: '',
      categoryId: this.categories().length > 0 ? this.categories()[0].id : null,
      dosageForm: 'TABLET',
      strength: '500mg',
      unitOfMeasure: 'BOX',
      barcode: '600' + Math.floor(1000000000 + Math.random() * 9000000000),
      reorderThreshold: 20,
      prescriptionRequired: false
    };
    this.showDrugModal.set(true);
  }

  openEditDrugModal(drug: DrugItem): void {
    this.isEditingDrug.set(true);
    this.editingDrugId = drug.id;
    this.drugForm = {
      name: drug.name,
      genericName: drug.genericName,
      categoryId: drug.categoryId,
      dosageForm: drug.dosageForm,
      strength: drug.strength,
      unitOfMeasure: drug.unitOfMeasure,
      barcode: drug.barcode,
      reorderThreshold: drug.reorderThreshold,
      prescriptionRequired: drug.prescriptionRequired
    };
    this.showDrugModal.set(true);
  }

  saveDrug(): void {
    const valResult = this.validationService.validateDrug(this.drugForm);
    if (!valResult.valid) {
      this.notificationService.warning(valResult.errors[0]);
      return;
    }

    if (this.isEditingDrug() && this.editingDrugId) {
      this.http.put<any>(`${environment.apiUrl}/drugs/${this.editingDrugId}`, this.drugForm).subscribe({
        next: () => {
          this.notificationService.success('Drug catalog updated successfully!');
          this.showDrugModal.set(false);
          this.loadDrugs();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to update drug')
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/drugs`, this.drugForm).subscribe({
        next: () => {
          this.notificationService.success('New drug catalog registered!');
          this.showDrugModal.set(false);
          this.loadDrugs();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to create drug')
      });
    }
  }

  confirmDeleteDrug(drug: DrugItem): void {
    if (confirm(`Are you sure you want to delete ${drug.name}?`)) {
      this.http.delete<any>(`${environment.apiUrl}/drugs/${drug.id}`).subscribe({
        next: () => {
          this.notificationService.success('Drug deleted successfully.');
          this.loadDrugs();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Cannot delete drug with active stock')
      });
    }
  }

  // Batch CRUD
  openBatchModal(): void {
    this.isEditingBatch.set(false);
    this.editingBatchId = null;
    this.batchForm = {
      drugId: this.selectedDrugForBatches || (this.drugs().length > 0 ? this.drugs()[0].id : null),
      batchNumber: 'BAT-' + new Date().getFullYear() + '-' + Math.floor(10 + Math.random() * 90),
      expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      quantity: 100,
      buyingPrice: 100,
      retailPrice: 150,
      wholesalePrice: 130,
      distributorPrice: 120,
      supplierId: this.suppliers().length > 0 ? this.suppliers()[0].id : null
    };
    this.showBatchModal.set(true);
  }

  openEditBatchModal(batch: BatchItem): void {
    this.isEditingBatch.set(true);
    this.editingBatchId = batch.id;
    this.batchForm = {
      drugId: batch.drugId,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      quantity: batch.quantityOnHand,
      buyingPrice: batch.buyingPrice,
      retailPrice: batch.retailPrice,
      wholesalePrice: batch.wholesalePrice,
      distributorPrice: batch.distributorPrice,
      supplierId: batch.supplierId
    };
    this.showBatchModal.set(true);
  }

  saveBatch(): void {
    const valResult = this.validationService.validateBatch({
      drugId: this.batchForm.drugId,
      batchNumber: this.batchForm.batchNumber,
      expiryDate: this.batchForm.expiryDate,
      quantityOnHand: this.batchForm.quantity,
      buyingPrice: this.batchForm.buyingPrice,
      retailPrice: this.batchForm.retailPrice
    });

    if (!valResult.valid) {
      this.notificationService.warning(valResult.errors[0]);
      return;
    }

    if (this.isEditingBatch() && this.editingBatchId) {
      this.http.put<any>(`${environment.apiUrl}/batches/${this.editingBatchId}`, this.batchForm).subscribe({
        next: () => {
          this.notificationService.success('Batch updated successfully!');
          this.showBatchModal.set(false);
          this.loadBatchesForSelectedDrug();
          this.loadDrugs();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to update batch')
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/batches`, this.batchForm).subscribe({
        next: () => {
          this.notificationService.success('Batch registered to FEFO ledger!');
          this.showBatchModal.set(false);
          this.loadBatchesForSelectedDrug();
          this.loadDrugs();
          this.loadMovements();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to register batch')
      });
    }
  }

  confirmDeleteBatch(batch: BatchItem): void {
    if (confirm(`Delete batch ${batch.batchNumber}?`)) {
      this.http.delete<any>(`${environment.apiUrl}/batches/${batch.id}`).subscribe({
        next: () => {
          this.notificationService.success('Batch deleted.');
          this.loadBatchesForSelectedDrug();
          this.loadDrugs();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Cannot delete batch with active stock')
      });
    }
  }

  // Stock Adjustment
  openAdjustModal(): void {
    this.http.get<any>(`${environment.apiUrl}/batches`).subscribe({
      next: (res) => {
        const list = res.data || [];
        this.allBatches.set(list);
        if (list.length > 0) {
          const match = this.selectedDrugForBatches
            ? list.find((b: any) => b.drugId === this.selectedDrugForBatches)
            : null;
          this.adjustForm.batchId = match ? match.id : list[0].id;
        }
        this.showAdjustModal.set(true);
      },
      error: () => this.showAdjustModal.set(true)
    });
  }

  saveAdjustment(): void {
    if (!this.adjustForm.batchId) {
      this.notificationService.warning('Please select a batch to adjust');
      return;
    }
    const qty = Number(this.adjustForm.quantityAdjusted);
    if (isNaN(qty) || qty === 0) {
      this.notificationService.warning('Quantity adjusted cannot be zero');
      return;
    }

    let movementType = 'MANUAL_ADJUSTMENT';
    if (this.adjustForm.reason === 'DAMAGED_EXPIRED') {
      movementType = 'DAMAGE_WRITE_OFF';
    } else if (this.adjustForm.reason === 'RETURN_TO_SUPPLIER') {
      movementType = 'PURCHASE_RETURN';
    }

    const reasonText = this.adjustForm.notes && this.adjustForm.notes.trim().length > 0
      ? `${this.adjustForm.reason}: ${this.adjustForm.notes.trim()}`
      : (this.adjustForm.reason || 'MANUAL_ADJUSTMENT');

    const payload = {
      batchId: Number(this.adjustForm.batchId),
      movementType: movementType,
      quantityDelta: qty,
      reason: reasonText
    };

    this.http.post<any>(`${environment.apiUrl}/inventory/adjust`, payload).subscribe({
      next: () => {
        this.notificationService.success('Stock adjustment applied and logged in Immutable Ledger!');
        this.showAdjustModal.set(false);
        this.loadBatchesForSelectedDrug();
        this.loadDrugs();
        this.loadMovements();
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Failed to adjust stock')
    });
  }

  // Category CRUD
  openCreateCategoryModal(): void {
    this.isEditingCategory.set(false);
    this.editingCategoryId = null;
    this.categoryForm = { name: '', description: '' };
    this.showCategoryModal.set(true);
  }

  openEditCategoryModal(cat: CategoryItem): void {
    this.isEditingCategory.set(true);
    this.editingCategoryId = cat.id;
    this.categoryForm = { name: cat.name, description: cat.description };
    this.showCategoryModal.set(true);
  }

  saveCategory(): void {
    if (!this.validationService.isNotEmpty(this.categoryForm.name, 2)) {
      this.notificationService.warning('Category name must be at least 2 characters');
      return;
    }

    if (this.isEditingCategory() && this.editingCategoryId) {
      this.http.put<any>(`${environment.apiUrl}/drugs/categories/${this.editingCategoryId}`, this.categoryForm).subscribe({
        next: () => {
          this.notificationService.success('Category updated.');
          this.showCategoryModal.set(false);
          this.loadCategories();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to update category')
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/drugs/categories`, this.categoryForm).subscribe({
        next: () => {
          this.notificationService.success('Category created.');
          this.showCategoryModal.set(false);
          this.loadCategories();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to create category')
      });
    }
  }

  deleteCategory(cat: CategoryItem): void {
    if (confirm(`Delete category "${cat.name}"?`)) {
      this.http.delete<any>(`${environment.apiUrl}/drugs/categories/${cat.id}`).subscribe({
        next: () => {
          this.notificationService.success('Category deleted.');
          this.loadCategories();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to delete category')
      });
    }
  }
}
