package com.pharmacy.pms.controller;

import com.pharmacy.pms.dto.request.DrugCreateRequest;
import com.pharmacy.pms.dto.response.ApiResponse;
import com.pharmacy.pms.dto.response.DrugResponse;
import com.pharmacy.pms.dto.response.PageResponse;
import com.pharmacy.pms.model.entity.Category;
import com.pharmacy.pms.service.DrugService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/drugs")
public class DrugController {

    private final DrugService drugService;

    public DrugController(DrugService drugService) {
        this.drugService = drugService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<DrugResponse>>> getAllDrugs(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        PageResponse<DrugResponse> drugs = drugService.getAllDrugs(query, PageRequest.of(page, size, Sort.by("name").ascending()));
        return ResponseEntity.ok(ApiResponse.success(drugs));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DrugResponse>> getDrugById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(drugService.getDrugById(id)));
    }

    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<ApiResponse<DrugResponse>> getDrugByBarcode(@PathVariable String barcode) {
        return ResponseEntity.ok(ApiResponse.success(drugService.getDrugByBarcode(barcode)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('DRUG_CREATE')")
    public ResponseEntity<ApiResponse<DrugResponse>> createDrug(@Valid @RequestBody DrugCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(drugService.createDrug(request), "Drug catalog created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('DRUG_EDIT')")
    public ResponseEntity<ApiResponse<DrugResponse>> updateDrug(@PathVariable Long id, @Valid @RequestBody DrugCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(drugService.updateDrug(id, request), "Drug updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('DRUG_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteDrug(@PathVariable Long id) {
        drugService.deleteDrug(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Drug deleted successfully"));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Category>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(drugService.getAllCategories()));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('DRUG_CREATE')")
    public ResponseEntity<ApiResponse<Category>> createCategory(@RequestBody Category category) {
        return ResponseEntity.ok(ApiResponse.success(drugService.createCategory(category), "Category created"));
    }

    @PutMapping("/categories/{id}")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('DRUG_EDIT')")
    public ResponseEntity<ApiResponse<Category>> updateCategory(@PathVariable Long id, @RequestBody Category category) {
        return ResponseEntity.ok(ApiResponse.success(drugService.updateCategory(id, category), "Category updated"));
    }

    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('DRUG_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        drugService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Category deleted successfully"));
    }
}
