package com.pharmacy.pms.repository;

import com.pharmacy.pms.model.entity.CashTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CashTransactionRepository extends JpaRepository<CashTransaction, Long> {

    List<CashTransaction> findByShiftIdOrderByCreatedAtDesc(Long shiftId);
}
