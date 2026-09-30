package com.pharmacy.pms.service.impl;

import com.pharmacy.pms.dto.request.PurchaseOrderCreateRequest;
import com.pharmacy.pms.dto.request.PurchaseOrderItemRequest;
import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.*;
import com.pharmacy.pms.model.enums.MovementType;
import com.pharmacy.pms.model.enums.PurchaseStatus;
import com.pharmacy.pms.repository.*;
import com.pharmacy.pms.service.InventoryService;
import com.pharmacy.pms.service.PurchaseService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PurchaseServiceImpl implements PurchaseService {

    private static final String PO_NOT_FOUND = "Purchase Order not found with ID: ";

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final DrugBatchRepository drugBatchRepository;
    private final SupplierRepository supplierRepository;
    private final DrugRepository drugRepository;
    private final BranchRepository branchRepository;
    private final InventoryService inventoryService;

    public PurchaseServiceImpl(PurchaseOrderRepository purchaseOrderRepository,
                               DrugBatchRepository drugBatchRepository,
                               SupplierRepository supplierRepository,
                               DrugRepository drugRepository,
                               BranchRepository branchRepository,
                               InventoryService inventoryService) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.drugBatchRepository = drugBatchRepository;
        this.supplierRepository = supplierRepository;
        this.drugRepository = drugRepository;
        this.branchRepository = branchRepository;
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
                .orElseThrow(() -> new ResourceNotFoundException(PO_NOT_FOUND + id));
    }

    @Override
    @Transactional
    public PurchaseOrder createPurchaseOrder(PurchaseOrderCreateRequest request, Long userId) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + request.getSupplierId()));

        Branch branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findById(request.getBranchId()).orElse(null);
        }
        if (branch == null) {
            List<Branch> branches = branchRepository.findAll();
            if (!branches.isEmpty()) {
                branch = branches.get(0);
            }
        }

        String poNumber = "PO-" + DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now()) + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber(poNumber);
        po.setSupplier(supplier);
        po.setBranch(branch);
        po.setOrderDate(LocalDate.now());
        po.setStatus(PurchaseStatus.ORDERED);
        po.setNotes(request.getNotes());

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<PurchaseOrderItem> items = new ArrayList<>();

        for (PurchaseOrderItemRequest itemReq : request.getItems()) {
            Drug drug = drugRepository.findById(itemReq.getDrugId())
                    .orElseThrow(() -> new ResourceNotFoundException("Drug not found with ID: " + itemReq.getDrugId()));

            BigDecimal lineSubtotal = itemReq.getUnitCost().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalAmount = totalAmount.add(lineSubtotal);

            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setPurchaseOrder(po);
            item.setDrug(drug);
            item.setQuantityOrdered(itemReq.getQuantity());
            item.setQuantityReceived(0);
            item.setUnitCost(itemReq.getUnitCost());
            item.setSubtotal(lineSubtotal);
            item.setBatchNumber(itemReq.getBatchNumber());
            item.setExpiryDate(itemReq.getExpiryDate());

            items.add(item);
        }

        po.setTotalAmount(totalAmount);
        po.setItems(items);

        return purchaseOrderRepository.save(po);
    }

    @Override
    @Transactional
    public PurchaseOrder updatePurchaseOrder(Long id, PurchaseOrderCreateRequest request, Long userId) {
        PurchaseOrder po = getPurchaseOrderById(id);
        if (po.getStatus() == PurchaseStatus.RECEIVED) {
            throw new IllegalStateException("Cannot modify a purchase order that has already been received into stock.");
        }

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + request.getSupplierId()));

        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findById(request.getBranchId()).orElse(null);
            if (branch != null) {
                po.setBranch(branch);
            }
        }

        po.setSupplier(supplier);
        po.setNotes(request.getNotes());

        // Clear existing items and replace with updated ones
        po.getItems().clear();

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (PurchaseOrderItemRequest itemReq : request.getItems()) {
            Drug drug = drugRepository.findById(itemReq.getDrugId())
                    .orElseThrow(() -> new ResourceNotFoundException("Drug not found with ID: " + itemReq.getDrugId()));

            BigDecimal lineSubtotal = itemReq.getUnitCost().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalAmount = totalAmount.add(lineSubtotal);

            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setPurchaseOrder(po);
            item.setDrug(drug);
            item.setQuantityOrdered(itemReq.getQuantity());
            item.setQuantityReceived(0);
            item.setUnitCost(itemReq.getUnitCost());
            item.setSubtotal(lineSubtotal);
            item.setBatchNumber(itemReq.getBatchNumber());
            item.setExpiryDate(itemReq.getExpiryDate());

            po.getItems().add(item);
        }

        po.setTotalAmount(totalAmount);
        return purchaseOrderRepository.save(po);
    }

    @Override
    @Transactional
    public void deletePurchaseOrder(Long id, Long userId) {
        PurchaseOrder po = getPurchaseOrderById(id);
        if (po.getStatus() == PurchaseStatus.RECEIVED) {
            throw new IllegalStateException("Cannot delete a purchase order that has already been received into inventory. Batches and audit trail records exist.");
        }
        purchaseOrderRepository.delete(po);
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
            batch.setBatchNumber(item.getBatchNumber() != null && !item.getBatchNumber().trim().isEmpty() ? item.getBatchNumber().trim() : "GRN-" + po.getPoNumber() + "-" + item.getId());
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
