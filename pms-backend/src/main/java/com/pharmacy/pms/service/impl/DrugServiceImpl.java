package com.pharmacy.pms.service.impl;

import com.pharmacy.pms.dto.request.DrugCreateRequest;
import com.pharmacy.pms.dto.response.DrugResponse;
import com.pharmacy.pms.dto.response.PageResponse;
import com.pharmacy.pms.exception.BadRequestException;
import com.pharmacy.pms.exception.ResourceNotFoundException;
import com.pharmacy.pms.model.entity.Category;
import com.pharmacy.pms.model.entity.Drug;
import com.pharmacy.pms.repository.CategoryRepository;
import com.pharmacy.pms.repository.DrugBatchRepository;
import com.pharmacy.pms.repository.DrugRepository;
import com.pharmacy.pms.service.DrugService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class DrugServiceImpl implements DrugService {

    private static final String DRUG_NOT_FOUND = "Drug not found with ID: ";
    private static final String CATEGORY_NOT_FOUND = "Category not found with ID: ";

    private final DrugRepository drugRepository;
    private final CategoryRepository categoryRepository;
    private final DrugBatchRepository batchRepository;

    public DrugServiceImpl(DrugRepository drugRepository, CategoryRepository categoryRepository, DrugBatchRepository batchRepository) {
        this.drugRepository = drugRepository;
        this.categoryRepository = categoryRepository;
        this.batchRepository = batchRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DrugResponse> getAllDrugs(String query, Pageable pageable) {
        Page<Drug> page;
        if (query != null && !query.trim().isEmpty()) {
            page = drugRepository.searchDrugs(query.trim(), pageable);
        } else {
            page = drugRepository.findAll(pageable);
        }

        LocalDate today = LocalDate.now();
        Page<DrugResponse> responsePage = page.map(drug -> {
            int stock = batchRepository.getTotalAvailableStockForDrug(drug.getId(), today);
            return new DrugResponse(drug, stock);
        });

        return new PageResponse<>(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public DrugResponse getDrugById(Long id) {
        Drug drug = drugRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(DRUG_NOT_FOUND + id));
        int stock = batchRepository.getTotalAvailableStockForDrug(drug.getId(), LocalDate.now());
        return new DrugResponse(drug, stock);
    }

    @Override
    @Transactional(readOnly = true)
    public DrugResponse getDrugByBarcode(String barcode) {
        Drug drug = drugRepository.findByBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("No drug found with barcode: " + barcode));
        int stock = batchRepository.getTotalAvailableStockForDrug(drug.getId(), LocalDate.now());
        return new DrugResponse(drug, stock);
    }

    @Override
    @Transactional
    public DrugResponse createDrug(DrugCreateRequest request) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException(CATEGORY_NOT_FOUND + request.getCategoryId()));

        Drug drug = new Drug();
        drug.setName(request.getName());
        drug.setGenericName(request.getGenericName());
        drug.setCategory(category);
        drug.setDosageForm(request.getDosageForm());
        drug.setStrength(request.getStrength());
        drug.setUnitOfMeasure(request.getUnitOfMeasure());
        drug.setBarcode(request.getBarcode());
        drug.setReorderThreshold(request.getReorderThreshold());
        drug.setPrescriptionRequired(request.isPrescriptionRequired());
        drug.setStatus("ACTIVE");

        Drug saved = drugRepository.save(drug);
        return new DrugResponse(saved, 0);
    }

    @Override
    @Transactional
    public DrugResponse updateDrug(Long id, DrugCreateRequest request) {
        Drug drug = drugRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(DRUG_NOT_FOUND + id));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException(CATEGORY_NOT_FOUND + request.getCategoryId()));

        drug.setName(request.getName());
        drug.setGenericName(request.getGenericName());
        drug.setCategory(category);
        drug.setDosageForm(request.getDosageForm());
        drug.setStrength(request.getStrength());
        drug.setUnitOfMeasure(request.getUnitOfMeasure());
        drug.setBarcode(request.getBarcode());
        drug.setReorderThreshold(request.getReorderThreshold());
        drug.setPrescriptionRequired(request.isPrescriptionRequired());

        Drug saved = drugRepository.save(drug);
        int stock = batchRepository.getTotalAvailableStockForDrug(saved.getId(), LocalDate.now());
        return new DrugResponse(saved, stock);
    }

    @Override
    @Transactional
    public void deleteDrug(Long id) {
        Drug drug = drugRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(DRUG_NOT_FOUND + id));

        int stock = batchRepository.getTotalAvailableStockForDrug(id, LocalDate.now());
        if (stock > 0) {
            throw new BadRequestException(
                    "Cannot delete drug '" + drug.getName() + "' because it still has " + stock + " active units in stock across batches. Adjust or zero the stock first.");
        }

        drugRepository.delete(drug);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Override
    @Transactional
    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }

    @Override
    @Transactional
    public Category updateCategory(Long id, Category category) {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(CATEGORY_NOT_FOUND + id));
        existing.setName(category.getName());
        existing.setDescription(category.getDescription());
        return categoryRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(CATEGORY_NOT_FOUND + id));
        categoryRepository.delete(category);
    }
}
