package com.skillbench.auth.service;

import com.skillbench.auth.dto.AuthResponse;
import com.skillbench.auth.dto.LoginRequest;
import com.skillbench.auth.dto.RegisterRequest;
import com.skillbench.auth.entity.Role;
import com.skillbench.auth.entity.User;
import com.skillbench.auth.exception.EmailAlreadyExistsException;
import com.skillbench.auth.exception.InvalidCredentialsException;
import com.skillbench.auth.repository.UserRepository;
import com.skillbench.auth.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("Email already in use");
        }

        // Role ki validation DTO mein @Pattern se ho chuki hai, isliye valueOf safe hai
        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.valueOf(request.getRole()))
                .build();

        try {
            user = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            // Do requests ek saath aayin to DB ka unique constraint pakad lega
            throw new EmailAlreadyExistsException("Email already in use");
        }

        return buildResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        return buildResponse(user);
    }

    private AuthResponse buildResponse(User user) {
        String token = jwtProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .education(user.getEducation())
                .experience(user.getExperience())
                .portfolioUrl(user.getPortfolioUrl())
                .linkedinUrl(user.getLinkedinUrl())
                .build();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}