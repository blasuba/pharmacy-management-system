package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.*;
import com.pharmacy.pms.dto.response.*;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface SettingsService {
    // 1. Pharmacy Profile
    PharmacyProfileResponse getProfile();
    PharmacyProfileResponse updateProfile(PharmacyProfileRequest request, Long currentUserId);
    PharmacyProfileResponse updateLogo(MultipartFile file, Long currentUserId);

    // 2. User Management
    PageResponse<UserResponse> getAllUsers(String query, Pageable pageable);
    UserResponse createUser(UserCreateRequest request, Long currentUserId);
    UserResponse updateUser(Long id, UserUpdateRequest request, Long currentUserId);
    void deactivateUser(Long id, Long currentUserId);
    void resetPassword(Long id, ResetPasswordRequest request, Long currentUserId);

    // 3. RBAC Matrix
    RbacMatrixResponse getRbacMatrix();
    RbacMatrixResponse updateRbacMatrix(RbacUpdateRequest request, Long currentUserId);

    // 4. Tax Configuration
    TaxConfigResponse getTaxConfig();
    TaxConfigResponse updateTaxConfig(TaxConfigRequest request, Long currentUserId);

    // 5. System Preferences
    SystemSettingsResponse getSystemSettings();
    SystemSettingsResponse updateSystemSettings(SystemSettingsRequest request, Long currentUserId);

    // 6. Notifications
    NotificationSettingsResponse getNotificationSettings();
    NotificationSettingsResponse updateNotificationSettings(NotificationSettingsRequest request, Long currentUserId);
    Map<String, Object> testNotificationChannel(NotificationTestRequest request);

    // 7. Backup & Data
    BackupScheduleResponse getBackupSchedule();
    BackupScheduleResponse updateBackupSchedule(BackupScheduleRequest request, Long currentUserId);
    byte[] generateManualBackupSql();
    void restoreBackupSql(MultipartFile file, Long currentUserId);
    byte[] exportDataCsv(String entityName);
    List<AuditLogResponse> getAuditLogs();
    void clearCache(Long currentUserId);
    SystemInfoResponse getSystemInfo();
}
