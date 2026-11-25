package com.skillbench.project.controller;

import com.skillbench.project.dto.ReviewRequest;
import com.skillbench.project.dto.SubmissionRequest;
import com.skillbench.project.dto.SubmissionResponse;
import com.skillbench.project.security.AuthUser;
import com.skillbench.project.service.SubmissionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @PostMapping("/{projectId}/submissions")
    public ResponseEntity<SubmissionResponse> submit(@PathVariable Long projectId,
                                                     @Valid @RequestBody SubmissionRequest request,
                                                     @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(submissionService.submit(projectId, request, user));
    }

    @GetMapping("/{projectId}/submissions")
    public ResponseEntity<List<SubmissionResponse>> forProject(@PathVariable Long projectId,
                                                               @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(submissionService.forProject(projectId, user));
    }

    @GetMapping("/submissions/my")
    public ResponseEntity<List<SubmissionResponse>> mine(@AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(submissionService.mine(user));
    }

    @PutMapping("/submissions/{submissionId}/review")
    public ResponseEntity<SubmissionResponse> review(@PathVariable Long submissionId,
                                                     @Valid @RequestBody ReviewRequest request,
                                                     @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(submissionService.review(submissionId, request, user));
    }
}