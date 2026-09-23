package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.*;
import com.pharmacy.pms.dto.response.*;
import com.pharmacy.pms.model.enums.AssetCategory;
import com.pharmacy.pms.model.enums.AssetStatus;

import java.util.List;

public interface FixedAssetService {

    AssetResponse createAsset(AssetCreateRequest request, Long userId);

    AssetResponse updateAsset(Long id, AssetUpdateRequest request, Long userId);

    void deleteAsset(Long id, Long userId);

    AssetResponse getAssetById(Long id);

    List<AssetResponse> searchAssets(String query, AssetCategory category, AssetStatus status, String location);

    AssetResponse assignAsset(Long id, AssetAssignRequest request, Long userId);

    AssetResponse returnAsset(Long id, Long userId);

    AssetMaintenanceResponse addMaintenanceRecord(Long id, AssetMaintenanceRequest request, Long userId);

    List<AssetMaintenanceResponse> getMaintenanceHistory(Long assetId);

    AssetDisposalResponse disposeAsset(Long id, AssetDisposalRequest request, Long userId);

    List<AssetDepreciationResponse> getDepreciationSchedule(Long assetId);

    List<AssetDepreciationResponse> runDepreciation(DepreciationRunRequest request, Long userId);

    AssetDashboardResponse getDashboardMetrics();

    List<AssetDisposalResponse> getDisposalHistory();

    byte[] exportAssetsExcel();

    byte[] exportAssetsPdf();
}
