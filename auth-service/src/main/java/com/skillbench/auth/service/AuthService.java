package com.skillbench.auth.service;

import com.skillbench.auth.dto.AuthResponse;
import com.skillbench.auth.dto.LoginRequest;
import com.skillbench.auth.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}