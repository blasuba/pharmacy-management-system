package com.pharmacy.pms.repository;

import com.pharmacy.pms.model.entity.TaxConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TaxConfigRepository extends JpaRepository<TaxConfig, Long> {
    Optional<TaxConfig> findFirstByOrderByIdAsc();
}
