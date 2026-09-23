package com.pharmacy.pms.repository;

import com.pharmacy.pms.model.entity.AssetMaintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AssetMaintenanceRepository extends JpaRepository<AssetMaintenance, Long> {

    List<AssetMaintenance> findByFixedAssetIdOrderByMaintenanceDateDesc(Long assetId);

    List<AssetMaintenance> findTop20ByOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(m.cost), 0) FROM AssetMaintenance m WHERE m.fixedAsset.id = :assetId")
    BigDecimal getTotalMaintenanceCostByAssetId(@Param("assetId") Long assetId);

    @Query("SELECT m FROM AssetMaintenance m WHERE m.nextMaintenanceDate BETWEEN :startDate AND :endDate")
    List<AssetMaintenance> findMaintenanceDueBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
