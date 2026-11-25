package com.skillbench.auth.controller;

import com.skillbench.auth.dto.ChangePasswordRequest;
import com.skillbench.auth.dto.DeveloperResponse;
import com.skillbench.auth.dto.ProfileResponse;
import com.skillbench.auth.dto.UpdateProfileRequest;
import com.skillbench.auth.security.AuthUser;
import com.skillbench.auth.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> me(@AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(profileService.getMe(user));
    }

    @PutMapping("/me")
    public ResponseEntity<ProfileResponse> update(@Valid @RequestBody UpdateProfileRequest request,
                                                  @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(profileService.updateMe(user, request));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                               @AuthenticationPrincipal AuthUser user) {
        profileService.changePassword(user, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/developers")
    public ResponseEntity<List<DeveloperResponse>> developers() {
        return ResponseEntity.ok(profileService.developers());
    }
}