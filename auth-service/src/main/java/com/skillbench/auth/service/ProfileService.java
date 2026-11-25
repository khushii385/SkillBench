package com.skillbench.auth.service;

import com.skillbench.auth.dto.ChangePasswordRequest;
import com.skillbench.auth.dto.DeveloperResponse;
import com.skillbench.auth.dto.ProfileResponse;
import com.skillbench.auth.dto.UpdateProfileRequest;
import com.skillbench.auth.entity.Role;
import com.skillbench.auth.entity.User;
import com.skillbench.auth.exception.BadRequestException;
import com.skillbench.auth.exception.ResourceNotFoundException;
import com.skillbench.auth.repository.UserRepository;
import com.skillbench.auth.security.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public ProfileResponse getMe(AuthUser auth) {
        return toProfile(findUser(auth));
    }

    @Transactional
    public ProfileResponse updateMe(AuthUser auth, UpdateProfileRequest request) {
        User user = findUser(auth);
        user.setName(request.getName().trim());
        user.setHeadline(blankToNull(request.getHeadline()));
        user.setBio(blankToNull(request.getBio()));
        user.setSkills(joinSkills(request.getSkills()));

        // --- Naye fields save ho rahe hain yahan ---
        user.setAvatarUrl(blankToNull(request.getAvatarUrl()));
        user.setEducation(blankToNull(request.getEducation()));
        user.setExperience(blankToNull(request.getExperience()));
        user.setPortfolioUrl(blankToNull(request.getPortfolioUrl()));
        user.setLinkedinUrl(blankToNull(request.getLinkedinUrl()));

        return toProfile(userRepository.save(user));
    }

    @Transactional
    public void changePassword(AuthUser auth, ChangePasswordRequest request) {
        User user = findUser(auth);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("New password must be different from the current one");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<DeveloperResponse> developers() {
        return userRepository.findByRoleOrderByNameAsc(Role.VENDOR_DEVELOPER).stream()
                .map(u -> DeveloperResponse.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .headline(u.getHeadline())
                        .bio(u.getBio())
                        .skills(splitSkills(u.getSkills()))
                        .avatarUrl(u.getAvatarUrl())
                        .education(u.getEducation())
                        .experience(u.getExperience())
                        .portfolioUrl(u.getPortfolioUrl())
                        .linkedinUrl(u.getLinkedinUrl())
                        .build())
                .toList();
    }

    private User findUser(AuthUser auth) {
        return userRepository.findById(auth.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private ProfileResponse toProfile(User u) {
        return ProfileResponse.builder()
                .userId(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .role(u.getRole())
                .headline(u.getHeadline())
                .bio(u.getBio())
                .skills(splitSkills(u.getSkills()))
                .avatarUrl(u.getAvatarUrl())
                .education(u.getEducation())
                .experience(u.getExperience())
                .portfolioUrl(u.getPortfolioUrl())
                .linkedinUrl(u.getLinkedinUrl())
                .build();
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private String joinSkills(List<String> skills) {
        if (skills == null) return null;
        Map<String, String> unique = new LinkedHashMap<>();
        for (String raw : skills) {
            if (raw == null) continue;
            String skill = raw.replace(",", " ").trim().replaceAll("\\s+", " ");
            if (!skill.isEmpty()) unique.putIfAbsent(skill.toLowerCase(), skill);
        }
        return unique.isEmpty() ? null : String.join(",", unique.values());
    }

    private List<String> splitSkills(String stored) {
        List<String> result = new ArrayList<>();
        if (stored == null || stored.isBlank()) return result;
        for (String s : stored.split(",")) {
            if (!s.isBlank()) result.add(s.trim());
        }
        return result;
    }
}