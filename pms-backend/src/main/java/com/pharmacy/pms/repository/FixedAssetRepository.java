package com.pharmacy.pms.repository;

import com.pharmacy.pms.model.entity.FixedAsset;
import com.pharmacy.pms.model.enums.AssetCategory;
import com.pharmacy.pms.model.enums.AssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FixedAssetRepository extends JpaRepository<FixedAsset, Long>, JpaSpecificationExecutor<FixedAsset> {

    Optional<FixedAsset> findByAssetCode(String assetCode);

    boolean existsByAssetCode(String assetCode);

    List<FixedAsset> findByCategory(AssetCategory category);

    List<FixedAsset> findByStatus(AssetStatus status);

    List<FixedAsset> findByAssignedToId(Long userId);

    List<FixedAsset> findAllByOrderByCreatedAtDesc();

    // Auto-code counter query
    long countByCategory(AssetCategory category);

    // Warranty expiring in next X days
    @Query("SELECT f FROM FixedAsset f WHERE f.warrantyExpiry BETWEEN :today AND :expiryThreshold AND f.status = 'ACTIVE'")
    List<FixedAsset> findAssetsWithWarrantyExpiringBetween(@Param("today") LocalDate today, @Param("expiryThreshold") LocalDate expiryThreshold);

    // Active assets for depreciation run
    @Query("SELECT f FROM FixedAsset f WHERE f.status = 'ACTIVE' OR f.status = 'UNDER_MAINTENANCE'")
    List<FixedAsset> findActiveAssetsForDepreciation();
}
