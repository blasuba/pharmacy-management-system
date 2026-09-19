package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.DrugCreateRequest;
import com.pharmacy.pms.dto.response.DrugResponse;
import com.pharmacy.pms.dto.response.PageResponse;
import com.pharmacy.pms.exception.BadRequestException;
import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.Category;
import com.pharmacy.pms.model.entity.Drug;
import com.pharmacy.pms.model.enums.DosageForm;
import com.pharmacy.pms.repository.CategoryRepository;
import com.pharmacy.pms.repository.DrugBatchRepository;
import com.pharmacy.pms.repository.DrugRepository;
import com.pharmacy.pms.service.impl.DrugServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DrugServiceTest {

    @Mock
    private DrugRepository drugRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private DrugBatchRepository batchRepository;

    @InjectMocks
    private DrugServiceImpl drugService;

    private Drug drug;
    private Category category;

    @BeforeEach
    void setUp() {
        category = new Category("Antibiotics", "Antibiotic meds");

        drug = new Drug();
        drug.setName("Amoxicillin 500mg");
        drug.setGenericName("Amoxicillin");
        drug.setCategory(category);
        drug.setDosageForm(DosageForm.CAPSULE);
        drug.setStrength("500mg");
        drug.setUnitOfMeasure("BOX");
        drug.setBarcode("1234567890");
        drug.setReorderThreshold(20);
        drug.setPrescriptionRequired(true);
    }

    @Test
    void testGetAllDrugs_WithQuery() {
        Pageable pageable = PageRequest.of(0, 10);
        when(drugRepository.searchDrugs(eq("Amox"), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(drug), pageable, 1));
        when(batchRepository.getTotalAvailableStockForDrug(any(), any(LocalDate.class))).thenReturn(50);

        PageResponse<DrugResponse> response = drugService.getAllDrugs("Amox", pageable);
        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
        assertEquals("Amoxicillin 500mg", response.getContent().get(0).getName());
    }

    @Test
    void testGetDrugById_Found() {
        when(drugRepository.findById(1L)).thenReturn(Optional.of(drug));
        when(batchRepository.getTotalAvailableStockForDrug(any(), any(LocalDate.class))).thenReturn(100);

        DrugResponse response = drugService.getDrugById(1L);
        assertNotNull(response);
        assertEquals(100, response.getTotalStock());
    }

    @Test
    void testGetDrugById_NotFound() {
        when(drugRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> drugService.getDrugById(99L));
    }

    @Test
    void testCreateDrug_Success() {
        DrugCreateRequest req = new DrugCreateRequest();
        req.setName("Amoxil");
        req.setGenericName("Amoxicillin");
        req.setCategoryId(1L);
        req.setDosageForm(DosageForm.CAPSULE);
        req.setStrength("500mg");
        req.setUnitOfMeasure("BOX");
        req.setBarcode("987654321");
        req.setReorderThreshold(10);
        req.setPrescriptionRequired(false);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(drugRepository.save(any(Drug.class))).thenReturn(drug);

        DrugResponse res = drugService.createDrug(req);
        assertNotNull(res);
        assertEquals("Amoxicillin 500mg", res.getName());
    }

    @Test
    void testDeleteDrug_ActiveStockThrowsError() {
        when(drugRepository.findById(1L)).thenReturn(Optional.of(drug));
        when(batchRepository.getTotalAvailableStockForDrug(any(), any(LocalDate.class))).thenReturn(25);

        assertThrows(BadRequestException.class, () -> drugService.deleteDrug(1L));
    }

    @Test
    void testDeleteDrug_ZeroStockSuccess() {
        when(drugRepository.findById(1L)).thenReturn(Optional.of(drug));
        when(batchRepository.getTotalAvailableStockForDrug(any(), any(LocalDate.class))).thenReturn(0);
        doNothing().when(drugRepository).delete(drug);

        assertDoesNotThrow(() -> drugService.deleteDrug(1L));
        verify(drugRepository, times(1)).delete(drug);
    }
}
