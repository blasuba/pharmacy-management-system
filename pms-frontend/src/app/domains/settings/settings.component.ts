import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Router, ActivatedRoute } from '@angular/router';
import { SettingsService, PharmacyProfile, SystemSettings, TaxConfig, NotificationSettings, BackupSchedule, RbacMatrix, UserItem, AuditLog, SystemInfo } from '../../core/services/settings.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmationService } from '../../core/services/confirmation.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <!-- Page Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;">
            System Settings & Control Center
          </h1>
          <p style="font-size: 13px; color: #64748b; margin: 4px 0 0;">
            Manage pharmacy profile, access control, taxation, global preferences, notifications, and automated backups.
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <button (click)="refreshCurrentTab()" class="btn btn-outline" style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px;">
            <lucide-icon name="refresh-cw" [size]="14"></lucide-icon>
            <span>Refresh</span>
          </button>
          <button (click)="clearCache()" class="btn btn-outline" style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #d97706; border-color: #fde68a;">
            <lucide-icon name="rotate-ccw" [size]="14"></lucide-icon>
            <span>Flush Cache</span>
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div style="display: flex; align-items: center; gap: 6px; border-bottom: 2px solid #e2e8f0; overflow-x: auto; padding-bottom: 2px;">
        <button *ngFor="let tab of tabs" 
                (click)="activeTab = tab.id; onTabChange(tab.id)"
                [class.active-tab-btn]="activeTab === tab.id"
                class="tab-nav-btn">
          <lucide-icon [name]="tab.icon" [size]="16"></lucide-icon>
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Loading Spinner -->
      <div *ngIf="loading()" style="padding: 40px; text-align: center; color: #64748b;">
        <lucide-icon name="refresh-cw" [size]="28" class="animate-spin"></lucide-icon>
        <p style="margin-top: 8px; font-size: 13px; font-weight: 600;">Loading configuration...</p>
      </div>

      <!-- TAB 1: PHARMACY PROFILE -->
      <div *ngIf="!loading() && activeTab === 'profile'" class="card" style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 14px;">
          <div>
            <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0;">Pharmacy Branding & Legal Profile</h2>
            <p style="font-size: 12px; color: #64748b; margin: 2px 0 0;">Official organization identity, tax identification, and operating license details</p>
          </div>
          <button (click)="saveProfile()" [disabled]="saving()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon name="check" [size]="15"></lucide-icon>
            <span>{{ saving() ? 'Saving...' : 'Save Profile' }}</span>
          </button>
        </div>

        <form (ngSubmit)="saveProfile()" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
          <!-- Logo & Basic Info -->
          <div style="grid-column: 1 / -1; display: flex; align-items: center; gap: 24px; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div style="width: 80px; height: 80px; border-radius: 12px; background: #0284c7; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid #bae6fd; flex-shrink: 0;">
              <img *ngIf="profile.logoPath" [src]="profile.logoPath" alt="Logo" style="width: 100%; height: 100%; object-fit: cover;" (error)="profile.logoPath = ''" />
              <lucide-icon *ngIf="!profile.logoPath" name="store" [size]="36" color="#ffffff"></lucide-icon>
            </div>
            <div>
              <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 4px;">Pharmacy Brand Logo</h4>
              <p style="font-size: 12px; color: #64748b; margin: 0 0 10px;">Upload PNG, JPG, or SVG for invoices, receipts, and system navigation</p>
              <label class="btn btn-outline" style="cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; padding: 6px 12px;">
                <lucide-icon name="upload" [size]="14"></lucide-icon>
                <span>Upload New Logo</span>
                <input type="file" (change)="onLogoSelected($event)" accept="image/*" style="display: none;" />
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Pharmacy Name <span class="text-danger">*</span></label>
            <input type="text" [(ngModel)]="profile.name" name="name" class="form-control" required placeholder="e.g. Bunna Pharmacy" />
          </div>

          <div class="form-group">
            <label class="form-label">Legal Business Name <span class="text-danger">*</span></label>
            <input type="text" [(ngModel)]="profile.legalName" name="legalName" class="form-control" required placeholder="e.g. Bunna Pharmacy PLC" />
          </div>

          <div class="form-group">
            <label class="form-label">Phone Number <span class="text-danger">*</span></label>
            <input type="text" [(ngModel)]="profile.phone" name="phone" class="form-control" required placeholder="+251-11-123-4567" />
          </div>

          <div class="form-group">
            <label class="form-label">Official Email <span class="text-danger">*</span></label>
            <input type="email" [(ngModel)]="profile.email" name="email" class="form-control" required placeholder="info@bunnapharmacy.com" />
          </div>

          <div class="form-group">
            <label class="form-label">Tax Identification Number (TIN) <span class="text-danger">*</span></label>
            <input type="text" [(ngModel)]="profile.tin" name="tin" class="form-control" required placeholder="1234567890" />
          </div>

          <div class="form-group">
            <label class="form-label">Pharmacy License Number <span class="text-danger">*</span></label>
            <input type="text" [(ngModel)]="profile.licenseNumber" name="licenseNumber" class="form-control" required placeholder="PH-2026-00123" />
          </div>

          <div class="form-group">
            <label class="form-label">License Expiry Date <span class="text-danger">*</span></label>
            <input type="date" [(ngModel)]="profile.licenseExpiry" name="licenseExpiry" class="form-control" [min]="minExpiryDate" required />
            <span style="font-size: 11px; color: #64748b;">Must be a future operating date</span>
          </div>

          <div class="form-group">
            <label class="form-label">Website (Optional)</label>
            <input type="url" [(ngModel)]="profile.website" name="website" class="form-control" placeholder="https://bunnapharmacy.com" />
          </div>

          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Physical Address / Headquarters <span class="text-danger">*</span></label>
            <textarea [(ngModel)]="profile.address" name="address" rows="2" class="form-control" required placeholder="Bole Road, Addis Ababa, Ethiopia"></textarea>
          </div>
        </form>
      </div>

      <!-- TAB 2: USER MANAGEMENT -->
      <div *ngIf="!loading() && activeTab === 'users'" class="card" style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0;">User Accounts & Access Control</h2>
              <span class="badge badge-primary" style="font-size: 11.5px; padding: 3px 8px;">{{ users.length }} Users</span>
            </div>
            <p style="font-size: 12.5px; color: #64748b; margin: 2px 0 0;">Provision new staff, update roles, reset credentials, or deactivate accounts</p>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="position: relative;">
              <input type="text" [(ngModel)]="userSearchQuery" (input)="loadUsers()" placeholder="Search staff users..." class="form-control" style="padding-left: 32px; width: 220px; padding-top: 7px; padding-bottom: 7px; font-size: 12.5px;" />
              <lucide-icon name="search" [size]="14" style="position: absolute; left: 10px; top: 10px; color: #94a3b8;"></lucide-icon>
            </div>
            <button (click)="openAddUserModal()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; font-size: 12.5px;">
              <lucide-icon name="user-plus" [size]="14"></lucide-icon>
              <span>Add Staff User</span>
            </button>
          </div>
        </div>

        <!-- Users Table -->
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="padding: 10px 16px;">Staff Member</th>
                <th style="padding: 10px 16px;">Username</th>
                <th style="padding: 10px 16px;">Roles</th>
                <th style="padding: 10px 16px;">Branch</th>
                <th style="padding: 10px 16px;">Status</th>
                <th style="padding: 10px 16px;">Created</th>
                <th style="padding: 10px 16px; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of users">
                <td style="padding: 11px 16px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 34px; height: 34px; border-radius: 8px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; border: 1px solid #bae6fd;">
                      {{ (u.fullName || u.username).charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <div style="font-weight: 700; color: #0f172a; font-size: 13.5px;">{{ u.fullName }}</div>
                      <div style="font-size: 12px; color: #64748b; margin-top: 1px;">{{ u.email }}</div>
                    </div>
                  </div>
                </td>
                <td style="padding: 11px 16px;">
                  <code style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; padding: 3px 8px; background: #f1f5f9; border-radius: 5px; border: 1px solid #e2e8f0; color: #334155;">&#64;{{ u.username }}</code>
                </td>
                <td style="padding: 11px 16px;">
                  <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                    <span *ngFor="let r of u.roles" class="badge badge-primary" style="padding: 4px 10px; font-size: 11.5px; font-weight: 600; border-radius: 6px;">
                      {{ formatRoleName(r) }}
                    </span>
                  </div>
                </td>
                <td style="padding: 11px 16px; font-size: 13px; color: #475569; font-weight: 500;">
                  <span style="display: inline-flex; align-items: center; gap: 5px;">
                    <lucide-icon name="building-2" [size]="13" color="#64748b"></lucide-icon>
                    {{ u.branchName || 'Central Branch' }}
                  </span>
                </td>
                <td style="padding: 11px 16px;">
                  <span [class]="u.active ? 'badge badge-success' : 'badge badge-danger'" style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; font-size: 11.5px; font-weight: 600;">
                    <lucide-icon [name]="u.active ? 'check-circle-2' : 'alert-circle'" [size]="12"></lucide-icon>
                    {{ u.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td style="padding: 11px 16px; font-size: 12.5px; color: #64748b;">{{ u.createdAt | date:'mediumDate' }}</td>
                <td style="padding: 11px 16px; text-align: right;">
                  <div style="display: inline-flex; align-items: center; gap: 6px;">
                    <button (click)="openEditUserModal(u)" class="btn-icon" title="Edit details">
                      <lucide-icon name="edit-2" [size]="13"></lucide-icon>
                    </button>
                    <button (click)="openResetPasswordModal(u)" class="btn-icon" title="Reset password" style="color: #d97706;">
                      <lucide-icon name="key" [size]="13"></lucide-icon>
                    </button>
                    <button (click)="deactivateUser(u)" [disabled]="isCurrentUser(u)" class="btn-icon" title="Deactivate user" style="color: #ef4444;">
                      <lucide-icon name="trash-2" [size]="13"></lucide-icon>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="users.length === 0">
                <td colspan="7" style="text-align: center; padding: 36px 20px; color: #64748b;">
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                    <lucide-icon name="users" [size]="28" color="#94a3b8"></lucide-icon>
                    <p style="font-size: 13.5px; font-weight: 600; margin: 0;">No users match the search filter</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 3: ROLE & PERMISSIONS (RBAC MATRIX) -->
      <div *ngIf="!loading() && activeTab === 'permissions'" class="card" style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0;">Role-Based Access Control (RBAC Matrix)</h2>
            <p style="font-size: 12.5px; color: #64748b; margin: 2px 0 0;">Define granular functional capabilities for each staff role. Changes take effect immediately.</p>
          </div>
          <button (click)="saveRbacMatrix()" [disabled]="saving()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; font-size: 12.5px;">
            <lucide-icon name="shield-check" [size]="14"></lucide-icon>
            <span>{{ saving() ? 'Saving...' : 'Save RBAC Matrix' }}</span>
          </button>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 45%; padding: 10px 16px;">Permission Module & Description</th>
                <th *ngFor="let role of rbacMatrix?.roles" style="text-align: center; width: 18%; padding: 10px 16px;">
                  <div style="font-weight: 800; color: #0f172a; font-size: 12.5px;">{{ role.displayName }}</div>
                  <div style="font-size: 10.5px; color: #64748b; font-weight: 500; margin-top: 1px;">{{ role.name }}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let perm of rbacMatrix?.permissions">
                <td style="padding: 11px 16px;">
                  <div style="font-weight: 700; color: #0f172a; font-size: 13px; line-height: 1.35;">{{ perm.description }}</div>
                  <div style="margin-top: 3px; display: flex; align-items: center; gap: 5px;">
                    <span style="display: inline-block; padding: 1px 6px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-size: 10.5px; font-weight: 700;">{{ perm.module }}</span>
                    <span style="font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: #64748b;">{{ perm.code }}</span>
                  </div>
                </td>
                <td *ngFor="let role of rbacMatrix?.roles" style="text-align: center; padding: 11px 16px;">
                  <input type="checkbox" 
                         [checked]="hasPermission(role.name, perm.code)"
                         (change)="togglePermission(role.name, perm.code)"
                         style="width: 17px; height: 17px; accent-color: #0284c7; cursor: pointer; vertical-align: middle;" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 4: TAX CONFIGURATION -->
      <div *ngIf="!loading() && activeTab === 'tax'" class="card" style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 14px;">
          <div>
            <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0;">Value Added Tax (VAT) & Fiscal Rules</h2>
            <p style="font-size: 12px; color: #64748b; margin: 2px 0 0;">Configure tax rates applied automatically in POS checkout and sales receipts</p>
          </div>
          <button (click)="saveTaxConfig()" [disabled]="saving()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon name="check" [size]="15"></lucide-icon>
            <span>{{ saving() ? 'Saving...' : 'Save Tax Rules' }}</span>
          </button>
        </div>

        <form (ngSubmit)="saveTaxConfig()" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
          <div class="form-group">
            <label class="form-label">Standard VAT Rate (%) <span class="text-danger">*</span></label>
            <div style="display: flex; align-items: center; gap: 12px;">
              <input type="number" [(ngModel)]="taxConfig.vatRate" name="vatRate" step="0.01" min="0" max="100" class="form-control" style="width: 140px;" required />
              <input type="range" [(ngModel)]="taxConfig.vatRate" name="vatRateRange" min="0" max="30" step="0.5" style="flex: 1; accent-color: #0284c7;" />
            </div>
            <span style="font-size: 11px; color: #64748b;">Ethiopia's standard VAT rate is 15.00%</span>
          </div>

          <div class="form-group">
            <label class="form-label">Default Tax Code</label>
            <input type="text" [(ngModel)]="taxConfig.defaultTaxCode" name="defaultTaxCode" class="form-control" placeholder="VAT-15" />
          </div>

          <div class="form-group">
            <label class="form-label">Tax Registration Number</label>
            <input type="text" [(ngModel)]="taxConfig.taxRegistrationNumber" name="taxRegistrationNumber" class="form-control" placeholder="TIN-0098712345" />
          </div>

          <div class="form-group" style="display: flex; flex-direction: column; justify-content: center;">
            <label class="form-label">Tax Inclusive Pricing</label>
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin-top: 4px;">
              <input type="checkbox" [(ngModel)]="taxConfig.taxInclusive" name="taxInclusive" style="width: 18px; height: 18px; accent-color: #0284c7;" />
              <span style="font-size: 13px; font-weight: 600; color: #334155;">Catalog drug prices are already tax-inclusive</span>
            </label>
            <span style="font-size: 11px; color: #64748b;">If enabled, tax is extracted from the unit price rather than added on top</span>
          </div>

          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Tax Exempt Drug Categories</label>
            <input type="text" [(ngModel)]="taxConfig.taxExemptCategories" name="taxExemptCategories" class="form-control" placeholder="e.g. Essential Drugs, Insulin, Vaccines, Oncology" />
            <span style="font-size: 11px; color: #64748b;">Comma-separated categories that are zero-rated / exempt from VAT in POS calculations</span>
          </div>
        </form>
      </div>

      <!-- TAB 5: SYSTEM PREFERENCES -->
      <div *ngIf="!loading() && activeTab === 'system'" class="card" style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 14px;">
          <div>
            <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0;">System Preferences & Localization</h2>
            <p style="font-size: 12px; color: #64748b; margin: 2px 0 0;">Global defaults for currency, formats, hardware printers, and inventory threshold alerts</p>
          </div>
          <button (click)="saveSystemSettings()" [disabled]="saving()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon name="check" [size]="15"></lucide-icon>
            <span>{{ saving() ? 'Saving...' : 'Save Preferences' }}</span>
          </button>
        </div>

        <form (ngSubmit)="saveSystemSettings()" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
          <div class="form-group">
            <label class="form-label">Default Currency Code <span class="text-danger">*</span></label>
            <select [(ngModel)]="systemSettings.currency" name="currency" class="form-control" required>
              <option value="ETB">ETB - Ethiopian Birr</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Currency Display Symbol <span class="text-danger">*</span></label>
            <input type="text" [(ngModel)]="systemSettings.currencySymbol" name="currencySymbol" class="form-control" required placeholder="Br" />
          </div>

          <div class="form-group">
            <label class="form-label">Date Format</label>
            <select [(ngModel)]="systemSettings.dateFormat" name="dateFormat" class="form-control">
              <option value="DD/MM/YYYY">DD/MM/YYYY (Ethiopian/European standard)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (US standard)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Time Zone</label>
            <select [(ngModel)]="systemSettings.timeZone" name="timeZone" class="form-control">
              <option value="Africa/Addis_Ababa">Africa/Addis_Ababa (EAT, UTC+3)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="Africa/Nairobi">Africa/Nairobi (EAT, UTC+3)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Interface Language</label>
            <select [(ngModel)]="systemSettings.language" name="language" class="form-control">
              <option value="en">English</option>
              <option value="am">Amharic (አማርኛ)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Receipt Printer Method</label>
            <select [(ngModel)]="systemSettings.receiptPrinter" name="receiptPrinter" class="form-control">
              <option value="PDF">Standard PDF Generator</option>
              <option value="THERMAL_80">Thermal POS Printer (80mm ESC/POS)</option>
              <option value="THERMAL_58">Thermal POS Printer (58mm ESC/POS)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Global Low Stock Threshold (Units) <span class="text-danger">*</span></label>
            <input type="number" [(ngModel)]="systemSettings.lowStockThreshold" name="lowStockThreshold" min="1" class="form-control" required />
            <span style="font-size: 11px; color: #64748b;">Triggers reorder badge and dashboard warning</span>
          </div>

          <div class="form-group">
            <label class="form-label">Expiry Alert Horizon (Days) <span class="text-danger">*</span></label>
            <input type="number" [(ngModel)]="systemSettings.expiryAlertDays" name="expiryAlertDays" min="1" class="form-control" required />
            <span style="font-size: 11px; color: #64748b;">Flags batches expiring within X days</span>
          </div>

          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Receipt Thermal / PDF Footer Message</label>
            <input type="text" [(ngModel)]="systemSettings.receiptFooter" name="receiptFooter" class="form-control" placeholder="Thank you for visiting Bunna Pharmacy! Get well soon!" />
          </div>

          <!-- POS Checkout & Cash Management Policy -->
          <div style="grid-column: 1 / -1; padding: 18px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
              <lucide-icon name="shopping-cart" [size]="18" color="#0284c7"></lucide-icon>
              <div>
                <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;">POS Sales & Cashier Control Policies</h4>
                <p style="font-size: 11.5px; color: #64748b; margin: 2px 0 0;">Control cashier discounting limits, drawer enforcement, and printing automation.</p>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label">Default Payment Method</label>
                <select [(ngModel)]="systemSettings.defaultPaymentMethod" name="defaultPaymentMethod" class="form-control">
                  <option value="CASH">Cash</option>
                  <option value="TELEBIRR">Telebirr</option>
                  <option value="CBE_BIRR">CBE Birr</option>
                  <option value="CARD">Bank Card / POS</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
                <span style="font-size: 11px; color: #64748b;">Pre-selected method when opening checkout modal</span>
              </div>

              <div class="form-group" style="margin: 0;">
                <label class="form-label">Max Cashier Discount (%) <span class="text-danger">*</span></label>
                <input type="number" [(ngModel)]="systemSettings.maxDiscountPercent" name="maxDiscountPercent" min="0" max="100" step="0.5" class="form-control" required />
                <span style="font-size: 11px; color: #64748b;">Maximum % discount a cashier can apply without manager PIN</span>
              </div>

              <div class="form-group" style="margin: 0; display: flex; flex-direction: column; justify-content: center;">
                <label class="form-label">Receipt Auto-Print</label>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-top: 4px;">
                  <input type="checkbox" [(ngModel)]="systemSettings.autoPrintReceipt" name="autoPrintReceipt" style="width: 17px; height: 17px; accent-color: #0284c7;" />
                  <span style="font-size: 12.5px; font-weight: 600; color: #334155;">Auto-trigger receipt print on checkout</span>
                </label>
              </div>

              <div class="form-group" style="margin: 0; display: flex; flex-direction: column; justify-content: center;">
                <label class="form-label">Enforce Shift Opening</label>
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-top: 4px;">
                  <input type="checkbox" [(ngModel)]="systemSettings.requireShiftOpen" name="requireShiftOpen" style="width: 17px; height: 17px; accent-color: #0284c7;" />
                  <span style="font-size: 12.5px; font-weight: 600; color: #334155;">Require active cash shift to dispense</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Security & Session Inactivity Policy -->
          <div style="grid-column: 1 / -1; margin-top: 6px; padding: 18px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
              <lucide-icon name="shield-alert" [size]="18" color="#0284c7"></lucide-icon>
              <div>
                <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0;">Workstation Security & Inactivity Timeout Policy</h4>
                <p style="font-size: 11.5px; color: #64748b; margin: 2px 0 0;">Automatically logs out idle terminals to safeguard patient records, dispense histories, and sales drawers.</p>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label">Auto-Logout Idle Timeout <span class="text-danger">*</span></label>
                <select [(ngModel)]="systemSettings.sessionTimeoutMinutes" name="sessionTimeoutMinutes" class="form-control" required>
                  <option [ngValue]="1">1 minute (Testing / 60s auto-logout)</option>
                  <option [ngValue]="5">5 minutes (High Security / Front Counter)</option>
                  <option [ngValue]="10">10 minutes</option>
                  <option [ngValue]="15">15 minutes (Standard Default)</option>
                  <option [ngValue]="30">30 minutes</option>
                  <option [ngValue]="60">60 minutes (1 Hour)</option>
                  <option [ngValue]="120">120 minutes (2 Hours - Back Office)</option>
                </select>
                <span style="font-size: 11px; color: #64748b;">Duration of inactivity before the session is automatically closed</span>
              </div>

              <div class="form-group" style="margin: 0;">
                <label class="form-label">Warning Notice Window <span class="text-danger">*</span></label>
                <select [(ngModel)]="systemSettings.sessionWarningMinutes" name="sessionWarningMinutes" class="form-control" required>
                  <option [ngValue]="1">1 minute before logout</option>
                  <option [ngValue]="2">2 minutes before logout (Recommended)</option>
                  <option [ngValue]="5">5 minutes before logout</option>
                </select>
                <span style="font-size: 11px; color: #64748b;">Advance countdown modal allowing user to click "Stay Logged In"</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- TAB 6: NOTIFICATIONS -->
      <div *ngIf="!loading() && activeTab === 'notifications'" class="card" style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 14px;">
          <div>
            <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0;">Multi-Channel Notification Gateway</h2>
            <p style="font-size: 12px; color: #64748b; margin: 2px 0 0;">Configure Email SMTP, SMS API, and Telegram bot triggers for operational alerts</p>
          </div>
          <button (click)="saveNotificationSettings()" [disabled]="saving()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px;">
            <lucide-icon name="check" [size]="15"></lucide-icon>
            <span>{{ saving() ? 'Saving...' : 'Save Channels' }}</span>
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 24px;">
          <!-- Event Triggers Card -->
          <div style="padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 12px;">Automated Event Subscriptions</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" [(ngModel)]="notificationSettings.lowStockAlertEnabled" style="width: 18px; height: 18px; accent-color: #0284c7;" />
                <span style="font-size: 13px; font-weight: 600; color: #334155;">Low Stock Alerts (Immediate)</span>
              </label>
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" [(ngModel)]="notificationSettings.expiryAlertEnabled" style="width: 18px; height: 18px; accent-color: #0284c7;" />
                <span style="font-size: 13px; font-weight: 600; color: #334155;">Drug Expiry Warnings (30 Days)</span>
              </label>
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                <input type="checkbox" [(ngModel)]="notificationSettings.dailyReportEnabled" style="width: 18px; height: 18px; accent-color: #0284c7;" />
                <span style="font-size: 13px; font-weight: 600; color: #334155;">Daily Sales & Revenue Summary</span>
              </label>
            </div>
          </div>

          <!-- Channel Settings Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
            <!-- Email Gateway -->
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 14px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <lucide-icon name="mail" [size]="18" color="#0284c7"></lucide-icon>
                  <span style="font-weight: 700; font-size: 14px; color: #0f172a;">Email SMTP Gateway</span>
                </div>
                <input type="checkbox" [(ngModel)]="notificationSettings.emailEnabled" style="width: 18px; height: 18px; accent-color: #0284c7;" />
              </div>

              <div class="form-group">
                <label class="form-label">SMTP Host</label>
                <input type="text" [(ngModel)]="notificationSettings.smtpHost" class="form-control" placeholder="smtp.gmail.com" />
              </div>
              <div class="form-group">
                <label class="form-label">SMTP Port</label>
                <input type="number" [(ngModel)]="notificationSettings.smtpPort" class="form-control" placeholder="587" />
              </div>
              <div class="form-group">
                <label class="form-label">SMTP Username</label>
                <input type="text" [(ngModel)]="notificationSettings.smtpUsername" class="form-control" placeholder="pharmacy@gmail.com" />
              </div>
              <div class="form-group">
                <label class="form-label">SMTP Password</label>
                <input type="password" [(ngModel)]="notificationSettings.smtpPassword" class="form-control" placeholder="••••••••" />
              </div>
              <div class="form-group">
                <label class="form-label">Sender Email</label>
                <input type="email" [(ngModel)]="notificationSettings.senderEmail" class="form-control" placeholder="alerts@bunnapharmacy.com" />
              </div>

              <button (click)="testChannel('EMAIL')" class="btn btn-outline" style="margin-top: auto; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                <lucide-icon name="send" [size]="14"></lucide-icon>
                <span>Send Test Email</span>
              </button>
            </div>

            <!-- SMS Gateway -->
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 14px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <lucide-icon name="smartphone" [size]="18" color="#10b981"></lucide-icon>
                  <span style="font-weight: 700; font-size: 14px; color: #0f172a;">SMS Gateway (Ethio Telecom / API)</span>
                </div>
                <input type="checkbox" [(ngModel)]="notificationSettings.smsEnabled" style="width: 18px; height: 18px; accent-color: #10b981;" />
              </div>

              <div class="form-group">
                <label class="form-label">Gateway API Key</label>
                <input type="password" [(ngModel)]="notificationSettings.smsApiKey" class="form-control" placeholder="sec_live_..." />
              </div>
              <div class="form-group">
                <label class="form-label">Sender ID / Mask</label>
                <input type="text" [(ngModel)]="notificationSettings.smsSenderId" class="form-control" placeholder="BUNNA-PHARM" />
              </div>

              <div style="flex: 1;"></div>
              <button (click)="testChannel('SMS')" class="btn btn-outline" style="margin-top: auto; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                <lucide-icon name="send" [size]="14"></lucide-icon>
                <span>Send Test SMS</span>
              </button>
            </div>

            <!-- Telegram Gateway -->
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 14px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <lucide-icon name="bell" [size]="18" color="#0284c7"></lucide-icon>
                  <span style="font-weight: 700; font-size: 14px; color: #0f172a;">Telegram Alert Bot</span>
                </div>
                <input type="checkbox" [(ngModel)]="notificationSettings.telegramEnabled" style="width: 18px; height: 18px; accent-color: #0284c7;" />
              </div>

              <div class="form-group">
                <label class="form-label">Telegram Bot Token</label>
                <input type="password" [(ngModel)]="notificationSettings.telegramBotToken" class="form-control" placeholder="123456:ABC-DEF..." />
              </div>
              <div class="form-group">
                <label class="form-label">Telegram Chat ID</label>
                <input type="text" [(ngModel)]="notificationSettings.telegramChatId" class="form-control" placeholder="-100123456789" />
              </div>

              <div style="flex: 1;"></div>
              <button (click)="testChannel('TELEGRAM')" class="btn btn-outline" style="margin-top: auto; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                <lucide-icon name="send" [size]="14"></lucide-icon>
                <span>Send Test Telegram</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 7: BACKUP & DATA -->
      <div *ngIf="!loading() && activeTab === 'backup'" style="display: flex; flex-direction: column; gap: 24px;">
        <!-- System Health Overview Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          <div class="card" style="padding: 16px; border-left: 4px solid #0284c7;">
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">PMS Release</div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px;">{{ systemInfo?.appVersion || '1.0.0-ENTERPRISE' }}</div>
            <div style="font-size: 11px; color: #0284c7; margin-top: 2px;">Java {{ systemInfo?.javaVersion }}</div>
          </div>
          <div class="card" style="padding: 16px; border-left: 4px solid #10b981;">
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Server Uptime</div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px;">{{ formatUptime(systemInfo?.uptimeSeconds) }}</div>
            <div style="font-size: 11px; color: #10b981; margin-top: 2px;">PostgreSQL Active</div>
          </div>
          <div class="card" style="padding: 16px; border-left: 4px solid #8b5cf6;">
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">JVM Memory Allocation</div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px;">{{ systemInfo?.totalMemoryMb }} MB</div>
            <div style="font-size: 11px; color: #8b5cf6; margin-top: 2px;">{{ systemInfo?.freeMemoryMb }} MB free of {{ systemInfo?.maxMemoryMb }} MB max</div>
          </div>
          <div class="card" style="padding: 16px; border-left: 4px solid #f59e0b;">
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Indexed System Records</div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px;">
              {{ (systemInfo?.details?.['totalDrugsCount'] || 0) + (systemInfo?.details?.['totalBatchesCount'] || 0) + (systemInfo?.details?.['totalSalesCount'] || 0) + (systemInfo?.details?.['totalExpensesCount'] || 0) + (systemInfo?.details?.['totalPurchasesCount'] || 0) }} Records
            </div>
            <div style="font-size: 11px; color: #f59e0b; margin-top: 2px;">
              {{ systemInfo?.details?.['totalExpensesCount'] || 0 }} exp • {{ systemInfo?.details?.['totalPurchasesCount'] || 0 }} po • {{ systemInfo?.details?.['totalBatchesCount'] || 0 }} batches
            </div>
          </div>
        </div>

        <!-- Live Modules Count Breakdown -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
          <div style="padding: 10px 14px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">Drugs Catalog</div>
            <div style="font-size: 16px; font-weight: 800; color: #0284c7;">{{ systemInfo?.details?.['totalDrugsCount'] || 0 }}</div>
          </div>
          <div style="padding: 10px 14px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">Stock Batches</div>
            <div style="font-size: 16px; font-weight: 800; color: #10b981;">{{ systemInfo?.details?.['totalBatchesCount'] || 0 }}</div>
          </div>
          <div style="padding: 10px 14px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">Sales Invoices</div>
            <div style="font-size: 16px; font-weight: 800; color: #8b5cf6;">{{ systemInfo?.details?.['totalSalesCount'] || 0 }}</div>
          </div>
          <div style="padding: 10px 14px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">Expenses</div>
            <div style="font-size: 16px; font-weight: 800; color: #ef4444;">{{ systemInfo?.details?.['totalExpensesCount'] || 0 }}</div>
          </div>
          <div style="padding: 10px 14px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">Purchases (PO)</div>
            <div style="font-size: 16px; font-weight: 800; color: #f59e0b;">{{ systemInfo?.details?.['totalPurchasesCount'] || 0 }}</div>
          </div>
          <div style="padding: 10px 14px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">Suppliers</div>
            <div style="font-size: 16px; font-weight: 800; color: #0284c7;">{{ systemInfo?.details?.['totalSuppliersCount'] || 0 }}</div>
          </div>
          <div style="padding: 10px 14px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">Customers</div>
            <div style="font-size: 16px; font-weight: 800; color: #0d9488;">{{ systemInfo?.details?.['totalCustomersCount'] || 0 }}</div>
          </div>
          <div style="padding: 10px 14px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">Fixed Assets</div>
            <div style="font-size: 16px; font-weight: 800; color: #6366f1;">{{ systemInfo?.details?.['totalAssetsCount'] || 0 }}</div>
          </div>
        </div>

        <!-- Backup & Restore Actions -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
          <!-- Manual SQL Dump -->
          <div class="card" style="padding: 20px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <lucide-icon name="download" [size]="20" color="#0284c7"></lucide-icon>
              <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0;">Instant SQL Dump</h3>
            </div>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 16px;">Generate and download a full SQL database backup snapshot for offsite storage.</p>
            <button (click)="downloadManualBackup()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px;">
              <lucide-icon name="database" [size]="15"></lucide-icon>
              <span>Download SQL Dump</span>
            </button>
          </div>

          <!-- Auto Backup Schedule -->
          <div class="card" style="padding: 20px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <lucide-icon name="clock" [size]="20" color="#10b981"></lucide-icon>
              <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0;">Automated Backup Schedule</h3>
            </div>
            <form (ngSubmit)="saveBackupSchedule()" style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 11px;">Frequency</label>
                  <select [(ngModel)]="backupSchedule.frequency" name="frequency" class="form-control" style="padding: 6px 10px; font-size: 12px;">
                    <option value="DAILY">Daily (Recommended)</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="NEVER">Never</option>
                  </select>
                </div>
                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 11px;">Retention Days</label>
                  <input type="number" [(ngModel)]="backupSchedule.retentionDays" name="retentionDays" min="1" class="form-control" style="padding: 6px 10px; font-size: 12px;" />
                </div>
              </div>
              <button type="submit" class="btn btn-outline" style="align-self: flex-start; margin-top: 4px;">Save Schedule</button>
            </form>
          </div>

          <!-- Export Data to CSV -->
          <div class="card" style="padding: 20px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <lucide-icon name="file-spreadsheet" [size]="20" color="#8b5cf6"></lucide-icon>
              <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0;">Export Datasets to CSV</h3>
            </div>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 14px;">Export raw data tables to CSV format for audits, accounting, and spreadsheets.</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px;">
              <button (click)="exportCsv('users')" class="btn btn-outline" style="font-size: 11.5px; padding: 6px 8px;">Users</button>
              <button (click)="exportCsv('drugs')" class="btn btn-outline" style="font-size: 11.5px; padding: 6px 8px;">Drugs</button>
              <button (click)="exportCsv('batches')" class="btn btn-outline" style="font-size: 11.5px; padding: 6px 8px;">Batches</button>
              <button (click)="exportCsv('sales')" class="btn btn-outline" style="font-size: 11.5px; padding: 6px 8px;">Sales</button>
              <button (click)="exportCsv('expenses')" class="btn btn-outline" style="font-size: 11.5px; padding: 6px 8px;">Expenses</button>
              <button (click)="exportCsv('purchases')" class="btn btn-outline" style="font-size: 11.5px; padding: 6px 8px;">Purchases</button>
              <button (click)="exportCsv('suppliers')" class="btn btn-outline" style="font-size: 11.5px; padding: 6px 8px;">Suppliers</button>
              <button (click)="exportCsv('customers')" class="btn btn-outline" style="font-size: 11.5px; padding: 6px 8px;">Customers</button>
              <button (click)="exportCsv('assets')" class="btn btn-outline" style="font-size: 11.5px; padding: 6px 8px;">Fixed Assets</button>
            </div>
          </div>
        </div>

        <!-- Audit Logs Table -->
        <div class="card" style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0;">System Audit Logs</h3>
              <p style="font-size: 13px; color: #64748b; margin: 3px 0 0;">Immutable trail of administrative configuration actions</p>
            </div>
            <button (click)="loadAuditLogs()" class="btn btn-outline" style="font-size: 12px; padding: 7px 14px; display: inline-flex; align-items: center; gap: 6px;">
              <lucide-icon name="refresh-cw" [size]="13"></lucide-icon>
              <span>Refresh Logs</span>
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="padding: 10px 16px;">Timestamp</th>
                  <th style="padding: 10px 16px;">User</th>
                  <th style="padding: 10px 16px;">Action</th>
                  <th style="padding: 10px 16px;">Target Entity</th>
                  <th style="padding: 10px 16px;">Details</th>
                  <th style="padding: 10px 16px;">IP Address</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let log of auditLogs">
                  <td style="padding: 11px 16px; font-size: 12.5px; color: #64748b; white-space: nowrap;">
                    {{ log.createdAt | date:'medium' }}
                  </td>
                  <td style="padding: 11px 16px; font-weight: 700; font-size: 13px; color: #0f172a;">
                    {{ log.username || 'SYSTEM' }}
                  </td>
                  <td style="padding: 11px 16px;">
                    <span class="badge badge-primary" style="font-size: 11.5px; padding: 3px 8px; font-weight: 600;">{{ log.action }}</span>
                  </td>
                  <td style="padding: 11px 16px; font-size: 12.5px; color: #334155; font-weight: 600;">
                    {{ log.entityName }} #{{ log.entityId }}
                  </td>
                  <td style="padding: 11px 16px; font-size: 12.5px; color: #475569; max-width: 300px; line-height: 1.35;">
                    {{ log.detailsJson }}
                  </td>
                  <td style="padding: 11px 16px;">
                    <code style="font-family: 'JetBrains Mono', monospace; font-size: 11.5px; padding: 3px 6px; background: #f1f5f9; border-radius: 5px; border: 1px solid #e2e8f0; color: #475569;">
                      {{ log.ipAddress || '127.0.0.1' }}
                    </code>
                  </td>
                </tr>
                <tr *ngIf="auditLogs.length === 0">
                  <td colspan="6" style="text-align: center; padding: 36px 20px; color: #64748b;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                      <lucide-icon name="clipboard-list" [size]="28" color="#94a3b8"></lucide-icon>
                      <p style="font-size: 13.5px; font-weight: 600; margin: 0;">No recent audit logs recorded</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: ADD / EDIT USER -->
    <div *ngIf="showUserModal" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div class="card" style="width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; padding: 24px; box-shadow: var(--shadow-xl);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
          <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0;">
            {{ editingUser ? 'Edit Staff User' : 'Add New Staff User' }}
          </h3>
          <button (click)="showUserModal = false" style="background: none; border: none; cursor: pointer; color: #64748b;">
            <lucide-icon name="x" [size]="18"></lucide-icon>
          </button>
        </div>

        <form (ngSubmit)="saveUserForm()" style="display: flex; flex-direction: column; gap: 14px;">
          <div *ngIf="!editingUser" class="form-group">
            <label class="form-label">Username <span class="text-danger">*</span></label>
            <input type="text" [(ngModel)]="userForm.username" name="username" class="form-control" required placeholder="e.g. abeberx" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label">First Name <span class="text-danger">*</span></label>
              <input type="text" [(ngModel)]="userForm.firstName" name="firstName" class="form-control" required placeholder="Abebe" />
            </div>
            <div class="form-group">
              <label class="form-label">Last Name <span class="text-danger">*</span></label>
              <input type="text" [(ngModel)]="userForm.lastName" name="lastName" class="form-control" required placeholder="Kebede" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Email Address <span class="text-danger">*</span></label>
            <input type="email" [(ngModel)]="userForm.email" name="email" class="form-control" required placeholder="abebe@bunnapharmacy.com" />
          </div>

          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="text" [(ngModel)]="userForm.phone" name="phone" class="form-control" placeholder="+251-911-000000" />
          </div>

          <div *ngIf="!editingUser" class="form-group">
            <label class="form-label">Password <span class="text-danger">*</span></label>
            <input type="password" [(ngModel)]="userForm.password" name="password" class="form-control" required placeholder="Min 8 chars, 1 uppercase, 1 num, 1 special" />
            <span style="font-size: 11px; color: #64748b;">Must have >= 8 chars, 1 uppercase, 1 number, 1 special symbol</span>
          </div>

          <div class="form-group">
            <label class="form-label">Primary Staff Role <span class="text-danger">*</span></label>
            <select [(ngModel)]="userForm.role" name="role" class="form-control" required>
              <option value="ROLE_OWNER">Super Admin / Owner (Full Control)</option>
              <option value="ROLE_PHARMACIST">Pharmacist (Dispense, FEFO Stock, GRN)</option>
              <option value="ROLE_CASHIER_ACCOUNTANT">Cashier / Accountant (POS, Shifts, Cash)</option>
            </select>
          </div>

          <div *ngIf="editingUser" class="form-group">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
              <input type="checkbox" [(ngModel)]="userForm.active" name="active" style="width: 18px; height: 18px; accent-color: #0284c7;" />
              <span style="font-size: 13px; font-weight: 600; color: #334155;">Active User Account</span>
            </label>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button type="button" (click)="showUserModal = false" class="btn btn-outline">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn btn-primary">
              {{ saving() ? 'Saving...' : (editingUser ? 'Update User' : 'Create User') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: RESET PASSWORD -->
    <div *ngIf="showResetPasswordModal" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div class="card" style="width: 100%; max-width: 440px; padding: 24px; box-shadow: var(--shadow-xl);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0;">Reset Password</h3>
          <button (click)="showResetPasswordModal = false" style="background: none; border: none; cursor: pointer; color: #64748b;">
            <lucide-icon name="x" [size]="18"></lucide-icon>
          </button>
        </div>

        <p style="font-size: 12px; color: #64748b; margin: 0 0 16px;">
          Set a temporary new password for user <strong>{{ selectedUserForReset?.username }}</strong>.
        </p>

        <form (ngSubmit)="executeResetPassword()" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="form-group">
            <label class="form-label">New Password <span class="text-danger">*</span></label>
            <input type="password" [(ngModel)]="newPasswordInput" name="newPassword" class="form-control" required placeholder="e.g. Bunna@2026!" />
            <span style="font-size: 11px; color: #64748b;">Min 8 chars with 1 uppercase, 1 number, 1 special character</span>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
            <button type="button" (click)="showResetPasswordModal = false" class="btn btn-outline">Cancel</button>
            <button type="submit" [disabled]="saving()" class="btn btn-primary">Reset Password</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .tab-nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .tab-nav-btn:hover {
      color: #0284c7;
      background: #f1f5f9;
      border-radius: 6px 6px 0 0;
    }
    .active-tab-btn {
      color: #0284c7 !important;
      border-bottom-color: #0284c7 !important;
      background: #f8fafc;
      font-weight: 700;
    }
    .text-danger { color: #ef4444; }
    .btn-icon {
      background: none;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #64748b;
      transition: all 0.15s ease;
    }
    .btn-icon:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
  `]
})
export class SettingsComponent implements OnInit {
  activeTab = 'profile';
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  minExpiryDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  tabs = [
    { id: 'profile', label: '1. Pharmacy Profile', icon: 'store' },
    { id: 'users', label: '2. User Management', icon: 'users' },
    { id: 'permissions', label: '3. Role & Permissions', icon: 'shield' },
    { id: 'tax', label: '4. Tax Configuration', icon: 'percent' },
    { id: 'system', label: '5. System Preferences', icon: 'sliders' },
    { id: 'notifications', label: '6. Notifications', icon: 'bell' },
    { id: 'backup', label: '7. Backup & Data', icon: 'database' },
  ];

  // Tab 1: Profile
  profile: PharmacyProfile = {
    name: '',
    legalName: '',
    address: '',
    phone: '',
    email: '',
    tin: '',
    licenseNumber: '',
    licenseExpiry: ''
  };

  // Tab 2: Users
  users: UserItem[] = [];
  userSearchQuery = '';
  showUserModal = false;
  editingUser: UserItem | null = null;
  userForm: any = { role: 'ROLE_PHARMACIST', active: true };
  showResetPasswordModal = false;
  selectedUserForReset: UserItem | null = null;
  newPasswordInput = '';

  // Tab 3: RBAC
  rbacMatrix: RbacMatrix | null = null;

  // Tab 4: Tax
  taxConfig: TaxConfig = {
    vatRate: 15.0,
    taxInclusive: false,
    defaultTaxCode: 'VAT-15'
  };

  // Tab 5: System
  systemSettings: SystemSettings = {
    currency: 'ETB',
    currencySymbol: 'Br',
    dateFormat: 'DD/MM/YYYY',
    timeZone: 'Africa/Addis_Ababa',
    language: 'en',
    receiptFooter: 'Thank you! Get well soon!',
    receiptPrinter: 'PDF',
    lowStockThreshold: 20,
    expiryAlertDays: 30,
    sessionTimeoutMinutes: 15,
    sessionWarningMinutes: 2,
    autoPrintReceipt: false,
    requireShiftOpen: false,
    maxDiscountPercent: 10.0,
    defaultPaymentMethod: 'CASH'
  };

  // Tab 6: Notifications
  notificationSettings: NotificationSettings = {
    emailEnabled: false,
    smsEnabled: false,
    telegramEnabled: false,
    lowStockAlertEnabled: true,
    expiryAlertEnabled: true,
    dailyReportEnabled: false
  };

  // Tab 7: Backup & Data
  backupSchedule: BackupSchedule = {
    frequency: 'DAILY',
    retentionDays: 30
  };
  auditLogs: AuditLog[] = [];
  systemInfo: SystemInfo | null = null;

  constructor(
    private settingsService: SettingsService,
    public authService: AuthService,
    private notif: NotificationService,
    private confirmService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab && this.tabs.some(t => t.id === tab)) {
        this.activeTab = tab;
      }
      this.loadTabContent(this.activeTab);
    });
  }

  onTabChange(tabId: string): void {
    this.activeTab = tabId;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId },
      queryParamsHandling: 'merge'
    });
    this.loadTabContent(tabId);
  }

  loadTabContent(tabId: string): void {
    switch (tabId) {
      case 'profile': this.loadProfile(); break;
      case 'users': this.loadUsers(); break;
      case 'permissions': this.loadRbacMatrix(); break;
      case 'tax': this.loadTaxConfig(); break;
      case 'system': this.loadSystemSettings(); break;
      case 'notifications': this.loadNotificationSettings(); break;
      case 'backup': this.loadBackupData(); break;
    }
  }

  refreshCurrentTab(): void {
    this.loadTabContent(this.activeTab);
  }

  // 1. Profile Methods
  loadProfile(): void {
    this.loading.set(true);
    this.settingsService.getProfile().subscribe({
      next: res => {
        if (res.data) this.profile = res.data;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  saveProfile(): void {
    this.saving.set(true);
    this.settingsService.updateProfile(this.profile).subscribe({
      next: res => {
        this.notif.show('Pharmacy profile saved successfully!', 'success');
        this.saving.set(false);
      },
      error: err => {
        this.notif.show(err.error?.message || 'Failed to update pharmacy profile', 'error');
        this.saving.set(false);
      }
    });
  }

  onLogoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.settingsService.uploadLogo(file).subscribe({
        next: res => {
          if (res.data) this.profile = res.data;
          this.notif.show('Logo uploaded successfully!', 'success');
        },
        error: err => this.notif.show(err.error?.message || 'Failed to upload logo', 'error')
      });
    }
  }

  // 2. User Management Methods
  loadUsers(): void {
    this.loading.set(true);
    this.settingsService.getUsers(this.userSearchQuery).subscribe({
      next: res => {
        this.users = res.data?.content || [];
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openAddUserModal(): void {
    this.editingUser = null;
    this.userForm = { role: 'ROLE_PHARMACIST', active: true };
    this.showUserModal = true;
  }

  openEditUserModal(user: UserItem): void {
    this.editingUser = user;
    this.userForm = {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.roles?.[0] || 'ROLE_PHARMACIST',
      active: user.active
    };
    this.showUserModal = true;
  }

  saveUserForm(): void {
    this.saving.set(true);
    if (this.editingUser) {
      const payload = {
        firstName: this.userForm.firstName,
        lastName: this.userForm.lastName,
        email: this.userForm.email,
        phone: this.userForm.phone,
        roles: [this.userForm.role],
        active: this.userForm.active
      };
      this.settingsService.updateUser(this.editingUser.id, payload).subscribe({
        next: () => {
          this.notif.show('User updated successfully!', 'success');
          this.showUserModal = false;
          this.saving.set(false);
          this.loadUsers();
        },
        error: err => {
          this.notif.show(err.error?.message || 'Failed to update user', 'error');
          this.saving.set(false);
        }
      });
    } else {
      const payload = {
        username: this.userForm.username,
        password: this.userForm.password,
        firstName: this.userForm.firstName,
        lastName: this.userForm.lastName,
        email: this.userForm.email,
        phone: this.userForm.phone,
        roles: [this.userForm.role]
      };
      this.settingsService.createUser(payload).subscribe({
        next: () => {
          this.notif.show('User created successfully!', 'success');
          this.showUserModal = false;
          this.saving.set(false);
          this.loadUsers();
        },
        error: err => {
          this.notif.show(err.error?.message || 'Failed to create user', 'error');
          this.saving.set(false);
        }
      });
    }
  }

  deactivateUser(user: UserItem): void {
    this.confirmService.confirm({
      title: 'Deactivate User',
      message: `Are you sure you want to deactivate user account "${user.username}"? They will no longer be able to log in.`,
      confirmText: 'Deactivate',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.settingsService.deactivateUser(user.id).subscribe({
          next: () => {
            this.notif.show('User deactivated successfully', 'success');
            this.loadUsers();
          },
          error: err => this.notif.show(err.error?.message || 'Failed to deactivate user', 'error')
        });
      }
    });
  }

  openResetPasswordModal(user: UserItem): void {
    this.selectedUserForReset = user;
    this.newPasswordInput = '';
    this.showResetPasswordModal = true;
  }

  executeResetPassword(): void {
    if (!this.selectedUserForReset) return;
    this.saving.set(true);
    this.settingsService.resetPassword(this.selectedUserForReset.id, this.newPasswordInput).subscribe({
      next: () => {
        this.notif.show('Password reset successfully!', 'success');
        this.showResetPasswordModal = false;
        this.saving.set(false);
      },
      error: err => {
        this.notif.show(err.error?.message || 'Failed to reset password', 'error');
        this.saving.set(false);
      }
    });
  }

  isCurrentUser(user: UserItem): boolean {
    const current = this.authService.currentUser();
    return current ? current.username === user.username : false;
  }

  formatRoleName(role: string): string {
    return role.replace('ROLE_', '').replace('_', ' ');
  }

  // 3. RBAC Methods
  loadRbacMatrix(): void {
    this.loading.set(true);
    this.settingsService.getRbacMatrix().subscribe({
      next: res => {
        this.rbacMatrix = res.data;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  hasPermission(roleName: string, permCode: string): boolean {
    if (!this.rbacMatrix?.rolePermissions) return false;
    const perms = this.rbacMatrix.rolePermissions[roleName];
    return perms ? perms.includes(permCode) : false;
  }

  togglePermission(roleName: string, permCode: string): void {
    if (!this.rbacMatrix) return;
    if (!this.rbacMatrix.rolePermissions[roleName]) {
      this.rbacMatrix.rolePermissions[roleName] = [];
    }
    const perms = this.rbacMatrix.rolePermissions[roleName];
    const idx = perms.indexOf(permCode);
    if (idx > -1) {
      perms.splice(idx, 1);
    } else {
      perms.push(permCode);
    }
  }

  saveRbacMatrix(): void {
    if (!this.rbacMatrix) return;
    this.saving.set(true);
    this.settingsService.updateRbacMatrix(this.rbacMatrix.rolePermissions).subscribe({
      next: res => {
        this.rbacMatrix = res.data;
        this.notif.show('RBAC permissions matrix updated successfully!', 'success');
        this.saving.set(false);
      },
      error: err => {
        this.notif.show(err.error?.message || 'Failed to update RBAC matrix', 'error');
        this.saving.set(false);
      }
    });
  }

  // 4. Tax Methods
  loadTaxConfig(): void {
    this.loading.set(true);
    this.settingsService.getTaxConfig().subscribe({
      next: res => {
        if (res.data) this.taxConfig = res.data;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  saveTaxConfig(): void {
    this.saving.set(true);
    this.settingsService.updateTaxConfig(this.taxConfig).subscribe({
      next: res => {
        this.notif.show('Tax rules updated successfully!', 'success');
        this.saving.set(false);
      },
      error: err => {
        this.notif.show(err.error?.message || 'Failed to update tax rules', 'error');
        this.saving.set(false);
      }
    });
  }

  // 5. System Settings Methods
  loadSystemSettings(): void {
    this.loading.set(true);
    this.settingsService.getSystemSettings().subscribe({
      next: res => {
        if (res.data) this.systemSettings = res.data;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  saveSystemSettings(): void {
    this.saving.set(true);
    this.settingsService.updateSystemSettings(this.systemSettings).subscribe({
      next: res => {
        this.notif.show('System preferences saved successfully!', 'success');
        this.saving.set(false);
      },
      error: err => {
        this.notif.show(err.error?.message || 'Failed to update system settings', 'error');
        this.saving.set(false);
      }
    });
  }

  // 6. Notifications Methods
  loadNotificationSettings(): void {
    this.loading.set(true);
    this.settingsService.getNotificationSettings().subscribe({
      next: res => {
        if (res.data) this.notificationSettings = res.data;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  saveNotificationSettings(): void {
    this.saving.set(true);
    this.settingsService.updateNotificationSettings(this.notificationSettings).subscribe({
      next: res => {
        this.notif.show('Notification settings saved successfully!', 'success');
        this.saving.set(false);
      },
      error: err => {
        this.notif.show(err.error?.message || 'Failed to update notification settings', 'error');
        this.saving.set(false);
      }
    });
  }

  testChannel(channel: string): void {
    this.settingsService.testNotification(channel).subscribe({
      next: res => this.notif.show(res.data?.message || `Test message sent to ${channel}`, 'success'),
      error: err => this.notif.show(err.error?.message || `Failed to test ${channel} gateway`, 'error')
    });
  }

  // 7. Backup & Data Methods
  loadBackupData(): void {
    this.loading.set(true);
    this.settingsService.getBackupSchedule().subscribe({
      next: res => { if (res.data) this.backupSchedule = res.data; }
    });
    this.loadAuditLogs();
    this.settingsService.getSystemInfo().subscribe({
      next: res => {
        if (res.data) this.systemInfo = res.data;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadAuditLogs(): void {
    this.settingsService.getAuditLogs().subscribe({
      next: res => { this.auditLogs = res.data || []; }
    });
  }

  saveBackupSchedule(): void {
    this.settingsService.updateBackupSchedule(this.backupSchedule).subscribe({
      next: () => this.notif.show('Backup schedule updated successfully', 'success'),
      error: err => this.notif.show(err.error?.message || 'Failed to update backup schedule', 'error')
    });
  }

  downloadManualBackup(): void {
    this.settingsService.downloadBackup().subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pms_backup_${new Date().toISOString().slice(0, 10)}.sql`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.notif.show('SQL Database Dump downloaded successfully!', 'success');
      },
      error: () => this.notif.show('Failed to generate SQL backup dump', 'error')
    });
  }

  exportCsv(entity: string): void {
    this.settingsService.exportDataCsv(entity).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${entity}_export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.notif.show(`${entity.toUpperCase()} dataset exported to CSV`, 'success');
      },
      error: () => this.notif.show(`Failed to export ${entity} CSV`, 'error')
    });
  }

  clearCache(): void {
    this.confirmService.confirm({
      title: 'Flush Application Cache',
      message: 'Are you sure you want to flush all in-memory and Redis caches? Dynamic configuration will reload from the database.',
      confirmText: 'Flush Cache',
      type: 'primary'
    }).then(confirmed => {
      if (confirmed) {
        this.settingsService.clearCache().subscribe({
          next: () => this.notif.show('System cache cleared successfully', 'success'),
          error: () => this.notif.show('Failed to flush cache', 'error')
        });
      }
    });
  }

  formatUptime(seconds?: number): string {
    if (!seconds) return 'Active';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  }
}
