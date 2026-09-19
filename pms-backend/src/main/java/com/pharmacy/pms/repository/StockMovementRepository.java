package com.pharmacy.pms.repository;

import com.pharmacy.pms.model.entity.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    Page<StockMovement> findByDrugBatchId(Long drugBatchId, Pageable pageable);
    List<StockMovement> findTop50ByOrderByCreatedAtDesc();
}
