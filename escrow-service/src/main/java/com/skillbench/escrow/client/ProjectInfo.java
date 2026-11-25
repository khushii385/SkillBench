package com.skillbench.escrow.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

/** project-service ke response ka sirf wo hissa jo escrow ko chahiye */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ProjectInfo(
        Long id,
        String title,
        BigDecimal budget,
        Long clientId,
        Long assignedVendorId,
        String status
) {}