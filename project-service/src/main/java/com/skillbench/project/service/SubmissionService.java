package com.skillbench.project.service;

import com.skillbench.project.dto.ReviewRequest;
import com.skillbench.project.dto.SubmissionRequest;
import com.skillbench.project.dto.SubmissionResponse;
import com.skillbench.project.entity.Project;
import com.skillbench.project.entity.ProjectStatus;
import com.skillbench.project.entity.Submission;
import com.skillbench.project.entity.SubmissionStatus;
import com.skillbench.project.exception.BadRequestException;
import com.skillbench.project.exception.ForbiddenException;
import com.skillbench.project.exception.InvalidStateException;
import com.skillbench.project.exception.ResourceNotFoundException;
import com.skillbench.project.repository.ProjectRepository;
import com.skillbench.project.repository.SubmissionRepository;
import com.skillbench.project.security.AuthUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final ProjectRepository projectRepository;

    public SubmissionService(SubmissionRepository submissionRepository, ProjectRepository projectRepository) {
        this.submissionRepository = submissionRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional
    public SubmissionResponse submit(Long projectId, SubmissionRequest request, AuthUser user) {
        Project project = findProject(projectId);

        if (!user.userId().equals(project.getAssignedVendorId())) {
            throw new ForbiddenException("You are not assigned to this project");
        }
        if (project.getStatus() != ProjectStatus.IN_PROGRESS) {
            throw new InvalidStateException("Work can only be submitted while the project is in progress");
        }
        if (submissionRepository.existsByProjectIdAndStatus(projectId, SubmissionStatus.SUBMITTED)) {
            throw new InvalidStateException("You already have a submission waiting for review");
        }
        if (submissionRepository.existsByProjectIdAndStatus(projectId, SubmissionStatus.APPROVED)) {
            throw new InvalidStateException("Your work was already approved. The client can now release the payment.");
        }

        String link = request.getRepoUrl() == null || request.getRepoUrl().isBlank() ? null : request.getRepoUrl().trim();
        Submission saved = submissionRepository.save(Submission.builder()
                .projectId(projectId)
                .vendorId(user.userId())
                .message(request.getMessage().trim())
                .repoUrl(link)
                .status(SubmissionStatus.SUBMITTED)
                .build());
        return toResponse(saved, project.getTitle());
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> forProject(Long projectId, AuthUser user) {
        Project project = findProject(projectId);
        boolean isOwner = project.getClientId().equals(user.userId());
        boolean isAssigned = user.userId().equals(project.getAssignedVendorId());
        if (!isOwner && !isAssigned) {
            throw new ForbiddenException("You cannot view submissions of this project");
        }
        return submissionRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(s -> toResponse(s, project.getTitle()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> mine(AuthUser user) {
        List<Submission> submissions;
        if ("CLIENT_ADMIN".equals(user.role())) {
            List<Long> projectIds = projectRepository.findByClientIdOrderByCreatedAtDesc(user.userId())
                    .stream().map(Project::getId).toList();
            submissions = projectIds.isEmpty()
                    ? List.of()
                    : submissionRepository.findByProjectIdInOrderByCreatedAtDesc(projectIds);
        } else {
            submissions = submissionRepository.findByVendorIdOrderByCreatedAtDesc(user.userId());
        }

        Map<Long, String> titles = projectRepository
                .findAllById(submissions.stream().map(Submission::getProjectId).distinct().toList())
                .stream().collect(Collectors.toMap(Project::getId, Project::getTitle, (a, b) -> a));

        return submissions.stream().map(s -> toResponse(s, titles.get(s.getProjectId()))).toList();
    }

    @Transactional
    public SubmissionResponse review(Long submissionId, ReviewRequest request, AuthUser user) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));
        Project project = findProject(submission.getProjectId());

        if (!project.getClientId().equals(user.userId())) {
            throw new ForbiddenException("You do not own this project");
        }
        if (submission.getStatus() != SubmissionStatus.SUBMITTED) {
            throw new InvalidStateException("This submission was already reviewed");
        }

        SubmissionStatus decision = SubmissionStatus.valueOf(request.getDecision());
        String feedback = request.getFeedback() == null || request.getFeedback().isBlank()
                ? null : request.getFeedback().trim();
        if (decision == SubmissionStatus.REJECTED && feedback == null) {
            throw new BadRequestException("Please tell the developer what needs to change");
        }

        submission.setStatus(decision);
        submission.setFeedback(feedback);
        submission.setReviewedAt(LocalDateTime.now());
        return toResponse(submissionRepository.save(submission), project.getTitle());
    }

    private Project findProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    private SubmissionResponse toResponse(Submission s, String projectTitle) {
        return SubmissionResponse.builder()
                .id(s.getId())
                .projectId(s.getProjectId())
                .projectTitle(projectTitle)
                .vendorId(s.getVendorId())
                .message(s.getMessage())
                .repoUrl(s.getRepoUrl())
                .status(s.getStatus())
                .feedback(s.getFeedback())
                .createdAt(s.getCreatedAt())
                .reviewedAt(s.getReviewedAt())
                .build();
    }
}