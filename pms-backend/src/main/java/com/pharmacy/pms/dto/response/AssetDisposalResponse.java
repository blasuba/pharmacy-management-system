package com.pharmacy.pms.dto.response;

import com.pharmacy.pms.model.entity.AssetDisposal;
import com.pharmacy.pms.model.enums.DisposalType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class AssetDisposalResponse {
    private Long id;
    private Long assetId;
    private String assetCode;
    private String assetName;
    private LocalDate disposalDate;
    private DisposalType disposalType;
    private BigDecimal salePrice;
    private BigDecimal bookValueAtDisposal;
    private BigDecimal gainLoss;
    private String reason;
    private String approvedByUsername;
    private LocalDateTime createdAt;

    public AssetDisposalResponse() {}

    public AssetDisposalResponse(AssetDisposal d) {
        if (d == null) return;
        this.id = d.getId();
        if (d.getFixedAsset() != null) {
            this.assetId = d.getFixedAsset().getId();
            this.assetCode = d.getFixedAsset().getAssetCode();
            this.assetName = d.getFixedAsset().getName();
        }
        this.disposalDate = d.getDisposalDate();
        this.disposalType = d.getDisposalType();
        this.salePrice = d.getSalePrice();
        this.bookValueAtDisposal = d.getBookValueAtDisposal();
        this.gainLoss = d.getGainLoss();
        this.reason = d.getReason();
        if (d.getApprovedBy() != null) {
            this.approvedByUsername = d.getApprovedBy().getUsername();
        }
        this.createdAt = d.getCreatedAt();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAssetId() { return assetId; }
    public void setAssetId(Long assetId) { this.assetId = assetId; }

    public String getAssetCode() { return assetCode; }
    public void setAssetCode(String assetCode) { this.assetCode = assetCode; }

    public String getAssetName() { return assetName; }
    public void setAssetName(String assetName) { this.assetName = assetName; }

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

    public String getApprovedByUsername() { return approvedByUsername; }
    public void setApprovedByUsername(String approvedByUsername) { this.approvedByUsername = approvedByUsername; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
