package com.pharmacy.pms.repository;

import com.pharmacy.pms.model.entity.CashShift;
import com.pharmacy.pms.model.enums.ShiftStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CashShiftRepository extends JpaRepository<CashShift, Long> {

    Optional<CashShift> findByCashierIdAndStatus(Long cashierId, ShiftStatus status);

    List<CashShift> findByOrderByOpenedAtDesc();

    @Query("SELECT s FROM CashShift s WHERE s.status = 'OPEN' ORDER BY s.openedAt DESC")
    List<CashShift> findAllActiveShifts();

    @Query("SELECT s FROM CashShift s WHERE s.cashier.id = :cashierId ORDER BY s.openedAt DESC")
    List<CashShift> findShiftsByCashier(@Param("cashierId") Long cashierId);
}
