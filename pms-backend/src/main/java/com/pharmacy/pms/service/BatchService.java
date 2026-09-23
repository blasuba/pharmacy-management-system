package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.BatchCreateRequest;
import com.pharmacy.pms.dto.response.BatchResponse;

import java.util.List;

public interface BatchService {
    List<BatchResponse> getAllBatches();
    List<BatchResponse> getBatchesByDrug(Long drugId);
    List<BatchResponse> getActiveBatchesFefo(Long drugId);
    BatchResponse createBatch(BatchCreateRequest request, Long userId);
    BatchResponse updateBatch(Long id, BatchCreateRequest request);
    void deleteBatch(Long id);
    List<BatchResponse> getExpiringBatches(int daysThreshold);
    List<BatchResponse> getExpiredBatches();
}
