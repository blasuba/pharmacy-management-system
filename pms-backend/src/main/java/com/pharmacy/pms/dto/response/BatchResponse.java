package com.pharmacy.pms.dto.response;

import com.pharmacy.pms.model.entity.DrugBatch;
import java.math.BigDecimal;
import java.time.LocalDate;

public class BatchResponse {
    private Long id;
    private Long drugId;
    private String drugName;
    private String genericName;
    private String batchNumber;
    private LocalDate expiryDate;
    private LocalDate manufacturingDate;
    private int quantityOnHand;
    private BigDecimal buyingPrice;
    private BigDecimal retailPrice;
    private BigDecimal wholesalePrice;
    private BigDecimal distributorPrice;
    private boolean expired;
    private boolean expiringSoon;

    public BatchResponse() {}

    public BatchResponse(DrugBatch batch) {
        this.id = batch.getId();
        if (batch.getDrug() != null) {
            this.drugId = batch.getDrug().getId();
            this.drugName = batch.getDrug().getName();
            this.genericName = batch.getDrug().getGenericName();
        }
        this.batchNumber = batch.getBatchNumber();
        this.expiryDate = batch.getExpiryDate();
        this.manufacturingDate = batch.getManufacturingDate();
        this.quantityOnHand = batch.getQuantityOnHand();
        this.buyingPrice = batch.getBuyingPrice();
        this.retailPrice = batch.getRetailPrice();
        this.wholesalePrice = batch.getWholesalePrice();
        this.distributorPrice = batch.getDistributorPrice();
        this.expired = batch.isExpired();
        this.expiringSoon = batch.isExpiringSoon(90);
    }

    public Long getId() { return id; }
    public Long getDrugId() { return drugId; }
    public String getDrugName() { return drugName; }
    public String getGenericName() { return genericName; }
    public String getBatchNumber() { return batchNumber; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public LocalDate getManufacturingDate() { return manufacturingDate; }
    public int getQuantityOnHand() { return quantityOnHand; }
    public BigDecimal getBuyingPrice() { return buyingPrice; }
    public BigDecimal getRetailPrice() { return retailPrice; }
    public BigDecimal getWholesalePrice() { return wholesalePrice; }
    public BigDecimal getDistributorPrice() { return distributorPrice; }
    public boolean isExpired() { return expired; }
    public boolean isExpiringSoon() { return expiringSoon; }
}
