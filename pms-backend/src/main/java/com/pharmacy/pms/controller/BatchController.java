package com.pharmacy.pms.controller;

import com.pharmacy.pms.dto.request.BatchCreateRequest;
import com.pharmacy.pms.dto.response.ApiResponse;
import com.pharmacy.pms.dto.response.BatchResponse;
import com.pharmacy.pms.security.PmsUserPrincipal;
import com.pharmacy.pms.service.BatchService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/batches")
public class BatchController {

    private final BatchService batchService;

    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BatchResponse>>> getAllBatches() {
        return ResponseEntity.ok(ApiResponse.success(batchService.getAllBatches()));
    }

    @GetMapping("/drug/{drugId}")
    public ResponseEntity<ApiResponse<List<BatchResponse>>> getBatchesByDrug(@PathVariable Long drugId) {
        return ResponseEntity.ok(ApiResponse.success(batchService.getBatchesByDrug(drugId)));
    }

    @GetMapping("/drug/{drugId}/fefo")
    public ResponseEntity<ApiResponse<List<BatchResponse>>> getActiveBatchesFefo(@PathVariable Long drugId) {
        return ResponseEntity.ok(ApiResponse.success(batchService.getActiveBatchesFefo(drugId)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_PHARMACIST') or hasAuthority('BATCH_MANAGE')")
    public ResponseEntity<ApiResponse<BatchResponse>> createBatch(
            @Valid @RequestBody BatchCreateRequest request,
            @AuthenticationPrincipal PmsUserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(batchService.createBatch(request, principal.getId()), "Batch registered successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_PHARMACIST') or hasAuthority('BATCH_MANAGE')")
    public ResponseEntity<ApiResponse<BatchResponse>> updateBatch(
            @PathVariable Long id,
            @Valid @RequestBody BatchCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(batchService.updateBatch(id, request), "Batch updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('ROLE_PHARMACIST') or hasAuthority('BATCH_MANAGE')")
    public ResponseEntity<ApiResponse<Void>> deleteBatch(@PathVariable Long id) {
        batchService.deleteBatch(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Batch deleted successfully"));
    }

    @GetMapping("/expiring")
    public ResponseEntity<ApiResponse<List<BatchResponse>>> getExpiringBatches(@RequestParam(defaultValue = "90") int days) {
        return ResponseEntity.ok(ApiResponse.success(batchService.getExpiringBatches(days)));
    }

    @GetMapping("/expired")
    public ResponseEntity<ApiResponse<List<BatchResponse>>> getExpiredBatches() {
        return ResponseEntity.ok(ApiResponse.success(batchService.getExpiredBatches()));
    }
}
