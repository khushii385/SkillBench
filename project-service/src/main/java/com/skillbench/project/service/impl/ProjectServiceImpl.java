package com.skillbench.project.service.impl;

import com.skillbench.project.dto.ProjectRequest;
import com.skillbench.project.dto.ProjectResponse;
import com.skillbench.project.entity.Project;
import com.skillbench.project.entity.ProjectStatus;
import com.skillbench.project.entity.SubmissionStatus;
import com.skillbench.project.exception.ForbiddenException;
import com.skillbench.project.exception.InvalidStateException;
import com.skillbench.project.exception.ResourceNotFoundException;
import com.skillbench.project.repository.ProjectRepository;
import com.skillbench.project.repository.SubmissionRepository;
import com.skillbench.project.security.AuthUser;
import com.skillbench.project.service.ProjectService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final SubmissionRepository submissionRepository;

    public ProjectServiceImpl(ProjectRepository projectRepository, SubmissionRepository submissionRepository) {
        this.projectRepository = projectRepository;
        this.submissionRepository = submissionRepository;
    }

    @Override
    @Transactional
    public ProjectResponse createProject(ProjectRequest request, AuthUser user) {
        Project project = Project.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .budget(request.getBudget())
                .deadline(request.getDeadline())
                .clientId(user.userId())
                .status(ProjectStatus.OPEN)
                .build();
        return toResponse(projectRepository.save(project));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectResponse> getOpenProjects() {
        return projectRepository.findByStatusOrderByCreatedAtDesc(ProjectStatus.OPEN)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectResponse> getMyProjects(AuthUser user) {
        List<Project> projects = "CLIENT_ADMIN".equals(user.role())
                ? projectRepository.findByClientIdOrderByCreatedAtDesc(user.userId())
                : projectRepository.findByAssignedVendorIdOrderByCreatedAtDesc(user.userId());
        return projects.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long id, AuthUser user) {
        Project project = findProject(id);
        boolean isOpen = project.getStatus() == ProjectStatus.OPEN;
        boolean isOwner = project.getClientId().equals(user.userId());
        boolean isAssignedVendor = user.userId().equals(project.getAssignedVendorId());

        if (!isOpen && !isOwner && !isAssignedVendor) {
            throw new ForbiddenException("You cannot view this project");
        }
        return toResponse(project);
    }

    @Override
    @Transactional
    public ProjectResponse updateProject(Long id, ProjectRequest request, AuthUser user) {
        Project project = findProject(id);
        ensureOwner(project, user);
        ensureStatus(project, ProjectStatus.OPEN, "Only OPEN projects can be edited");

        project.setTitle(request.getTitle().trim());
        project.setDescription(request.getDescription().trim());
        project.setBudget(request.getBudget());
        project.setDeadline(request.getDeadline());
        return toResponse(projectRepository.save(project));
    }

    @Override
    @Transactional
    public void deleteProject(Long id, AuthUser user) {
        Project project = findProject(id);
        ensureOwner(project, user);
        ensureStatus(project, ProjectStatus.OPEN, "Only OPEN projects can be deleted");
        projectRepository.delete(project);
    }

    @Override
    @Transactional
    public ProjectResponse acceptProject(Long id, AuthUser user) {
        Project project = findProject(id);
        ensureStatus(project, ProjectStatus.OPEN, "This project is no longer open");

        project.setAssignedVendorId(user.userId());
        project.setStatus(ProjectStatus.IN_PROGRESS);
        return toResponse(projectRepository.save(project));
    }

    @Override
    @Transactional
    public ProjectResponse completeProject(Long id, AuthUser user) {
        Project project = findProject(id);
        ensureOwner(project, user);
        ensureStatus(project, ProjectStatus.IN_PROGRESS, "Only IN_PROGRESS projects can be completed");

        if (!submissionRepository.existsByProjectIdAndStatus(id, SubmissionStatus.APPROVED)) {
            throw new InvalidStateException("Approve the developer's submitted work before completing this project");
        }

        project.setStatus(ProjectStatus.COMPLETED);
        return toResponse(projectRepository.save(project));
    }

    private Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    private void ensureOwner(Project project, AuthUser user) {
        if (!project.getClientId().equals(user.userId())) {
            throw new ForbiddenException("You do not own this project");
        }
    }

    private void ensureStatus(Project project, ProjectStatus expected, String message) {
        if (project.getStatus() != expected) {
            throw new InvalidStateException(message);
        }
    }

    private ProjectResponse toResponse(Project p) {
        return ProjectResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .budget(p.getBudget())
                .deadline(p.getDeadline())
                .clientId(p.getClientId())
                .assignedVendorId(p.getAssignedVendorId())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}