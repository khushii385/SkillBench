package com.skillbench.project.security;


public record AuthUser(Long userId, String email, String role) {}