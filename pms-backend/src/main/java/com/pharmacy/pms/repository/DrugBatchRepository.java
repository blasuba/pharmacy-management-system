package com.pharmacy.pms.repository;

import com.pharmacy.pms.model.entity.DrugBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DrugBatchRepository extends JpaRepository<DrugBatch, Long> {

    // Strict FEFO (First-Expiry-First-Out) active batches retrieval
    @Query("SELECT b FROM DrugBatch b WHERE b.drug.id = :drugId AND b.quantityOnHand > 0 AND b.expiryDate > :today ORDER BY b.expiryDate ASC")
    List<DrugBatch> findActiveBatchesByDrugFefo(@Param("drugId") Long drugId, @Param("today") LocalDate today);

    List<DrugBatch> findByDrugIdOrderByExpiryDateAsc(Long drugId);

    Optional<DrugBatch> findByDrugIdAndBatchNumber(Long drugId, String batchNumber);

    // Expiry alerts: batches expiring on or before a given date but not yet expired
    @Query("SELECT b FROM DrugBatch b WHERE b.expiryDate BETWEEN :startDate AND :endDate AND b.quantityOnHand > 0 ORDER BY b.expiryDate ASC")
    List<DrugBatch> findBatchesExpiringBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Already expired batches with remaining stock
    @Query("SELECT b FROM DrugBatch b WHERE b.expiryDate < :today AND b.quantityOnHand > 0")
    List<DrugBatch> findExpiredBatches(@Param("today") LocalDate today);

    // Aggregate total stock for a drug across all batches
    @Query("SELECT COALESCE(SUM(b.quantityOnHand), 0) FROM DrugBatch b WHERE b.drug.id = :drugId AND b.expiryDate > :today")
    int getTotalAvailableStockForDrug(@Param("drugId") Long drugId, @Param("today") LocalDate today);
}
