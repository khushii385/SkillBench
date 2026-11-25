package com.skillbench.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class UpdateProfileRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @Size(max = 100, message = "Headline must be at most 100 characters")
    private String headline;

    @Size(max = 500, message = "Bio must be at most 500 characters")
    private String bio;

    @Size(max = 15, message = "You can add at most 15 skills")
    private List<@Size(max = 30, message = "Each skill must be at most 30 characters") String> skills;

    // --- Naye Fields ---
    private String avatarUrl;

    @Size(max = 150, message = "Education must be at most 150 characters")
    private String education;

    @Size(max = 150, message = "Experience must be at most 150 characters")
    private String experience;

    @Size(max = 255, message = "Portfolio URL must be at most 255 characters")
    private String portfolioUrl;

    @Size(max = 255, message = "LinkedIn URL must be at most 255 characters")
    private String linkedinUrl;
}