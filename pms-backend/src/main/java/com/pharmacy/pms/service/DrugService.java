package com.pharmacy.pms.service;

import com.pharmacy.pms.dto.request.DrugCreateRequest;
import com.pharmacy.pms.dto.response.DrugResponse;
import com.pharmacy.pms.dto.response.PageResponse;
import com.pharmacy.pms.model.entity.Category;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DrugService {
    PageResponse<DrugResponse> getAllDrugs(String query, Pageable pageable);
    DrugResponse getDrugById(Long id);
    DrugResponse getDrugByBarcode(String barcode);
    DrugResponse createDrug(DrugCreateRequest request);
    DrugResponse updateDrug(Long id, DrugCreateRequest request);
    void deleteDrug(Long id);
    List<Category> getAllCategories();
    Category createCategory(Category category);
    Category updateCategory(Long id, Category category);
    void deleteCategory(Long id);
}
