package com.pharmacy.pms.dto.request;

import com.pharmacy.pms.model.enums.CustomerType;
import com.pharmacy.pms.model.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class PosCheckoutRequest {
    private Long customerId;
    private CustomerType saleType = CustomerType.RETAIL;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    @NotNull(message = "Paid amount is required")
    private BigDecimal paidAmount;

    private BigDecimal overallDiscount = BigDecimal.ZERO;
    private String prescriptionNumber;
    private String doctorName;

    @NotEmpty(message = "Cart cannot be empty")
    @Valid
    private List<PosCartItemRequest> items;

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public CustomerType getSaleType() { return saleType; }
    public void setSaleType(CustomerType saleType) { this.saleType = saleType; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }

    public BigDecimal getOverallDiscount() { return overallDiscount; }
    public void setOverallDiscount(BigDecimal overallDiscount) { this.overallDiscount = overallDiscount; }

    public String getPrescriptionNumber() { return prescriptionNumber; }
    public void setPrescriptionNumber(String prescriptionNumber) { this.prescriptionNumber = prescriptionNumber; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public List<PosCartItemRequest> getItems() { return items; }
    public void setItems(List<PosCartItemRequest> items) { this.items = items; }
}
