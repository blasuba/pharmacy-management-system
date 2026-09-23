package com.pharmacy.pms.service.impl;

import com.pharmacy.pms.dto.request.BatchCreateRequest;
import com.pharmacy.pms.dto.response.BatchResponse;
import com.pharmacy.pms.exception.BadRequestException;
import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.Drug;
import com.pharmacy.pms.model.entity.DrugBatch;
import com.pharmacy.pms.model.entity.Supplier;
import com.pharmacy.pms.model.enums.MovementType;
import com.pharmacy.pms.repository.DrugBatchRepository;
import com.pharmacy.pms.repository.DrugRepository;
import com.pharmacy.pms.repository.SupplierRepository;
import com.pharmacy.pms.service.BatchService;
import com.pharmacy.pms.service.InventoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class BatchServiceImpl implements BatchService {

    private final DrugBatchRepository batchRepository;
    private final DrugRepository drugRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryService inventoryService;

    public BatchServiceImpl(DrugBatchRepository batchRepository, DrugRepository drugRepository, SupplierRepository supplierRepository, InventoryService inventoryService) {
        this.batchRepository = batchRepository;
        this.drugRepository = drugRepository;
        this.supplierRepository = supplierRepository;
        this.inventoryService = inventoryService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchResponse> getAllBatches() {
        return batchRepository.findAll().stream()
                .map(BatchResponse::new)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchResponse> getBatchesByDrug(Long drugId) {
        return batchRepository.findByDrugIdOrderByExpiryDateAsc(drugId).stream()
                .map(BatchResponse::new)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchResponse> getActiveBatchesFefo(Long drugId) {
        return batchRepository.findActiveBatchesByDrugFefo(drugId, LocalDate.now()).stream()
                .map(BatchResponse::new)
                .toList();
    }

    @Override
    @Transactional
    public BatchResponse createBatch(BatchCreateRequest request, Long userId) {
        Drug drug = drugRepository.findById(request.getDrugId())
                .orElseThrow(() -> new ResourceNotFoundException("Drug not found with ID: " + request.getDrugId()));

        Supplier supplier = null;
        if (request.getSupplierId() != null) {
            supplier = supplierRepository.findById(request.getSupplierId()).orElse(null);
        }

        DrugBatch batch = new DrugBatch();
        batch.setDrug(drug);
        batch.setSupplier(supplier);
        batch.setBatchNumber(request.getBatchNumber());
        batch.setExpiryDate(request.getExpiryDate());
        batch.setManufacturingDate(request.getManufacturingDate());
        batch.setQuantityOnHand(request.getQuantity());
        batch.setBuyingPrice(request.getBuyingPrice());
        batch.setRetailPrice(request.getRetailPrice());
        batch.setWholesalePrice(request.getWholesalePrice() != null ? request.getWholesalePrice() : request.getRetailPrice());
        batch.setDistributorPrice(request.getDistributorPrice() != null ? request.getDistributorPrice() : request.getRetailPrice());

        DrugBatch saved = batchRepository.save(batch);

        // Record immutable ledger entry for initial stock intake
        inventoryService.recordMovement(saved, userId, MovementType.PURCHASE_RECEIPT, request.getQuantity(), "INITIAL_BATCH_INTAKE", saved.getId(), "Direct batch registration");

        return new BatchResponse(saved);
    }

    @Override
    @Transactional
    public BatchResponse updateBatch(Long id, BatchCreateRequest request) {
        DrugBatch batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + id));

        if (request.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(request.getSupplierId()).orElse(null);
            batch.setSupplier(supplier);
        }

        batch.setBatchNumber(request.getBatchNumber());
        batch.setExpiryDate(request.getExpiryDate());
        batch.setManufacturingDate(request.getManufacturingDate());
        batch.setBuyingPrice(request.getBuyingPrice());
        batch.setRetailPrice(request.getRetailPrice());
        if (request.getWholesalePrice() != null) {
            batch.setWholesalePrice(request.getWholesalePrice());
        }
        if (request.getDistributorPrice() != null) {
            batch.setDistributorPrice(request.getDistributorPrice());
        }

        DrugBatch updated = batchRepository.save(batch);
        return new BatchResponse(updated);
    }

    @Override
    @Transactional
    public void deleteBatch(Long id) {
        DrugBatch batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + id));

        if (batch.getQuantityOnHand() > 0) {
            throw new BadRequestException(
                    "Cannot delete batch " + batch.getBatchNumber() + " with active quantity (" + batch.getQuantityOnHand() + "). Adjust quantity to zero first.");
        }

        batchRepository.delete(batch);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchResponse> getExpiringBatches(int daysThreshold) {
        LocalDate today = LocalDate.now();
        LocalDate futureDate = today.plusDays(daysThreshold);
        return batchRepository.findBatchesExpiringBetween(today, futureDate).stream()
                .map(BatchResponse::new)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchResponse> getExpiredBatches() {
        return batchRepository.findExpiredBatches(LocalDate.now()).stream()
                .map(BatchResponse::new)
                .toList();
    }
}
