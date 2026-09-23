package com.pharmacy.pms.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.pharmacy.pms.model.enums.ShiftStatus;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cash_shifts", indexes = {
    @Index(name = "idx_shift_cashier", columnList = "cashier_id"),
    @Index(name = "idx_shift_status", columnList = "status")
})
public class CashShift extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cashier_id", nullable = false)
    private User cashier;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @Column(name = "shift_number", nullable = false, unique = true, length = 50)
    private String shiftNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ShiftStatus status = ShiftStatus.OPEN;

    @Column(name = "opened_at", nullable = false)
    private LocalDateTime openedAt = LocalDateTime.now();

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "opening_balance", nullable = false, precision = 12, scale = 2)
    private BigDecimal openingBalance = BigDecimal.ZERO;

    @Column(name = "cash_sales_total", precision = 12, scale = 2)
    private BigDecimal cashSalesTotal = BigDecimal.ZERO;

    @Column(name = "digital_sales_total", precision = 12, scale = 2)
    private BigDecimal digitalSalesTotal = BigDecimal.ZERO;

    @Column(name = "cash_in_total", precision = 12, scale = 2)
    private BigDecimal cashInTotal = BigDecimal.ZERO;

    @Column(name = "cash_out_total", precision = 12, scale = 2)
    private BigDecimal cashOutTotal = BigDecimal.ZERO;

    @Column(name = "closing_actual_cash", precision = 12, scale = 2)
    private BigDecimal closingActualCash;

    @Column(name = "expected_cash", precision = 12, scale = 2)
    private BigDecimal expectedCash;

    @Column(name = "discrepancy", precision = 12, scale = 2)
    private BigDecimal discrepancy;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "shift", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CashTransaction> transactions = new ArrayList<>();

    public CashShift() {
        // Default constructor for JPA
    }

    public User getCashier() { return cashier; }
    public void setCashier(User cashier) { this.cashier = cashier; }

    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }

    public String getShiftNumber() { return shiftNumber; }
    public void setShiftNumber(String shiftNumber) { this.shiftNumber = shiftNumber; }

    public ShiftStatus getStatus() { return status; }
    public void setStatus(ShiftStatus status) { this.status = status; }

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

    public BigDecimal getClosingActualCash() { return closingActualCash; }
    public void setClosingActualCash(BigDecimal closingActualCash) { this.closingActualCash = closingActualCash; }

    public BigDecimal getExpectedCash() { return expectedCash; }
    public void setExpectedCash(BigDecimal expectedCash) { this.expectedCash = expectedCash; }

    public BigDecimal getDiscrepancy() { return discrepancy; }
    public void setDiscrepancy(BigDecimal discrepancy) { this.discrepancy = discrepancy; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<CashTransaction> getTransactions() { return transactions; }
    public void setTransactions(List<CashTransaction> transactions) { this.transactions = transactions; }
}
