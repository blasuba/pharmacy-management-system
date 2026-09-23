package com.pharmacy.pms.dto.request;

import jakarta.validation.constraints.NotNull;

public class DepreciationRunRequest {

    @NotNull(message = "Fiscal year is required")
    private Integer fiscalYear;

    private boolean overwriteExisting = false;

    public Integer getFiscalYear() { return fiscalYear; }
    public void setFiscalYear(Integer fiscalYear) { this.fiscalYear = fiscalYear; }

    public boolean isOverwriteExisting() { return overwriteExisting; }
    public void setOverwriteExisting(boolean overwriteExisting) { this.overwriteExisting = overwriteExisting; }
}
