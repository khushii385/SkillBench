package com.skillbench.escrow.service;

import com.skillbench.escrow.client.ProjectClient;
import com.skillbench.escrow.client.ProjectInfo;
import com.skillbench.escrow.dto.CreateEscrowRequest;
import com.skillbench.escrow.dto.EscrowResponse;
import com.skillbench.escrow.entity.EscrowAccount;
import com.skillbench.escrow.entity.EscrowStatus;
import com.skillbench.escrow.exception.ForbiddenException;
import com.skillbench.escrow.exception.InvalidStateException;
import com.skillbench.escrow.exception.ResourceNotFoundException;
import com.skillbench.escrow.repository.EscrowRepository;
import com.skillbench.escrow.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EscrowService {

    private final EscrowRepository escrowRepository;
    private final ProjectClient projectClient;

    @Transactional
    public EscrowResponse createEscrow(CreateEscrowRequest request, AuthUser user) {
        ProjectInfo project = projectClient.getProject(request.getProjectId(), user.token());

        if (!user.userId().equals(project.clientId())) {
            throw new ForbiddenException("You do not own this project");
        }
        if (!"IN_PROGRESS".equals(project.status()) || project.assignedVendorId() == null) {
            throw new InvalidStateException("Escrow can be created only after a vendor has accepted the project");
        }
        if (escrowRepository.existsByProjectId(project.id())) {
            throw new InvalidStateException("Escrow already exists for this project");
        }

        EscrowAccount account = EscrowAccount.builder()
                .projectId(project.id())
                .clientId(project.clientId())
                .vendorId(project.assignedVendorId())
                .amount(project.budget())
                .status(EscrowStatus.HELD)
                .build();

        try {
            return mapToResponse(escrowRepository.saveAndFlush(account));
        } catch (DataIntegrityViolationException e) {
            throw new InvalidStateException("Escrow already exists for this project");
        }
    }

    @Transactional(readOnly = true)
    public EscrowResponse getEscrowByProjectId(Long projectId, AuthUser user) {
        EscrowAccount account = findByProject(projectId);
        if (!isParticipant(account, user)) {
            throw new ForbiddenException("You cannot view this escrow");
        }
        return mapToResponse(account);
    }

    @Transactional(readOnly = true)
    public List<EscrowResponse> getMyEscrows(AuthUser user) {
        List<EscrowAccount> list = "CLIENT_ADMIN".equals(user.role())
                ? escrowRepository.findByClientIdOrderByCreatedAtDesc(user.userId())
                : escrowRepository.findByVendorIdOrderByCreatedAtDesc(user.userId());
        return list.stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public EscrowResponse releasePayment(Long projectId, AuthUser user) {
        EscrowAccount account = findByProject(projectId);
        ensureClientOwner(account, user);
        ensureHeld(account, "release");

        ProjectInfo project = projectClient.getProject(projectId, user.token());
        if (!"COMPLETED".equals(project.status())) {
            projectClient.completeProject(projectId, user.token());
        }

        account.setStatus(EscrowStatus.RELEASED);
        return mapToResponse(escrowRepository.save(account));
    }

    @Transactional
    public EscrowResponse refundPayment(Long projectId, AuthUser user) {
        EscrowAccount account = findByProject(projectId);
        ensureClientOwner(account, user);
        ensureHeld(account, "refund");

        account.setStatus(EscrowStatus.REFUNDED);
        return mapToResponse(escrowRepository.save(account));
    }

    private EscrowAccount findByProject(Long projectId) {
        return escrowRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Escrow account not found for project ID: " + projectId));
    }

    private boolean isParticipant(EscrowAccount account, AuthUser user) {
        return account.getClientId().equals(user.userId()) || account.getVendorId().equals(user.userId());
    }

    private void ensureClientOwner(EscrowAccount account, AuthUser user) {
        if (!account.getClientId().equals(user.userId())) {
            throw new ForbiddenException("Only the client who funded this escrow can do this");
        }
    }

    private void ensureHeld(EscrowAccount account, String action) {
        if (account.getStatus() != EscrowStatus.HELD) {
            throw new InvalidStateException("Cannot " + action + " payment. Current status: " + account.getStatus());
        }
    }

    private EscrowResponse mapToResponse(EscrowAccount account) {
        return EscrowResponse.builder()
                .id(account.getId())
                .projectId(account.getProjectId())
                .clientId(account.getClientId())
                .vendorId(account.getVendorId())
                .amount(account.getAmount())
                .status(account.getStatus())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }
}