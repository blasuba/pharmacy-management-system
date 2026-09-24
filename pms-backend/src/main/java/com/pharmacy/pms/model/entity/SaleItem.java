package com.pharmacy.pms.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "sale_items")
public class SaleItem extends BaseEntity {

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "drug_batch_id", nullable = false)
    private DrugBatch drugBatch;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "cost_price_at_sale", nullable = false, precision = 12, scale = 2)
    private BigDecimal costPriceAtSale;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "refunded_quantity", nullable = false)
    private int refundedQuantity = 0;

    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    public SaleItem() {
        // Default constructor for JPA
    }

    public Sale getSale() { return sale; }
    public void setSale(Sale sale) { this.sale = sale; }

    public DrugBatch getDrugBatch() { return drugBatch; }
    public void setDrugBatch(DrugBatch drugBatch) { this.drugBatch = drugBatch; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public int getRefundedQuantity() { return refundedQuantity; }
    public void setRefundedQuantity(int refundedQuantity) { this.refundedQuantity = refundedQuantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getCostPriceAtSale() { return costPriceAtSale; }
    public void setCostPriceAtSale(BigDecimal costPriceAtSale) { this.costPriceAtSale = costPriceAtSale; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
}
