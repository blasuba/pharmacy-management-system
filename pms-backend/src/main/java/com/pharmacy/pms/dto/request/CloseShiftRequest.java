package com.pharmacy.pms.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class CloseShiftRequest {

    @NotNull(message = "Closing actual cash is required")
    @DecimalMin(value = "0.00", message = "Closing actual cash must be non-negative")
    private BigDecimal closingActualCash;

    private String notes;

    public BigDecimal getClosingActualCash() { return closingActualCash; }
    public void setClosingActualCash(BigDecimal closingActualCash) { this.closingActualCash = closingActualCash; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
