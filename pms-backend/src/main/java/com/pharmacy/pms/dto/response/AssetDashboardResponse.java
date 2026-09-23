package com.pharmacy.pms.dto.response;

import java.math.BigDecimal;
import java.util.List;

public class AssetDashboardResponse {
    private long totalAssetsCount;
    private BigDecimal totalPurchaseValue = BigDecimal.ZERO;
    private BigDecimal totalCurrentBookValue = BigDecimal.ZERO;
    private BigDecimal totalDepreciationThisYear = BigDecimal.ZERO;
    private long activeAssetsCount;
    private long assetsUnderMaintenanceCount;
    private long disposedAssetsCount;
    private long warrantyAlertsCount;
    private long replacementAlertsCount;
    private List<AssetResponse> expiringWarrantyAssets;
    private List<AssetResponse> replacementDueAssets;
    private List<AssetMaintenanceResponse> recentMaintenances;

    public AssetDashboardResponse() {}

    public long getTotalAssetsCount() { return totalAssetsCount; }
    public void setTotalAssetsCount(long totalAssetsCount) { this.totalAssetsCount = totalAssetsCount; }

    public BigDecimal getTotalPurchaseValue() { return totalPurchaseValue; }
    public void setTotalPurchaseValue(BigDecimal totalPurchaseValue) { this.totalPurchaseValue = totalPurchaseValue; }

    public BigDecimal getTotalCurrentBookValue() { return totalCurrentBookValue; }
    public void setTotalCurrentBookValue(BigDecimal totalCurrentBookValue) { this.totalCurrentBookValue = totalCurrentBookValue; }

    public BigDecimal getTotalDepreciationThisYear() { return totalDepreciationThisYear; }
    public void setTotalDepreciationThisYear(BigDecimal totalDepreciationThisYear) { this.totalDepreciationThisYear = totalDepreciationThisYear; }

    public long getActiveAssetsCount() { return activeAssetsCount; }
    public void setActiveAssetsCount(long activeAssetsCount) { this.activeAssetsCount = activeAssetsCount; }

    public long getAssetsUnderMaintenanceCount() { return assetsUnderMaintenanceCount; }
    public void setAssetsUnderMaintenanceCount(long assetsUnderMaintenanceCount) { this.assetsUnderMaintenanceCount = assetsUnderMaintenanceCount; }

    public long getDisposedAssetsCount() { return disposedAssetsCount; }
    public void setDisposedAssetsCount(long disposedAssetsCount) { this.disposedAssetsCount = disposedAssetsCount; }

    public long getWarrantyAlertsCount() { return warrantyAlertsCount; }
    public void setWarrantyAlertsCount(long warrantyAlertsCount) { this.warrantyAlertsCount = warrantyAlertsCount; }

    public long getReplacementAlertsCount() { return replacementAlertsCount; }
    public void setReplacementAlertsCount(long replacementAlertsCount) { this.replacementAlertsCount = replacementAlertsCount; }

    public List<AssetResponse> getExpiringWarrantyAssets() { return expiringWarrantyAssets; }
    public void setExpiringWarrantyAssets(List<AssetResponse> expiringWarrantyAssets) { this.expiringWarrantyAssets = expiringWarrantyAssets; }

    public List<AssetResponse> getReplacementDueAssets() { return replacementDueAssets; }
    public void setReplacementDueAssets(List<AssetResponse> replacementDueAssets) { this.replacementDueAssets = replacementDueAssets; }

    public List<AssetMaintenanceResponse> getRecentMaintenances() { return recentMaintenances; }
    public void setRecentMaintenances(List<AssetMaintenanceResponse> recentMaintenances) { this.recentMaintenances = recentMaintenances; }
}
