package com.skillbench.auth.dto;

import com.skillbench.auth.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private String headline;
    private String bio;
    private List<String> skills;

    private String avatarUrl;
    private String education;
    private String experience;
    private String portfolioUrl;
    private String linkedinUrl;
}