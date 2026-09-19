package com.pharmacy.pms.service.impl;

import com.pharmacy.pms.dto.request.StockAdjustmentRequest;
import com.pharmacy.pms.exception.InsufficientStockException;
import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.DrugBatch;
import com.pharmacy.pms.model.entity.StockMovement;
import com.pharmacy.pms.model.entity.User;
import com.pharmacy.pms.model.enums.MovementType;
import com.pharmacy.pms.repository.DrugBatchRepository;
import com.pharmacy.pms.repository.StockMovementRepository;
import com.pharmacy.pms.repository.UserRepository;
import com.pharmacy.pms.service.InventoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryServiceImpl implements InventoryService {

    private final StockMovementRepository movementRepository;
    private final DrugBatchRepository batchRepository;
    private final UserRepository userRepository;

    public InventoryServiceImpl(StockMovementRepository movementRepository, DrugBatchRepository batchRepository, UserRepository userRepository) {
        this.movementRepository = movementRepository;
        this.batchRepository = batchRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public StockMovement recordMovement(DrugBatch batch, Long userId, MovementType type, int quantityDelta, String refType, Long refId, String reason) {
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        StockMovement movement = StockMovement.builder()
                .drugBatch(batch)
                .branch(batch.getBranch())
                .user(user)
                .movementType(type)
                .quantityDelta(quantityDelta)
                .referenceType(refType)
                .referenceId(refId)
                .reason(reason)
                .build();
        return movementRepository.save(movement);
    }

    @Override
    @Transactional
    public StockMovement adjustStock(StockAdjustmentRequest request, Long userId) {
        DrugBatch batch = batchRepository.findById(request.getBatchId())
                .orElseThrow(() -> new ResourceNotFoundException("Drug Batch not found with ID: " + request.getBatchId()));

        int newQuantity = batch.getQuantityOnHand() + request.getQuantityDelta();
        if (newQuantity < 0) {
            throw new InsufficientStockException("Cannot adjust stock below 0. Current on-hand is: " + batch.getQuantityOnHand());
        }

        batch.setQuantityOnHand(newQuantity);
        batchRepository.save(batch);

        return recordMovement(batch, userId, request.getMovementType(), request.getQuantityDelta(), "MANUAL_ADJUSTMENT", batch.getId(), request.getReason());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockMovement> getRecentMovements() {
        return movementRepository.findTop50ByOrderByCreatedAtDesc();
    }
}
