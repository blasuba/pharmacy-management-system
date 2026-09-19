package com.pharmacy.pms.dto.response;

import com.pharmacy.pms.model.entity.Drug;
import com.pharmacy.pms.model.enums.DosageForm;

public class DrugResponse {
    private Long id;
    private String name;
    private String genericName;
    private Long categoryId;
    private String categoryName;
    private DosageForm dosageForm;
    private String strength;
    private String unitOfMeasure;
    private String barcode;
    private int reorderThreshold;
    private boolean prescriptionRequired;
    private String status;
    private int totalStock;

    public DrugResponse() {}

    public DrugResponse(Drug drug, int totalStock) {
        this.id = drug.getId();
        this.name = drug.getName();
        this.genericName = drug.getGenericName();
        if (drug.getCategory() != null) {
            this.categoryId = drug.getCategory().getId();
            this.categoryName = drug.getCategory().getName();
        }
        this.dosageForm = drug.getDosageForm();
        this.strength = drug.getStrength();
        this.unitOfMeasure = drug.getUnitOfMeasure();
        this.barcode = drug.getBarcode();
        this.reorderThreshold = drug.getReorderThreshold();
        this.prescriptionRequired = drug.isPrescriptionRequired();
        this.status = drug.getStatus();
        this.totalStock = totalStock;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getGenericName() { return genericName; }
    public Long getCategoryId() { return categoryId; }
    public String getCategoryName() { return categoryName; }
    public DosageForm getDosageForm() { return dosageForm; }
    public String getStrength() { return strength; }
    public String getUnitOfMeasure() { return unitOfMeasure; }
    public String getBarcode() { return barcode; }
    public int getReorderThreshold() { return reorderThreshold; }
    public boolean isPrescriptionRequired() { return prescriptionRequired; }
    public String getStatus() { return status; }
    public int getTotalStock() { return totalStock; }
}
