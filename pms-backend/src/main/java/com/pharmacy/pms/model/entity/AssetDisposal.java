package com.pharmacy.pms.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.pharmacy.pms.model.enums.DisposalType;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "asset_disposals", indexes = {
    @Index(name = "idx_disposal_asset_id", columnList = "asset_id", unique = true),
    @Index(name = "idx_disposal_date", columnList = "disposal_date")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AssetDisposal extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false, unique = true)
    private FixedAsset fixedAsset;

    @Column(name = "disposal_date", nullable = false)
    private LocalDate disposalDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "disposal_type", nullable = false, length = 30)
    private DisposalType disposalType;

    @Column(name = "sale_price", precision = 12, scale = 2)
    private BigDecimal salePrice = BigDecimal.ZERO;

    @Column(name = "book_value_at_disposal", nullable = false, precision = 12, scale = 2)
    private BigDecimal bookValueAtDisposal = BigDecimal.ZERO;

    @Column(name = "gain_loss", nullable = false, precision = 12, scale = 2)
    private BigDecimal gainLoss = BigDecimal.ZERO; // Positive = Gain, Negative = Loss

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    public AssetDisposal() {}

    public AssetDisposal(FixedAsset fixedAsset, LocalDate disposalDate, DisposalType disposalType, BigDecimal salePrice, BigDecimal bookValueAtDisposal, BigDecimal gainLoss, String reason, User approvedBy) {
        this.fixedAsset = fixedAsset;
        this.disposalDate = disposalDate;
        this.disposalType = disposalType;
        this.salePrice = salePrice;
        this.bookValueAtDisposal = bookValueAtDisposal;
        this.gainLoss = gainLoss;
        this.reason = reason;
        this.approvedBy = approvedBy;
    }

    public FixedAsset getFixedAsset() { return fixedAsset; }
    public void setFixedAsset(FixedAsset fixedAsset) { this.fixedAsset = fixedAsset; }

    public LocalDate getDisposalDate() { return disposalDate; }
    public void setDisposalDate(LocalDate disposalDate) { this.disposalDate = disposalDate; }

    public DisposalType getDisposalType() { return disposalType; }
    public void setDisposalType(DisposalType disposalType) { this.disposalType = disposalType; }

    public BigDecimal getSalePrice() { return salePrice; }
    public void setSalePrice(BigDecimal salePrice) { this.salePrice = salePrice; }

    public BigDecimal getBookValueAtDisposal() { return bookValueAtDisposal; }
    public void setBookValueAtDisposal(BigDecimal bookValueAtDisposal) { this.bookValueAtDisposal = bookValueAtDisposal; }

    public BigDecimal getGainLoss() { return gainLoss; }
    public void setGainLoss(BigDecimal gainLoss) { this.gainLoss = gainLoss; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public User getApprovedBy() { return approvedBy; }
    public void setApprovedBy(User approvedBy) { this.approvedBy = approvedBy; }
}
