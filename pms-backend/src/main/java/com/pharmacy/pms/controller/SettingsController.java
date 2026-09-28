package com.pharmacy.pms.controller;

import com.pharmacy.pms.dto.request.*;
import com.pharmacy.pms.dto.response.*;
import com.pharmacy.pms.security.PmsUserPrincipal;
import com.pharmacy.pms.service.SettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/settings")
@Tag(name = "Settings", description = "Pharmacy Management System configuration and administration endpoints")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    // ==================== 1. Pharmacy Profile ====================
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get pharmacy profile", description = "Fetch primary pharmacy profile, branding, TIN and license info")
    public ResponseEntity<ApiResponse<PharmacyProfileResponse>> getProfile() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getProfile()));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Update pharmacy profile", description = "Update pharmacy profile, license, and legal details")
    public ResponseEntity<ApiResponse<PharmacyProfileResponse>> updateProfile(
            @Valid @RequestBody PharmacyProfileRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(settingsService.updateProfile(request, userId), "Pharmacy profile updated successfully"));
    }

    @PostMapping(value = "/profile/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Upload pharmacy logo", description = "Upload image file for pharmacy logo branding")
    public ResponseEntity<ApiResponse<PharmacyProfileResponse>> uploadLogo(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(settingsService.updateLogo(file, userId), "Logo updated successfully"));
    }

    // ==================== 2. User Management ====================
    @GetMapping("/users")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE') or hasAuthority('ROLE_PHARMACIST') or hasAuthority('ROLE_CASHIER_ACCOUNTANT')")
    @Operation(summary = "List all users", description = "Fetch paginated list of staff and user accounts")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAllUsers(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        PageResponse<UserResponse> users = settingsService.getAllUsers(
                query,
                PageRequest.of(page, size, Sort.by("id").descending())
        );
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PostMapping("/users")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Add new user", description = "Create a new user account with assigned roles")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody UserCreateRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(settingsService.createUser(request, userId), "User created successfully"));
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Update user details", description = "Update user profile details and role assignments")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(settingsService.updateUser(id, request, userId), "User updated successfully"));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Deactivate user", description = "Soft delete / deactivate user account (blocks login, preserves records)")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(
            @PathVariable Long id,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        settingsService.deactivateUser(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "User deactivated successfully"));
    }

    @PostMapping("/users/{id}/reset-password")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Reset user password", description = "Admin sets a temporary new password for a user")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        settingsService.resetPassword(id, request, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully"));
    }

    // ==================== 3. RBAC Matrix ====================
    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Get RBAC matrix", description = "Fetch roles and assigned permission definitions")
    public ResponseEntity<ApiResponse<RbacMatrixResponse>> getRbacMatrix() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getRbacMatrix()));
    }

    @PutMapping("/permissions")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Update RBAC matrix", description = "Update permission assignments for each system role")
    public ResponseEntity<ApiResponse<RbacMatrixResponse>> updateRbacMatrix(
            @Valid @RequestBody RbacUpdateRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(settingsService.updateRbacMatrix(request, userId), "RBAC permissions updated successfully"));
    }

    // ==================== 4. Tax Configuration ====================
    @GetMapping("/tax")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get tax configuration", description = "Fetch VAT rate and tax rules")
    public ResponseEntity<ApiResponse<TaxConfigResponse>> getTaxConfig() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getTaxConfig()));
    }

    @PutMapping("/tax")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Update tax configuration", description = "Update VAT rate, tax inclusive toggle, and exemptions")
    public ResponseEntity<ApiResponse<TaxConfigResponse>> updateTaxConfig(
            @Valid @RequestBody TaxConfigRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(settingsService.updateTaxConfig(request, userId), "Tax configuration updated successfully"));
    }

    // ==================== 5. System Preferences ====================
    @GetMapping("/system")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get system preferences", description = "Fetch currency, format, timezone, and threshold settings")
    public ResponseEntity<ApiResponse<SystemSettingsResponse>> getSystemSettings() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getSystemSettings()));
    }

    @PutMapping("/system")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Update system preferences", description = "Update app-wide preferences like currency and thresholds")
    public ResponseEntity<ApiResponse<SystemSettingsResponse>> updateSystemSettings(
            @Valid @RequestBody SystemSettingsRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(settingsService.updateSystemSettings(request, userId), "System settings updated successfully"));
    }

    // ==================== 6. Notifications ====================
    @GetMapping("/notifications")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Get notification settings", description = "Fetch SMTP, SMS gateway, Telegram, and event preferences")
    public ResponseEntity<ApiResponse<NotificationSettingsResponse>> getNotificationSettings() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getNotificationSettings()));
    }

    @PutMapping("/notifications")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Update notification settings", description = "Update notification channels and credentials")
    public ResponseEntity<ApiResponse<NotificationSettingsResponse>> updateNotificationSettings(
            @Valid @RequestBody NotificationSettingsRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(settingsService.updateNotificationSettings(request, userId), "Notification settings updated successfully"));
    }

    @PostMapping("/notifications/test")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Test notification channel", description = "Send a test notification across Email, SMS, or Telegram")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testNotificationChannel(
            @Valid @RequestBody NotificationTestRequest request) {
        return ResponseEntity.ok(ApiResponse.success(settingsService.testNotificationChannel(request), "Test notification sent successfully"));
    }

    // ==================== 7. Backup & Data ====================
    @GetMapping("/backup/schedule")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Get backup schedule", description = "Fetch automated backup schedule configuration")
    public ResponseEntity<ApiResponse<BackupScheduleResponse>> getBackupSchedule() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getBackupSchedule()));
    }

    @PutMapping("/backup/schedule")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Update backup schedule", description = "Update backup frequency, time, and retention")
    public ResponseEntity<ApiResponse<BackupScheduleResponse>> updateBackupSchedule(
            @Valid @RequestBody BackupScheduleRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(settingsService.updateBackupSchedule(request, userId), "Backup schedule updated successfully"));
    }

    @PostMapping("/backup")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Trigger manual backup", description = "Generate database SQL dump snapshot")
    public ResponseEntity<ApiResponse<String>> triggerBackup() {
        return ResponseEntity.ok(ApiResponse.success("Backup dump prepared successfully. Download using GET /settings/backup/download"));
    }

    @GetMapping("/backup/download")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Download backup file", description = "Download full SQL database dump file")
    public ResponseEntity<byte[]> downloadBackup() {
        byte[] backupBytes = settingsService.generateManualBackupSql();
        String filename = "pms_backup_" + DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss").format(LocalDateTime.now()) + ".sql";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(backupBytes);
    }

    @PostMapping(value = "/backup/restore", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Restore backup", description = "Upload SQL backup file to restore database state")
    public ResponseEntity<ApiResponse<Void>> restoreBackup(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        settingsService.restoreBackupSql(file, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Database restore executed successfully"));
    }

    @GetMapping("/export/{entity}")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Export data to CSV", description = "Export users, drugs, or sales datasets to CSV")
    public ResponseEntity<byte[]> exportData(
            @PathVariable String entity) {
        byte[] csvBytes = settingsService.exportDataCsv(entity);
        String filename = entity.toLowerCase() + "_export_" + DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now()) + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Get audit logs", description = "Fetch audit logs of system and configuration activities")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getAuditLogs() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getAuditLogs()));
    }

    @DeleteMapping("/cache")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Clear cache", description = "Flush application and Redis cache")
    public ResponseEntity<ApiResponse<Void>> clearCache(
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        settingsService.clearCache(userId);
        return ResponseEntity.ok(ApiResponse.success(null, "System cache flushed successfully"));
    }

    @GetMapping("/system-info")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_SUPER_ADMIN') or hasAuthority('SUPER_ADMIN') or hasAuthority('SETTINGS_MANAGE') or hasAuthority('USER_MANAGE')")
    @Operation(summary = "Get system info", description = "Fetch JVM uptime, version, database, and hardware metrics")
    public ResponseEntity<ApiResponse<SystemInfoResponse>> getSystemInfo() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getSystemInfo()));
    }
}
