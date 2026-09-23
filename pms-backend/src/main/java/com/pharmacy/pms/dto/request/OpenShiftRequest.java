package com.pharmacy.pms.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class OpenShiftRequest {

    @NotNull(message = "Opening balance is required")
    @DecimalMin(value = "0.00", message = "Opening balance must be non-negative")
    private BigDecimal openingBalance;

    private String notes;

    public BigDecimal getOpeningBalance() { return openingBalance; }
    public void setOpeningBalance(BigDecimal openingBalance) { this.openingBalance = openingBalance; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
