package com.pharmacy.pms.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.pharmacy.pms.model.enums.DosageForm;
import jakarta.persistence.*;

@Entity
@Table(name = "drugs")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Drug extends BaseEntity {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "generic_name", nullable = false, length = 150)
    private String genericName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "dosage_form", length = 50)
    private DosageForm dosageForm;

    @Column(name = "strength", length = 50)
    private String strength;

    @Column(name = "unit_of_measure", length = 30)
    private String unitOfMeasure; // BOX, STRIP, BOTTLE, VIAL

    @Column(name = "barcode", unique = true, length = 100)
    private String barcode;

    @Column(name = "reorder_threshold", nullable = false)
    private int reorderThreshold = 20;

    @Column(name = "is_prescription_required", nullable = false)
    private boolean isPrescriptionRequired = false;

    @Column(name = "status", length = 20)
    private String status = "ACTIVE";

    public Drug() {
        // Default constructor for JPA
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGenericName() { return genericName; }
    public void setGenericName(String genericName) { this.genericName = genericName; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

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

    public boolean isPrescriptionRequired() { return isPrescriptionRequired; }
    public void setPrescriptionRequired(boolean prescriptionRequired) { isPrescriptionRequired = prescriptionRequired; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
