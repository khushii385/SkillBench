package com.skillbench.project.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must be at most 150 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description must be at most 2000 characters")
    private String description;

    @NotNull(message = "Budget is required")
    @DecimalMin(value = "1.00", message = "Budget must be at least 1")
    @Digits(integer = 10, fraction = 2, message = "Budget can have at most 2 decimal places")
    private BigDecimal budget;

    @FutureOrPresent(message = "Deadline cannot be in the past")
    private LocalDate deadline;   // optional, format: "2026-12-31"
}