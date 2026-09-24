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
    private java.math.BigDecimal retailPrice = java.math.BigDecimal.ZERO;
    private java.math.BigDecimal wholesalePrice = java.math.BigDecimal.ZERO;
    private java.math.BigDecimal distributorPrice = java.math.BigDecimal.ZERO;

    public DrugResponse() {}

    public DrugResponse(Drug drug, int totalStock) {
        this(drug, totalStock, java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO);
    }

    public DrugResponse(Drug drug, int totalStock, java.math.BigDecimal retailPrice, java.math.BigDecimal wholesalePrice, java.math.BigDecimal distributorPrice) {
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
        this.retailPrice = retailPrice != null ? retailPrice : java.math.BigDecimal.ZERO;
        this.wholesalePrice = wholesalePrice != null ? wholesalePrice : java.math.BigDecimal.ZERO;
        this.distributorPrice = distributorPrice != null ? distributorPrice : java.math.BigDecimal.ZERO;
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
    public java.math.BigDecimal getRetailPrice() { return retailPrice; }
    public java.math.BigDecimal getWholesalePrice() { return wholesalePrice; }
    public java.math.BigDecimal getDistributorPrice() { return distributorPrice; }
}
