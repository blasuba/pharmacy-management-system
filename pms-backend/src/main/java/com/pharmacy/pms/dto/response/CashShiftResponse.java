package com.pharmacy.pms.dto.response;

import com.pharmacy.pms.model.entity.CashShift;
import com.pharmacy.pms.model.enums.ShiftStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CashShiftResponse {

    private Long id;
    private String shiftNumber;
    private ShiftStatus status;
    private Long cashierId;
    private String cashierName;
    private String branchName;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private BigDecimal openingBalance;
    private BigDecimal cashSalesTotal;
    private BigDecimal digitalSalesTotal;
    private BigDecimal cashInTotal;
    private BigDecimal cashOutTotal;
    private BigDecimal expectedCash;
    private BigDecimal closingActualCash;
    private BigDecimal discrepancy;
    private String notes;

    public CashShiftResponse() {
        // Default constructor
    }

    public CashShiftResponse(CashShift shift) {
        if (shift != null) {
            this.id = shift.getId();
            this.shiftNumber = shift.getShiftNumber();
            this.status = shift.getStatus();
            if (shift.getCashier() != null) {
                this.cashierId = shift.getCashier().getId();
                this.cashierName = shift.getCashier().getFullName();
            }
            if (shift.getBranch() != null) {
                this.branchName = shift.getBranch().getName();
            }
            this.openedAt = shift.getOpenedAt();
            this.closedAt = shift.getClosedAt();
            this.openingBalance = shift.getOpeningBalance();
            this.cashSalesTotal = shift.getCashSalesTotal();
            this.digitalSalesTotal = shift.getDigitalSalesTotal();
            this.cashInTotal = shift.getCashInTotal();
            this.cashOutTotal = shift.getCashOutTotal();
            this.expectedCash = shift.getExpectedCash();
            this.closingActualCash = shift.getClosingActualCash();
            this.discrepancy = shift.getDiscrepancy();
            this.notes = shift.getNotes();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getShiftNumber() { return shiftNumber; }
    public void setShiftNumber(String shiftNumber) { this.shiftNumber = shiftNumber; }

    public ShiftStatus getStatus() { return status; }
    public void setStatus(ShiftStatus status) { this.status = status; }

    public Long getCashierId() { return cashierId; }
    public void setCashierId(Long cashierId) { this.cashierId = cashierId; }

    public String getCashierName() { return cashierName; }
    public void setCashierName(String cashierName) { this.cashierName = cashierName; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public LocalDateTime getOpenedAt() { return openedAt; }
    public void setOpenedAt(LocalDateTime openedAt) { this.openedAt = openedAt; }

    public LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }

    public BigDecimal getOpeningBalance() { return openingBalance; }
    public void setOpeningBalance(BigDecimal openingBalance) { this.openingBalance = openingBalance; }

    public BigDecimal getCashSalesTotal() { return cashSalesTotal; }
    public void setCashSalesTotal(BigDecimal cashSalesTotal) { this.cashSalesTotal = cashSalesTotal; }

    public BigDecimal getDigitalSalesTotal() { return digitalSalesTotal; }
    public void setDigitalSalesTotal(BigDecimal digitalSalesTotal) { this.digitalSalesTotal = digitalSalesTotal; }

    public BigDecimal getCashInTotal() { return cashInTotal; }
    public void setCashInTotal(BigDecimal cashInTotal) { this.cashInTotal = cashInTotal; }

    public BigDecimal getCashOutTotal() { return cashOutTotal; }
    public void setCashOutTotal(BigDecimal cashOutTotal) { this.cashOutTotal = cashOutTotal; }

    public BigDecimal getExpectedCash() { return expectedCash; }
    public void setExpectedCash(BigDecimal expectedCash) { this.expectedCash = expectedCash; }

    public BigDecimal getClosingActualCash() { return closingActualCash; }
    public void setClosingActualCash(BigDecimal closingActualCash) { this.closingActualCash = closingActualCash; }

    public BigDecimal getDiscrepancy() { return discrepancy; }
    public void setDiscrepancy(BigDecimal discrepancy) { this.discrepancy = discrepancy; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
