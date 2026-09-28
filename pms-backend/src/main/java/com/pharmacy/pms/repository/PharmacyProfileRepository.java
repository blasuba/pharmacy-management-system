package com.pharmacy.pms.repository;

import com.pharmacy.pms.model.entity.PharmacyProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PharmacyProfileRepository extends JpaRepository<PharmacyProfile, Long> {
    Optional<PharmacyProfile> findFirstByOrderByIdAsc();
}
