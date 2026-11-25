package com.skillbench.escrow.security;

/** Token se nikla hua logged-in user. `token` isliye hai ki project-service ko call karte waqt forward kar sakein. */
public record AuthUser(Long userId, String email, String role, String token) {}