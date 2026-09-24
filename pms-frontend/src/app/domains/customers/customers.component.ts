import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { ValidationService } from '../../core/services/validation.service';
import { environment } from '../../../environments/environment';
import { PaginationComponent, PaginatePipe } from '../../shared';

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
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, PaginationComponent, PaginatePipe],
  template: `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: var(--slate-900);">Customer & Client Directory</h1>
          <p style="font-size: 13px; color: var(--slate-500); margin-top: 2px;">
            Manage wholesale clinics, distributors, retail accounts, credit limits, and outstanding balances
          </p>
        </div>

        <button (click)="openCreateModal()" class="btn btn-primary" style="box-shadow: var(--shadow); display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="user-plus" [size]="15"></lucide-icon> Register New Client
        </button>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
        <div class="card" style="border-left: 4px solid #0284c7;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Active Clients</span>
            <lucide-icon name="users" [size]="18" color="#0284c7"></lucide-icon>
          </div>
          <div style="font-size: 24px; font-weight: 800; color: var(--slate-900); margin: 6px 0 2px;">
            {{ customers().length }} Accounts
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Registered clinics & retail buyers
          </div>
        </div>

        <div class="card" style="border-left: 4px solid #ef4444;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Outstanding Credit</span>
            <lucide-icon name="credit-card" [size]="18" color="#dc2626"></lucide-icon>
          </div>
          <div style="font-size: 24px; font-weight: 800; color: #dc2626; margin: 6px 0 2px; font-family: monospace;">
            ETB {{ getTotalOutstanding() | number:'1.2-2' }}
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Total receivable portfolio
          </div>
        </div>

        <div class="card" style="border-left: 4px solid #10b981;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">Total Credit Limit</span>
            <lucide-icon name="shield-check" [size]="18" color="#059669"></lucide-icon>
          </div>
          <div style="font-size: 24px; font-weight: 800; color: #059669; margin: 6px 0 2px; font-family: monospace;">
            ETB {{ getTotalCreditCapacity() | number:'1.2-2' }}
          </div>
          <div style="font-size: 11px; color: var(--slate-500);">
            Authorized credit headroom
          </div>
        </div>
      </div>

      <!-- Filters Toolbar -->
      <div class="card" style="padding: 14px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 260px; position: relative;">
          <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
          <input type="text" [(ngModel)]="searchQuery" (input)="loadCustomers()"
                 class="form-control" style="padding-left: 36px;" placeholder="Search customers by name, phone, email, or TIN..." />
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
          <select [(ngModel)]="selectedTypeFilter" class="form-control" style="width: auto; min-width: 170px;">
            <option value="">All Account Types</option>
            <option value="RETAIL">Retail Customers</option>
            <option value="WHOLESALE">Wholesale Clinics</option>
            <option value="DISTRIBUTOR">Distributors</option>
          </select>
          <button (click)="resetFilters()" class="btn btn-outline" style="padding: 8px 12px; display: inline-flex; align-items: center; gap: 4px;">
            <lucide-icon name="rotate-ccw" [size]="13"></lucide-icon> Reset
          </button>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <app-pagination
          [totalItems]="filteredCustomers().length"
          [pageSize]="pageSize()"
          [currentPage]="page()"
          (pageChange)="page.set($event)"
          (pageSizeChange)="pageSize.set($event); page.set(1)">
        </app-pagination>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
            <thead style="background: #f8fafc; border-bottom: 1px solid var(--slate-200); color: var(--slate-600); font-weight: 700;">
              <tr>
                <th style="padding: 12px 16px;">Customer / Organization</th>
                <th style="padding: 12px 16px;">Account Type</th>
                <th style="padding: 12px 16px;">Phone & Contact</th>
                <th style="padding: 12px 16px;">Email & TIN</th>
                <th style="padding: 12px 16px; text-align: right;">Credit Limit</th>
                <th style="padding: 12px 16px; text-align: right;">Current Balance</th>
                <th style="padding: 12px 16px; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of (filteredCustomers() | paginate: page() : pageSize())" style="border-bottom: 1px solid var(--slate-100);" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                <td style="padding: 12px 16px;">
                  <div style="font-weight: 800; color: var(--slate-900);">{{ c.name }}</div>
                  <div style="font-size: 11px; color: var(--slate-500);">{{ c.address || 'Address not specified' }}</div>
                </td>

                <td style="padding: 12px 16px;">
                  <span class="badge" [ngClass]="getTypeBadgeClass(c.customerType)">
                    {{ c.customerType }}
                  </span>
                </td>

                <td style="padding: 12px 16px; font-weight: 600; color: var(--slate-800);">
                  {{ c.phone || '-' }}
                </td>

                <td style="padding: 12px 16px;">
                  <div style="color: var(--slate-700);">{{ c.email || '-' }}</div>
                  <div *ngIf="c.taxNumber" style="font-size: 11px; color: var(--slate-500);">TIN: {{ c.taxNumber }}</div>
                </td>

                <td style="padding: 12px 16px; text-align: right; font-family: monospace; font-weight: 600; color: var(--slate-700);">
                  ETB {{ (c.creditLimit || 0) | number:'1.2-2' }}
                </td>

                <td style="padding: 12px 16px; text-align: right; font-family: monospace; font-weight: 800;"
                    [style.color]="(c.currentBalance || 0) > 0 ? '#dc2626' : '#059669'">
                  ETB {{ (c.currentBalance || 0) | number:'1.2-2' }}
                </td>

                <td style="padding: 12px 16px; text-align: right;">
                  <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                    <button *ngIf="(c.currentBalance || 0) > 0" (click)="openSettleModal(c)" class="btn btn-success" style="padding: 4px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;" title="Settle Outstanding Credit">
                      <lucide-icon name="wallet" [size]="12"></lucide-icon> Settle
                    </button>
                    <a [routerLink]="['/pos']" [queryParams]="{ customerId: c.id }" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; color: #0284c7; display: inline-flex; align-items: center; gap: 4px;" title="Create Sale in POS">
                      <lucide-icon name="zap" [size]="12"></lucide-icon> POS
                    </a>
                    <button (click)="openEditModal(c)" class="btn btn-outline" style="padding: 4px 6px; font-size: 11px; display: inline-flex; align-items: center;" title="Edit details">
                      <lucide-icon name="edit-2" [size]="12"></lucide-icon>
                    </button>
                    <button (click)="confirmDelete(c)" class="btn btn-outline" style="padding: 4px 6px; font-size: 11px; color: #ef4444; border-color: #fecaca; display: inline-flex; align-items: center;" title="Delete customer">
                      <lucide-icon name="trash-2" [size]="12"></lucide-icon>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="filteredCustomers().length === 0">
                <td colspan="7" style="text-align: center; padding: 36px; color: var(--slate-400);">No customer records found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL: Settle Credit -->
    <div *ngIf="showSettleModal" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 440px; max-width: 100%; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 10px;">
          <h3 style="font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <lucide-icon name="circle-dollar-sign" [size]="20" color="#059669"></lucide-icon> Settle Credit Account
          </h3>
          <button (click)="showSettleModal = false" style="background: none; border: none; cursor: pointer; color: var(--slate-400);">✕</button>
        </div>

        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid var(--slate-200); margin-bottom: 14px; font-size: 13px;">
          <div><strong>Customer:</strong> {{ settleTarget?.name }}</div>
          <div style="color: #dc2626; font-weight: 700; margin-top: 4px;">
            Outstanding Balance: ETB {{ (settleTarget?.currentBalance || 0) | number:'1.2-2' }}
          </div>
        </div>

        <form (ngSubmit)="submitSettlePayment()" style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="font-size: 12px; font-weight: 700;">Payment Amount (ETB) *</label>
            <input type="number" [(ngModel)]="settleForm.amount" name="amount" required min="1" [max]="settleTarget?.currentBalance || 9999999" class="form-control" style="font-size: 18px; font-weight: 800;" />
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700;">Payment Method *</label>
            <select [(ngModel)]="settleForm.paymentMethod" name="paymentMethod" class="form-control">
              <option value="CASH">Cash Deposit (Recorded into Register)</option>
              <option value="MOBILE_MONEY">Telebirr / CBE Birr</option>
              <option value="CARD">Bank Card / POS</option>
              <option value="BANK_TRANSFER">Direct Bank Transfer</option>
            </select>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700;">Reference # / Note</label>
            <input type="text" [(ngModel)]="settleForm.notes" name="notes" placeholder="e.g. Telebirr Txn #FT12345" class="form-control" />
          </div>

          <div style="display: flex; gap: 10px; margin-top: 10px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
            <button type="button" (click)="showSettleModal = false" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button type="submit" class="btn btn-success" style="flex: 2;">Record Payment & Receipt</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Create / Edit Customer Modal -->
    <div *ngIf="showModal()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 500px; max-width: 100%; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--slate-200); padding-bottom: 10px;">
          <h3 style="font-size: 18px; font-weight: 800;">
            {{ isEditing() ? 'Edit Customer Profile' : 'Register New Customer Account' }}
          </h3>
          <button (click)="showModal.set(false)" style="background: none; border: none; cursor: pointer; color: var(--slate-400);">✕</button>
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

          <div style="display: flex; gap: 10px; margin-top: 10px; border-top: 1px solid var(--slate-200); padding-top: 14px;">
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

  page = signal(1);
  pageSize = signal(10);

  showModal = signal(false);
  isEditing = signal(false);
  editingId: number | null = null;

  showSettleModal = false;
  settleTarget: CustomerItem | null = null;
  settleForm = { amount: 0, paymentMethod: 'CASH', notes: '' };

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
    private notificationService: NotificationService,
    private validationService: ValidationService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.page.set(1);
    const q = this.searchQuery ? `?query=${encodeURIComponent(this.searchQuery)}` : '';
    this.http.get<any>(`${environment.apiUrl}/customers${q}`).subscribe({
      next: (res) => this.customers.set(res.data || [])
    });
  }

  getTotalOutstanding(): number {
    return this.customers().reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  }

  getTotalCreditCapacity(): number {
    return this.customers().reduce((sum, c) => sum + (c.creditLimit || 0), 0);
  }

  filteredCustomers(): CustomerItem[] {
    if (!this.selectedTypeFilter) return this.customers();
    return this.customers().filter(c => c.customerType === this.selectedTypeFilter);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedTypeFilter = '';
    this.page.set(1);
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

  openSettleModal(customer: CustomerItem): void {
    this.settleTarget = customer;
    this.settleForm = {
      amount: customer.currentBalance,
      paymentMethod: 'CASH',
      notes: ''
    };
    this.showSettleModal = true;
  }

  submitSettlePayment(): void {
    if (!this.settleTarget) return;
    if (!this.validationService.isPositiveNumber(this.settleForm.amount, false)) {
      this.notificationService.warning('Settlement amount must be greater than 0');
      return;
    }
    if (this.settleForm.amount > this.settleTarget.currentBalance) {
      this.notificationService.warning(`Settlement cannot exceed outstanding balance of ETB ${this.settleTarget.currentBalance}`);
      return;
    }

    this.http.post<any>(`${environment.apiUrl}/customers/${this.settleTarget.id}/pay`, this.settleForm).subscribe({
      next: () => {
        this.notificationService.success('Customer credit settlement recorded successfully!');
        this.showSettleModal = false;
        this.loadCustomers();
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Payment recording failed')
    });
  }

  saveCustomer(): void {
    const valResult = this.validationService.validateCustomer(this.formData);
    if (!valResult.valid) {
      this.notificationService.warning(valResult.errors[0]);
      return;
    }

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

  async confirmDelete(customer: CustomerItem): Promise<void> {
    const ok = await this.confirmationService.confirm({
      title: 'Delete Customer Account',
      message: `Are you sure you want to delete customer account "${customer.name}"? This action cannot be undone.`,
      confirmText: 'Delete Customer',
      type: 'danger',
      icon: 'trash-2'
    });

    if (ok) {
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
