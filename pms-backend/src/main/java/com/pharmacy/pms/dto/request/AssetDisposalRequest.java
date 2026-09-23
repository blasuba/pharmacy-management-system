package com.pharmacy.pms.dto.request;

import com.pharmacy.pms.model.enums.DisposalType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class AssetDisposalRequest {

    @NotNull(message = "Disposal date is required")
    private LocalDate disposalDate;

    @NotNull(message = "Disposal type is required")
    private DisposalType disposalType;

    @DecimalMin(value = "0.0", message = "Sale price cannot be negative")
    private BigDecimal salePrice = BigDecimal.ZERO;

    private String reason;

    public LocalDate getDisposalDate() { return disposalDate; }
    public void setDisposalDate(LocalDate disposalDate) { this.disposalDate = disposalDate; }

    public DisposalType getDisposalType() { return disposalType; }
    public void setDisposalType(DisposalType disposalType) { this.disposalType = disposalType; }

    public BigDecimal getSalePrice() { return salePrice; }
    public void setSalePrice(BigDecimal salePrice) { this.salePrice = salePrice; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
