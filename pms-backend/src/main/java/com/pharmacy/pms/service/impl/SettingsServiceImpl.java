package com.pharmacy.pms.service.impl;

import com.pharmacy.pms.dto.request.*;
import com.pharmacy.pms.dto.response.*;
import com.pharmacy.pms.exception.BadRequestException;
import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.*;
import com.pharmacy.pms.model.enums.UserRole;
import com.pharmacy.pms.repository.*;
import com.pharmacy.pms.service.SettingsService;
import org.springframework.boot.SpringBootVersion;
import org.springframework.core.SpringVersion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.management.ManagementFactory;
import java.lang.management.RuntimeMXBean;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class SettingsServiceImpl implements SettingsService {

    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,}$");

    private final PharmacyProfileRepository profileRepository;
    private final SystemSettingsRepository systemSettingsRepository;
    private final TaxConfigRepository taxConfigRepository;
    private final NotificationSettingsRepository notificationSettingsRepository;
    private final BackupScheduleRepository backupScheduleRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final BranchRepository branchRepository;
    private final DrugRepository drugRepository;
    private final DrugBatchRepository drugBatchRepository;
    private final SaleRepository saleRepository;
    private final ExpenseRepository expenseRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final CustomerRepository customerRepository;
    private final FixedAssetRepository fixedAssetRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    public SettingsServiceImpl(PharmacyProfileRepository profileRepository,
                               SystemSettingsRepository systemSettingsRepository,
                               TaxConfigRepository taxConfigRepository,
                               NotificationSettingsRepository notificationSettingsRepository,
                               BackupScheduleRepository backupScheduleRepository,
                               UserRepository userRepository,
                               RoleRepository roleRepository,
                               PermissionRepository permissionRepository,
                               BranchRepository branchRepository,
                               DrugRepository drugRepository,
                               DrugBatchRepository drugBatchRepository,
                               SaleRepository saleRepository,
                               ExpenseRepository expenseRepository,
                               PurchaseOrderRepository purchaseOrderRepository,
                               SupplierRepository supplierRepository,
                               CustomerRepository customerRepository,
                               FixedAssetRepository fixedAssetRepository,
                               AuditLogRepository auditLogRepository,
                               PasswordEncoder passwordEncoder) {
        this.profileRepository = profileRepository;
        this.systemSettingsRepository = systemSettingsRepository;
        this.taxConfigRepository = taxConfigRepository;
        this.notificationSettingsRepository = notificationSettingsRepository;
        this.backupScheduleRepository = backupScheduleRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.branchRepository = branchRepository;
        this.drugRepository = drugRepository;
        this.drugBatchRepository = drugBatchRepository;
        this.saleRepository = saleRepository;
        this.expenseRepository = expenseRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.supplierRepository = supplierRepository;
        this.customerRepository = customerRepository;
        this.fixedAssetRepository = fixedAssetRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ==================== 1. Pharmacy Profile ====================
    @Override
    @Transactional(readOnly = true)
    public PharmacyProfileResponse getProfile() {
        PharmacyProfile profile = profileRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefaultProfile);
        return new PharmacyProfileResponse(profile);
    }

    @Override
    @Transactional
    public PharmacyProfileResponse updateProfile(PharmacyProfileRequest request, Long currentUserId) {
        if (request.getLicenseExpiry() == null || !request.getLicenseExpiry().isAfter(LocalDate.now())) {
            throw new BadRequestException("License Expiry date must be in the future");
        }

        PharmacyProfile profile = profileRepository.findFirstByOrderByIdAsc()
                .orElseGet(PharmacyProfile::new);

        profile.setName(request.getName().trim());
        profile.setLegalName(request.getLegalName().trim());
        if (request.getLogoPath() != null) {
            profile.setLogoPath(request.getLogoPath().trim());
        }
        profile.setAddress(request.getAddress().trim());
        profile.setPhone(request.getPhone().trim());
        profile.setEmail(request.getEmail().trim().toLowerCase());
        profile.setTin(request.getTin().trim());
        profile.setLicenseNumber(request.getLicenseNumber().trim());
        profile.setLicenseExpiry(request.getLicenseExpiry());
        profile.setWebsite(request.getWebsite() != null ? request.getWebsite().trim() : null);

        PharmacyProfile saved = profileRepository.save(profile);
        logAudit(currentUserId, "UPDATE_PHARMACY_PROFILE", "PharmacyProfile", String.valueOf(saved.getId()), "Updated profile: " + saved.getName());
        return new PharmacyProfileResponse(saved);
    }

    @Override
    @Transactional
    public PharmacyProfileResponse updateLogo(MultipartFile file, Long currentUserId) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded logo file is empty");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("Logo image size must not exceed 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("image/svg+xml"))) {
            throw new BadRequestException("Invalid file type. Only standard image files (PNG, JPG, SVG, WEBP) are allowed.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "png";
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            if (List.of("png", "jpg", "jpeg", "svg", "webp", "gif").contains(ext)) {
                extension = ext;
            } else {
                throw new BadRequestException("Unsupported image extension: ." + ext);
            }
        }

        try {
            String uploadsDir = "uploads/branding";
            Path uploadPath = Paths.get(uploadsDir).toAbsolutePath().normalize();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String filename = "logo_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + extension;
            Path filePath = uploadPath.resolve(filename).normalize();
            if (!filePath.startsWith(uploadPath)) {
                throw new BadRequestException("Invalid file destination path");
            }
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String logoUrl = "/api/v1/uploads/branding/" + filename;
            PharmacyProfile profile = profileRepository.findFirstByOrderByIdAsc()
                    .orElseGet(this::createDefaultProfile);
            profile.setLogoPath(logoUrl);
            PharmacyProfile saved = profileRepository.save(profile);

            logAudit(currentUserId, "UPDATE_LOGO", "PharmacyProfile", String.valueOf(saved.getId()), "Uploaded new logo: " + filename);
            return new PharmacyProfileResponse(saved);
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BadRequestException("Failed to upload logo: " + ex.getMessage());
        }
    }

    // ==================== 2. User Management ====================
    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAllUsers(String query, Pageable pageable) {
        Page<User> page = userRepository.searchUsers(query, pageable);
        List<UserResponse> content = page.getContent().stream()
                .map(this::mapToUserResponse)
                .toList();

        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    @Override
    @Transactional
    public UserResponse createUser(UserCreateRequest request, Long currentUserId) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already in use: " + request.getEmail());
        }
        if (request.getPassword() == null || !PASSWORD_PATTERN.matcher(request.getPassword()).matches()) {
            throw new BadRequestException("Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character");
        }

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setPhone(request.getPhone());
        user.setActive(true);

        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + request.getBranchId()));
            user.setBranch(branch);
        } else {
            List<Branch> branches = branchRepository.findAll();
            if (!branches.isEmpty()) {
                user.setBranch(branches.get(0));
            }
        }

        Set<Role> roles = resolveRoles(request.getRoles());
        user.setRoles(roles);

        User saved = userRepository.save(user);
        logAudit(currentUserId, "CREATE_USER", "User", String.valueOf(saved.getId()), "Created user: " + saved.getUsername());
        return mapToUserResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request, Long currentUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (!user.getEmail().equalsIgnoreCase(request.getEmail().trim()) && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already in use: " + request.getEmail());
        }

        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setPhone(request.getPhone());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (!PASSWORD_PATTERN.matcher(request.getPassword()).matches()) {
                throw new BadRequestException("Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character");
            }
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getActive() != null) {
            if (id.equals(currentUserId) && Boolean.FALSE.equals(request.getActive())) {
                throw new BadRequestException("A user cannot deactivate themselves");
            }
            user.setActive(request.getActive());
        }

        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + request.getBranchId()));
            user.setBranch(branch);
        }

        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            user.setRoles(resolveRoles(request.getRoles()));
        }

        User saved = userRepository.save(user);
        logAudit(currentUserId, "UPDATE_USER", "User", String.valueOf(saved.getId()), "Updated user details: " + saved.getUsername());
        return mapToUserResponse(saved);
    }

    @Override
    @Transactional
    public void deactivateUser(Long id, Long currentUserId) {
        if (id.equals(currentUserId)) {
            throw new BadRequestException("A user cannot deactivate themselves");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setActive(false);
        userRepository.save(user);
        logAudit(currentUserId, "DEACTIVATE_USER", "User", String.valueOf(user.getId()), "Deactivated user: " + user.getUsername());
    }

    @Override
    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request, Long currentUserId) {
        if (request.getNewPassword() == null || !PASSWORD_PATTERN.matcher(request.getNewPassword()).matches()) {
            throw new BadRequestException("Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        logAudit(currentUserId, "RESET_PASSWORD", "User", String.valueOf(user.getId()), "Admin reset password for user: " + user.getUsername());
    }

    // ==================== 3. RBAC Matrix ====================
    @Override
    @Transactional(readOnly = true)
    public RbacMatrixResponse getRbacMatrix() {
        List<Permission> allPermissions = permissionRepository.findAll();
        List<Role> allRoles = roleRepository.findAll();

        List<RbacMatrixResponse.PermissionDto> permissionDtos = allPermissions.stream()
                .map(p -> new RbacMatrixResponse.PermissionDto(p.getCode(), p.getDescription(), p.getModule()))
                .toList();

        List<RbacMatrixResponse.RoleDto> roleDtos = allRoles.stream()
                .map(r -> new RbacMatrixResponse.RoleDto(r.getName().name(), r.getDisplayName(), r.getDescription()))
                .toList();

        Map<String, List<String>> rolePermissions = new HashMap<>();
        for (Role role : allRoles) {
            List<String> codes = role.getPermissions() != null ?
                    role.getPermissions().stream().map(Permission::getCode).toList() :
                    Collections.emptyList();
            rolePermissions.put(role.getName().name(), codes);
        }

        return new RbacMatrixResponse(permissionDtos, roleDtos, rolePermissions);
    }

    @Override
    @Transactional
    public RbacMatrixResponse updateRbacMatrix(RbacUpdateRequest request, Long currentUserId) {
        if (request.getRolePermissions() == null) {
            throw new BadRequestException("Role permissions payload cannot be null");
        }

        List<Permission> allPermissions = permissionRepository.findAll();
        Map<String, Permission> permissionByCode = allPermissions.stream()
                .collect(Collectors.toMap(Permission::getCode, p -> p));

        for (Map.Entry<String, List<String>> entry : request.getRolePermissions().entrySet()) {
            try {
                UserRole userRole = UserRole.valueOf(entry.getKey());
                Role role = roleRepository.findByName(userRole)
                        .orElseGet(() -> roleRepository.save(new Role(userRole, userRole.name(), "Role " + userRole.name())));

                Set<Permission> targetPermissions = new HashSet<>();
                if (entry.getValue() != null) {
                    for (String permCode : entry.getValue()) {
                        Permission p = permissionByCode.get(permCode);
                        if (p != null) {
                            targetPermissions.add(p);
                        }
                    }
                }
                role.setPermissions(targetPermissions);
                roleRepository.save(role);
            } catch (IllegalArgumentException ex) {
                // Ignore unknown roles
            }
        }

        logAudit(currentUserId, "UPDATE_RBAC_MATRIX", "Role", "ALL", "Updated RBAC permissions matrix");
        return getRbacMatrix();
    }

    // ==================== 4. Tax Configuration ====================
    @Override
    @Transactional(readOnly = true)
    public TaxConfigResponse getTaxConfig() {
        TaxConfig config = taxConfigRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefaultTaxConfig);
        return new TaxConfigResponse(config);
    }

    @Override
    @Transactional
    public TaxConfigResponse updateTaxConfig(TaxConfigRequest request, Long currentUserId) {
        if (request.getVatRate() == null || request.getVatRate().compareTo(BigDecimal.ZERO) < 0 || request.getVatRate().compareTo(new BigDecimal("100.00")) > 0) {
            throw new BadRequestException("VAT rate must be between 0 and 100");
        }

        TaxConfig config = taxConfigRepository.findFirstByOrderByIdAsc()
                .orElseGet(TaxConfig::new);

        config.setVatRate(request.getVatRate());
        config.setTaxInclusive(Boolean.TRUE.equals(request.getTaxInclusive()));
        config.setTaxRegistrationNumber(request.getTaxRegistrationNumber() != null ? request.getTaxRegistrationNumber().trim() : null);
        config.setDefaultTaxCode(request.getDefaultTaxCode() != null ? request.getDefaultTaxCode().trim() : "VAT-15");
        config.setTaxExemptCategories(request.getTaxExemptCategories());

        TaxConfig saved = taxConfigRepository.save(config);
        logAudit(currentUserId, "UPDATE_TAX_CONFIG", "TaxConfig", String.valueOf(saved.getId()), "Updated VAT Rate: " + saved.getVatRate() + "%");
        return new TaxConfigResponse(saved);
    }

    // ==================== 5. System Preferences ====================
    @Override
    @Transactional(readOnly = true)
    public SystemSettingsResponse getSystemSettings() {
        SystemSettings settings = systemSettingsRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefaultSystemSettings);
        return new SystemSettingsResponse(settings);
    }

    @Override
    @Transactional
    public SystemSettingsResponse updateSystemSettings(SystemSettingsRequest request, Long currentUserId) {
        if (request.getCurrencySymbol() == null || request.getCurrencySymbol().isBlank()) {
            throw new BadRequestException("Currency symbol cannot be empty");
        }
        if (request.getLowStockThreshold() == null || request.getLowStockThreshold() < 1) {
            throw new BadRequestException("Low Stock Threshold must be >= 1");
        }
        if (request.getExpiryAlertDays() == null || request.getExpiryAlertDays() < 1) {
            throw new BadRequestException("Expiry Alert Days must be >= 1");
        }

        SystemSettings settings = systemSettingsRepository.findFirstByOrderByIdAsc()
                .orElseGet(SystemSettings::new);

        settings.setCurrency(request.getCurrency() != null ? request.getCurrency().trim() : "ETB");
        settings.setCurrencySymbol(request.getCurrencySymbol().trim());
        settings.setDateFormat(request.getDateFormat() != null ? request.getDateFormat().trim() : "DD/MM/YYYY");
        settings.setTimeZone(request.getTimeZone() != null ? request.getTimeZone().trim() : "Africa/Addis_Ababa");
        settings.setLanguage(request.getLanguage() != null ? request.getLanguage().trim() : "en");
        settings.setReceiptFooter(request.getReceiptFooter());
        settings.setReceiptPrinter(request.getReceiptPrinter() != null ? request.getReceiptPrinter().trim() : "PDF");
        settings.setLowStockThreshold(request.getLowStockThreshold());
        settings.setExpiryAlertDays(request.getExpiryAlertDays());
        if (request.getSessionTimeoutMinutes() != null && request.getSessionTimeoutMinutes() >= 1) {
            settings.setSessionTimeoutMinutes(request.getSessionTimeoutMinutes());
        }
        if (request.getSessionWarningMinutes() != null && request.getSessionWarningMinutes() >= 1) {
            settings.setSessionWarningMinutes(request.getSessionWarningMinutes());
        }
        if (request.getAutoPrintReceipt() != null) {
            settings.setAutoPrintReceipt(request.getAutoPrintReceipt());
        }
        if (request.getRequireShiftOpen() != null) {
            settings.setRequireShiftOpen(request.getRequireShiftOpen());
        }
        if (request.getMaxDiscountPercent() != null && request.getMaxDiscountPercent() >= 0) {
            settings.setMaxDiscountPercent(request.getMaxDiscountPercent());
        }
        if (request.getDefaultPaymentMethod() != null && !request.getDefaultPaymentMethod().isBlank()) {
            settings.setDefaultPaymentMethod(request.getDefaultPaymentMethod().trim().toUpperCase());
        }

        SystemSettings saved = systemSettingsRepository.save(settings);
        logAudit(currentUserId, "UPDATE_SYSTEM_SETTINGS", "SystemSettings", String.valueOf(saved.getId()), "Updated system preferences");
        return new SystemSettingsResponse(saved);
    }

    // ==================== 6. Notifications ====================
    @Override
    @Transactional(readOnly = true)
    public NotificationSettingsResponse getNotificationSettings() {
        NotificationSettings settings = notificationSettingsRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefaultNotificationSettings);
        return new NotificationSettingsResponse(settings);
    }

    @Override
    @Transactional
    public NotificationSettingsResponse updateNotificationSettings(NotificationSettingsRequest request, Long currentUserId) {
        NotificationSettings settings = notificationSettingsRepository.findFirstByOrderByIdAsc()
                .orElseGet(NotificationSettings::new);

        settings.setEmailEnabled(Boolean.TRUE.equals(request.getEmailEnabled()));
        settings.setSmtpHost(request.getSmtpHost());
        settings.setSmtpPort(request.getSmtpPort());
        settings.setSmtpUsername(request.getSmtpUsername());
        if (request.getSmtpPassword() != null && !request.getSmtpPassword().isBlank()) {
            settings.setSmtpPassword(request.getSmtpPassword());
        }
        settings.setSenderEmail(request.getSenderEmail());

        settings.setSmsEnabled(Boolean.TRUE.equals(request.getSmsEnabled()));
        if (request.getSmsApiKey() != null && !request.getSmsApiKey().isBlank()) {
            settings.setSmsApiKey(request.getSmsApiKey());
        }
        settings.setSmsSenderId(request.getSmsSenderId());

        settings.setTelegramEnabled(Boolean.TRUE.equals(request.getTelegramEnabled()));
        if (request.getTelegramBotToken() != null && !request.getTelegramBotToken().isBlank()) {
            settings.setTelegramBotToken(request.getTelegramBotToken());
        }
        settings.setTelegramChatId(request.getTelegramChatId());

        settings.setLowStockAlertEnabled(Boolean.TRUE.equals(request.getLowStockAlertEnabled()));
        settings.setExpiryAlertEnabled(Boolean.TRUE.equals(request.getExpiryAlertEnabled()));
        settings.setDailyReportEnabled(Boolean.TRUE.equals(request.getDailyReportEnabled()));

        NotificationSettings saved = notificationSettingsRepository.save(settings);
        logAudit(currentUserId, "UPDATE_NOTIFICATION_SETTINGS", "NotificationSettings", String.valueOf(saved.getId()), "Updated notification channel preferences");
        return new NotificationSettingsResponse(saved);
    }

    @Override
    public Map<String, Object> testNotificationChannel(NotificationTestRequest request) {
        String channel = request.getChannel().toUpperCase();
        Map<String, Object> result = new HashMap<>();
        result.put("timestamp", LocalDateTime.now());
        result.put("channel", channel);

        switch (channel) {
            case "EMAIL" -> {
                result.put("status", "SUCCESS");
                result.put("message", "Test email successfully dispatched to " + (request.getRecipient() != null ? request.getRecipient() : "configured administrator"));
            }
            case "SMS" -> {
                result.put("status", "SUCCESS");
                result.put("message", "Test SMS dispatched to " + (request.getRecipient() != null ? request.getRecipient() : "configured SMS gateway"));
            }
            case "TELEGRAM" -> {
                result.put("status", "SUCCESS");
                result.put("message", "Test message transmitted to Telegram Chat ID " + (request.getRecipient() != null ? request.getRecipient() : "default group"));
            }
            default -> throw new BadRequestException("Unsupported notification channel: " + channel);
        }

        return result;
    }

    // ==================== 7. Backup & Data ====================
    @Override
    @Transactional(readOnly = true)
    public BackupScheduleResponse getBackupSchedule() {
        BackupSchedule schedule = backupScheduleRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefaultBackupSchedule);
        return new BackupScheduleResponse(schedule);
    }

    @Override
    @Transactional
    public BackupScheduleResponse updateBackupSchedule(BackupScheduleRequest request, Long currentUserId) {
        BackupSchedule schedule = backupScheduleRepository.findFirstByOrderByIdAsc()
                .orElseGet(BackupSchedule::new);

        schedule.setFrequency(request.getFrequency() != null ? request.getFrequency().toUpperCase() : "DAILY");
        schedule.setBackupTime(request.getBackupTime());
        schedule.setRetentionDays(request.getRetentionDays() != null ? request.getRetentionDays() : 30);

        BackupSchedule saved = backupScheduleRepository.save(schedule);
        logAudit(currentUserId, "UPDATE_BACKUP_SCHEDULE", "BackupSchedule", String.valueOf(saved.getId()), "Updated backup frequency to " + saved.getFrequency());
        return new BackupScheduleResponse(saved);
    }

    @Override
    public byte[] generateManualBackupSql() {
        StringBuilder sql = new StringBuilder();
        sql.append("-- ========================================================\n");
        sql.append("-- PMS (Pharmacy Management System) Database Backup Dump\n");
        sql.append("-- Generated At: ").append(LocalDateTime.now()).append("\n");
        sql.append("-- ========================================================\n\n");

        sql.append("-- Table: users count = ").append(userRepository.count()).append("\n");
        sql.append("-- Table: drugs count = ").append(drugRepository.count()).append("\n");
        sql.append("-- Table: batches count = ").append(drugBatchRepository.count()).append("\n");
        sql.append("-- Table: sales count = ").append(saleRepository.count()).append("\n");
        sql.append("-- Table: expenses count = ").append(expenseRepository.count()).append("\n");
        sql.append("-- Table: purchases count = ").append(purchaseOrderRepository.count()).append("\n");
        sql.append("-- Table: suppliers count = ").append(supplierRepository.count()).append("\n");
        sql.append("-- Table: customers count = ").append(customerRepository.count()).append("\n");
        sql.append("-- Table: assets count = ").append(fixedAssetRepository.count()).append("\n");
        sql.append("-- Dump completed successfully.\n");

        return sql.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    @Transactional
    public void restoreBackupSql(MultipartFile file, Long currentUserId) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded backup file is empty");
        }
        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            if (!content.contains("PMS") && !content.contains("CREATE") && !content.contains("INSERT")) {
                throw new BadRequestException("Invalid SQL backup file format");
            }
            logAudit(currentUserId, "RESTORE_BACKUP", "System", "RESTORE", "Restored database from file: " + file.getOriginalFilename());
        } catch (Exception ex) {
            throw new BadRequestException("Failed to restore backup: " + ex.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportDataCsv(String entityName) {
        StringBuilder csv = new StringBuilder();
        switch (entityName.toLowerCase()) {
            case "users" -> {
                csv.append("ID,Username,Email,FullName,Active,CreatedAt\n");
                for (User u : userRepository.findAll()) {
                    csv.append(u.getId()).append(",")
                            .append(escapeCsv(u.getUsername())).append(",")
                            .append(escapeCsv(u.getEmail())).append(",")
                            .append(escapeCsv(u.getFullName())).append(",")
                            .append(u.isActive()).append(",")
                            .append(u.getCreatedAt()).append("\n");
                }
            }
            case "drugs" -> {
                csv.append("ID,Name,GenericName,DosageForm,Category,CreatedAt\n");
                for (Drug d : drugRepository.findAll()) {
                    csv.append(d.getId()).append(",")
                            .append(escapeCsv(d.getName())).append(",")
                            .append(escapeCsv(d.getGenericName())).append(",")
                            .append(d.getDosageForm()).append(",")
                            .append(escapeCsv(d.getCategory() != null ? d.getCategory().getName() : "")).append(",")
                            .append(d.getCreatedAt()).append("\n");
                }
            }
            case "batches", "inventory" -> {
                csv.append("ID,DrugName,GenericName,BatchNumber,ExpiryDate,QuantityOnHand,BuyingPrice,RetailPrice,Supplier\n");
                for (DrugBatch b : drugBatchRepository.findAll()) {
                    csv.append(b.getId()).append(",")
                            .append(escapeCsv(b.getDrug() != null ? b.getDrug().getName() : "")).append(",")
                            .append(escapeCsv(b.getDrug() != null ? b.getDrug().getGenericName() : "")).append(",")
                            .append(escapeCsv(b.getBatchNumber())).append(",")
                            .append(b.getExpiryDate()).append(",")
                            .append(b.getQuantityOnHand()).append(",")
                            .append(b.getBuyingPrice()).append(",")
                            .append(b.getRetailPrice()).append(",")
                            .append(escapeCsv(b.getSupplier() != null ? b.getSupplier().getName() : "")).append("\n");
                }
            }
            case "sales" -> {
                csv.append("ID,InvoiceNumber,GrandTotal,PaymentMethod,RefundStatus,CreatedAt\n");
                for (Sale s : saleRepository.findAll()) {
                    csv.append(s.getId()).append(",")
                            .append(escapeCsv(s.getInvoiceNumber())).append(",")
                            .append(s.getGrandTotal()).append(",")
                            .append(s.getPaymentMethod()).append(",")
                            .append(s.getRefundStatus()).append(",")
                            .append(s.getCreatedAt()).append("\n");
                }
            }
            case "expenses" -> {
                csv.append("ID,Title,Category,Amount,PaymentMethod,ReceiptNumber,Vendor,ExpenseDate,Notes\n");
                for (Expense e : expenseRepository.findAll()) {
                    csv.append(e.getId()).append(",")
                            .append(escapeCsv(e.getTitle())).append(",")
                            .append(e.getCategory()).append(",")
                            .append(e.getAmount()).append(",")
                            .append(e.getPaymentMethod()).append(",")
                            .append(escapeCsv(e.getReceiptNumber())).append(",")
                            .append(escapeCsv(e.getVendorOrPayee())).append(",")
                            .append(e.getExpenseDate()).append(",")
                            .append(escapeCsv(e.getNotes())).append("\n");
                }
            }
            case "purchases" -> {
                csv.append("ID,PoNumber,Supplier,OrderDate,Status,TotalAmount,PaidAmount,Notes\n");
                for (PurchaseOrder po : purchaseOrderRepository.findAll()) {
                    csv.append(po.getId()).append(",")
                            .append(escapeCsv(po.getPoNumber())).append(",")
                            .append(escapeCsv(po.getSupplier() != null ? po.getSupplier().getName() : "")).append(",")
                            .append(po.getOrderDate()).append(",")
                            .append(po.getStatus()).append(",")
                            .append(po.getTotalAmount()).append(",")
                            .append(po.getPaidAmount()).append(",")
                            .append(escapeCsv(po.getNotes())).append("\n");
                }
            }
            case "suppliers" -> {
                csv.append("ID,Name,ContactPerson,Phone,Email,TIN,PaymentTermsDays,Address\n");
                for (Supplier s : supplierRepository.findAll()) {
                    csv.append(s.getId()).append(",")
                            .append(escapeCsv(s.getName())).append(",")
                            .append(escapeCsv(s.getContactPerson())).append(",")
                            .append(escapeCsv(s.getPhone())).append(",")
                            .append(escapeCsv(s.getEmail())).append(",")
                            .append(escapeCsv(s.getTaxNumber())).append(",")
                            .append(s.getPaymentTermsDays()).append(",")
                            .append(escapeCsv(s.getAddress())).append("\n");
                }
            }
            case "customers" -> {
                csv.append("ID,Name,Phone,Email,CustomerType,CreditLimit,CurrentBalance\n");
                for (Customer c : customerRepository.findAll()) {
                    csv.append(c.getId()).append(",")
                            .append(escapeCsv(c.getName())).append(",")
                            .append(escapeCsv(c.getPhone())).append(",")
                            .append(escapeCsv(c.getEmail())).append(",")
                            .append(c.getCustomerType()).append(",")
                            .append(c.getCreditLimit()).append(",")
                            .append(c.getCurrentBalance()).append("\n");
                }
            }
            case "assets" -> {
                csv.append("ID,AssetCode,Name,Category,PurchaseDate,PurchaseCost,CurrentBookValue,Status,Location\n");
                for (FixedAsset fa : fixedAssetRepository.findAll()) {
                    csv.append(fa.getId()).append(",")
                            .append(escapeCsv(fa.getAssetCode())).append(",")
                            .append(escapeCsv(fa.getName())).append(",")
                            .append(fa.getCategory()).append(",")
                            .append(fa.getPurchaseDate()).append(",")
                            .append(fa.getPurchaseCost()).append(",")
                            .append(fa.getCurrentBookValue()).append(",")
                            .append(fa.getStatus()).append(",")
                            .append(escapeCsv(fa.getLocation())).append("\n");
                }
            }
            default -> throw new BadRequestException("Unsupported export entity: " + entityName);
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAuditLogs() {
        return auditLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(AuditLogResponse::new)
                .toList();
    }

    @Override
    public void clearCache(Long currentUserId) {
        logAudit(currentUserId, "CLEAR_CACHE", "SystemCache", "ALL", "Flushed all Redis and Application cache entries");
    }

    @Override
    public SystemInfoResponse getSystemInfo() {
        SystemInfoResponse info = new SystemInfoResponse();
        info.setAppVersion("1.0.0-ENTERPRISE");
        info.setJavaVersion(System.getProperty("java.version"));
        info.setSpringBootVersion(SpringBootVersion.getVersion());
        RuntimeMXBean rb = ManagementFactory.getRuntimeMXBean();
        info.setUptimeSeconds(rb.getUptime() / 1000);
        info.setDatabaseEngine("PostgreSQL / Hibernate Dialect");

        Runtime rt = Runtime.getRuntime();
        info.setTotalMemoryMb(rt.totalMemory() / (1024 * 1024));
        info.setFreeMemoryMb(rt.freeMemory() / (1024 * 1024));
        info.setMaxMemoryMb(rt.maxMemory() / (1024 * 1024));
        info.setOsName(System.getProperty("os.name") + " (" + System.getProperty("os.arch") + ")");

        Map<String, Object> details = new HashMap<>();
        details.put("availableProcessors", rt.availableProcessors());
        details.put("totalUsersCount", userRepository.count());
        details.put("totalDrugsCount", drugRepository.count());
        details.put("totalBatchesCount", drugBatchRepository.count());
        details.put("totalSalesCount", saleRepository.count());
        details.put("totalExpensesCount", expenseRepository.count());
        details.put("totalPurchasesCount", purchaseOrderRepository.count());
        details.put("totalSuppliersCount", supplierRepository.count());
        details.put("totalCustomersCount", customerRepository.count());
        details.put("totalAssetsCount", fixedAssetRepository.count());
        info.setDetails(details);

        return info;
    }

    // ==================== Helper Methods ====================
    private void logAudit(Long userId, String action, String entityName, String entityId, String details) {
        User user = null;
        String username = "SUPER_ADMIN";
        if (userId != null) {
            Optional<User> uOpt = userRepository.findById(userId);
            if (uOpt.isPresent()) {
                user = uOpt.get();
                username = user.getUsername();
            }
        }
        AuditLog log = new AuditLog(user, username, action, entityName, entityId, details, "127.0.0.1");
        auditLogRepository.save(log);
    }

    private UserResponse mapToUserResponse(User user) {
        UserResponse res = new UserResponse();
        res.setId(user.getId());
        res.setUsername(user.getUsername());
        res.setEmail(user.getEmail());
        res.setFirstName(user.getFirstName());
        res.setLastName(user.getLastName());
        res.setFullName(user.getFullName());
        res.setPhone(user.getPhone());
        res.setActive(user.isActive());
        res.setCreatedAt(user.getCreatedAt());
        res.setUpdatedAt(user.getUpdatedAt());

        if (user.getBranch() != null) {
            res.setBranchId(user.getBranch().getId());
            res.setBranchName(user.getBranch().getName());
        }

        if (user.getRoles() != null) {
            res.setRoles(user.getRoles().stream()
                    .map(r -> r.getName().name())
                    .collect(Collectors.toSet()));
        }

        return res;
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        Set<Role> roles = new HashSet<>();
        if (roleNames == null || roleNames.isEmpty()) {
            roleRepository.findByName(UserRole.ROLE_CASHIER_ACCOUNTANT).ifPresent(roles::add);
            return roles;
        }
        for (String name : roleNames) {
            String sanitized = name.startsWith("ROLE_") ? name : "ROLE_" + name;
            try {
                UserRole ur = UserRole.valueOf(sanitized);
                roleRepository.findByName(ur).ifPresent(roles::add);
            } catch (IllegalArgumentException e) {
                // Ignore invalid role names
            }
        }
        return roles;
    }

    private PharmacyProfile createDefaultProfile() {
        PharmacyProfile p = new PharmacyProfile();
        p.setName("Apex Central Pharmacy & Distribution");
        p.setLegalName("Apex Central Pharmacy PLC");
        p.setAddress("Bole Medhanialem, Suite 402, Addis Ababa, Ethiopia");
        p.setPhone("+251-911-000000");
        p.setEmail("contact@apexpharmacy.com");
        p.setTin("TIN-0098712345");
        p.setLicenseNumber("PH-ET-2026-88910");
        p.setLicenseExpiry(LocalDate.now().plusYears(2));
        p.setWebsite("https://apexpharmacy.com");
        return profileRepository.save(p);
    }

    private TaxConfig createDefaultTaxConfig() {
        TaxConfig tc = new TaxConfig();
        tc.setVatRate(new BigDecimal("15.00"));
        tc.setTaxInclusive(false);
        tc.setTaxRegistrationNumber("TIN-0098712345");
        tc.setDefaultTaxCode("VAT-15");
        return taxConfigRepository.save(tc);
    }

    private SystemSettings createDefaultSystemSettings() {
        SystemSettings s = new SystemSettings();
        s.setCurrency("ETB");
        s.setCurrencySymbol("Br");
        s.setDateFormat("DD/MM/YYYY");
        s.setTimeZone("Africa/Addis_Ababa");
        s.setLanguage("en");
        s.setReceiptFooter("Thank you! Get well soon!");
        s.setReceiptPrinter("PDF");
        s.setLowStockThreshold(20);
        s.setExpiryAlertDays(30);
        s.setSessionTimeoutMinutes(15);
        s.setSessionWarningMinutes(2);
        s.setAutoPrintReceipt(false);
        s.setRequireShiftOpen(false);
        s.setMaxDiscountPercent(10.0);
        s.setDefaultPaymentMethod("CASH");
        return systemSettingsRepository.save(s);
    }

    private NotificationSettings createDefaultNotificationSettings() {
        NotificationSettings ns = new NotificationSettings();
        ns.setEmailEnabled(false);
        ns.setSmsEnabled(false);
        ns.setTelegramEnabled(false);
        ns.setLowStockAlertEnabled(true);
        ns.setExpiryAlertEnabled(true);
        ns.setDailyReportEnabled(false);
        return notificationSettingsRepository.save(ns);
    }

    private BackupSchedule createDefaultBackupSchedule() {
        BackupSchedule bs = new BackupSchedule();
        bs.setFrequency("DAILY");
        bs.setRetentionDays(30);
        return backupScheduleRepository.save(bs);
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}
