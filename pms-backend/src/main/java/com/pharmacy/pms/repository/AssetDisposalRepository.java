package com.pharmacy.pms.repository;

import com.pharmacy.pms.model.entity.AssetDisposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetDisposalRepository extends JpaRepository<AssetDisposal, Long> {

    Optional<AssetDisposal> findByFixedAssetId(Long assetId);

    List<AssetDisposal> findAllByOrderByDisposalDateDesc();
}
