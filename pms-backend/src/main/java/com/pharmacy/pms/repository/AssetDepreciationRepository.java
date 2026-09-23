package com.pharmacy.pms.repository;

import com.pharmacy.pms.model.entity.AssetDepreciation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssetDepreciationRepository extends JpaRepository<AssetDepreciation, Long> {

    List<AssetDepreciation> findByFixedAssetIdOrderByFiscalYearAsc(Long assetId);

    Optional<AssetDepreciation> findByFixedAssetIdAndFiscalYear(Long assetId, int fiscalYear);

    List<AssetDepreciation> findByFiscalYear(int fiscalYear);

    @Query("SELECT COALESCE(SUM(d.depreciationAmount), 0) FROM AssetDepreciation d WHERE d.fiscalYear = :fiscalYear")
    BigDecimal getTotalDepreciationForFiscalYear(@Param("fiscalYear") int fiscalYear);

    boolean existsByFixedAssetIdAndFiscalYearAndIsLockedTrue(Long assetId, int fiscalYear);
}
