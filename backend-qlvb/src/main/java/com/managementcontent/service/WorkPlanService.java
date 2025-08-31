package com.managementcontent.service;

import com.managementcontent.dto.DocumentLinkDTO;
import com.managementcontent.dto.WorkPlanDTO;
import com.managementcontent.dto.WorkPlanTaskDTO;
import com.managementcontent.model.*;
import com.managementcontent.model.enums.WorkPlanStatus;
import com.managementcontent.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkPlanService {
    private final WorkPlanRepository workPlanRepository;
    private final WorkPlanTaskRepository workPlanTaskRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;

    /**
     * Lấy tất cả kế hoạch công việc với bộ lọc (deprecated - nên sử dụng các methods cụ thể khác)
     * @deprecated Sử dụng các methods cụ thể như getWorkPlansByDepartment(), getWorkPlansByDateRange()
     */
    @Deprecated
    public List<WorkPlanDTO> getAllWorkPlans(Long departmentId, String status, LocalDate startDate, LocalDate endDate) {
        List<WorkPlan> workPlans = workPlanRepository.findAllWithDepartmentAndCreator();

        // Convert frontend status to backend status for filtering
        String backendStatus = status;
        if (status != null) {
            WorkPlanStatus workPlanStatus = WorkPlanStatus.fromFrontendCode(status);
            if (workPlanStatus != null) {
                backendStatus = workPlanStatus.getBackendStatus();
            }
        }

        final String finalBackendStatus = backendStatus;

        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan trước khi filter
        for (WorkPlan workPlan : workPlans) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }

        // Lấy danh sách department IDs (bao gồm department con) nếu có departmentId
        Set<Long> departmentIds = null;
        if (departmentId != null) {
            departmentIds = getAllDepartmentIds(departmentId);
        }
        final Set<Long> finalDepartmentIds = departmentIds;

        // Lọc theo các tiêu chí
        return workPlans.stream()
                .filter(wp -> departmentId == null ||
                        (wp.getDepartment() != null && finalDepartmentIds.contains(wp.getDepartment().getId())))
                .filter(wp -> status == null || wp.getStatus().equals(finalBackendStatus))
                .filter(wp -> {
                    if (startDate == null) {
                        return true;
                    }
                    LocalDateTime wpStartDate = wp.getStartDate();
                    return wpStartDate == null || !wpStartDate.toLocalDate().isBefore(startDate);
                })
                .filter(wp -> {
                    if (endDate == null) {
                        return true;
                    }
                    LocalDateTime wpEndDate = wp.getEndDate();
                    return wpEndDate == null || !wpEndDate.toLocalDate().isAfter(endDate);
                })
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy kế hoạch công việc theo phòng ban (bao gồm cả phòng ban con)
     */
    public List<WorkPlanDTO> getWorkPlansByDepartment(Long departmentId) {
        List<WorkPlan> workPlans = workPlanRepository.findAllWithDepartmentAndCreator();
        
        // Lấy danh sách tất cả department IDs (bao gồm department con)
        Set<Long> departmentIds = getAllDepartmentIds(departmentId);
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlans) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        return workPlans.stream()
                .filter(wp -> wp.getDepartment() != null && departmentIds.contains(wp.getDepartment().getId()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy kế hoạch công việc theo phòng ban và trạng thái (bao gồm cả phòng ban con)
     */
    public List<WorkPlanDTO> getWorkPlansByDepartmentAndStatus(Long departmentId, String status) {
        // Convert frontend status to backend status
        String backendStatus = convertToBackendStatus(status);
        
        List<WorkPlan> workPlans = workPlanRepository.findAllWithDepartmentAndCreator();
        
        // Lấy danh sách tất cả department IDs (bao gồm department con)
        Set<Long> departmentIds = getAllDepartmentIds(departmentId);
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlans) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        return workPlans.stream()
                .filter(wp -> wp.getDepartment() != null && departmentIds.contains(wp.getDepartment().getId()))
                .filter(wp -> wp.getStatus().equals(backendStatus))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy kế hoạch công việc theo khoảng thời gian
     */
    public List<WorkPlanDTO> getWorkPlansByDateRange(LocalDate startDate, LocalDate endDate) {
        List<WorkPlan> workPlans = workPlanRepository.findAllWithDepartmentAndCreator();
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlans) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        return workPlans.stream()
                .filter(wp -> isWithinDateRange(wp, startDate, endDate))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy kế hoạch công việc theo phòng ban và khoảng thời gian (bao gồm cả phòng ban con)
     */
    public List<WorkPlanDTO> getWorkPlansByDepartmentAndDateRange(Long departmentId, LocalDate startDate, LocalDate endDate) {
        List<WorkPlan> workPlans = workPlanRepository.findAllWithDepartmentAndCreator();
        
        // Lấy danh sách tất cả department IDs (bao gồm department con)
        Set<Long> departmentIds = getAllDepartmentIds(departmentId);
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlans) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        return workPlans.stream()
                .filter(wp -> wp.getDepartment() != null && departmentIds.contains(wp.getDepartment().getId()))
                .filter(wp -> isWithinDateRange(wp, startDate, endDate))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy kế hoạch công việc theo trạng thái
     */
    public List<WorkPlanDTO> getWorkPlansByStatus(String status) {
        String backendStatus = convertToBackendStatus(status);
        
        List<WorkPlan> workPlans = workPlanRepository.findAllWithDepartmentAndCreator();
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlans) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        return workPlans.stream()
                .filter(wp -> wp.getStatus().equals(backendStatus))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy tất cả kế hoạch công việc
     */
    public List<WorkPlanDTO> getAllWorkPlans() {
        List<WorkPlan> workPlans = workPlanRepository.findAllWithDepartmentAndCreator();
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlans) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        return workPlans.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Lấy tất cả kế hoạch công việc với phân trang
     */
    public Page<WorkPlanDTO> getAllWorkPlans(Pageable pageable) {
        List<WorkPlan> workPlans = workPlanRepository.findAllWithDepartmentAndCreator();
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlans) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        List<WorkPlanDTO> workPlanDTOs = workPlans.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        // Thực hiện phân trang trong memory
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), workPlanDTOs.size());
        
        List<WorkPlanDTO> pageContent = (start < workPlanDTOs.size()) ? 
                workPlanDTOs.subList(start, end) : new ArrayList<>();
        
        return new PageImpl<>(pageContent, pageable, workPlanDTOs.size());
    }

    /**
     * Lấy kế hoạch công việc theo phòng ban với phân trang (bao gồm cả phòng ban con)
     */
    public Page<WorkPlanDTO> getWorkPlansByDepartment(Long departmentId, Pageable pageable) {
        List<WorkPlan> workPlans = workPlanRepository.findAllWithDepartmentAndCreator();
        
        // Lấy danh sách tất cả department IDs (bao gồm department con)
        Set<Long> departmentIds = getAllDepartmentIds(departmentId);
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlans) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        List<WorkPlanDTO> filteredWorkPlans = workPlans.stream()
                .filter(wp -> wp.getDepartment() != null && departmentIds.contains(wp.getDepartment().getId()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        // Thực hiện phân trang trong memory
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filteredWorkPlans.size());
        
        List<WorkPlanDTO> pageContent = (start < filteredWorkPlans.size()) ? 
                filteredWorkPlans.subList(start, end) : new ArrayList<>();
        
        return new PageImpl<>(pageContent, pageable, filteredWorkPlans.size());
    }

    /**
     * Lấy kế hoạch công việc theo phòng ban và trạng thái với phân trang (bao gồm cả phòng ban con)
     */
    public Page<WorkPlanDTO> getWorkPlansByDepartmentAndStatus(Long departmentId, String status, Pageable pageable) {
        // Convert frontend status to backend status
        String backendStatus = convertToBackendStatus(status);
        
        List<WorkPlan> workPlans = workPlanRepository.findAllWithDepartmentAndCreator();
        
        // Lấy danh sách tất cả department IDs (bao gồm department con)
        Set<Long> departmentIds = getAllDepartmentIds(departmentId);
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlans) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        List<WorkPlanDTO> filteredWorkPlans = workPlans.stream()
                .filter(wp -> wp.getDepartment() != null && departmentIds.contains(wp.getDepartment().getId()))
                .filter(wp -> wp.getStatus().equals(backendStatus))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        // Thực hiện phân trang trong memory
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filteredWorkPlans.size());
        
        List<WorkPlanDTO> pageContent = (start < filteredWorkPlans.size()) ? 
                filteredWorkPlans.subList(start, end) : new ArrayList<>();
        
        return new PageImpl<>(pageContent, pageable, filteredWorkPlans.size());
    }

    /**
     * Lấy kế hoạch công việc theo khoảng thời gian với phân trang
     */
    public Page<WorkPlanDTO> getWorkPlansByDateRange(LocalDate startDate, LocalDate endDate, Pageable pageable) {
        List<WorkPlan> workPlans = workPlanRepository.findAllWithDepartmentAndCreator();
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlans) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        List<WorkPlanDTO> filteredWorkPlans = workPlans.stream()
                .filter(wp -> isWithinDateRange(wp, startDate, endDate))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        // Thực hiện phân trang trong memory
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filteredWorkPlans.size());
        
        List<WorkPlanDTO> pageContent = (start < filteredWorkPlans.size()) ? 
                filteredWorkPlans.subList(start, end) : new ArrayList<>();
        
        return new PageImpl<>(pageContent, pageable, filteredWorkPlans.size());
    }

    /**
     * Lấy kế hoạch công việc theo trạng thái với phân trang
     */
    public Page<WorkPlanDTO> getWorkPlansByStatus(String status, Pageable pageable) {
        String backendStatus = convertToBackendStatus(status);
        
        List<WorkPlan> workPlans = workPlanRepository.findAllWithDepartmentAndCreator();
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlans) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        List<WorkPlanDTO> filteredWorkPlans = workPlans.stream()
                .filter(wp -> wp.getStatus().equals(backendStatus))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        // Thực hiện phân trang trong memory
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filteredWorkPlans.size());
        
        List<WorkPlanDTO> pageContent = (start < filteredWorkPlans.size()) ? 
                filteredWorkPlans.subList(start, end) : new ArrayList<>();
        
        return new PageImpl<>(pageContent, pageable, filteredWorkPlans.size());
    }

    /**
     * Lấy kế hoạch công việc theo tuần với phân trang
     */
    public Page<WorkPlanDTO> getWorkPlansByWeek(int year, int week, Pageable pageable) {
        Page<WorkPlan> workPlansPage = workPlanRepository.findByYearAndWeek(year, week, pageable);
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlansPage.getContent()) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        return workPlansPage.map(this::convertToDTO);
    }

    /**
     * Lấy kế hoạch công việc theo tháng với phân trang
     */
    public Page<WorkPlanDTO> getWorkPlansByMonth(int year, int month, Pageable pageable) {
        Page<WorkPlan> workPlansPage = workPlanRepository.findByYearAndMonth(year, month, pageable);
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlansPage.getContent()) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        return workPlansPage.map(this::convertToDTO);
    }

    /**
     * Lấy kế hoạch công việc theo năm với phân trang
     */
    public Page<WorkPlanDTO> getWorkPlansByYear(int year, Pageable pageable) {
        Page<WorkPlan> workPlansPage = workPlanRepository.findByYear(year, pageable);
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlansPage.getContent()) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        return workPlansPage.map(this::convertToDTO);
    }

    /**
     * Lấy kế hoạch công việc theo phòng ban và tuần với phân trang
     */
    public Page<WorkPlanDTO> getWorkPlansByDepartmentAndWeek(Long departmentId, int year, int week, Pageable pageable) {
        // Lấy danh sách tất cả department IDs (bao gồm department con)
        Set<Long> departmentIds = getAllDepartmentIds(departmentId);
        List<Long> departmentIdsList = new ArrayList<>(departmentIds);
        
        Page<WorkPlan> workPlansPage = workPlanRepository.findByDepartmentIdsAndYearAndWeek(departmentIdsList, year, week, pageable);
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlansPage.getContent()) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        return workPlansPage.map(this::convertToDTO);
    }

    /**
     * Lấy kế hoạch công việc theo phòng ban và tháng với phân trang
     */
    public Page<WorkPlanDTO> getWorkPlansByDepartmentAndMonth(Long departmentId, int year, int month, Pageable pageable) {
        // Lấy danh sách tất cả department IDs (bao gồm department con)
        Set<Long> departmentIds = getAllDepartmentIds(departmentId);
        List<Long> departmentIdsList = new ArrayList<>(departmentIds);
        
        Page<WorkPlan> workPlansPage = workPlanRepository.findByDepartmentIdsAndYearAndMonth(departmentIdsList, year, month, pageable);
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlansPage.getContent()) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        return workPlansPage.map(this::convertToDTO);
    }

    /**
     * Lấy kế hoạch công việc theo phòng ban và năm với phân trang
     */
    public Page<WorkPlanDTO> getWorkPlansByDepartmentAndYear(Long departmentId, int year, Pageable pageable) {
        // Lấy danh sách tất cả department IDs (bao gồm department con)
        Set<Long> departmentIds = getAllDepartmentIds(departmentId);
        List<Long> departmentIdsList = new ArrayList<>(departmentIds);
        
        Page<WorkPlan> workPlansPage = workPlanRepository.findByDepartmentIdsAndYear(departmentIdsList, year, pageable);
        
        // Tự động kiểm tra và cập nhật trạng thái cho từng work plan
        for (WorkPlan workPlan : workPlansPage.getContent()) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        return workPlansPage.map(this::convertToDTO);
    }

    /**
     * Lấy kế hoạch công việc theo ID
     */
    public Optional<WorkPlanDTO> getWorkPlanById(Long id) {
        Optional<WorkPlan> workPlanOpt = workPlanRepository.findById(id);
        if (workPlanOpt.isPresent()) {
            WorkPlan workPlan = workPlanOpt.get();
            
            // Tự động kiểm tra và cập nhật trạng thái dựa trên tasks
            updateWorkPlanStatusBasedOnTasks(workPlan);
            
            return Optional.of(convertToDTO(workPlan));
        }
        return Optional.empty();
    }

    /**
     * Tạo kế hoạch công việc mới
     */
    @Transactional
    public WorkPlanDTO createWorkPlan(WorkPlanDTO workPlanDTO, User currentUser) {
        WorkPlan workPlan = new WorkPlan();
        workPlan.setTitle(workPlanDTO.getTitle());
        workPlan.setDescription(workPlanDTO.getDescription());

        // Set phòng ban
        if (workPlanDTO.getDepartmentId() != null) {
            departmentRepository.findById(workPlanDTO.getDepartmentId())
                    .ifPresent(workPlan::setDepartment);
        } else if (currentUser.getDepartment() != null) {
            workPlan.setDepartment(currentUser.getDepartment());
        }

        workPlan.setStartDate(workPlanDTO.getStartDate());
        workPlan.setEndDate(workPlanDTO.getEndDate());
        workPlan.setStatus(WorkPlanStatus.DRAFT.getBackendStatus());
        workPlan.setCreatedBy(currentUser);

        WorkPlan savedWorkPlan = workPlanRepository.save(workPlan);

        // Tạo các nhiệm vụ nếu có
        if (workPlanDTO.getTasks() != null && !workPlanDTO.getTasks().isEmpty()) {
            List<WorkPlanTask> tasks = new ArrayList<>();
            for (WorkPlanTaskDTO taskDTO : workPlanDTO.getTasks()) {
                WorkPlanTask task = new WorkPlanTask();
                task.setTitle(taskDTO.getTitle());
                task.setDescription(taskDTO.getDescription());

                // Set người được giao nhiệm vụ
                if (taskDTO.getAssigneeId() != null) {
                    userRepository.findById(taskDTO.getAssigneeId())
                            .ifPresent(task::setAssignee);
                }

                task.setStartDate(taskDTO.getStartDate());
                task.setEndDate(taskDTO.getEndDate());
                task.setStatus("PENDING");
                task.setProgress(0);
                task.setWorkPlan(savedWorkPlan);
                tasks.add(task);
            }
            workPlanTaskRepository.saveAll(tasks);
            savedWorkPlan.setTasks(tasks);
        }

        return convertToDTO(savedWorkPlan);
    }

    /**
     * Cập nhật kế hoạch công việc
     */
    @Transactional
    public Optional<WorkPlanDTO> updateWorkPlan(Long id, WorkPlanDTO workPlanDTO) {
        return workPlanRepository.findById(id).map(workPlan -> {
            workPlan.setTitle(workPlanDTO.getTitle());
            workPlan.setDescription(workPlanDTO.getDescription());

            // Cập nhật phòng ban
            if (workPlanDTO.getDepartmentId() != null) {
                departmentRepository.findById(workPlanDTO.getDepartmentId())
                        .ifPresent(workPlan::setDepartment);
            }

            workPlan.setStartDate(workPlanDTO.getStartDate());
            workPlan.setEndDate(workPlanDTO.getEndDate());

            // Không cập nhật trạng thái ở đây vì có API riêng cho việc đó

            // Cập nhật danh sách nhiệm vụ
            if (workPlanDTO.getTasks() != null) {
                // Xóa các nhiệm vụ cũ
                workPlanTaskRepository.deleteByWorkPlanId(id);

                // Tạo các nhiệm vụ mới
                List<WorkPlanTask> newTasks = new ArrayList<>();
                for (WorkPlanTaskDTO taskDTO : workPlanDTO.getTasks()) {
                    WorkPlanTask task = new WorkPlanTask();
                    task.setTitle(taskDTO.getTitle());
                    task.setDescription(taskDTO.getDescription());

                    if (taskDTO.getAssigneeId() != null) {
                        userRepository.findById(taskDTO.getAssigneeId())
                                .ifPresent(task::setAssignee);
                    }

                    task.setStartDate(taskDTO.getStartDate());
                    task.setEndDate(taskDTO.getEndDate());
                    task.setStatus(taskDTO.getStatus() != null ? taskDTO.getStatus() : "PENDING");
                    task.setProgress(taskDTO.getProgress() != null ? taskDTO.getProgress() : 0);
                    task.setWorkPlan(workPlan);
                    newTasks.add(task);
                }
                workPlanTaskRepository.saveAll(newTasks);
                workPlan.setTasks(newTasks);
            }

            WorkPlan savedWorkPlan = workPlanRepository.save(workPlan);
            
            // Cập nhật trạng thái kế hoạch dựa trên tiến độ tasks
            updateWorkPlanStatusBasedOnTasks(savedWorkPlan);
            
            return convertToDTO(savedWorkPlan);
        });
    }

    /**
     * Bắt đầu thực hiện kế hoạch (chuyển từ APPROVED sang IN_PROGRESS)
     */
    @Transactional
    public Optional<WorkPlanDTO> startWorkPlan(Long id, User currentUser) {
        return workPlanRepository.findById(id).map(workPlan -> {
            if (!WorkPlanStatus.APPROVED.getBackendStatus().equals(workPlan.getStatus())) {
                throw new IllegalStateException("Chỉ có thể bắt đầu kế hoạch đã được phê duyệt");
            }

            workPlan.setStatus(WorkPlanStatus.IN_PROGRESS.getBackendStatus());
            workPlan.setUpdatedAt(LocalDateTime.now());

            WorkPlan savedWorkPlan = workPlanRepository.save(workPlan);
            return convertToDTO(savedWorkPlan);
        });
    }

    /**
     * Hoàn thành kế hoạch (chuyển sang COMPLETED)
     */
    @Transactional
    public Optional<WorkPlanDTO> completeWorkPlan(Long id, User currentUser) {
        return workPlanRepository.findById(id).map(workPlan -> {
            if (!WorkPlanStatus.IN_PROGRESS.getBackendStatus().equals(workPlan.getStatus())) {
                throw new IllegalStateException("Chỉ có thể hoàn thành kế hoạch đang thực hiện");
            }

            // Kiểm tra tất cả tasks đã hoàn thành chưa
            boolean allTasksCompleted = workPlan.getTasks().stream()
                    .allMatch(task -> "COMPLETED".equals(task.getStatus()) || task.getProgress() >= 100);

            if (!allTasksCompleted) {
                throw new IllegalStateException("Chưa thể hoàn thành kế hoạch vì còn nhiệm vụ chưa hoàn thành");
            }

            workPlan.setStatus(WorkPlanStatus.COMPLETED.getBackendStatus());
            workPlan.setUpdatedAt(LocalDateTime.now());

            WorkPlan savedWorkPlan = workPlanRepository.save(workPlan);
            return convertToDTO(savedWorkPlan);
        });
    }

    /**
     * Cập nhật trạng thái kế hoạch dựa trên tiến độ các tasks
     */
    @Transactional
    public void updateWorkPlanStatusBasedOnTasks(WorkPlan workPlan) {
        if (!WorkPlanStatus.IN_PROGRESS.getBackendStatus().equals(workPlan.getStatus()) &&
            !WorkPlanStatus.APPROVED.getBackendStatus().equals(workPlan.getStatus())) {
            return; // Chỉ cập nhật cho kế hoạch đang thực hiện hoặc đã duyệt
        }

        List<WorkPlanTask> tasks = workPlan.getTasks();
        if (tasks.isEmpty()) {
            return;
        }

        // Kiểm tra có task nào đã bắt đầu chưa
        boolean hasStartedTasks = tasks.stream()
                .anyMatch(task -> "IN_PROGRESS".equals(task.getStatus()) || 
                                 "COMPLETED".equals(task.getStatus()) || 
                                 task.getProgress() > 0);

        // Kiểm tra tất cả tasks đã hoàn thành chưa
        boolean allTasksCompleted = tasks.stream()
                .allMatch(task -> "COMPLETED".equals(task.getStatus()) || task.getProgress() >= 100);

        if (allTasksCompleted) {
            workPlan.setStatus(WorkPlanStatus.COMPLETED.getBackendStatus());
        } else if (hasStartedTasks && WorkPlanStatus.APPROVED.getBackendStatus().equals(workPlan.getStatus())) {
            workPlan.setStatus(WorkPlanStatus.IN_PROGRESS.getBackendStatus());
        }

        workPlan.setUpdatedAt(LocalDateTime.now());
        workPlanRepository.save(workPlan);
    }

    /**
     * Force check và cập nhật trạng thái cho tất cả work plans trong database
     * Method này có thể được gọi để sửa dữ liệu có sẵn
     */
    @Transactional
    public void forceUpdateAllWorkPlanStatuses() {
        List<WorkPlan> allWorkPlans = workPlanRepository.findAll();
        
        for (WorkPlan workPlan : allWorkPlans) {
            updateWorkPlanStatusBasedOnTasks(workPlan);
        }
        
        System.out.println("Đã cập nhật trạng thái cho " + allWorkPlans.size() + " kế hoạch công việc");
    }

    /**
     * Xóa kế hoạch công việc
     */
    @Transactional
    public void deleteWorkPlan(Long id) {
        workPlanRepository.deleteById(id);
    }

    /**
     * Phê duyệt kế hoạch công việc
     */
    @Transactional
    public Optional<WorkPlanDTO> approveWorkPlan(Long id, String comments) {
        return workPlanRepository.findById(id).map(workPlan -> {
            workPlan.setStatus("APPROVED");
            workPlan.setUpdatedAt(LocalDateTime.now());
            // Có thể lưu comments vào một trường riêng hoặc trong lịch sử

            WorkPlan savedWorkPlan = workPlanRepository.save(workPlan);
            return convertToDTO(savedWorkPlan);
        });
    }

    /**
     * Từ chối kế hoạch công việc
     */
    @Transactional
    public Optional<WorkPlanDTO> rejectWorkPlan(Long id, String comments) {
        return workPlanRepository.findById(id).map(workPlan -> {
            workPlan.setStatus("REJECTED");
            workPlan.setUpdatedAt(LocalDateTime.now());
            // Có thể lưu comments vào một trường riêng hoặc trong lịch sử

            WorkPlan savedWorkPlan = workPlanRepository.save(workPlan);
            return convertToDTO(savedWorkPlan);
        });
    }

    /**
     * Gửi kế hoạch công việc để phê duyệt
     */
    @Transactional
    public Optional<WorkPlanDTO> submitWorkPlan(Long id, User currentUser) {

        return workPlanRepository.findById(id).map(workPlan -> {
            // Kiểm tra quyền hạn
            if (!canModifyWorkPlan(workPlan, currentUser)) {
                throw new IllegalStateException("Bạn không có quyền gửi kế hoạch này");
            }

            // Chỉ cho phép gửi nếu kế hoạch đang ở trạng thái DRAFT
            if (!WorkPlanStatus.DRAFT.getBackendStatus().equals(workPlan.getStatus())) {
                throw new IllegalStateException("Chỉ có thể gửi kế hoạch ở trạng thái DRAFT");
            }

            workPlan.setStatus(WorkPlanStatus.SUBMITTED.getBackendStatus());
            workPlan.setUpdatedAt(LocalDateTime.now());

            WorkPlan savedWorkPlan = workPlanRepository.save(workPlan);
            return convertToDTO(savedWorkPlan);
        });
    }

    /**
     * Phê duyệt hoặc từ chối kế hoạch công việc
     */
    @Transactional
    public Optional<WorkPlanDTO> approveOrRejectWorkPlan(Long id, Boolean approved, String comments, User currentUser) {
        return workPlanRepository.findById(id).map(workPlan -> {
            // Kiểm tra quyền hạn (giả định manager hoặc admin có quyền phê duyệt)
            if (!isApprover(currentUser)) {
                throw new IllegalStateException("Bạn không có quyền phê duyệt kế hoạch");
            }

            // Chỉ cho phép phê duyệt/từ chối nếu kế hoạch đang ở trạng thái SUBMITTED
            if (!WorkPlanStatus.SUBMITTED.getBackendStatus().equals(workPlan.getStatus())) {
                throw new IllegalStateException("Chỉ có thể phê duyệt kế hoạch ở trạng thái SUBMITTED");
            }

            // Cập nhật trạng thái dựa trên quyết định
            if (Boolean.TRUE.equals(approved)) {
                workPlan.setStatus(WorkPlanStatus.APPROVED.getBackendStatus());
            } else {
                workPlan.setStatus(WorkPlanStatus.REJECTED.getBackendStatus());
            }

            // Cập nhật thời gian và thông tin
            workPlan.setUpdatedAt(LocalDateTime.now());
            workPlan.setApprovalComments(comments);
            workPlan.setApprovedBy(currentUser);
            workPlan.setApprovedAt(LocalDateTime.now());

            WorkPlan savedWorkPlan = workPlanRepository.save(workPlan);
            return convertToDTO(savedWorkPlan);
        });
    }

    /**
     * Cập nhật trạng thái nhiệm vụ trong kế hoạch
     */
    @Transactional
    public Optional<WorkPlanTaskDTO> updateTaskStatus(Long taskId, String status, Integer progress, String comments, User currentUser) {
        return workPlanTaskRepository.findById(taskId).map(task -> {
            // Kiểm tra quyền hạn (có thể kiểm tra user có quyền update task này không)
            
            if (status != null) {
                task.setStatus(status);
            }
            if (progress != null) {
                task.setProgress(progress);
            }
            if (comments != null) {
                task.setStatusComments(comments);
            }
            
            task.setLastUpdatedBy(currentUser);
            task.setUpdatedAt(LocalDateTime.now());
            
            WorkPlanTask savedTask = workPlanTaskRepository.save(task);
            
            // Cập nhật trạng thái kế hoạch dựa trên tiến độ tasks
            updateWorkPlanStatusBasedOnTasks(task.getWorkPlan());
            
            return convertTaskToDTO(savedTask);
        });
    }

    /**
     * Convert WorkPlan entity to DTO với status mapping cho frontend
     */
    private WorkPlanDTO convertToDTO(WorkPlan workPlan) {
        WorkPlanDTO dto = new WorkPlanDTO();
        dto.setId(workPlan.getId());
        dto.setTitle(workPlan.getTitle());
        dto.setDescription(workPlan.getDescription());
        dto.setDepartment(workPlan.getDepartment() != null ? workPlan.getDepartment().getName() : null);
        dto.setDepartmentId(workPlan.getDepartment() != null ? workPlan.getDepartment().getId() : null);
        dto.setStartDate(workPlan.getStartDate());
        dto.setEndDate(workPlan.getEndDate());
        
        // Map backend status to frontend status
        WorkPlanStatus status = WorkPlanStatus.fromBackendStatus(workPlan.getStatus());
        dto.setStatus(status != null ? status.getFrontendCode() : workPlan.getStatus());
        
        dto.setCreatedBy(workPlan.getCreatedBy() != null ? workPlan.getCreatedBy().getName() : null);
        dto.setCreatedById(workPlan.getCreatedBy() != null ? workPlan.getCreatedBy().getId() : null);
        dto.setCreatedAt(workPlan.getCreatedAt());
        dto.setUpdatedAt(workPlan.getUpdatedAt());

        // Convert tasks
        if (workPlan.getTasks() != null) {
            List<WorkPlanTaskDTO> taskDTOs = workPlan.getTasks().stream()
                    .map(this::convertTaskToDTO)
                    .collect(Collectors.toList());
            dto.setTasks(taskDTOs);
        }

        return dto;
    }

    /**
     * Utility method: Convert frontend status to backend status
     */
    private String convertToBackendStatus(String frontendStatus) {
        if (frontendStatus == null) {
            return null;
        }
        
        WorkPlanStatus workPlanStatus = WorkPlanStatus.fromFrontendCode(frontendStatus);
        return workPlanStatus != null ? workPlanStatus.getBackendStatus() : frontendStatus;
    }

    /**
     * Utility method: Kiểm tra work plan có nằm trong khoảng thời gian không
     */
    private boolean isWithinDateRange(WorkPlan workPlan, LocalDate startDate, LocalDate endDate) {
        LocalDateTime wpStartDate = workPlan.getStartDate();
        LocalDateTime wpEndDate = workPlan.getEndDate();
        
        // Kiểm tra startDate
        if (startDate != null && wpStartDate != null) {
            if (wpStartDate.toLocalDate().isBefore(startDate)) {
                return false;
            }
        }
        
        // Kiểm tra endDate
        if (endDate != null && wpEndDate != null) {
            if (wpEndDate.toLocalDate().isAfter(endDate)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Utility method: Kiểm tra work plan có nằm trong tuần cụ thể không
     */
    private boolean isInWeek(WorkPlan workPlan, int year, int week) {
        LocalDateTime wpStartDate = workPlan.getStartDate();
        LocalDateTime wpEndDate = workPlan.getEndDate();
        
        if (wpStartDate == null && wpEndDate == null) {
            return false;
        }
        
        WeekFields weekFields = WeekFields.of(Locale.getDefault());
        
        // Kiểm tra start date
        if (wpStartDate != null) {
            LocalDate startDate = wpStartDate.toLocalDate();
            int wpYear = startDate.getYear();
            int wpWeek = startDate.get(weekFields.weekOfYear());
            if (wpYear == year && wpWeek == week) {
                return true;
            }
        }
        
        // Kiểm tra end date
        if (wpEndDate != null) {
            LocalDate endDate = wpEndDate.toLocalDate();
            int wpYear = endDate.getYear();
            int wpWeek = endDate.get(weekFields.weekOfYear());
            if (wpYear == year && wpWeek == week) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Utility method: Kiểm tra work plan có nằm trong tháng cụ thể không
     */
    private boolean isInMonth(WorkPlan workPlan, int year, int month) {
        LocalDateTime wpStartDate = workPlan.getStartDate();
        LocalDateTime wpEndDate = workPlan.getEndDate();
        
        if (wpStartDate == null && wpEndDate == null) {
            return false;
        }
        
        // Kiểm tra start date
        if (wpStartDate != null) {
            LocalDate startDate = wpStartDate.toLocalDate();
            if (startDate.getYear() == year && startDate.getMonthValue() == month) {
                return true;
            }
        }
        
        // Kiểm tra end date
        if (wpEndDate != null) {
            LocalDate endDate = wpEndDate.toLocalDate();
            if (endDate.getYear() == year && endDate.getMonthValue() == month) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Utility method: Kiểm tra work plan có nằm trong năm cụ thể không
     */
    private boolean isInYear(WorkPlan workPlan, int year) {
        LocalDateTime wpStartDate = workPlan.getStartDate();
        LocalDateTime wpEndDate = workPlan.getEndDate();
        
        if (wpStartDate == null && wpEndDate == null) {
            return false;
        }
        
        // Kiểm tra start date
        if (wpStartDate != null) {
            LocalDate startDate = wpStartDate.toLocalDate();
            if (startDate.getYear() == year) {
                return true;
            }
        }
        
        // Kiểm tra end date
        if (wpEndDate != null) {
            LocalDate endDate = wpEndDate.toLocalDate();
            if (endDate.getYear() == year) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Utility method: Lấy tất cả department IDs bao gồm cả department con (recursive)
     */
    private Set<Long> getAllDepartmentIds(Long departmentId) {
        Set<Long> departmentIds = new HashSet<>();
        
        // Thêm chính department được yêu cầu
        departmentIds.add(departmentId);
        
        // Tìm department và lấy tất cả department con
        departmentRepository.findById(departmentId).ifPresent(department -> {
            collectChildDepartmentIds(department, departmentIds);
        });
        
        return departmentIds;
    }

    /**
     * Utility method: Thu thập tất cả department con IDs (recursive helper)
     */
    private void collectChildDepartmentIds(Department department, Set<Long> departmentIds) {
        if (department.getChildDepartments() != null) {
            for (Department childDept : department.getChildDepartments()) {
                departmentIds.add(childDept.getId());
                // Đệ quy để lấy các department con của department con
                collectChildDepartmentIds(childDept, departmentIds);
            }
        }
    }

    /**
     * Convert WorkPlanTask entity to DTO
     */
    private WorkPlanTaskDTO convertTaskToDTO(WorkPlanTask task) {
        WorkPlanTaskDTO dto = new WorkPlanTaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setAssigneeId(task.getAssignee() != null ? task.getAssignee().getId() : null);
        dto.setAssigneeName(task.getAssignee() != null ? task.getAssignee().getName() : null);
        dto.setStartDate(task.getStartDate());
        dto.setEndDate(task.getEndDate());
        dto.setStatus(task.getStatus());
        dto.setProgress(task.getProgress());
        dto.setStatusComments(task.getStatusComments());
        dto.setCreatedAt(task.getCreatedAt());
        dto.setUpdatedAt(task.getUpdatedAt());
        return dto;
    }

    /**
     * Tạo nhiệm vụ mới từ DTO
     */
    private WorkPlanTask createNewTask(WorkPlanTaskDTO taskDTO, WorkPlan workPlan) {
        WorkPlanTask task = new WorkPlanTask();
        task.setTitle(taskDTO.getTitle());
        task.setDescription(taskDTO.getDescription());

        if (taskDTO.getAssigneeId() != null) {
            userRepository.findById(taskDTO.getAssigneeId())
                    .ifPresent(task::setAssignee);
        }

        task.setStartDate(taskDTO.getStartDate());
        task.setEndDate(taskDTO.getEndDate());
        task.setStatus(taskDTO.getStatus() != null ? taskDTO.getStatus() : "PENDING");
        task.setProgress(taskDTO.getProgress() != null ? taskDTO.getProgress() : 0);
        task.setWorkPlan(workPlan);

        return task;
    }

    /**
     * Kiểm tra user có quyền modify work plan không
     */
    private boolean canModifyWorkPlan(WorkPlan workPlan, User user) {
        // Người tạo có quyền modify
        if (workPlan.getCreatedBy() != null && workPlan.getCreatedBy().getId().equals(user.getId())) {
            return true;
        }
        
        // Admin có quyền modify
        if (isAdmin(user)) {
            return true;
        }
        
        // Trưởng phòng có quyền modify kế hoạch trong phòng ban
        if (isDepartmentHead(user) && workPlan.getDepartment() != null && 
            user.getDepartment() != null &&
            workPlan.getDepartment().getId().equals(user.getDepartment().getId())) {
            return true;
        }
        
        return false;
    }

    /**
     * Kiểm tra user có quyền approve không
     */
    private boolean isApprover(User user) {
        // Implement logic kiểm tra quyền approve dựa trên role
        // Ví dụ: Manager, Admin có quyền approve
        return user.getRoles().stream()
                .anyMatch(role -> role.getName().contains("MANAGER") || 
                                 role.getName().contains("ADMIN") ||
                                 role.getName().contains("TRUONG") ||
                                 role.getName().contains("PHO"));
    }

    private boolean isAdmin(User user) {
        return user.getRoles().stream()
                .anyMatch(role -> role.getName().contains("ADMIN"));
    }

    private boolean isDepartmentHead(User user) {
        return user.getRoles().stream()
                .anyMatch(role -> role.getName().contains("TRUONG") || 
                                 role.getName().contains("PHO"));
    }
}