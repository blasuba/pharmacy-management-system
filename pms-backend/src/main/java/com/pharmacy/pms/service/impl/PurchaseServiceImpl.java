package com.pharmacy.pms.service.impl;

import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.*;
import com.pharmacy.pms.model.enums.MovementType;
import com.pharmacy.pms.model.enums.PurchaseStatus;
import com.pharmacy.pms.repository.DrugBatchRepository;
import com.pharmacy.pms.repository.PurchaseOrderRepository;
import com.pharmacy.pms.service.InventoryService;
import com.pharmacy.pms.service.PurchaseService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class PurchaseServiceImpl implements PurchaseService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final DrugBatchRepository drugBatchRepository;
    private final InventoryService inventoryService;

    public PurchaseServiceImpl(PurchaseOrderRepository purchaseOrderRepository, DrugBatchRepository drugBatchRepository, InventoryService inventoryService) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.drugBatchRepository = drugBatchRepository;
        this.inventoryService = inventoryService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrder> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseOrder getPurchaseOrderById(Long id) {
        return purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with ID: " + id));
    }

    @Override
    @Transactional
    public PurchaseOrder receiveGoods(Long poId, Long userId) {
        PurchaseOrder po = getPurchaseOrderById(poId);
        if (po.getStatus() == PurchaseStatus.RECEIVED) {
            return po;
        }

        for (PurchaseOrderItem item : po.getItems()) {
            item.setQuantityReceived(item.getQuantityOrdered());

            DrugBatch batch = new DrugBatch();
            batch.setDrug(item.getDrug());
            batch.setBranch(po.getBranch());
            batch.setSupplier(po.getSupplier());
            batch.setBatchNumber(item.getBatchNumber() != null ? item.getBatchNumber() : "GRN-" + po.getPoNumber());
            batch.setExpiryDate(item.getExpiryDate() != null ? item.getExpiryDate() : LocalDate.now().plusMonths(18));
            batch.setManufacturingDate(LocalDate.now());
            batch.setQuantityOnHand(item.getQuantityReceived());
            batch.setBuyingPrice(item.getUnitCost());
            batch.setRetailPrice(item.getUnitCost().multiply(BigDecimal.valueOf(1.35))); // Standard 35% margin default
            batch.setWholesalePrice(item.getUnitCost().multiply(BigDecimal.valueOf(1.15)));
            batch.setDistributorPrice(item.getUnitCost().multiply(BigDecimal.valueOf(1.08)));

            DrugBatch savedBatch = drugBatchRepository.save(batch);

            // Record immutable ledger entry
            inventoryService.recordMovement(savedBatch, userId, MovementType.PURCHASE_RECEIPT, item.getQuantityReceived(), "PURCHASE_ORDER", po.getId(), "GRN Receipt for PO: " + po.getPoNumber());
        }

        po.setStatus(PurchaseStatus.RECEIVED);
        return purchaseOrderRepository.save(po);
    }
}
