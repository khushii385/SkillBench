package com.skillbench.escrow.repository;

import com.skillbench.escrow.entity.EscrowAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EscrowRepository extends JpaRepository<EscrowAccount, Long> {
    Optional<EscrowAccount> findByProjectId(Long projectId);
    boolean existsByProjectId(Long projectId);
    List<EscrowAccount> findByClientIdOrderByCreatedAtDesc(Long clientId);
    List<EscrowAccount> findByVendorIdOrderByCreatedAtDesc(Long vendorId);
}