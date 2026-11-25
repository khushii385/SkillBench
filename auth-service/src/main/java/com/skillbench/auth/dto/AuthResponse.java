package com.skillbench.auth.dto;

import com.skillbench.auth.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private Long userId;
    private String email;
    private String name;
    private Role role;
    private String avatarUrl;
    private String education;
    private String experience;
    private String portfolioUrl;
    private String linkedinUrl;
}