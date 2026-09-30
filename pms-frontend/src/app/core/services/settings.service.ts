import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PharmacyProfile {
  id?: number;
  name: string;
  legalName: string;
  logoPath?: string;
  address: string;
  phone: string;
  email: string;
  tin: string;
  licenseNumber: string;
  licenseExpiry: string;
  website?: string;
  updatedAt?: string;
}

export interface SystemSettings {
  id?: number;
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  timeZone: string;
  language: string;
  receiptFooter: string;
  receiptPrinter: string;
  lowStockThreshold: number;
  expiryAlertDays: number;
  sessionTimeoutMinutes?: number;
  sessionWarningMinutes?: number;
  autoPrintReceipt?: boolean;
  requireShiftOpen?: boolean;
  maxDiscountPercent?: number;
  defaultPaymentMethod?: string;
  updatedAt?: string;
}

export interface TaxConfig {
  id?: number;
  vatRate: number;
  taxInclusive: boolean;
  taxRegistrationNumber?: string;
  defaultTaxCode: string;
  taxExemptCategories?: string;
  updatedAt?: string;
}

export interface NotificationSettings {
  id?: number;
  emailEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  senderEmail?: string;
  smsEnabled: boolean;
  smsApiKey?: string;
  smsSenderId?: string;
  telegramEnabled: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
  lowStockAlertEnabled: boolean;
  expiryAlertEnabled: boolean;
  dailyReportEnabled: boolean;
  updatedAt?: string;
}

export interface BackupSchedule {
  id?: number;
  frequency: string;
  backupTime?: string;
  retentionDays?: number;
  lastBackupAt?: string;
  updatedAt?: string;
}

export interface RbacMatrix {
  permissions: { code: string; description: string; module: string }[];
  roles: { name: string; displayName: string; description: string }[];
  rolePermissions: Record<string, string[]>;
}

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
  updatedAt?: string;
}

export interface AuditLog {
  id: number;
  username: string;
  action: string;
  entityName: string;
  entityId: string;
  detailsJson: string;
  ipAddress: string;
  createdAt: string;
}

export interface SystemInfo {
  appVersion: string;
  javaVersion: string;
  springBootVersion: string;
  uptimeSeconds: number;
  databaseEngine: string;
  totalMemoryMb: number;
  freeMemoryMb: number;
  maxMemoryMb: number;
  osName: string;
  details?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly baseUrl = `${environment.apiUrl}/settings`;

  profile = signal<PharmacyProfile | null>(null);
  systemSettings = signal<SystemSettings | null>(null);

  constructor(private http: HttpClient) {
    this.loadProfile();
    this.loadSystemSettings();
  }

  // 1. Profile
  getProfile(): Observable<ApiResponse<PharmacyProfile>> {
    return this.http.get<ApiResponse<PharmacyProfile>>(`${this.baseUrl}/profile`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.profile.set(res.data);
        }
      })
    );
  }

  loadProfile(): void {
    if (localStorage.getItem('pms_token')) {
      this.getProfile().subscribe({
        error: () => {} // Handled silently
      });
    }
  }

  loadSystemSettings(): void {
    if (localStorage.getItem('pms_token')) {
      this.getSystemSettings().subscribe({
        error: () => {} // Handled silently
      });
    }
  }

  updateProfile(data: PharmacyProfile): Observable<ApiResponse<PharmacyProfile>> {
    return this.http.put<ApiResponse<PharmacyProfile>>(`${this.baseUrl}/profile`, data).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.profile.set(res.data);
        }
      })
    );
  }

  uploadLogo(file: File): Observable<ApiResponse<PharmacyProfile>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<PharmacyProfile>>(`${this.baseUrl}/profile/logo`, formData).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.profile.set(res.data);
        }
      })
    );
  }

  // 2. Users
  getUsers(query?: string, page = 0, size = 50): Observable<ApiResponse<any>> {
    let params: any = { page, size };
    if (query) params.query = query;
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/users`, { params });
  }

  createUser(data: any): Observable<ApiResponse<UserItem>> {
    return this.http.post<ApiResponse<UserItem>>(`${this.baseUrl}/users`, data);
  }

  updateUser(id: number, data: any): Observable<ApiResponse<UserItem>> {
    return this.http.put<ApiResponse<UserItem>>(`${this.baseUrl}/users/${id}`, data);
  }

  deactivateUser(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/users/${id}`);
  }

  resetPassword(id: number, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/users/${id}/reset-password`, { newPassword });
  }

  // 3. RBAC
  getRbacMatrix(): Observable<ApiResponse<RbacMatrix>> {
    return this.http.get<ApiResponse<RbacMatrix>>(`${this.baseUrl}/permissions`);
  }

  updateRbacMatrix(rolePermissions: Record<string, string[]>): Observable<ApiResponse<RbacMatrix>> {
    return this.http.put<ApiResponse<RbacMatrix>>(`${this.baseUrl}/permissions`, { rolePermissions });
  }

  // 4. Tax
  getTaxConfig(): Observable<ApiResponse<TaxConfig>> {
    return this.http.get<ApiResponse<TaxConfig>>(`${this.baseUrl}/tax`);
  }

  updateTaxConfig(data: TaxConfig): Observable<ApiResponse<TaxConfig>> {
    return this.http.put<ApiResponse<TaxConfig>>(`${this.baseUrl}/tax`, data);
  }

  // 5. System
  getSystemSettings(): Observable<ApiResponse<SystemSettings>> {
    return this.http.get<ApiResponse<SystemSettings>>(`${this.baseUrl}/system`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.systemSettings.set(res.data);
        }
      })
    );
  }

  updateSystemSettings(data: SystemSettings): Observable<ApiResponse<SystemSettings>> {
    return this.http.put<ApiResponse<SystemSettings>>(`${this.baseUrl}/system`, data).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.systemSettings.set(res.data);
        }
      })
    );
  }

  // 6. Notifications
  getNotificationSettings(): Observable<ApiResponse<NotificationSettings>> {
    return this.http.get<ApiResponse<NotificationSettings>>(`${this.baseUrl}/notifications`);
  }

  updateNotificationSettings(data: NotificationSettings): Observable<ApiResponse<NotificationSettings>> {
    return this.http.put<ApiResponse<NotificationSettings>>(`${this.baseUrl}/notifications`, data);
  }

  testNotification(channel: string, recipient?: string, message?: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/notifications/test`, { channel, recipient, message });
  }

  // 7. Backup & Data
  getBackupSchedule(): Observable<ApiResponse<BackupSchedule>> {
    return this.http.get<ApiResponse<BackupSchedule>>(`${this.baseUrl}/backup/schedule`);
  }

  updateBackupSchedule(data: BackupSchedule): Observable<ApiResponse<BackupSchedule>> {
    return this.http.put<ApiResponse<BackupSchedule>>(`${this.baseUrl}/backup/schedule`, data);
  }

  downloadBackup(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/backup/download`, { responseType: 'blob' });
  }

  restoreBackup(file: File): Observable<ApiResponse<void>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/backup/restore`, formData);
  }

  exportDataCsv(entity: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export/${entity}`, { responseType: 'blob' });
  }

  getAuditLogs(): Observable<ApiResponse<AuditLog[]>> {
    return this.http.get<ApiResponse<AuditLog[]>>(`${this.baseUrl}/audit-logs`);
  }

  clearCache(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/cache`);
  }

  getSystemInfo(): Observable<ApiResponse<SystemInfo>> {
    return this.http.get<ApiResponse<SystemInfo>>(`${this.baseUrl}/system-info`);
  }
}
