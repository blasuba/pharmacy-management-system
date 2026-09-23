package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.StockAdjustmentRequest;
import com.pharmacy.pms.dto.response.StockMovementResponse;
import com.pharmacy.pms.model.entity.DrugBatch;
import com.pharmacy.pms.model.entity.StockMovement;
import com.pharmacy.pms.model.enums.MovementType;

import java.util.List;

public interface InventoryService {
    StockMovement recordMovement(DrugBatch batch, Long userId, MovementType type, int quantityDelta, String refType, Long refId, String reason);
    StockMovementResponse adjustStock(StockAdjustmentRequest request, Long userId);
    List<StockMovementResponse> getRecentMovements();
}
