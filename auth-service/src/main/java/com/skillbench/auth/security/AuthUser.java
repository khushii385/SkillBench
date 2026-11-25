package com.skillbench.auth.security;

public record AuthUser(Long userId, String email, String role) {}