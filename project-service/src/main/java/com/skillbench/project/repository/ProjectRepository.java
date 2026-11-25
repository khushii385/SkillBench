package com.skillbench.project.repository;

import com.skillbench.project.entity.Project;
import com.skillbench.project.entity.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByStatusOrderByCreatedAtDesc(ProjectStatus status);
    List<Project> findByClientIdOrderByCreatedAtDesc(Long clientId);
    List<Project> findByAssignedVendorIdOrderByCreatedAtDesc(Long vendorId);
}