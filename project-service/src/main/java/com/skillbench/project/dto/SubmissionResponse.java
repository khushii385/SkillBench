package com.skillbench.project.dto;

import com.skillbench.project.entity.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionResponse {
    private Long id;
    private Long projectId;
    private String projectTitle;
    private Long vendorId;
    private String message;
    private String repoUrl;
    private SubmissionStatus status;
    private String feedback;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
}