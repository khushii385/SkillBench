package com.skillbench.project.controller;

import com.skillbench.project.dto.ProjectRequest;
import com.skillbench.project.dto.ProjectResponse;
import com.skillbench.project.security.AuthUser;
import com.skillbench.project.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    /** CLIENT_ADMIN: naya project post kare */
    @PostMapping
    public ResponseEntity<ProjectResponse> create(@Valid @RequestBody ProjectRequest request,
                                                  @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.createProject(request, user));
    }

    /** Sab logged-in users: saare OPEN projects (marketplace) */
    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getOpenProjects() {
        return ResponseEntity.ok(projectService.getOpenProjects());
    }

    /** Client: apne projects. Vendor: jo projects usne accept kiye. */
    @GetMapping("/my-projects")
    public ResponseEntity<List<ProjectResponse>> getMyProjects(@AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(projectService.getMyProjects(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getById(@PathVariable Long id,
                                                   @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(projectService.getProjectById(id, user));
    }

    /** CLIENT_ADMIN (owner): sirf OPEN project edit */
    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody ProjectRequest request,
                                                  @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(projectService.updateProject(id, request, user));
    }

    /** CLIENT_ADMIN (owner): sirf OPEN project delete */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        projectService.deleteProject(id, user);
        return ResponseEntity.noContent().build();
    }

    /** VENDOR_DEVELOPER: project accept (OPEN -> IN_PROGRESS) */
    @PostMapping("/{id}/accept")
    public ResponseEntity<ProjectResponse> accept(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(projectService.acceptProject(id, user));
    }

    /** CLIENT_ADMIN (owner): kaam poora (IN_PROGRESS -> COMPLETED) */
    @PostMapping("/{id}/complete")
    public ResponseEntity<ProjectResponse> complete(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(projectService.completeProject(id, user));
    }
}