package com.pharmacy.pms.dto.response;

import com.pharmacy.pms.model.entity.Sale;
import com.pharmacy.pms.model.entity.SaleItem;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PosReceiptResponse {
    private Long saleId;
    private String invoiceNumber;
    private LocalDateTime createdAt;
    private String cashierName;
    private String customerName;
    private String saleType;
    private String paymentMethod;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal grandTotal;
    private BigDecimal paidAmount;
    private BigDecimal changeAmount;
    private String prescriptionNumber;
    private List<ItemReceiptDto> items = new ArrayList<>();

    public static class ItemReceiptDto {
        private String drugName;
        private String genericName;
        private String batchNumber;
        private String expiryDate;
        private int quantity;
        private BigDecimal unitPrice;
        private BigDecimal discount;
        private BigDecimal subtotal;

        public ItemReceiptDto(SaleItem item) {
            if (item.getDrugBatch() != null && item.getDrugBatch().getDrug() != null) {
                this.drugName = item.getDrugBatch().getDrug().getName();
                this.genericName = item.getDrugBatch().getDrug().getGenericName();
                this.batchNumber = item.getDrugBatch().getBatchNumber();
                this.expiryDate = item.getDrugBatch().getExpiryDate() != null ? item.getDrugBatch().getExpiryDate().toString() : "";
            }
            this.quantity = item.getQuantity();
            this.unitPrice = item.getUnitPrice();
            this.discount = item.getDiscountAmount();
            this.subtotal = item.getSubtotal();
        }

        public String getDrugName() { return drugName; }
        public String getGenericName() { return genericName; }
        public String getBatchNumber() { return batchNumber; }
        public String getExpiryDate() { return expiryDate; }
        public int getQuantity() { return quantity; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public BigDecimal getDiscount() { return discount; }
        public BigDecimal getSubtotal() { return subtotal; }
    }

    public PosReceiptResponse() {}

    public PosReceiptResponse(Sale sale) {
        this.saleId = sale.getId();
        this.invoiceNumber = sale.getInvoiceNumber();
        this.createdAt = sale.getCreatedAt();
        if (sale.getCashier() != null) {
            this.cashierName = sale.getCashier().getFullName();
        }
        if (sale.getCustomer() != null) {
            this.customerName = sale.getCustomer().getName();
        } else {
            this.customerName = "Walk-in Retail Customer";
        }
        this.saleType = sale.getSaleType().name();
        this.paymentMethod = sale.getPaymentMethod().name();
        this.subtotal = sale.getSubtotal();
        this.discountAmount = sale.getDiscountAmount();
        this.taxAmount = sale.getTaxAmount();
        this.grandTotal = sale.getGrandTotal();
        this.paidAmount = sale.getPaidAmount();
        this.changeAmount = sale.getChangeAmount();
        this.prescriptionNumber = sale.getPrescriptionNumber();

        if (sale.getItems() != null) {
            for (SaleItem item : sale.getItems()) {
                this.items.add(new ItemReceiptDto(item));
            }
        }
    }

    public Long getSaleId() { return saleId; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getCashierName() { return cashierName; }
    public String getCustomerName() { return customerName; }
    public String getSaleType() { return saleType; }
    public String getPaymentMethod() { return paymentMethod; }
    public BigDecimal getSubtotal() { return subtotal; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public BigDecimal getGrandTotal() { return grandTotal; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public BigDecimal getChangeAmount() { return changeAmount; }
    public String getPrescriptionNumber() { return prescriptionNumber; }
    public List<ItemReceiptDto> getItems() { return items; }
}
