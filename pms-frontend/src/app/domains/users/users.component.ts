import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../core/services/notification.service';
import { ValidationService } from '../../core/services/validation.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { environment } from '../../../environments/environment';
import { PaginationComponent, PaginatePipe } from '../../shared';

export interface UserItem {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  branchId?: number;
  branchName?: string;
  active: boolean;
  roles: string[];
  createdAt: string;
}

export interface RoleItem {
  id: number;
  name: string;
  description: string;
}

export interface BranchItem {
  id: number;
  name: string;
  code: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent, PaginatePipe],
  template: `
    <div style="display: flex; flex-direction: column; gap: 22px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="font-size: 22px; font-weight: 800; color: var(--slate-900);">User & Role Management</h1>
          <p style="font-size: 13px; color: var(--slate-500); margin-top: 2px;">
            Provision staff accounts, assign granular role permissions, and manage active statuses
          </p>
        </div>
        <button (click)="openCreateModal()" class="btn btn-primary" style="box-shadow: var(--shadow); display: inline-flex; align-items: center; gap: 6px;">
          <lucide-icon name="user-plus" [size]="16"></lucide-icon> Add New Staff Member
        </button>
      </div>

      <!-- Filters & Search Bar -->
      <div class="card" style="padding: 16px; display: flex; gap: 14px; flex-wrap: wrap; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 280px; position: relative;">
          <lucide-icon name="search" [size]="16" style="position: absolute; left: 12px; color: var(--slate-400); pointer-events: none;"></lucide-icon>
          <input type="text" [(ngModel)]="searchQuery" (input)="loadUsers()"
                 class="form-control" style="padding-left: 36px;" placeholder="Search by name, username, or email..." />
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <label style="font-size: 12px; font-weight: 600; color: var(--slate-600); display: flex; align-items: center; gap: 4px;">
            <lucide-icon name="filter" [size]="13"></lucide-icon> Filter by Role:
          </label>
          <select [(ngModel)]="selectedRoleFilter" (change)="applyFilter()" aria-label="Filter staff users by role" class="form-control" style="width: auto; min-width: 170px;">
            <option value="">All Roles</option>
            <option *ngFor="let role of roles()" [value]="role.name">{{ getRoleLabel(role.name) }}</option>
          </select>
          <button (click)="resetFilters()" class="btn btn-outline" style="padding: 8px 12px; display: inline-flex; align-items: center; gap: 4px;">
            <lucide-icon name="rotate-ccw" [size]="13"></lucide-icon> Reset
          </button>
        </div>
      </div>

      <!-- Users Data Table -->
      <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--slate-200); box-shadow: var(--shadow-sm);">
        <app-pagination
          [totalItems]="filteredUsers().length"
          [pageSize]="pageSize()"
          [currentPage]="page()"
          (pageChange)="page.set($event)"
          (pageSizeChange)="pageSize.set($event); page.set(1)">
        </app-pagination>
        <div class="table-responsive" style="border: none; border-radius: 0;">
          <table class="data-table">
            <thead>
              <tr>
                <th style="padding: 10px 16px;">Staff Member</th>
                <th style="padding: 10px 16px;">Username</th>
                <th style="padding: 10px 16px;">Assigned Role</th>
                <th style="padding: 10px 16px;">Branch Store</th>
                <th style="padding: 10px 16px;">Phone</th>
                <th style="padding: 10px 16px;">Account Status</th>
                <th style="padding: 10px 16px; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of (filteredUsers() | paginate: page() : pageSize())">
                <!-- Staff info & avatar -->
                <td style="padding: 11px 16px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 34px; height: 34px; border-radius: 8px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; flex-shrink: 0; border: 1px solid #bae6fd;">
                      {{ getInitials(user.fullName) }}
                    </div>
                    <div>
                      <div style="font-weight: 700; color: var(--slate-900); font-size: 13.5px;">{{ user.fullName }}</div>
                      <div style="font-size: 12px; color: var(--slate-500); margin-top: 1px;">{{ user.email }}</div>
                    </div>
                  </div>
                </td>

                <!-- Username -->
                <td style="padding: 11px 16px;">
                  <code style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; padding: 3px 8px; background: #f1f5f9; border-radius: 5px; border: 1px solid var(--slate-200); color: var(--slate-700);">&#64;{{ user.username }}</code>
                </td>

                <!-- Assigned Role -->
                <td style="padding: 11px 16px;">
                  <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                    <span *ngFor="let role of user.roles" class="badge" [ngClass]="getRoleBadgeClass(role)" style="padding: 4px 10px; font-size: 11.5px; font-weight: 600; border-radius: 6px;">
                      {{ getRoleLabel(role) }}
                    </span>
                  </div>
                </td>

                <!-- Branch Store -->
                <td style="padding: 11px 16px; color: var(--slate-700); font-weight: 500; font-size: 13px;">
                  <span style="display: inline-flex; align-items: center; gap: 5px;">
                    <lucide-icon name="building-2" [size]="13" color="#64748b"></lucide-icon>
                    {{ user.branchName || 'Main Store' }}
                  </span>
                </td>

                <!-- Phone -->
                <td style="padding: 11px 16px; color: var(--slate-600); font-size: 13px;">
                  {{ user.phone || '-' }}
                </td>

                <!-- Status -->
                <td style="padding: 11px 16px;">
                  <span class="badge" [ngClass]="user.active ? 'badge-success' : 'badge-danger'" style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; font-size: 11.5px; font-weight: 600;">
                    <lucide-icon [name]="user.active ? 'check-circle-2' : 'alert-circle'" [size]="12"></lucide-icon>
                    {{ user.active ? 'Active' : 'Suspended' }}
                  </span>
                </td>

                <!-- Actions -->
                <td style="padding: 11px 16px; text-align: right;">
                  <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                    <button (click)="openEditModal(user)" class="btn btn-outline" style="padding: 5px 10px; font-size: 11.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px;" title="Edit details & role">
                      <lucide-icon name="edit-2" [size]="12"></lucide-icon> Edit
                    </button>
                    <button (click)="toggleStatus(user)"
                            class="btn btn-outline"
                            [style.color]="user.active ? '#d97706' : '#059669'"
                            style="padding: 5px 10px; font-size: 11.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px;"
                            [title]="user.active ? 'Suspend Account' : 'Reactivate Account'">
                      <lucide-icon [name]="user.active ? 'pause' : 'play'" [size]="12"></lucide-icon>
                      {{ user.active ? 'Suspend' : 'Activate' }}
                    </button>
                    <button *ngIf="user.username !== 'admin'"
                            (click)="confirmDelete(user)"
                            class="btn btn-outline"
                            style="padding: 5px 8px; font-size: 11.5px; color: #ef4444; display: inline-flex; align-items: center; border-radius: 6px;"
                            title="Delete user permanently">
                      <lucide-icon name="trash-2" [size]="13"></lucide-icon>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="filteredUsers().length === 0">
                <td colspan="7" style="text-align: center; padding: 36px 20px; color: var(--slate-400);">
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
                    <lucide-icon name="users" [size]="28" color="#94a3b8"></lucide-icon>
                    <p style="font-size: 13.5px; font-weight: 600; margin: 0;">No user accounts matching the search criteria.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create / Edit User Modal -->
    <div *ngIf="showModal()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 550px; max-width: 100%; padding: 28px; box-shadow: var(--shadow-lg); animation: modalFade 0.2s ease;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--slate-200); padding-bottom: 12px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: var(--slate-900);">
              {{ isEditing() ? 'Edit Staff Profile' : 'Add New Staff Member' }}
            </h3>
            <p style="font-size: 12px; color: var(--slate-500);">
              {{ isEditing() ? 'Update user roles and branch assignments' : 'Configure login credentials and assigned operational role' }}
            </p>
          </div>
          <button (click)="closeModal()" style="background: none; border: none; cursor: pointer; color: var(--slate-400); display: flex; align-items: center;">
            <lucide-icon name="x" [size]="18"></lucide-icon>
          </button>
        </div>

        <form (ngSubmit)="saveUser()" style="display: flex; flex-direction: column; gap: 14px;">
          <!-- First & Last Name -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700);">First Name *</label>
              <input type="text" [(ngModel)]="formData.firstName" name="firstName" required class="form-control" placeholder="e.g. Abebe" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700);">Last Name *</label>
              <input type="text" [(ngModel)]="formData.lastName" name="lastName" required class="form-control" placeholder="e.g. Kebede" />
            </div>
          </div>

          <!-- Username & Email -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700);">Username *</label>
              <input type="text" [(ngModel)]="formData.username" name="username" [disabled]="isEditing()" required class="form-control" placeholder="e.g. abebe.k" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700);">Email Address *</label>
              <input type="email" [(ngModel)]="formData.email" name="email" required class="form-control" placeholder="e.g. abebe@pharmacy.com" />
            </div>
          </div>

          <!-- Password & Phone -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700);">
                {{ isEditing() ? 'Password (Leave blank to keep)' : 'Initial Password *' }}
              </label>
              <input type="password" [(ngModel)]="formData.password" name="password" [required]="!isEditing()" class="form-control" placeholder="••••••••" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--slate-700);">Phone Number</label>
              <input type="text" [(ngModel)]="formData.phone" name="phone" class="form-control" placeholder="+251-911-000000" />
            </div>
          </div>

          <!-- Role Assignment -->
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700);">Operational Role *</label>
            <select [(ngModel)]="selectedRole" name="selectedRole" required class="form-control">
              <option *ngFor="let role of roles()" [value]="role.name">
                {{ getRoleLabel(role.name) }} - {{ role.description }}
              </option>
            </select>
          </div>

          <!-- Branch Assignment -->
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--slate-700);">Assigned Branch</label>
            <select [(ngModel)]="formData.branchId" name="branchId" class="form-control">
              <option *ngFor="let branch of branches()" [value]="branch.id">
                {{ branch.name }} ({{ branch.code }})
              </option>
            </select>
          </div>

          <!-- Modal Action Buttons -->
          <div style="display: flex; gap: 10px; margin-top: 10px; border-top: 1px solid var(--slate-200); padding-top: 16px;">
            <button type="button" (click)="closeModal()" class="btn btn-outline" style="flex: 1;">Cancel</button>
            <button type="submit" [disabled]="isSubmitting" class="btn btn-primary" style="flex: 2;">
              {{ isSubmitting ? 'Saving...' : (isEditing() ? 'Update Account' : 'Create Staff Member') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div *ngIf="userToDelete()" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
      <div class="card" style="width: 420px; max-width: 100%; padding: 24px; text-align: center;">
        <div style="display: flex; justify-content: center; margin-bottom: 12px;">
          <lucide-icon name="alert-triangle" [size]="40" color="#ef4444"></lucide-icon>
        </div>
        <h3 style="font-size: 17px; font-weight: 800; color: var(--slate-900); margin-bottom: 6px;">Delete Staff Member</h3>
        <p style="font-size: 13px; color: var(--slate-600); line-height: 1.4; margin-bottom: 20px;">
          Are you sure you want to permanently remove <strong>{{ userToDelete()?.fullName }}</strong> (&#64;{{ userToDelete()?.username }})? This action cannot be undone.
        </p>
        <div style="display: flex; gap: 10px;">
          <button (click)="userToDelete.set(null)" class="btn btn-outline" style="flex: 1;">Cancel</button>
          <button (click)="executeDelete()" class="btn btn-danger" style="flex: 1;">Delete Permanently</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes modalFade {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class UsersComponent implements OnInit {
  users = signal<UserItem[]>([]);
  roles = signal<RoleItem[]>([]);
  branches = signal<BranchItem[]>([]);

  searchQuery = '';
  selectedRoleFilter = '';

  page = signal(1);
  pageSize = signal(10);

  showModal = signal(false);
  isEditing = signal(false);
  editingUserId: number | null = null;
  userToDelete = signal<UserItem | null>(null);
  isSubmitting = false;

  formData: any = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    branchId: null,
    roles: []
  };

  selectedRole = 'ROLE_PHARMACIST';

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private validationService: ValidationService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
    this.loadBranches();
  }

  loadUsers(): void {
    this.page.set(1);
    const q = this.searchQuery ? `?query=${encodeURIComponent(this.searchQuery)}` : '';
    this.http.get<any>(`${environment.apiUrl}/users${q}`).subscribe({
      next: (res) => this.users.set(res.data.content || []),
      error: () => this.notificationService.error('Failed to load user list')
    });
  }

  loadRoles(): void {
    this.http.get<any>(`${environment.apiUrl}/users/roles`).subscribe({
      next: (res) => this.roles.set(res.data || [])
    });
  }

  loadBranches(): void {
    this.http.get<any>(`${environment.apiUrl}/users/branches`).subscribe({
      next: (res) => {
        this.branches.set(res.data || []);
        if (res.data && res.data.length > 0 && !this.formData.branchId) {
          this.formData.branchId = res.data[0].id;
        }
      }
    });
  }

  filteredUsers(): UserItem[] {
    if (!this.selectedRoleFilter) {
      return this.users();
    }
    return this.users().filter(u => u.roles && u.roles.includes(this.selectedRoleFilter));
  }

  applyFilter(): void {
    this.page.set(1);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedRoleFilter = '';
    this.page.set(1);
    this.loadUsers();
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingUserId = null;
    this.formData = {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      branchId: this.branches().length > 0 ? this.branches()[0].id : null,
      roles: []
    };
    this.selectedRole = 'ROLE_PHARMACIST';
    this.showModal.set(true);
  }

  openEditModal(user: UserItem): void {
    this.isEditing.set(true);
    this.editingUserId = user.id;
    this.formData = {
      username: user.username,
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      branchId: user.branchId || (this.branches().length > 0 ? this.branches()[0].id : null),
      active: user.active
    };
    this.selectedRole = user.roles && user.roles.length > 0 ? user.roles[0] : 'ROLE_PHARMACIST';
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.isSubmitting = false;
  }

  saveUser(): void {
    const fullName = `${this.formData.firstName || ''} ${this.formData.lastName || ''}`.trim();
    const valResult = this.validationService.validateUser({
      fullName,
      username: this.formData.username,
      email: this.formData.email,
      phone: this.formData.phone,
      password: this.formData.password,
      roles: [this.selectedRole]
    }, this.isEditing());

    if (!valResult.valid) {
      this.notificationService.warning(valResult.errors[0]);
      return;
    }

    this.isSubmitting = true;
    const payload = {
      ...this.formData,
      roles: [this.selectedRole]
    };

    if (this.isEditing() && this.editingUserId) {
      this.http.put<any>(`${environment.apiUrl}/users/${this.editingUserId}`, payload).subscribe({
        next: () => {
          this.notificationService.success('Staff account updated successfully!');
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notificationService.error(err.error?.message || 'Failed to update user');
        }
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/users`, payload).subscribe({
        next: () => {
          this.notificationService.success('Staff account created successfully!');
          this.closeModal();
          this.loadUsers();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notificationService.error(err.error?.message || 'Failed to create user');
        }
      });
    }
  }

  toggleStatus(user: UserItem): void {
    this.http.patch<any>(`${environment.apiUrl}/users/${user.id}/status`, {}).subscribe({
      next: (res) => {
        const updated = res.data;
        this.notificationService.info(`Account status for ${updated.fullName} set to ${updated.active ? 'ACTIVE' : 'SUSPENDED'}`);
        this.loadUsers();
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Failed to toggle account status');
      }
    });
  }

  confirmDelete(user: UserItem): void {
    this.userToDelete.set(user);
  }

  executeDelete(): void {
    const user = this.userToDelete();
    if (!user) return;

    this.http.delete<any>(`${environment.apiUrl}/users/${user.id}`).subscribe({
      next: () => {
        this.notificationService.success(`User ${user.fullName} deleted.`);
        this.userToDelete.set(null);
        this.loadUsers();
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Failed to delete user');
      }
    });
  }

  getInitials(fullName: string): string {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }

  getRoleLabel(roleName: string): string {
    switch (roleName) {
      case 'ROLE_OWNER': return 'Admin / Owner';
      case 'ROLE_PHARMACIST': return 'Pharmacist';
      case 'ROLE_CASHIER_ACCOUNTANT': return 'Cashier / Sales';
      default: return roleName;
    }
  }

  getRoleIconName(roleName: string): string {
    switch (roleName) {
      case 'ROLE_OWNER': return 'crown';
      case 'ROLE_PHARMACIST': return 'pill';
      case 'ROLE_CASHIER_ACCOUNTANT': return 'zap';
      default: return 'shield';
    }
  }

  getRoleBadgeClass(roleName: string): string {
    switch (roleName) {
      case 'ROLE_OWNER': return 'badge-primary';
      case 'ROLE_PHARMACIST': return 'badge-success';
      case 'ROLE_CASHIER_ACCOUNTANT': return 'badge-warning';
      default: return 'badge-primary';
    }
  }
}
