package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.AssetAssignRequest;
import com.pharmacy.pms.dto.request.AssetCreateRequest;
import com.pharmacy.pms.dto.request.AssetDisposalRequest;
import com.pharmacy.pms.dto.request.DepreciationRunRequest;
import com.pharmacy.pms.dto.response.AssetDepreciationResponse;
import com.pharmacy.pms.dto.response.AssetDisposalResponse;
import com.pharmacy.pms.dto.response.AssetResponse;
import com.pharmacy.pms.exception.BadRequestException;
import com.pharmacy.pms.model.entity.*;
import com.pharmacy.pms.model.enums.AssetCategory;
import com.pharmacy.pms.model.enums.AssetStatus;
import com.pharmacy.pms.model.enums.DepreciationMethod;
import com.pharmacy.pms.model.enums.DisposalType;
import com.pharmacy.pms.repository.*;
import com.pharmacy.pms.service.impl.FixedAssetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FixedAssetServiceTest {

    @Mock
    private FixedAssetRepository assetRepository;

    @Mock
    private AssetDepreciationRepository depreciationRepository;

    @Mock
    private AssetMaintenanceRepository maintenanceRepository;

    @Mock
    private AssetDisposalRepository disposalRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private FixedAssetServiceImpl assetService;

    private FixedAsset asset;
    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("admin");
        user.setFirstName("Admin");
        user.setLastName("User");

        asset = new FixedAsset();
        asset.setId(1L);
        asset.setAssetCode("AST-LAP-0001");
        asset.setName("Dell Latitude 5540");
        asset.setCategory(AssetCategory.LAPTOP);
        asset.setPurchaseDate(LocalDate.of(2025, 1, 1));
        asset.setPurchaseCost(BigDecimal.valueOf(50000));
        asset.setSalvageValue(BigDecimal.valueOf(5000));
        asset.setUsefulLifeYears(5);
        asset.setCurrentBookValue(BigDecimal.valueOf(50000));
        asset.setStatus(AssetStatus.ACTIVE);
        asset.setDepreciationMethod(DepreciationMethod.STRAIGHT_LINE);
    }

    @Test
    void testCreateAsset_GeneratesCodeAndInitializesValues() {
        AssetCreateRequest req = new AssetCreateRequest();
        req.setName("Dell Latitude 5540");
        req.setCategory(AssetCategory.LAPTOP);
        req.setPurchaseDate(LocalDate.now());
        req.setPurchaseCost(BigDecimal.valueOf(50000));
        req.setUsefulLifeYears(5);
        req.setSalvageValue(BigDecimal.valueOf(5000));

        when(assetRepository.countByCategory(AssetCategory.LAPTOP)).thenReturn(0L);
        when(assetRepository.existsByAssetCode(anyString())).thenReturn(false);
        when(assetRepository.save(any(FixedAsset.class))).thenReturn(asset);

        AssetResponse res = assetService.createAsset(req, 1L);
        assertNotNull(res);
        assertEquals("Dell Latitude 5540", res.getName());
        verify(auditLogRepository, times(1)).save(any());
    }

    @Test
    void testRunDepreciation_StraightLineCalculation() {
        DepreciationRunRequest req = new DepreciationRunRequest();
        req.setFiscalYear(2025);

        when(assetRepository.findActiveAssetsForDepreciation()).thenReturn(List.of(asset));
        when(depreciationRepository.existsByFixedAssetIdAndFiscalYearAndIsLockedTrue(any(), eq(2025))).thenReturn(false);
        when(depreciationRepository.findByFixedAssetIdAndFiscalYear(any(), eq(2025))).thenReturn(Optional.empty());

        // Annual Depreciation = (50000 - 5000) / 5 = 9000
        AssetDepreciation savedDep = new AssetDepreciation(asset, 2025, BigDecimal.valueOf(50000), BigDecimal.valueOf(9000), BigDecimal.valueOf(41000), true);
        when(depreciationRepository.findByFiscalYear(2025)).thenReturn(List.of(savedDep));

        List<AssetDepreciationResponse> results = assetService.runDepreciation(req, 1L);

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(BigDecimal.valueOf(9000), results.get(0).getDepreciationAmount());
        assertEquals(BigDecimal.valueOf(41000), results.get(0).getClosingValue());
        verify(depreciationRepository, times(1)).save(any(AssetDepreciation.class));
    }

    @Test
    void testDisposeAsset_GainLossCalculation() {
        asset.setCurrentBookValue(BigDecimal.valueOf(30000));

        AssetDisposalRequest req = new AssetDisposalRequest();
        req.setDisposalDate(LocalDate.now());
        req.setDisposalType(DisposalType.SOLD);
        req.setSalePrice(BigDecimal.valueOf(35000)); // 35000 - 30000 = +5000 Gain
        req.setReason("Upgraded office workstation");

        when(assetRepository.findById(1L)).thenReturn(Optional.of(asset));
        AssetDisposal disposal = new AssetDisposal(asset, LocalDate.now(), DisposalType.SOLD, BigDecimal.valueOf(35000), BigDecimal.valueOf(30000), BigDecimal.valueOf(5000), "Upgraded", user);
        when(disposalRepository.save(any(AssetDisposal.class))).thenReturn(disposal);

        AssetDisposalResponse res = assetService.disposeAsset(1L, req, 1L);

        assertNotNull(res);
        assertEquals(BigDecimal.valueOf(5000), res.getGainLoss());
        assertEquals(DisposalType.SOLD, res.getDisposalType());
        assertEquals(BigDecimal.ZERO, asset.getCurrentBookValue());
        assertEquals(AssetStatus.SOLD, asset.getStatus());
    }

    @Test
    void testDisposeAsset_ThrowsIfAssigned() {
        asset.setAssignedTo(user);
        when(assetRepository.findById(1L)).thenReturn(Optional.of(asset));

        AssetDisposalRequest req = new AssetDisposalRequest();
        req.setDisposalDate(LocalDate.now());
        req.setDisposalType(DisposalType.DISPOSED);

        assertThrows(BadRequestException.class, () -> assetService.disposeAsset(1L, req, 1L));
    }

    @Test
    void testAssignAndReturnAsset() {
        when(assetRepository.findById(1L)).thenReturn(Optional.of(asset));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(assetRepository.save(any(FixedAsset.class))).thenReturn(asset);

        AssetAssignRequest assignReq = new AssetAssignRequest();
        assignReq.setUserId(2L);
        assignReq.setNotes("Assigned for dispensing operations");

        AssetResponse assignRes = assetService.assignAsset(1L, assignReq, 1L);
        assertNotNull(assignRes);
        verify(notificationService, times(1)).createAnnouncement(anyString(), anyString(), any(), anyString());

        // Return asset
        AssetResponse returnRes = assetService.returnAsset(1L, 1L);
        assertNotNull(returnRes);
        assertNull(asset.getAssignedTo());
    }
}
