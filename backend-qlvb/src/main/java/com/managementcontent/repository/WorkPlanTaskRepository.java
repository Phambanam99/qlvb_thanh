package com.managementcontent.repository;

import com.managementcontent.model.WorkPlanTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkPlanTaskRepository extends JpaRepository<WorkPlanTask, Long> {
    List<WorkPlanTask> findByWorkPlanId(Long workPlanId);
    
    List<WorkPlanTask> findByAssigneeId(Long assigneeId);
    
    void deleteByWorkPlanId(Long workPlanId);
}