package com.skillbench.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SubmissionRequest {

    @NotBlank(message = "Please describe the work you are submitting")
    @Size(max = 2000, message = "Message must be at most 2000 characters")
    private String message;

    @Size(max = 500, message = "Link must be at most 500 characters")
    @Pattern(regexp = "^$|^https?://\\S+$", message = "Link must start with http:// or https://")
    private String repoUrl;
}