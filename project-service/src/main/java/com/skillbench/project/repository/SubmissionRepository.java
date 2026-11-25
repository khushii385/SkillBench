package com.skillbench.project.repository;

import com.skillbench.project.entity.Submission;
import com.skillbench.project.entity.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByProjectIdOrderByCreatedAtDesc(Long projectId);
    List<Submission> findByVendorIdOrderByCreatedAtDesc(Long vendorId);
    List<Submission> findByProjectIdInOrderByCreatedAtDesc(Collection<Long> projectIds);
    boolean existsByProjectIdAndStatus(Long projectId, SubmissionStatus status);
}