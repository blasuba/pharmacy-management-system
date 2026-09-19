package com.pharmacy.pms.repository;

import com.pharmacy.pms.model.entity.Drug;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DrugRepository extends JpaRepository<Drug, Long> {
    Optional<Drug> findByBarcode(String barcode);

    @Query("SELECT d FROM Drug d WHERE " +
           "LOWER(d.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.genericName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.barcode) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Drug> searchDrugs(@Param("query") String query, Pageable pageable);
}
