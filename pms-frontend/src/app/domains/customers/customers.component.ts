import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../core/services/notification.service';
import { environment } from '../../../environments/environment';

export interface CustomerItem {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  address?: string;
  customerType: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
  creditLimit: number;
  currentBalance: number;
  createdAt?: string;
}

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div style="display: flex; flex-direction: column; gap: 22px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: var(--slate-900);">Customer & Client Directory</h1>
          <p style="font-size: 13px; color: var(--slate-500); margin-top: 2px;">
            Manage wholesale clinics, distributors, retail accounts, credit limits, and outstanding balances
          </p>
        </div>
        <button (click)="openCreateModal()" class="btn btn-primary" style="box-shadow: var(--shadow); display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="user-plus" [size]="16"></lucide-icon> Register New Customer
        </button>
      </div>

      <!-- Filters & Search Bar -->
      <div class="card" style="padding: 16px; display: flex; gap: 14px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 280px; position: relative;">
          <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
          <input type="text" [(ngModel)]="searchQuery" (input)="loadCustomers()"
                 class="form-control" style="padding-left: 36px;" placeholder="Search customers by name, phone, email, or TIN..." />
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <label style="font-size: 12px; font-weight: 600; color: var(--slate-600); display: flex; align-items: center; gap: 4px;">
            <lucide-icon name="filter" [size]="13"></lucide-icon> Type Filter:
          </label>
          <select [(ngModel)]="selectedTypeFilter" class="form-control" style="width: auto; min-width: 170px;">
            <option value="">All Account Types</option>
            <option value="RETAIL">Retail Customer</option>
            <option value="WHOLESALE">Wholesale Clinic/Pharmacy</option>
            <option value="DISTRIBUTOR">Regional Distributor</option>
          </select>
          <button (click)="resetFilters()" class="btn btn-outline" style="padding: 8px 12px; display: inline-flex; align-items: center; gap: 4px;">
            <lucide-icon name="rotate-ccw" [size]="13"></lucide-icon> Reset
          </button>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
            <thead style="background: #f8fafc; border-bottom: 1px solid var(--slate-200); color: var(--slate-600); font-weight: 700;">
              <tr>
                <th style="padding: 14px 18px;">Customer / Organization</th>
                <th style="padding: 14px 18px;">Account Type</th>
                <th style="padding: 14px 18px;">Phone</th>
                <th style="padding: 14px 18px;">Email & TIN</th>
                <th style="padding: 14px 18px;">Credit Limit</th>
                <th style="padding: 14px 18px;">Current Balance</th>
                <th style="padding: 14px 18px; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of filteredCustomers()" style="border-bottom: 1px solid var(--slate-100);" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                <!-- Customer Name & Address -->
                <td style="padding: 14px 18px;">
                  <div style="font-weight: 800; color: var(--slate-900);">{{ c.name }}</div>
                  <div style="font-size: 11px; color: var(--slate-500);">{{ c.address || 'Address not specified' }}</div>
                </td>

                <!-- Account Type -->
                <td style="padding: 14px 18px;">
                  <span class="badge" [ngClass]="getTypeBadgeClass(c.customerType)">
                    {{ c.customerType }}
                  </span>
                </td>

                <!-- Phone -->
                <td style="padding: 14px 18px; color: var(--slate-700); font-weight: 600;">
                  {{ c.phone || '-' }}
                </td>

                <!-- Email & Tax Number -->
                <td style="padding: 14px 18px;">
                  <div style="color: var(--slate-700);">{{ c.email || '-' }}</div>
                  <div *ngIf="c.taxNumber" style="font-size: 11px; color: var(--slate-500);">TIN: {{ c.taxNumber }}</div>
                </td>

                <!-- Credit Limit -->
                <td style="padding: 14px 18px; font-weight: 600; color: var(--slate-700);">
                  ETB {{ (c.creditLimit || 0) | number:'1.2-2' }}
                </td>

                <!-- Current Balance -->
                <td style="padding: 14px 18px;">
                  <span style="font-weight: 800;" [style.color]="(c.currentBalance || 0) > 0 ? '#dc2626' : '#059669'">
                    ETB {{ (c.currentBalance || 0) | number:'1.2-2' }}
                  </span>
                </td>

                <!-- Actions -->
                <td style="padding: 14px 18px; text-align: right;">
                  <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                    <a [routerLink]="['/pos']" class="btn btn-outline" style="padding: 5px 9px; font-size: 12px; color: #0284c7; display: inline-flex; align-items: center; gap: 4px;" title="Create Sale for this Customer">
                      <lucide-icon name="zap" [size]="13"></lucide-icon> POS
                    </a>
                    <button (click)="openEditModal(c)" class="btn btn-outline" style="padding: 5px 8px; font-size: 12px; display: inline-flex; align-items: center;" title="Edit details">
                      <lucide-icon name="edit-2" [size]="13"></lucide-icon>
                    </button>
                    <button (click)="confirmDelete(c)" class="btn btn-outline" style="padding: 5px 8px; font-size: 12px; color: #ef4444; display: inline-flex; align-items: center;" title="Delete customer">
                      <lucide-icon name="trash-2" [size]="13"></lucide-icon>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="filteredCustomers().length === 0">
                <td colspan="7" style="text-align: center; padding: 36px; color: var(--slate-400);">
                  No customer records found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create / Edit Customer Modal -->
    <div *ngIf="showModal()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 540px; max-width: 100%; padding: 26px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 18px; font-weight: 800;">
            {{ isEditing() ? 'Edit Customer Profile' : 'Register New Customer Account' }}
          </h3>
          <button (click)="showModal.set(false)" style="background: none; border: none; cursor: pointer; color: var(--slate-400); display: flex; align-items: center;">
            <lucide-icon name="x" [size]="18"></lucide-icon>
          </button>
        </div>

        <form (ngSubmit)="saveCustomer()" style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="font-size: 12px; font-weight: 700;">Customer / Clinic Name *</label>
            <input type="text" [(ngModel)]="formData.name" name="name" required class="form-control" placeholder="e.g. Red Cross Clinic (Wholesale)" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 12px; font-weight: 700;">Customer Type *</label>
              <select [(ngModel)]="formData.customerType" name="customerType" class="form-control">
                <option value="RETAIL">Retail Customer</option>
                <option value="WHOLESALE">Wholesale Clinic/Pharmacy</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700;">Phone Number</label>
              <input type="text" [(ngModel)]="formData.phone" name="phone" class="form-control" placeholder="+251-911-000000" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 12px; font-weight: 700;">Email Address</label>
              <input type="email" [(ngModel)]="formData.email" name="email" class="form-control" placeholder="client@domain.com" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700;">Tax Identification (TIN)</label>
              <input type="text" [(ngModel)]="formData.taxNumber" name="taxNumber" class="form-control" placeholder="TIN-00123456" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="font-size: 12px; font-weight: 700;">Credit Limit (ETB)</label>
              <input type="number" [(ngModel)]="formData.creditLimit" name="creditLimit" class="form-control" placeholder="50000" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700;">Address / Location</label>
              <input type="text" [(ngModel)]="formData.address" name="address" class="form-control" placeholder="Bole Subcity, Addis Ababa" />
            </div>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 14px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
            <button type="button" (click)="showModal.set(false)" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button type="submit" class="btn btn-primary" style="flex: 2;">
              {{ isEditing() ? 'Update Customer' : 'Register Customer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class CustomersComponent implements OnInit {
  customers = signal<CustomerItem[]>([]);
  searchQuery = '';
  selectedTypeFilter = '';

  showModal = signal(false);
  isEditing = signal(false);
  editingId: number | null = null;

  formData: any = {
    name: '',
    phone: '',
    email: '',
    taxNumber: '',
    address: '',
    customerType: 'RETAIL',
    creditLimit: 0
  };

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    const q = this.searchQuery ? `?query=${encodeURIComponent(this.searchQuery)}` : '';
    this.http.get<any>(`${environment.apiUrl}/customers${q}`).subscribe({
      next: (res) => this.customers.set(res.data || [])
    });
  }

  filteredCustomers(): CustomerItem[] {
    if (!this.selectedTypeFilter) return this.customers();
    return this.customers().filter(c => c.customerType === this.selectedTypeFilter);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedTypeFilter = '';
    this.loadCustomers();
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingId = null;
    this.formData = {
      name: '',
      phone: '',
      email: '',
      taxNumber: '',
      address: '',
      customerType: 'RETAIL',
      creditLimit: 0
    };
    this.showModal.set(true);
  }

  openEditModal(customer: CustomerItem): void {
    this.isEditing.set(true);
    this.editingId = customer.id;
    this.formData = {
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      taxNumber: customer.taxNumber || '',
      address: customer.address || '',
      customerType: customer.customerType,
      creditLimit: customer.creditLimit || 0
    };
    this.showModal.set(true);
  }

  saveCustomer(): void {
    if (this.isEditing() && this.editingId) {
      this.http.put<any>(`${environment.apiUrl}/customers/${this.editingId}`, this.formData).subscribe({
        next: () => {
          this.notificationService.success('Customer details updated successfully!');
          this.showModal.set(false);
          this.loadCustomers();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to update customer')
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/customers`, this.formData).subscribe({
        next: () => {
          this.notificationService.success('Customer registered successfully!');
          this.showModal.set(false);
          this.loadCustomers();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to register customer')
      });
    }
  }

  confirmDelete(customer: CustomerItem): void {
    if (confirm(`Delete customer "${customer.name}"?`)) {
      this.http.delete<any>(`${environment.apiUrl}/customers/${customer.id}`).subscribe({
        next: () => {
          this.notificationService.success('Customer deleted.');
          this.loadCustomers();
        },
        error: (err) => this.notificationService.error(err.error?.message || 'Failed to delete customer')
      });
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'WHOLESALE': return 'badge-primary';
      case 'DISTRIBUTOR': return 'badge-warning';
      case 'RETAIL': default: return 'badge-success';
    }
  }
}
