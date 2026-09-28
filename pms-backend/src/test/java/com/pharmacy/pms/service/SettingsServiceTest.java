package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.*;
import com.pharmacy.pms.dto.response.*;
import com.pharmacy.pms.exception.BadRequestException;
import com.pharmacy.pms.model.entity.*;
import com.pharmacy.pms.model.enums.UserRole;
import com.pharmacy.pms.repository.*;
import com.pharmacy.pms.service.impl.SettingsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SettingsServiceTest {

    @Mock
    private PharmacyProfileRepository profileRepository;
    @Mock
    private SystemSettingsRepository systemSettingsRepository;
    @Mock
    private TaxConfigRepository taxConfigRepository;
    @Mock
    private NotificationSettingsRepository notificationSettingsRepository;
    @Mock
    private BackupScheduleRepository backupScheduleRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PermissionRepository permissionRepository;
    @Mock
    private BranchRepository branchRepository;
    @Mock
    private DrugRepository drugRepository;
    @Mock
    private SaleRepository saleRepository;
    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private SettingsServiceImpl settingsService;

    private PharmacyProfile sampleProfile;
    private TaxConfig sampleTaxConfig;
    private SystemSettings sampleSystemSettings;

    @BeforeEach
    void setUp() {
        sampleProfile = new PharmacyProfile();
        sampleProfile.setId(1L);
        sampleProfile.setName("Bunna Pharmacy");
        sampleProfile.setLegalName("Bunna Pharmacy PLC");
        sampleProfile.setAddress("Bole Road, Addis Ababa");
        sampleProfile.setPhone("+251-11-123-4567");
        sampleProfile.setEmail("info@bunnapharmacy.com");
        sampleProfile.setTin("1234567890");
        sampleProfile.setLicenseNumber("PH-2026-00123");
        sampleProfile.setLicenseExpiry(LocalDate.now().plusYears(1));

        sampleTaxConfig = new TaxConfig();
        sampleTaxConfig.setId(1L);
        sampleTaxConfig.setVatRate(new BigDecimal("15.00"));
        sampleTaxConfig.setTaxInclusive(false);

        sampleSystemSettings = new SystemSettings();
        sampleSystemSettings.setId(1L);
        sampleSystemSettings.setCurrency("ETB");
        sampleSystemSettings.setCurrencySymbol("Br");
        sampleSystemSettings.setLowStockThreshold(20);
        sampleSystemSettings.setExpiryAlertDays(30);
    }

    @Test
    void testGetProfile() {
        when(profileRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(sampleProfile));

        PharmacyProfileResponse response = settingsService.getProfile();
        assertNotNull(response);
        assertEquals("Bunna Pharmacy", response.getName());
        assertEquals("1234567890", response.getTin());
    }

    @Test
    void testUpdateProfile_Success() {
        when(profileRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(sampleProfile));
        when(profileRepository.save(any(PharmacyProfile.class))).thenAnswer(i -> i.getArgument(0));

        PharmacyProfileRequest request = new PharmacyProfileRequest();
        request.setName("Bunna Pharmacy Updated");
        request.setLegalName("Bunna Pharmacy PLC");
        request.setAddress("Bole Road");
        request.setPhone("+251-11-123-4567");
        request.setEmail("contact@bunnapharmacy.com");
        request.setTin("1234567890");
        request.setLicenseNumber("PH-2026-00123");
        request.setLicenseExpiry(LocalDate.now().plusYears(2));

        PharmacyProfileResponse response = settingsService.updateProfile(request, 1L);
        assertNotNull(response);
        assertEquals("Bunna Pharmacy Updated", response.getName());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testUpdateProfile_PastLicenseExpiry_ThrowsBadRequest() {
        PharmacyProfileRequest request = new PharmacyProfileRequest();
        request.setName("Bunna Pharmacy");
        request.setLegalName("Bunna PLC");
        request.setAddress("Bole");
        request.setPhone("0911000000");
        request.setEmail("test@bunna.com");
        request.setTin("123");
        request.setLicenseNumber("LIC123");
        request.setLicenseExpiry(LocalDate.now().minusDays(1));

        assertThrows(BadRequestException.class, () -> settingsService.updateProfile(request, 1L));
    }

    @Test
    void testTaxConfig_Update() {
        when(taxConfigRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(sampleTaxConfig));
        when(taxConfigRepository.save(any(TaxConfig.class))).thenAnswer(i -> i.getArgument(0));

        TaxConfigRequest req = new TaxConfigRequest();
        req.setVatRate(new BigDecimal("15.00"));
        req.setTaxInclusive(true);
        req.setDefaultTaxCode("VAT-15");

        TaxConfigResponse res = settingsService.updateTaxConfig(req, 1L);
        assertNotNull(res);
        assertTrue(res.getTaxInclusive());
        assertEquals(new BigDecimal("15.00"), res.getVatRate());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testTaxConfig_InvalidVatRate_ThrowsBadRequest() {
        TaxConfigRequest req = new TaxConfigRequest();
        req.setVatRate(new BigDecimal("150.00"));

        assertThrows(BadRequestException.class, () -> settingsService.updateTaxConfig(req, 1L));
    }

    @Test
    void testSystemSettings_Update() {
        when(systemSettingsRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(sampleSystemSettings));
        when(systemSettingsRepository.save(any(SystemSettings.class))).thenAnswer(i -> i.getArgument(0));

        SystemSettingsRequest req = new SystemSettingsRequest();
        req.setCurrency("ETB");
        req.setCurrencySymbol("Br");
        req.setLowStockThreshold(15);
        req.setExpiryAlertDays(45);
        req.setSessionTimeoutMinutes(30);
        req.setSessionWarningMinutes(5);

        SystemSettingsResponse res = settingsService.updateSystemSettings(req, 1L);
        assertNotNull(res);
        assertEquals(15, res.getLowStockThreshold());
        assertEquals(45, res.getExpiryAlertDays());
        assertEquals(30, res.getSessionTimeoutMinutes());
        assertEquals(5, res.getSessionWarningMinutes());
    }

    @Test
    void testUserDeactivation_SelfDeactivation_ThrowsBadRequest() {
        assertThrows(BadRequestException.class, () -> settingsService.deactivateUser(1L, 1L));
    }

    @Test
    void testPasswordReset_InvalidPattern_ThrowsBadRequest() {
        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setNewPassword("simple"); // Fails min 8 chars, 1 uppercase, 1 number, 1 special char

        assertThrows(BadRequestException.class, () -> settingsService.resetPassword(2L, req, 1L));
    }

    @Test
    void testTestNotificationChannel_Success() {
        NotificationTestRequest req = new NotificationTestRequest();
        req.setChannel("EMAIL");
        req.setRecipient("admin@example.com");

        Map<String, Object> res = settingsService.testNotificationChannel(req);
        assertEquals("SUCCESS", res.get("status"));
        assertEquals("EMAIL", res.get("channel"));
    }
}
