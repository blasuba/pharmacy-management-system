import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { ValidationService } from '../../core/services/validation.service';
import { PaginationComponent, PaginatePipe } from '../../shared';

export interface FixedAssetItem {
  id: number;
  assetCode: string;
  name: string;
  category: string;
  description: string;
  purchaseDate: string;
  purchaseCost: number;
  supplierId: number | null;
  supplierName: string | null;
  location: string;
  serialNumber: string;
  warrantyExpiry: string | null;
  usefulLifeYears: number;
  salvageValue: number;
  depreciationMethod: string;
  currentBookValue: number;
  status: 'ACTIVE' | 'UNDER_MAINTENANCE' | 'DISPOSED' | 'SOLD' | 'LOST';
  assignedToId: number | null;
  assignedToName: string | null;
  assignedDate: string | null;
  assignmentNotes: string | null;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;
  warrantyExpiringSoon: boolean;
  nearEndOfLife: boolean;
  totalMaintenanceCost: number;
  replacementSuggested: boolean;
}

export interface DepreciationItem {
  id: number;
  assetId: number;
  assetCode: string;
  assetName: string;
  fiscalYear: number;
  openingValue: number;
  depreciationAmount: number;
  closingValue: number;
  locked: boolean;
  createdAt: string;
}

export interface MaintenanceItem {
  id: number;
  assetId: number;
  assetCode: string;
  assetName: string;
  maintenanceDate: string;
  description: string;
  cost: number;
  performedBy: string;
  nextMaintenanceDate: string | null;
  createdByUsername: string;
  createdAt: string;
}

export interface DisposalItem {
  id: number;
  assetId: number;
  assetCode: string;
  assetName: string;
  disposalDate: string;
  disposalType: 'SOLD' | 'DISPOSED' | 'LOST';
  salePrice: number;
  bookValueAtDisposal: number;
  gainLoss: number;
  reason: string;
  approvedByUsername: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalAssetsCount: number;
  totalPurchaseValue: number;
  totalCurrentBookValue: number;
  totalDepreciationThisYear: number;
  activeAssetsCount: number;
  assetsUnderMaintenanceCount: number;
  disposedAssetsCount: number;
  warrantyAlertsCount: number;
  replacementAlertsCount: number;
  expiringWarrantyAssets: FixedAssetItem[];
  replacementDueAssets: FixedAssetItem[];
  recentMaintenances: MaintenanceItem[];
}

@Component({
  selector: 'app-fixed-assets',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent, PaginatePipe],
  template: `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 20px 24px; border-radius: 12px; border: 1px solid var(--slate-200); box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 38px; height: 38px; border-radius: 8px; background: #fdf2f8; color: #db2777; display: flex; align-items: center; justify-content: center;">
              <lucide-icon name="monitor" [size]="22"></lucide-icon>
            </div>
            <div>
              <h1 style="font-size: 20px; font-weight: 800; color: var(--slate-900); margin: 0; letter-spacing: -0.5px;">Fixed Assets & Hardware</h1>
              <p style="font-size: 13px; color: var(--slate-500); margin: 0;">Capital equipment, IT assets, depreciation schedules, maintenance logs & disposals</p>
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button (click)="exportExcel()" class="btn btn-outline" style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px;">
            <lucide-icon name="file-spreadsheet" [size]="15" color="#059669"></lucide-icon>
            Export Excel
          </button>
          <button (click)="exportPdf()" class="btn btn-outline" style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px;">
            <lucide-icon name="file-down" [size]="15" color="#dc2626"></lucide-icon>
            Export PDF
          </button>
          <button *ngIf="canManageAssets()" (click)="openRunDepreciationModal()" class="btn btn-outline" style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; border-color: #818cf8; color: #4f46e5;">
            <lucide-icon name="trending-down" [size]="15"></lucide-icon>
            Run Depreciation
          </button>
          <button *ngIf="canManageAssets()" (click)="openCreateModal()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px;">
            <lucide-icon name="plus" [size]="16"></lucide-icon>
            Register Asset
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
        <div class="kpi-card" style="border-left: 4px solid #3b82f6;">
          <div class="kpi-title">Total Capital Assets</div>
          <div class="kpi-value">{{ metrics()?.totalAssetsCount || assets().length }}</div>
          <div class="kpi-subtext">Active: {{ metrics()?.activeAssetsCount || 0 }} | Disposed: {{ metrics()?.disposedAssetsCount || 0 }}</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #10b981;">
          <div class="kpi-title">Total Purchase Cost</div>
          <div class="kpi-value">ETB {{ (metrics()?.totalPurchaseValue || totalAcquisitionCost()) | number:'1.2-2' }}</div>
          <div class="kpi-subtext">Historical acquisition value</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #8b5cf6;">
          <div class="kpi-title">Current Net Book Value</div>
          <div class="kpi-value">ETB {{ (metrics()?.totalCurrentBookValue || totalCurrentBookValue()) | number:'1.2-2' }}</div>
          <div class="kpi-subtext">After straight-line depreciation</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #f59e0b;">
          <div class="kpi-title">Depreciation This Year</div>
          <div class="kpi-value">ETB {{ (metrics()?.totalDepreciationThisYear || 0) | number:'1.2-2' }}</div>
          <div class="kpi-subtext">Current fiscal year write-off</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #ef4444;">
          <div class="kpi-title">Action Alerts</div>
          <div class="kpi-value" style="color: #dc2626;">{{ (metrics()?.warrantyAlertsCount || 0) + (metrics()?.replacementAlertsCount || 0) }}</div>
          <div class="kpi-subtext">{{ metrics()?.warrantyAlertsCount || 0 }} warranty, {{ metrics()?.replacementAlertsCount || 0 }} replace due</div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div style="display: flex; gap: 8px; border-bottom: 2px solid var(--slate-200); padding-bottom: 2px;">
        <button (click)="activeTab.set('register')" [class.active-tab]="activeTab() === 'register'" class="tab-btn">
          <lucide-icon name="monitor" [size]="16"></lucide-icon>
          Asset Register & Inventory ({{ assets().length }})
        </button>
        <button (click)="activeTab.set('depreciation'); loadDepreciationsForSelected()" [class.active-tab]="activeTab() === 'depreciation'" class="tab-btn">
          <lucide-icon name="trending-down" [size]="16"></lucide-icon>
          Depreciation Schedules & Engine
        </button>
        <button (click)="activeTab.set('maintenance'); loadMaintenances()" [class.active-tab]="activeTab() === 'maintenance'" class="tab-btn">
          <lucide-icon name="wrench" [size]="16"></lucide-icon>
          Maintenance & Repair Logs
        </button>
        <button (click)="activeTab.set('disposals'); loadDisposals()" [class.active-tab]="activeTab() === 'disposals'" class="tab-btn">
          <lucide-icon name="archive" [size]="16"></lucide-icon>
          Disposals & Gain/Loss Ledger
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 1: ASSET REGISTER & INVENTORY                                        -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'register'" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Filters Bar -->
        <div style="background: #fff; padding: 14px 18px; border-radius: 10px; border: 1px solid var(--slate-200); display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          <div style="position: relative; flex: 1; min-width: 200px;">
            <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; top: 10px; color: var(--slate-400);"></lucide-icon>
            <input type="text" [(ngModel)]="searchQuery" (input)="filterAssets()" placeholder="Search asset name, code, serial number..." class="form-control" style="padding-left: 36px; height: 38px; font-size: 13px;" />
          </div>

          <select [(ngModel)]="selectedCategory" (change)="filterAssets()" class="form-control" style="width: 170px; height: 38px; font-size: 13px;">
            <option value="">All Categories</option>
            <option value="LAPTOP">Laptops</option>
            <option value="DESKTOP">Desktops & Workstations</option>
            <option value="REFRIGERATOR">Refrigerators & Freezers</option>
            <option value="AC">Air Conditioners (AC)</option>
            <option value="POS_TERMINAL">POS Terminals</option>
            <option value="GENERATOR">Generators & Power</option>
            <option value="SECURITY_CAMERA">Security Cameras</option>
            <option value="FURNITURE">Furniture & Fixtures</option>
            <option value="OTHER">Other Assets</option>
          </select>

          <select [(ngModel)]="selectedStatus" (change)="filterAssets()" class="form-control" style="width: 160px; height: 38px; font-size: 13px;">
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="DISPOSED">Disposed</option>
            <option value="SOLD">Sold</option>
            <option value="LOST">Lost</option>
          </select>

          <button (click)="resetFilters()" class="btn btn-outline" style="height: 38px; font-size: 12px;">Reset</button>
        </div>

        <!-- Asset Table -->
        <div style="background: #fff; border-radius: 10px; border: 1px solid var(--slate-200); overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <app-pagination
            [totalItems]="filteredAssets().length"
            [pageSize]="assetPageSize()"
            [currentPage]="assetPage()"
            (pageChange)="assetPage.set($event)"
            (pageSizeChange)="assetPageSize.set($event); assetPage.set(1)">
          </app-pagination>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
              <thead style="background: #f8fafc; color: var(--slate-600); border-bottom: 1px solid var(--slate-200);">
                <tr>
                  <th style="padding: 12px 16px;">Asset Code</th>
                  <th style="padding: 12px 16px;">Name & Category</th>
                  <th style="padding: 12px 16px;">Location / Serial</th>
                  <th style="padding: 12px 16px;">Purchase Date & Cost</th>
                  <th style="padding: 12px 16px;">Book Value</th>
                  <th style="padding: 12px 16px;">Assigned Staff</th>
                  <th style="padding: 12px 16px;">Status</th>
                  <th style="padding: 12px 16px; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let asset of (filteredAssets() | paginate: assetPage() : assetPageSize())" style="border-bottom: 1px solid var(--slate-100); transition: background 0.15s;" [style.background]="asset.status === 'DISPOSED' || asset.status === 'SOLD' ? '#f8fafc' : '#ffffff'">
                  <td style="padding: 12px 16px; font-weight: 700; color: #0284c7;">
                    <code>{{ asset.assetCode }}</code>
                  </td>
                  <td style="padding: 12px 16px;">
                    <div style="font-weight: 700; color: var(--slate-900);">{{ asset.name }}</div>
                    <span class="badge" style="background: #f1f5f9; color: var(--slate-600); font-size: 11px; margin-top: 2px;">{{ asset.category }}</span>
                    <span *ngIf="asset.warrantyExpiringSoon" class="badge" style="background: #fef3c7; color: #b45309; font-size: 10px; margin-left: 4px;">Warranty Due</span>
                    <span *ngIf="asset.replacementSuggested" class="badge" style="background: #fee2e2; color: #b91c1c; font-size: 10px; margin-left: 4px;">Replace Suggested</span>
                  </td>
                  <td style="padding: 12px 16px; color: var(--slate-600);">
                    <div><lucide-icon name="map-pin" [size]="12" style="display: inline; vertical-align: middle;"></lucide-icon> {{ asset.location || 'Unassigned Area' }}</div>
                    <div style="font-size: 11px; color: var(--slate-400);">SN: {{ asset.serialNumber || 'N/A' }}</div>
                  </td>
                  <td style="padding: 12px 16px;">
                    <div style="font-weight: 700; color: var(--slate-800);">ETB {{ asset.purchaseCost | number:'1.2-2' }}</div>
                    <div style="font-size: 11px; color: var(--slate-400);">{{ asset.purchaseDate | date:'mediumDate' }} ({{ asset.usefulLifeYears }} yrs)</div>
                  </td>
                  <td style="padding: 12px 16px;">
                    <div style="font-weight: 800; color: #4338ca;">ETB {{ asset.currentBookValue | number:'1.2-2' }}</div>
                    <div style="width: 80px; height: 4px; background: #e2e8f0; border-radius: 2px; margin-top: 4px; overflow: hidden;">
                      <div [style.width.%]="getBookValuePercent(asset)" style="height: 100%; background: #6366f1;"></div>
                    </div>
                  </td>
                  <td style="padding: 12px 16px;">
                    <span *ngIf="asset.assignedToName" class="badge badge-primary" style="display: inline-flex; align-items: center; gap: 4px;">
                      <lucide-icon name="user" [size]="11"></lucide-icon>
                      {{ asset.assignedToName }}
                    </span>
                    <span *ngIf="!asset.assignedToName" style="color: var(--slate-400); font-style: italic; font-size: 12px;">Unassigned</span>
                  </td>
                  <td style="padding: 12px 16px;">
                    <span [ngClass]="getStatusBadgeClass(asset.status)">{{ asset.status }}</span>
                  </td>
                  <td style="padding: 12px 16px; text-align: right;">
                    <div style="display: flex; gap: 6px; justify-content: flex-end;">
                      <button (click)="openDetailModal(asset)" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px;" title="View Details">
                        <lucide-icon name="eye" [size]="13"></lucide-icon>
                      </button>
                      <button *ngIf="canManageAssets() && asset.status !== 'DISPOSED' && asset.status !== 'SOLD'" (click)="openEditModal(asset)" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px;" title="Edit Asset">
                        <lucide-icon name="edit" [size]="13"></lucide-icon>
                      </button>
                      <button *ngIf="canManageAssets() && asset.status === 'ACTIVE'" (click)="openAssignModal(asset)" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; color: #0284c7; border-color: #bae6fd;" title="Assign / Reassign">
                        <lucide-icon name="user-check" [size]="13"></lucide-icon>
                      </button>
                      <button *ngIf="canManageAssets() && asset.status !== 'DISPOSED' && asset.status !== 'SOLD'" (click)="openMaintenanceModal(asset)" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; color: #d97706; border-color: #fde68a;" title="Log Maintenance">
                        <lucide-icon name="wrench" [size]="13"></lucide-icon>
                      </button>
                      <button *ngIf="canApproveDisposals() && asset.status !== 'DISPOSED' && asset.status !== 'SOLD'" (click)="openDisposeModal(asset)" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; color: #dc2626; border-color: #fecaca;" title="Dispose / Sell">
                        <lucide-icon name="archive" [size]="13"></lucide-icon>
                      </button>
                      <button *ngIf="isSuperAdmin()" (click)="deleteAsset(asset)" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; color: #dc2626;" title="Delete Asset">
                        <lucide-icon name="trash-2" [size]="13"></lucide-icon>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="filteredAssets().length === 0">
                  <td colspan="8" style="text-align: center; padding: 36px; color: var(--slate-400);">
                    <lucide-icon name="monitor" [size]="32" style="margin-bottom: 8px; opacity: 0.4;"></lucide-icon>
                    <div>No fixed assets found matching the criteria.</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 2: DEPRECIATION SCHEDULES & ENGINE                                   -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'depreciation'" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: #fff; padding: 18px 20px; border-radius: 10px; border: 1px solid var(--slate-200); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-size: 15px; font-weight: 800; color: var(--slate-900); margin: 0;">Straight-Line Depreciation Engine</h3>
            <p style="font-size: 12px; color: var(--slate-500); margin: 4px 0 0;">Annual Depreciation = (Purchase Cost - Salvage Value) / Useful Life</p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <select [(ngModel)]="selectedAssetForDeprec" (change)="loadDepreciationsForSelected()" class="form-control" style="width: 260px; font-size: 13px;">
              <option [ngValue]="null">-- Select Specific Asset --</option>
              <option *ngFor="let a of assets()" [ngValue]="a.id">{{ a.assetCode }} - {{ a.name }}</option>
            </select>
            <button *ngIf="canManageAssets()" (click)="openRunDepreciationModal()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px;">
              <lucide-icon name="trending-down" [size]="15"></lucide-icon>
              Run Batch Depreciation
            </button>
          </div>
        </div>

        <div style="background: #fff; border-radius: 10px; border: 1px solid var(--slate-200); overflow: hidden;">
          <app-pagination
            [totalItems]="depreciations().length"
            [pageSize]="deprPageSize()"
            [currentPage]="deprPage()"
            (pageChange)="deprPage.set($event)"
            (pageSizeChange)="deprPageSize.set($event); deprPage.set(1)">
          </app-pagination>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
            <thead style="background: #f8fafc; color: var(--slate-600); border-bottom: 1px solid var(--slate-200);">
              <tr>
                <th style="padding: 12px 16px;">Fiscal Year</th>
                <th style="padding: 12px 16px;">Asset Code & Name</th>
                <th style="padding: 12px 16px;">Opening Book Value</th>
                <th style="padding: 12px 16px;">Depreciation Amount</th>
                <th style="padding: 12px 16px;">Closing Book Value</th>
                <th style="padding: 12px 16px;">Status</th>
                <th style="padding: 12px 16px;">Calculated Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of (depreciations() | paginate: deprPage() : deprPageSize())" style="border-bottom: 1px solid var(--slate-100);">
                <td style="padding: 12px 16px; font-weight: 800; color: #0284c7;">FY {{ d.fiscalYear }}</td>
                <td style="padding: 12px 16px;">
                  <div style="font-weight: 700;">{{ d.assetName }}</div>
                  <code style="font-size: 11px;">{{ d.assetCode }}</code>
                </td>
                <td style="padding: 12px 16px; font-weight: 600;">ETB {{ d.openingValue | number:'1.2-2' }}</td>
                <td style="padding: 12px 16px; font-weight: 800; color: #dc2626;">- ETB {{ d.depreciationAmount | number:'1.2-2' }}</td>
                <td style="padding: 12px 16px; font-weight: 800; color: #059669;">ETB {{ d.closingValue | number:'1.2-2' }}</td>
                <td style="padding: 12px 16px;">
                  <span class="badge badge-success" *ngIf="d.locked">LOCKED</span>
                </td>
                <td style="padding: 12px 16px; color: var(--slate-400); font-size: 12px;">{{ d.createdAt | date:'short' }}</td>
              </tr>
              <tr *ngIf="depreciations().length === 0">
                <td colspan="7" style="text-align: center; padding: 36px; color: var(--slate-400);">
                  No depreciation records found. Run batch depreciation to generate schedules.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 3: MAINTENANCE LOGS                                                  -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'maintenance'" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: #fff; padding: 18px 20px; border-radius: 10px; border: 1px solid var(--slate-200); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="font-size: 15px; font-weight: 800; color: var(--slate-900); margin: 0;">Equipment Service & Repair Logs</h3>
            <p style="font-size: 12px; color: var(--slate-500); margin: 4px 0 0;">Track maintenance history, repair costs, vendor details & service reminders</p>
          </div>
          <button *ngIf="canManageAssets()" (click)="openNewMaintenanceModal()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px;">
            <lucide-icon name="plus" [size]="15"></lucide-icon>
            Log Maintenance
          </button>
        </div>

        <div style="background: #fff; border-radius: 10px; border: 1px solid var(--slate-200); overflow: hidden;">
          <app-pagination
            [totalItems]="maintenances().length"
            [pageSize]="maintPageSize()"
            [currentPage]="maintPage()"
            (pageChange)="maintPage.set($event)"
            (pageSizeChange)="maintPageSize.set($event); maintPage.set(1)">
          </app-pagination>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
            <thead style="background: #f8fafc; color: var(--slate-600); border-bottom: 1px solid var(--slate-200);">
              <tr>
                <th style="padding: 12px 16px;">Service Date</th>
                <th style="padding: 12px 16px;">Asset Code & Name</th>
                <th style="padding: 12px 16px;">Description / Problem</th>
                <th style="padding: 12px 16px;">Cost (ETB)</th>
                <th style="padding: 12px 16px;">Performed By</th>
                <th style="padding: 12px 16px;">Next Service Due</th>
                <th style="padding: 12px 16px;">Logged By</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let m of (maintenances() | paginate: maintPage() : maintPageSize())" style="border-bottom: 1px solid var(--slate-100);">
                <td style="padding: 12px 16px; font-weight: 700;">{{ m.maintenanceDate | date:'mediumDate' }}</td>
                <td style="padding: 12px 16px;">
                  <div style="font-weight: 700;">{{ m.assetName }}</div>
                  <code>{{ m.assetCode }}</code>
                </td>
                <td style="padding: 12px 16px; color: var(--slate-700); max-width: 300px;">{{ m.description }}</td>
                <td style="padding: 12px 16px; font-weight: 800; color: #b45309;">ETB {{ m.cost | number:'1.2-2' }}</td>
                <td style="padding: 12px 16px; color: var(--slate-600);">{{ m.performedBy || 'Internal Staff' }}</td>
                <td style="padding: 12px 16px; color: var(--slate-600);">{{ m.nextMaintenanceDate ? (m.nextMaintenanceDate | date:'mediumDate') : 'None set' }}</td>
                <td style="padding: 12px 16px; color: var(--slate-500);"><code>&#64;{{ m.createdByUsername }}</code></td>
              </tr>
              <tr *ngIf="maintenances().length === 0">
                <td colspan="7" style="text-align: center; padding: 36px; color: var(--slate-400);">
                  No maintenance records logged yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 4: DISPOSALS & GAIN/LOSS LEDGER                                      -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab() === 'disposals'" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: #fff; padding: 18px 20px; border-radius: 10px; border: 1px solid var(--slate-200);">
          <h3 style="font-size: 15px; font-weight: 800; color: var(--slate-900); margin: 0;">Disposal & Gain/Loss Accounting Ledger</h3>
          <p style="font-size: 12px; color: var(--slate-500); margin: 4px 0 0;">Immutable record of sold, scrapped, and lost assets with gain/loss calculations (Sale Price - Current Book Value)</p>
        </div>

        <div style="background: #fff; border-radius: 10px; border: 1px solid var(--slate-200); overflow: hidden;">
          <app-pagination
            [totalItems]="disposals().length"
            [pageSize]="dispPageSize()"
            [currentPage]="dispPage()"
            (pageChange)="dispPage.set($event)"
            (pageSizeChange)="dispPageSize.set($event); dispPage.set(1)">
          </app-pagination>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
            <thead style="background: #f8fafc; color: var(--slate-600); border-bottom: 1px solid var(--slate-200);">
              <tr>
                <th style="padding: 12px 16px;">Disposal Date</th>
                <th style="padding: 12px 16px;">Asset Code & Name</th>
                <th style="padding: 12px 16px;">Type</th>
                <th style="padding: 12px 16px;">Book Value at Disposal</th>
                <th style="padding: 12px 16px;">Sale Proceeds</th>
                <th style="padding: 12px 16px;">Net Gain / Loss</th>
                <th style="padding: 12px 16px;">Reason & Justification</th>
                <th style="padding: 12px 16px;">Approved By</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of (disposals() | paginate: dispPage() : dispPageSize())" style="border-bottom: 1px solid var(--slate-100);">
                <td style="padding: 12px 16px; font-weight: 700;">{{ d.disposalDate | date:'mediumDate' }}</td>
                <td style="padding: 12px 16px;">
                  <div style="font-weight: 700;">{{ d.assetName }}</div>
                  <code>{{ d.assetCode }}</code>
                </td>
                <td style="padding: 12px 16px;">
                  <span class="badge" [ngClass]="d.disposalType === 'SOLD' ? 'badge-success' : 'badge-danger'">{{ d.disposalType }}</span>
                </td>
                <td style="padding: 12px 16px; font-weight: 600;">ETB {{ d.bookValueAtDisposal | number:'1.2-2' }}</td>
                <td style="padding: 12px 16px; font-weight: 700; color: #0284c7;">ETB {{ d.salePrice | number:'1.2-2' }}</td>
                <td style="padding: 12px 16px; font-weight: 800;" [style.color]="d.gainLoss >= 0 ? '#059669' : '#dc2626'">
                  {{ d.gainLoss >= 0 ? '+' : '' }}ETB {{ d.gainLoss | number:'1.2-2' }}
                  <span style="font-size: 10px; font-weight: 600; display: block;">{{ d.gainLoss >= 0 ? 'GAIN ON SALE' : 'LOSS ON DISPOSAL' }}</span>
                </td>
                <td style="padding: 12px 16px; color: var(--slate-600); max-width: 250px;">{{ d.reason || 'N/A' }}</td>
                <td style="padding: 12px 16px; color: var(--slate-500);"><code>&#64;{{ d.approvedByUsername || 'Admin' }}</code></td>
              </tr>
              <tr *ngIf="disposals().length === 0">
                <td colspan="8" style="text-align: center; padding: 36px; color: var(--slate-400);">
                  No assets have been disposed or sold yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- MODAL: ADD / EDIT ASSET                                                  -->
      <!-- ========================================================================= -->
      <div *ngIf="showAssetModal()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
        <div style="background: #fff; border-radius: 12px; width: 100%; max-width: 650px; max-height: 90vh; overflow-y: auto; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 12px;">
            <h3 style="font-size: 16px; font-weight: 800; color: var(--slate-900); margin: 0;">
              {{ isEditingAsset() ? 'Edit Fixed Asset' : 'Register New Capital Asset' }}
            </h3>
            <button (click)="showAssetModal.set(false)" class="btn btn-outline" style="padding: 4px 8px;"><lucide-icon name="x" [size]="14"></lucide-icon></button>
          </div>

          <form (ngSubmit)="saveAsset()" style="display: flex; flex-direction: column; gap: 14px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; font-weight: 700;">Asset Name *</label>
                <input type="text" [(ngModel)]="assetForm.name" name="name" required class="form-control" placeholder="e.g. Dell Latitude 5540" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">Category *</label>
                <select [(ngModel)]="assetForm.category" name="category" required class="form-control">
                  <option value="LAPTOP">Laptop Computer</option>
                  <option value="DESKTOP">Desktop / Workstation</option>
                  <option value="REFRIGERATOR">Refrigerator / Freezer</option>
                  <option value="AC">Air Conditioner (AC)</option>
                  <option value="POS_TERMINAL">POS Terminal / Scanner</option>
                  <option value="GENERATOR">Generator / UPS Power</option>
                  <option value="SECURITY_CAMERA">Security Camera / DVR</option>
                  <option value="FURNITURE">Furniture & Fixtures</option>
                  <option value="OTHER">Other Capital Asset</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; font-weight: 700;">Purchase Date *</label>
                <input type="date" [(ngModel)]="assetForm.purchaseDate" name="purchaseDate" required class="form-control" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">Purchase Cost (ETB) *</label>
                <input type="number" [(ngModel)]="assetForm.purchaseCost" name="purchaseCost" required min="1" step="0.01" class="form-control" placeholder="50000.00" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; font-weight: 700;">Useful Life (Years) *</label>
                <input type="number" [(ngModel)]="assetForm.usefulLifeYears" name="usefulLifeYears" required min="1" class="form-control" placeholder="5" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">Estimated Salvage Value (ETB)</label>
                <input type="number" [(ngModel)]="assetForm.salvageValue" name="salvageValue" min="0" step="0.01" class="form-control" placeholder="0.00" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; font-weight: 700;">Physical Location</label>
                <input type="text" [(ngModel)]="assetForm.location" name="location" class="form-control" placeholder="e.g. Dispensing Counter 1, Server Room" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">Serial Number</label>
                <input type="text" [(ngModel)]="assetForm.serialNumber" name="serialNumber" class="form-control" placeholder="e.g. SN-9988220" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; font-weight: 700;">Warranty Expiry Date</label>
                <input type="date" [(ngModel)]="assetForm.warrantyExpiry" name="warrantyExpiry" class="form-control" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">Supplier / Vendor</label>
                <select [(ngModel)]="assetForm.supplierId" name="supplierId" class="form-control">
                  <option [ngValue]="null">-- No Supplier Linked --</option>
                  <option *ngFor="let s of suppliers()" [ngValue]="s.id">{{ s.name }}</option>
                </select>
              </div>
            </div>

            <div>
              <label style="font-size: 12px; font-weight: 700;">Description & Specifications</label>
              <textarea [(ngModel)]="assetForm.description" name="description" class="form-control" rows="2" placeholder="Technical specs, serials, accessories included..."></textarea>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 14px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
              <button type="button" (click)="showAssetModal.set(false)" class="btn btn-outline" style="flex: 1;">Cancel</button>
              <button type="submit" class="btn btn-primary" style="flex: 2;">{{ isEditingAsset() ? 'Update Asset' : 'Register & Save' }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- MODAL: ASSIGN / RETURN ASSET                                             -->
      <!-- ========================================================================= -->
      <div *ngIf="showAssignModal()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
        <div style="background: #fff; border-radius: 12px; width: 100%; max-width: 480px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 12px;">
            <h3 style="font-size: 16px; font-weight: 800; color: var(--slate-900); margin: 0;">
              Assign Asset: {{ selectedAsset()?.assetCode }}
            </h3>
            <button (click)="showAssignModal.set(false)" class="btn btn-outline" style="padding: 4px 8px;"><lucide-icon name="x" [size]="14"></lucide-icon></button>
          </div>

          <div *ngIf="selectedAsset()?.assignedToName" style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
            <div style="font-size: 12px; color: #166534; font-weight: 700;">Currently Assigned To:</div>
            <div style="font-size: 14px; font-weight: 800; color: #15803d;">{{ selectedAsset()?.assignedToName }} (Since {{ selectedAsset()?.assignedDate | date:'mediumDate' }})</div>
            <button (click)="returnAsset(selectedAsset()!)" class="btn btn-outline" style="margin-top: 8px; font-size: 11px; color: #dc2626; border-color: #fca5a5;">
              <lucide-icon name="undo-2" [size]="12"></lucide-icon> Return Asset to Inventory
            </button>
          </div>

          <form (ngSubmit)="saveAssignment()" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="font-size: 12px; font-weight: 700;">Assign to Staff Member *</label>
              <select [(ngModel)]="assignForm.userId" name="userId" required class="form-control">
                <option [ngValue]="null" disabled>-- Select Staff Member ({{ staffUsers().length }} Available) --</option>
                <option *ngFor="let u of staffUsers()" [ngValue]="u.id">
                  {{ u.fullName || u.username }} (&#64;{{ u.username }}) - {{ u.roleName || (u.roles && u.roles[0]) || 'Staff' }}
                </option>
              </select>
              <div *ngIf="staffUsers().length === 0" style="font-size: 11px; color: #dc2626; margin-top: 4px;">
                No staff users loaded. Click to refresh or check staff accounts.
              </div>
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700;">Assignment Date *</label>
              <input type="date" [(ngModel)]="assignForm.assignedDate" name="assignedDate" required class="form-control" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700;">Notes / Handover Agreement</label>
              <textarea [(ngModel)]="assignForm.notes" name="notes" class="form-control" rows="2" placeholder="Condition of item at handover..."></textarea>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 14px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
              <button type="button" (click)="showAssignModal.set(false)" class="btn btn-outline" style="flex: 1;">Cancel</button>
              <button type="submit" class="btn btn-primary" style="flex: 2;">Confirm Assignment</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- MODAL: LOG MAINTENANCE                                                   -->
      <!-- ========================================================================= -->
      <div *ngIf="showMaintenanceModal()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
        <div style="background: #fff; border-radius: 12px; width: 100%; max-width: 500px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 12px;">
            <h3 style="font-size: 16px; font-weight: 800; color: var(--slate-900); margin: 0;">
              Log Maintenance / Repair
            </h3>
            <button (click)="showMaintenanceModal.set(false)" class="btn btn-outline" style="padding: 4px 8px;"><lucide-icon name="x" [size]="14"></lucide-icon></button>
          </div>

          <form (ngSubmit)="saveMaintenance()" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="font-size: 12px; font-weight: 700;">Target Asset *</label>
              <select [(ngModel)]="maintenanceForm.assetId" name="assetId" required class="form-control" [disabled]="!!selectedAsset()">
                <option *ngFor="let a of assets()" [ngValue]="a.id">{{ a.assetCode }} - {{ a.name }}</option>
              </select>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="font-size: 12px; font-weight: 700;">Service Date *</label>
                <input type="date" [(ngModel)]="maintenanceForm.maintenanceDate" name="maintenanceDate" required class="form-control" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">Cost (ETB) *</label>
                <input type="number" [(ngModel)]="maintenanceForm.cost" name="cost" required min="0" step="0.01" class="form-control" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700;">Work Done / Diagnosis *</label>
              <textarea [(ngModel)]="maintenanceForm.description" name="description" required class="form-control" rows="2" placeholder="e.g. Replaced cooling fan, OS reinstallation..."></textarea>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="font-size: 12px; font-weight: 700;">Service Provider / Vendor</label>
                <input type="text" [(ngModel)]="maintenanceForm.performedBy" name="performedBy" class="form-control" placeholder="e.g. Internal IT, Apex Tech Services" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">Next Service Reminder</label>
                <input type="date" [(ngModel)]="maintenanceForm.nextMaintenanceDate" name="nextMaintenanceDate" class="form-control" />
              </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 14px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
              <button type="button" (click)="showMaintenanceModal.set(false)" class="btn btn-outline" style="flex: 1;">Cancel</button>
              <button type="submit" class="btn btn-primary" style="flex: 2;">Save Maintenance Record</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- MODAL: DISPOSE / SELL ASSET                                              -->
      <!-- ========================================================================= -->
      <div *ngIf="showDisposeModal()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
        <div style="background: #fff; border-radius: 12px; width: 100%; max-width: 500px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 12px;">
            <h3 style="font-size: 16px; font-weight: 800; color: #dc2626; margin: 0;">
              Dispose / Sell Asset: {{ selectedAsset()?.assetCode }}
            </h3>
            <button (click)="showDisposeModal.set(false)" class="btn btn-outline" style="padding: 4px 8px;"><lucide-icon name="x" [size]="14"></lucide-icon></button>
          </div>

          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 8px; margin-bottom: 14px;">
            <div style="font-size: 12px; color: #991b1b; font-weight: 700;">Current Book Value:</div>
            <div style="font-size: 15px; font-weight: 800; color: #b91c1c;">ETB {{ selectedAsset()?.currentBookValue | number:'1.2-2' }}</div>
          </div>

          <form (ngSubmit)="saveDisposal()" style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <label style="font-size: 12px; font-weight: 700;">Disposal Date *</label>
                <input type="date" [(ngModel)]="disposeForm.disposalDate" name="disposalDate" required class="form-control" />
              </div>
              <div>
                <label style="font-size: 12px; font-weight: 700;">Disposal Type *</label>
                <select [(ngModel)]="disposeForm.disposalType" name="disposalType" required class="form-control">
                  <option value="SOLD">Sold / Liquidated</option>
                  <option value="DISPOSED">Scrapped / Written-off</option>
                  <option value="LOST">Lost / Stolen</option>
                </select>
              </div>
            </div>

            <div *ngIf="disposeForm.disposalType === 'SOLD'">
              <label style="font-size: 12px; font-weight: 700;">Sale Price (ETB) *</label>
              <input type="number" [(ngModel)]="disposeForm.salePrice" name="salePrice" min="0" step="0.01" class="form-control" placeholder="0.00" />
              <div style="font-size: 12px; margin-top: 4px;" [style.color]="getProjectedGainLoss() >= 0 ? '#059669' : '#dc2626'">
                Projected Net {{ getProjectedGainLoss() >= 0 ? 'Gain' : 'Loss' }}: ETB {{ getProjectedGainLoss() | number:'1.2-2' }}
              </div>
            </div>

            <div>
              <label style="font-size: 12px; font-weight: 700;">Reason / Scrap Authorization *</label>
              <textarea [(ngModel)]="disposeForm.reason" name="reason" required class="form-control" rows="2" placeholder="e.g. Beyond economical repair, sold to scrap recycler..."></textarea>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 14px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
              <button type="button" (click)="showDisposeModal.set(false)" class="btn btn-outline" style="flex: 1;">Cancel</button>
              <button type="submit" class="btn btn-danger" style="flex: 2;">Approve & Execute Disposal</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- MODAL: RUN BATCH DEPRECIATION                                            -->
      <!-- ========================================================================= -->
      <div *ngIf="showRunDeprecModal()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
        <div style="background: #fff; border-radius: 12px; width: 100%; max-width: 440px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 12px;">
            <h3 style="font-size: 16px; font-weight: 800; color: var(--slate-900); margin: 0;">
              Execute Straight-Line Depreciation
            </h3>
            <button (click)="showRunDeprecModal.set(false)" class="btn btn-outline" style="padding: 4px 8px;"><lucide-icon name="x" [size]="14"></lucide-icon></button>
          </div>

          <p style="font-size: 13px; color: var(--slate-600); margin-bottom: 14px;">
            This will calculate straight-line depreciation for all active capital assets and update their current book values in the balance sheet.
          </p>

          <form (ngSubmit)="runDepreciationBatch()" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="font-size: 12px; font-weight: 700;">Fiscal Year (FY) *</label>
              <input type="number" [(ngModel)]="runDeprecForm.fiscalYear" name="fiscalYear" required min="2020" max="2050" class="form-control" />
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" [(ngModel)]="runDeprecForm.overwriteExisting" name="overwrite" id="overwriteCheck" />
              <label for="overwriteCheck" style="font-size: 12px; color: var(--slate-700);">Overwrite existing records for this fiscal year</label>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 14px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
              <button type="button" (click)="showRunDeprecModal.set(false)" class="btn btn-outline" style="flex: 1;">Cancel</button>
              <button type="submit" class="btn btn-primary" style="flex: 2;">Run Depreciation</button>
            </div>
          </form>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- MODAL: ASSET DETAILS & LIFECYCLE                                         -->
      <!-- ========================================================================= -->
      <div *ngIf="showDetailModal()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
        <div style="background: #fff; border-radius: 12px; width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 12px;">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--slate-900); margin: 0;">{{ selectedAsset()?.name }}</h3>
              <div style="font-size: 12px; color: var(--slate-500);">Asset Code: <code>{{ selectedAsset()?.assetCode }}</code></div>
            </div>
            <button (click)="showDetailModal.set(false)" class="btn btn-outline" style="padding: 4px 8px;"><lucide-icon name="x" [size]="14"></lucide-icon></button>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 13px;">
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
              <div style="font-weight: 700; color: var(--slate-600); margin-bottom: 6px;">Financial Overview</div>
              <div>Purchase Cost: <b>ETB {{ selectedAsset()?.purchaseCost | number:'1.2-2' }}</b></div>
              <div>Current Book Value: <b style="color: #4338ca;">ETB {{ selectedAsset()?.currentBookValue | number:'1.2-2' }}</b></div>
              <div>Salvage Value: <b>ETB {{ selectedAsset()?.salvageValue | number:'1.2-2' }}</b></div>
              <div>Useful Life: <b>{{ selectedAsset()?.usefulLifeYears }} years</b></div>
            </div>
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
              <div style="font-weight: 700; color: var(--slate-600); margin-bottom: 6px;">Status & Custody</div>
              <div>Status: <span [ngClass]="getStatusBadgeClass(selectedAsset()?.status!)">{{ selectedAsset()?.status }}</span></div>
              <div>Assigned To: <b>{{ selectedAsset()?.assignedToName || 'Unassigned' }}</b></div>
              <div>Location: <b>{{ selectedAsset()?.location || 'General' }}</b></div>
              <div>Warranty: <b>{{ selectedAsset()?.warrantyExpiry ? (selectedAsset()?.warrantyExpiry | date:'mediumDate') : 'No warranty' }}</b></div>
            </div>
          </div>

          <div *ngIf="selectedAsset()?.description" style="margin-top: 14px; font-size: 13px; color: var(--slate-600);">
            <b>Description / Specs:</b>
            <p style="margin: 4px 0 0;">{{ selectedAsset()?.description }}</p>
          </div>

          <div style="margin-top: 20px; text-align: right;">
            <button (click)="showDetailModal.set(false)" class="btn btn-primary" style="padding: 6px 16px;">Close</button>
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
    .kpi-card {
      background: #ffffff;
      padding: 16px;
      border-radius: 10px;
      border: 1px solid var(--slate-200);
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .kpi-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--slate-500);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-value {
      font-size: 18px;
      font-weight: 800;
      color: var(--slate-900);
      margin: 4px 0;
    }
    .kpi-subtext {
      font-size: 11px;
      color: var(--slate-400);
    }
  `]
})
export class FixedAssetsComponent implements OnInit {

  activeTab = signal<'register' | 'depreciation' | 'maintenance' | 'disposals'>('register');

  assets = signal<FixedAssetItem[]>([]);
  filteredAssets = signal<FixedAssetItem[]>([]);
  depreciations = signal<DepreciationItem[]>([]);
  maintenances = signal<MaintenanceItem[]>([]);
  disposals = signal<DisposalItem[]>([]);
  metrics = signal<DashboardMetrics | null>(null);

  staffUsers = signal<any[]>([]);
  suppliers = signal<any[]>([]);

  // Pagination state
  assetPage = signal(1);
  assetPageSize = signal(10);
  deprPage = signal(1);
  deprPageSize = signal(10);
  maintPage = signal(1);
  maintPageSize = signal(10);
  dispPage = signal(1);
  dispPageSize = signal(10);

  searchQuery = '';
  selectedCategory = '';
  selectedStatus = '';
  selectedAssetForDeprec: number | null = null;

  // Modals state
  showAssetModal = signal(false);
  isEditingAsset = signal(false);
  editingAssetId: number | null = null;

  showAssignModal = signal(false);
  showMaintenanceModal = signal(false);
  showDisposeModal = signal(false);
  showRunDeprecModal = signal(false);
  showDetailModal = signal(false);

  selectedAsset = signal<FixedAssetItem | null>(null);

  assetForm: any = {
    name: '',
    category: 'LAPTOP',
    description: '',
    purchaseDate: new Date().toISOString().substring(0, 10),
    purchaseCost: null,
    supplierId: null,
    location: '',
    serialNumber: '',
    warrantyExpiry: '',
    usefulLifeYears: 5,
    salvageValue: 0,
    depreciationMethod: 'STRAIGHT_LINE'
  };

  assignForm: any = {
    userId: null,
    assignedDate: new Date().toISOString().substring(0, 10),
    notes: ''
  };

  maintenanceForm: any = {
    assetId: null,
    maintenanceDate: new Date().toISOString().substring(0, 10),
    description: '',
    cost: 0,
    performedBy: '',
    nextMaintenanceDate: ''
  };

  disposeForm: any = {
    disposalDate: new Date().toISOString().substring(0, 10),
    disposalType: 'SOLD',
    salePrice: 0,
    reason: ''
  };

  runDeprecForm: any = {
    fiscalYear: new Date().getFullYear(),
    overwriteExisting: false
  };

  totalAcquisitionCost = computed(() => {
    return this.assets().reduce((sum, a) => sum + (Number(a.purchaseCost) || 0), 0);
  });

  totalCurrentBookValue = computed(() => {
    return this.assets().reduce((sum, a) => sum + (Number(a.currentBookValue) || 0), 0);
  });

  constructor(
    private http: HttpClient,
    public authService: AuthService,
    private notificationService: NotificationService,
    private validationService: ValidationService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadAssets();
    this.loadDashboard();
    this.loadStaffUsers();
    this.loadSuppliers();
  }

  canManageAssets(): boolean {
    return this.authService.hasRole('ROLE_OWNER') || this.authService.hasRole('ROLE_CASHIER_ACCOUNTANT');
  }

  isSuperAdmin(): boolean {
    return this.authService.hasRole('ROLE_OWNER');
  }

  canApproveDisposals(): boolean {
    return this.authService.hasRole('ROLE_OWNER');
  }

  loadAssets(): void {
    this.http.get<any>(`${environment.apiUrl}/assets`).subscribe({
      next: (res) => {
        const list = res.data || [];
        this.assets.set(list);
        this.filterAssets();
      },
      error: () => this.notificationService.error('Failed to load fixed assets')
    });
  }

  loadDashboard(): void {
    this.http.get<any>(`${environment.apiUrl}/assets/dashboard`).subscribe({
      next: (res) => this.metrics.set(res.data)
    });
  }

  loadStaffUsers(): void {
    this.http.get<any>(`${environment.apiUrl}/users?size=100`).subscribe({
      next: (res) => {
        const list = res.data?.content || (Array.isArray(res.data) ? res.data : []);
        this.staffUsers.set(list);
      },
      error: () => this.notificationService.error('Failed to load staff list')
    });
  }

  loadSuppliers(): void {
    this.http.get<any>(`${environment.apiUrl}/suppliers`).subscribe({
      next: (res) => {
        const list = res.data?.content || (Array.isArray(res.data) ? res.data : []);
        this.suppliers.set(list);
      }
    });
  }

  filterAssets(): void {
    let result = this.assets();
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.assetCode.toLowerCase().includes(q) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(q))
      );
    }
    if (this.selectedCategory) {
      result = result.filter(a => a.category === this.selectedCategory);
    }
    if (this.selectedStatus) {
      result = result.filter(a => a.status === this.selectedStatus);
    }
    this.filteredAssets.set(result);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.filterAssets();
  }

  getBookValuePercent(asset: FixedAssetItem): number {
    if (!asset.purchaseCost || asset.purchaseCost === 0) return 0;
    const ratio = (asset.currentBookValue / asset.purchaseCost) * 100;
    return Math.max(0, Math.min(100, Math.round(ratio)));
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'badge badge-success';
      case 'UNDER_MAINTENANCE': return 'badge badge-warning';
      case 'DISPOSED': return 'badge badge-danger';
      case 'SOLD': return 'badge badge-primary';
      case 'LOST': return 'badge badge-danger';
      default: return 'badge';
    }
  }

  // Create / Edit
  openCreateModal(): void {
    this.isEditingAsset.set(false);
    this.editingAssetId = null;
    this.assetForm = {
      name: '',
      category: 'LAPTOP',
      description: '',
      purchaseDate: new Date().toISOString().substring(0, 10),
      purchaseCost: null,
      supplierId: null,
      location: '',
      serialNumber: '',
      warrantyExpiry: '',
      usefulLifeYears: 5,
      salvageValue: 0,
      depreciationMethod: 'STRAIGHT_LINE'
    };
    this.showAssetModal.set(true);
  }

  openEditModal(asset: FixedAssetItem): void {
    this.isEditingAsset.set(true);
    this.editingAssetId = asset.id;
    this.assetForm = {
      name: asset.name,
      category: asset.category,
      description: asset.description,
      purchaseDate: asset.purchaseDate,
      purchaseCost: asset.purchaseCost,
      supplierId: asset.supplierId,
      location: asset.location,
      serialNumber: asset.serialNumber,
      warrantyExpiry: asset.warrantyExpiry,
      usefulLifeYears: asset.usefulLifeYears,
      salvageValue: asset.salvageValue,
      depreciationMethod: asset.depreciationMethod
    };
    this.showAssetModal.set(true);
  }

  saveAsset(): void {
    if (!this.assetForm.name.trim()) {
      this.notificationService.warning('Asset name is required');
      return;
    }
    if (!this.assetForm.purchaseCost || this.assetForm.purchaseCost <= 0) {
      this.notificationService.warning('Purchase cost must be greater than zero');
      return;
    }

    if (this.isEditingAsset() && this.editingAssetId) {
      this.http.put<any>(`${environment.apiUrl}/assets/${this.editingAssetId}`, this.assetForm).subscribe({
        next: () => {
          this.notificationService.success('Asset updated successfully');
          this.showAssetModal.set(false);
          this.loadAssets();
          this.loadDashboard();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to update asset')
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/assets`, this.assetForm).subscribe({
        next: () => {
          this.notificationService.success('Fixed asset registered successfully');
          this.showAssetModal.set(false);
          this.loadAssets();
          this.loadDashboard();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to register asset')
      });
    }
  }

  async deleteAsset(asset: FixedAssetItem): Promise<void> {
    const ok = await this.confirmationService.confirm({
      title: 'Delete Fixed Asset',
      message: `Are you sure you want to permanently delete asset "${asset.name}" (${asset.assetCode})? This action cannot be undone.`,
      confirmText: 'Delete Asset',
      type: 'danger',
      icon: 'trash-2'
    });

    if (ok) {
      this.http.delete<any>(`${environment.apiUrl}/assets/${asset.id}`).subscribe({
        next: () => {
          this.notificationService.success('Asset deleted successfully');
          this.loadAssets();
          this.loadDashboard();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to delete asset')
      });
    }
  }

  // Assignment
  openAssignModal(asset: FixedAssetItem): void {
    this.selectedAsset.set(asset);
    this.assignForm = {
      userId: asset.assignedToId || null,
      assignedDate: asset.assignedDate || new Date().toISOString().substring(0, 10),
      notes: asset.assignmentNotes || ''
    };
    this.loadStaffUsers();
    this.showAssignModal.set(true);
  }

  saveAssignment(): void {
    if (!this.selectedAsset()) return;
    if (!this.assignForm.userId) {
      this.notificationService.warning('Please select a staff user to assign');
      return;
    }
    this.http.post<any>(`${environment.apiUrl}/assets/${this.selectedAsset()!.id}/assign`, this.assignForm).subscribe({
      next: () => {
        this.notificationService.success('Asset assigned successfully and staff notified');
        this.showAssignModal.set(false);
        this.loadAssets();
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Failed to assign asset')
    });
  }

  async returnAsset(asset: FixedAssetItem): Promise<void> {
    const ok = await this.confirmationService.confirm({
      title: 'Return Asset Custody',
      message: `Return "${asset.name}" (${asset.assetCode}) back to general unassigned inventory?`,
      confirmText: 'Return to Custody',
      type: 'warning',
      icon: 'undo-2'
    });

    if (ok) {
      this.http.post<any>(`${environment.apiUrl}/assets/${asset.id}/return`, {}).subscribe({
        next: () => {
          this.notificationService.success('Asset returned to general custody');
          this.showAssignModal.set(false);
          this.loadAssets();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to return asset')
      });
    }
  }

  // Maintenance
  openMaintenanceModal(asset: FixedAssetItem): void {
    this.selectedAsset.set(asset);
    this.maintenanceForm = {
      assetId: asset.id,
      maintenanceDate: new Date().toISOString().substring(0, 10),
      description: '',
      cost: 0,
      performedBy: '',
      nextMaintenanceDate: ''
    };
    this.showMaintenanceModal.set(true);
  }

  openNewMaintenanceModal(): void {
    this.selectedAsset.set(null);
    this.maintenanceForm = {
      assetId: this.assets().length > 0 ? this.assets()[0].id : null,
      maintenanceDate: new Date().toISOString().substring(0, 10),
      description: '',
      cost: 0,
      performedBy: '',
      nextMaintenanceDate: ''
    };
    this.showMaintenanceModal.set(true);
  }

  saveMaintenance(): void {
    const assetId = this.maintenanceForm.assetId;
    if (!assetId) {
      this.notificationService.warning('Please select an asset');
      return;
    }
    if (!this.maintenanceForm.description.trim()) {
      this.notificationService.warning('Maintenance description is required');
      return;
    }

    this.http.post<any>(`${environment.apiUrl}/assets/${assetId}/maintenance`, this.maintenanceForm).subscribe({
      next: () => {
        this.notificationService.success('Maintenance record logged');
        this.showMaintenanceModal.set(false);
        this.loadAssets();
        this.loadDashboard();
        if (this.activeTab() === 'maintenance') {
          this.loadMaintenances();
        }
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Failed to log maintenance')
    });
  }

  loadMaintenances(): void {
    if (this.selectedAsset()) {
      this.http.get<any>(`${environment.apiUrl}/assets/${this.selectedAsset()!.id}/maintenance`).subscribe({
        next: (res) => this.maintenances.set(res.data || [])
      });
    } else if (this.metrics()?.recentMaintenances) {
      this.maintenances.set(this.metrics()!.recentMaintenances);
    }
  }

  // Disposals
  openDisposeModal(asset: FixedAssetItem): void {
    if (asset.assignedToName) {
      this.notificationService.warning(`Asset is currently assigned to ${asset.assignedToName}. Return the asset before disposing.`);
      return;
    }
    this.selectedAsset.set(asset);
    this.disposeForm = {
      disposalDate: new Date().toISOString().substring(0, 10),
      disposalType: 'SOLD',
      salePrice: 0,
      reason: ''
    };
    this.showDisposeModal.set(true);
  }

  getProjectedGainLoss(): number {
    if (!this.selectedAsset()) return 0;
    const book = this.selectedAsset()!.currentBookValue || 0;
    const sale = this.disposeForm.salePrice || 0;
    return sale - book;
  }

  saveDisposal(): void {
    if (!this.selectedAsset()) return;
    if (!this.disposeForm.reason.trim()) {
      this.notificationService.warning('Disposal reason is required');
      return;
    }
    this.http.post<any>(`${environment.apiUrl}/assets/${this.selectedAsset()!.id}/dispose`, this.disposeForm).subscribe({
      next: () => {
        this.notificationService.success('Asset disposed & gain/loss recorded');
        this.showDisposeModal.set(false);
        this.loadAssets();
        this.loadDashboard();
        if (this.activeTab() === 'disposals') {
          this.loadDisposals();
        }
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Failed to dispose asset')
    });
  }

  loadDisposals(): void {
    this.http.get<any>(`${environment.apiUrl}/assets/disposals`).subscribe({
      next: (res) => this.disposals.set(res.data || [])
    });
  }

  // Depreciation
  openRunDepreciationModal(): void {
    this.runDeprecForm = {
      fiscalYear: new Date().getFullYear(),
      overwriteExisting: false
    };
    this.showRunDeprecModal.set(true);
  }

  runDepreciationBatch(): void {
    this.http.post<any>(`${environment.apiUrl}/assets/depreciation/run`, this.runDeprecForm).subscribe({
      next: (res) => {
        this.notificationService.success(`Annual depreciation for FY ${this.runDeprecForm.fiscalYear} executed successfully`);
        this.showRunDeprecModal.set(false);
        this.depreciations.set(res.data || []);
        this.loadAssets();
        this.loadDashboard();
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Failed to execute depreciation')
    });
  }

  loadDepreciationsForSelected(): void {
    if (this.selectedAssetForDeprec) {
      this.http.get<any>(`${environment.apiUrl}/assets/${this.selectedAssetForDeprec}/depreciation`).subscribe({
        next: (res) => this.depreciations.set(res.data || [])
      });
    }
  }

  // Detail Modal
  openDetailModal(asset: FixedAssetItem): void {
    this.selectedAsset.set(asset);
    this.showDetailModal.set(true);
  }

  // Exports
  exportExcel(): void {
    window.open(`${environment.apiUrl}/assets/export/excel`, '_blank');
  }

  exportPdf(): void {
    window.open(`${environment.apiUrl}/assets/export/pdf`, '_blank');
  }
}
