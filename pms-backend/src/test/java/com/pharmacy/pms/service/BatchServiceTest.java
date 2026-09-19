package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.BatchCreateRequest;
import com.pharmacy.pms.dto.response.BatchResponse;
import com.pharmacy.pms.exception.BadRequestException;
import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.Drug;
import com.pharmacy.pms.model.entity.DrugBatch;
import com.pharmacy.pms.model.entity.Supplier;
import com.pharmacy.pms.repository.DrugBatchRepository;
import com.pharmacy.pms.repository.DrugRepository;
import com.pharmacy.pms.repository.SupplierRepository;
import com.pharmacy.pms.service.impl.BatchServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BatchServiceTest {

    @Mock
    private DrugBatchRepository batchRepository;

    @Mock
    private DrugRepository drugRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private InventoryService inventoryService;

    @InjectMocks
    private BatchServiceImpl batchService;

    private Drug drug;
    private DrugBatch batch;
    private Supplier supplier;

    @BeforeEach
    void setUp() {
        drug = new Drug();
        drug.setName("Paracetamol");

        supplier = new Supplier();
        supplier.setName("PharmaCorp");

        batch = new DrugBatch();
        batch.setDrug(drug);
        batch.setSupplier(supplier);
        batch.setBatchNumber("BAT-100");
        batch.setExpiryDate(LocalDate.now().plusMonths(6));
        batch.setQuantityOnHand(100);
        batch.setBuyingPrice(BigDecimal.valueOf(20));
        batch.setRetailPrice(BigDecimal.valueOf(30));
    }

    @Test
    void testGetBatchesByDrug() {
        when(batchRepository.findByDrugIdOrderByExpiryDateAsc(1L)).thenReturn(List.of(batch));
        List<BatchResponse> list = batchService.getBatchesByDrug(1L);
        assertEquals(1, list.size());
        assertEquals("BAT-100", list.get(0).getBatchNumber());
    }

    @Test
    void testCreateBatch_Success() {
        BatchCreateRequest req = new BatchCreateRequest();
        req.setDrugId(1L);
        req.setSupplierId(1L);
        req.setBatchNumber("BAT-200");
        req.setExpiryDate(LocalDate.now().plusMonths(12));
        req.setQuantity(50);
        req.setBuyingPrice(BigDecimal.valueOf(15));
        req.setRetailPrice(BigDecimal.valueOf(25));

        when(drugRepository.findById(1L)).thenReturn(Optional.of(drug));
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(supplier));
        when(batchRepository.save(any(DrugBatch.class))).thenReturn(batch);

        BatchResponse res = batchService.createBatch(req, 1L);
        assertNotNull(res);
        verify(inventoryService, times(1)).recordMovement(any(), eq(1L), any(), eq(50), any(), any(), any());
    }

    @Test
    void testDeleteBatch_WithStockThrowsError() {
        when(batchRepository.findById(1L)).thenReturn(Optional.of(batch));
        assertThrows(BadRequestException.class, () -> batchService.deleteBatch(1L));
    }

    @Test
    void testDeleteBatch_ZeroStockSuccess() {
        batch.setQuantityOnHand(0);
        when(batchRepository.findById(1L)).thenReturn(Optional.of(batch));
        doNothing().when(batchRepository).delete(batch);

        assertDoesNotThrow(() -> batchService.deleteBatch(1L));
        verify(batchRepository, times(1)).delete(batch);
    }
}
