package com.skillbench.escrow.dto;

import com.skillbench.escrow.entity.EscrowStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EscrowResponse {

    private Long id;
    private Long projectId;
    private Long clientId;
    private Long vendorId;
    private BigDecimal amount;
    private EscrowStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}