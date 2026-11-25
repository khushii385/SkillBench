package com.skillbench.escrow.controller;

import com.skillbench.escrow.dto.CreateEscrowRequest;
import com.skillbench.escrow.dto.EscrowResponse;
import com.skillbench.escrow.security.AuthUser;
import com.skillbench.escrow.service.EscrowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/escrows")
@RequiredArgsConstructor
public class EscrowController {

    private final EscrowService escrowService;

    /** CLIENT_ADMIN: escrow fund kare (body: {"projectId": 1}) */
    @PostMapping
    public ResponseEntity<EscrowResponse> createEscrow(@Valid @RequestBody CreateEscrowRequest request,
                                                       @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(escrowService.createEscrow(request, user));
    }

    /** Client: apni escrows. Vendor: usko milne wali escrows. */
    @GetMapping("/my")
    public ResponseEntity<List<EscrowResponse>> getMyEscrows(@AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(escrowService.getMyEscrows(user));
    }

    /** Sirf us project ka client ya vendor dekh sakta hai */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<EscrowResponse> getEscrowByProjectId(@PathVariable Long projectId,
                                                               @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(escrowService.getEscrowByProjectId(projectId, user));
    }

    /** CLIENT_ADMIN (owner): payment vendor ko release, project COMPLETED */
    @PutMapping("/project/{projectId}/release")
    public ResponseEntity<EscrowResponse> releasePayment(@PathVariable Long projectId,
                                                         @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(escrowService.releasePayment(projectId, user));
    }

    /** CLIENT_ADMIN (owner): paisa wapas */
    @PutMapping("/project/{projectId}/refund")
    public ResponseEntity<EscrowResponse> refundPayment(@PathVariable Long projectId,
                                                        @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(escrowService.refundPayment(projectId, user));
    }
}