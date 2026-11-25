package com.skillbench.escrow.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Ab sirf projectId. Amount, client aur vendor backend khud project se nikalta hai. */
@Data
public class CreateEscrowRequest {

    @NotNull(message = "Project ID is required")
    private Long projectId;
}