package com.skillbench.project.service;

import com.skillbench.project.dto.ProjectRequest;
import com.skillbench.project.dto.ProjectResponse;
import com.skillbench.project.security.AuthUser;

import java.util.List;

public interface ProjectService {
    ProjectResponse createProject(ProjectRequest request, AuthUser user);
    List<ProjectResponse> getOpenProjects();
    List<ProjectResponse> getMyProjects(AuthUser user);
    ProjectResponse getProjectById(Long id, AuthUser user);
    ProjectResponse updateProject(Long id, ProjectRequest request, AuthUser user);
    void deleteProject(Long id, AuthUser user);
    ProjectResponse acceptProject(Long id, AuthUser user);
    ProjectResponse completeProject(Long id, AuthUser user);
}