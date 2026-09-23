package com.pharmacy.pms.controller;

import com.pharmacy.pms.dto.request.*;
import com.pharmacy.pms.dto.response.*;
import com.pharmacy.pms.model.enums.AssetCategory;
import com.pharmacy.pms.model.enums.AssetStatus;
import com.pharmacy.pms.security.PmsUserPrincipal;
import com.pharmacy.pms.service.FixedAssetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/assets")
@Tag(name = "Fixed Assets", description = "Fixed Asset management, straight-line depreciation, maintenance tracking, assignment, and disposals")
public class FixedAssetController {

    private final FixedAssetService assetService;

    public FixedAssetController(FixedAssetService assetService) {
        this.assetService = assetService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_CASHIER_ACCOUNTANT')")
    @Operation(summary = "Register a new fixed asset")
    public ResponseEntity<ApiResponse<AssetResponse>> createAsset(
            @Valid @RequestBody AssetCreateRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        AssetResponse response = assetService.createAsset(request, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ApiResponse.success(response, "Fixed asset registered successfully"));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_CASHIER_ACCOUNTANT') or hasAuthority('ROLE_PHARMACIST')")
    @Operation(summary = "Search and filter fixed assets")
    public ResponseEntity<ApiResponse<List<AssetResponse>>> searchAssets(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) AssetCategory category,
            @RequestParam(required = false) AssetStatus status,
            @RequestParam(required = false) String location) {
        return ResponseEntity.ok(ApiResponse.success(assetService.searchAssets(query, category, status, location)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_CASHIER_ACCOUNTANT') or hasAuthority('ROLE_PHARMACIST')")
    @Operation(summary = "Get fixed asset details")
    public ResponseEntity<ApiResponse<AssetResponse>> getAssetById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(assetService.getAssetById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_CASHIER_ACCOUNTANT')")
    @Operation(summary = "Update fixed asset information")
    public ResponseEntity<ApiResponse<AssetResponse>> updateAsset(
            @PathVariable Long id,
            @Valid @RequestBody AssetUpdateRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        AssetResponse response = assetService.updateAsset(id, request, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ApiResponse.success(response, "Asset updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_OWNER')")
    @Operation(summary = "Delete fixed asset (Super Admin only, requires no depreciation)")
    public ResponseEntity<ApiResponse<Void>> deleteAsset(
            @PathVariable Long id,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        assetService.deleteAsset(id, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ApiResponse.success(null, "Asset deleted successfully"));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_CASHIER_ACCOUNTANT')")
    @Operation(summary = "Assign fixed asset to staff user")
    public ResponseEntity<ApiResponse<AssetResponse>> assignAsset(
            @PathVariable Long id,
            @Valid @RequestBody AssetAssignRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        AssetResponse response = assetService.assignAsset(id, request, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ApiResponse.success(response, "Asset assigned successfully"));
    }

    @PostMapping("/{id}/return")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_CASHIER_ACCOUNTANT')")
    @Operation(summary = "Return assigned fixed asset")
    public ResponseEntity<ApiResponse<AssetResponse>> returnAsset(
            @PathVariable Long id,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        AssetResponse response = assetService.returnAsset(id, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ApiResponse.success(response, "Asset returned successfully"));
    }

    @PostMapping("/{id}/maintenance")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_CASHIER_ACCOUNTANT')")
    @Operation(summary = "Add maintenance log entry for asset")
    public ResponseEntity<ApiResponse<AssetMaintenanceResponse>> addMaintenance(
            @PathVariable Long id,
            @Valid @RequestBody AssetMaintenanceRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        AssetMaintenanceResponse response = assetService.addMaintenanceRecord(id, request, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ApiResponse.success(response, "Maintenance record logged successfully"));
    }

    @GetMapping("/{id}/maintenance")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_CASHIER_ACCOUNTANT') or hasAuthority('ROLE_PHARMACIST')")
    @Operation(summary = "Get maintenance history for asset")
    public ResponseEntity<ApiResponse<List<AssetMaintenanceResponse>>> getMaintenanceHistory(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(assetService.getMaintenanceHistory(id)));
    }

    @PostMapping("/{id}/dispose")
    @PreAuthorize("hasAuthority('ROLE_OWNER')")
    @Operation(summary = "Dispose or sell fixed asset and calculate gain/loss (Super Admin only)")
    public ResponseEntity<ApiResponse<AssetDisposalResponse>> disposeAsset(
            @PathVariable Long id,
            @Valid @RequestBody AssetDisposalRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        AssetDisposalResponse response = assetService.disposeAsset(id, request, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ApiResponse.success(response, "Asset disposed and gain/loss calculated"));
    }

    @GetMapping("/{id}/depreciation")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_CASHIER_ACCOUNTANT')")
    @Operation(summary = "Get depreciation schedule for asset")
    public ResponseEntity<ApiResponse<List<AssetDepreciationResponse>>> getDepreciationSchedule(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(assetService.getDepreciationSchedule(id)));
    }

    @PostMapping("/depreciation/run")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_CASHIER_ACCOUNTANT')")
    @Operation(summary = "Execute annual batch straight-line depreciation for all active assets")
    public ResponseEntity<ApiResponse<List<AssetDepreciationResponse>>> runDepreciation(
            @Valid @RequestBody DepreciationRunRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        List<AssetDepreciationResponse> responses = assetService.runDepreciation(request, principal != null ? principal.getId() : null);
        return ResponseEntity.ok(ApiResponse.success(responses, "Annual depreciation completed successfully"));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_CASHIER_ACCOUNTANT') or hasAuthority('ROLE_PHARMACIST')")
    @Operation(summary = "Get Fixed Assets Dashboard KPI metrics and alerts")
    public ResponseEntity<ApiResponse<AssetDashboardResponse>> getDashboardMetrics() {
        return ResponseEntity.ok(ApiResponse.success(assetService.getDashboardMetrics()));
    }

    @GetMapping("/disposals")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_CASHIER_ACCOUNTANT')")
    @Operation(summary = "Get all disposal and gain/loss history")
    public ResponseEntity<ApiResponse<List<AssetDisposalResponse>>> getDisposalHistory() {
        return ResponseEntity.ok(ApiResponse.success(assetService.getDisposalHistory()));
    }

    @GetMapping("/export/excel")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_CASHIER_ACCOUNTANT')")
    @Operation(summary = "Export Fixed Asset register to Excel")
    public ResponseEntity<byte[]> exportExcel() {
        byte[] data = assetService.exportAssetsExcel();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=fixed_assets_register.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/export/pdf")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_CASHIER_ACCOUNTANT')")
    @Operation(summary = "Export Fixed Asset register to PDF")
    public ResponseEntity<byte[]> exportPdf() {
        byte[] data = assetService.exportAssetsPdf();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=fixed_assets_register.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}
