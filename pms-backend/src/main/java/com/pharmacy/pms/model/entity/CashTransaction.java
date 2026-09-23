package com.pharmacy.pms.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.pharmacy.pms.model.enums.CashTransactionType;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "cash_transactions", indexes = {
    @Index(name = "idx_cash_tx_shift", columnList = "shift_id"),
    @Index(name = "idx_cash_tx_type", columnList = "transaction_type")
})
public class CashTransaction extends BaseEntity {

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id", nullable = false)
    private CashShift shift;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 20)
    private CashTransactionType transactionType;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "category", nullable = false, length = 100)
    private String category; // e.g., PETTY_CASH, SUPPLIER_PAYMENT, CHANGE_DEPOSIT, OWNER_DRAW, MISC_EXPENSE

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "performed_by_id", nullable = false)
    private User performedBy;

    public CashTransaction() {
        // Default constructor for JPA
    }

    public CashShift getShift() { return shift; }
    public void setShift(CashShift shift) { this.shift = shift; }

    public CashTransactionType getTransactionType() { return transactionType; }
    public void setTransactionType(CashTransactionType transactionType) { this.transactionType = transactionType; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public User getPerformedBy() { return performedBy; }
    public void setPerformedBy(User performedBy) { this.performedBy = performedBy; }
}
