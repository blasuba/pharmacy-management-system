package com.pharmacy.pms.dto.request;

import com.pharmacy.pms.model.enums.DosageForm;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class DrugCreateRequest {
    @NotBlank(message = "Brand name is required")
    private String name;

    @NotBlank(message = "Generic name is required")
    private String genericName;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private DosageForm dosageForm;
    private String strength;
    private String unitOfMeasure;
    private String barcode;
    private int reorderThreshold = 20;
    private boolean prescriptionRequired = false;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGenericName() { return genericName; }
    public void setGenericName(String genericName) { this.genericName = genericName; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public DosageForm getDosageForm() { return dosageForm; }
    public void setDosageForm(DosageForm dosageForm) { this.dosageForm = dosageForm; }

    public String getStrength() { return strength; }
    public void setStrength(String strength) { this.strength = strength; }

    public String getUnitOfMeasure() { return unitOfMeasure; }
    public void setUnitOfMeasure(String unitOfMeasure) { this.unitOfMeasure = unitOfMeasure; }

    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }

    public int getReorderThreshold() { return reorderThreshold; }
    public void setReorderThreshold(int reorderThreshold) { this.reorderThreshold = reorderThreshold; }

    public boolean isPrescriptionRequired() { return prescriptionRequired; }
    public void setPrescriptionRequired(boolean prescriptionRequired) { this.prescriptionRequired = prescriptionRequired; }
}
