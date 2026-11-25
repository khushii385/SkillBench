package com.skillbench.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeveloperResponse {
    private Long id;
    private String name;
    private String headline;
    private String bio;
    private List<String> skills;

    // Naye fields:
    private String avatarUrl;
    private String education;
    private String experience;
    private String portfolioUrl;
    private String linkedinUrl;
}