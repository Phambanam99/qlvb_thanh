package com.managementcontent.service;

import com.managementcontent.dto.ScheduleDTO;
import com.managementcontent.dto.ScheduleEventDTO;
import com.managementcontent.model.*;
import com.managementcontent.model.enums.ScheduleStatus;
import com.managementcontent.repository.*;
import com.managementcontent.util.RoleGroupUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ScheduleEventRepository scheduleEventRepository;
    private final ScheduleEventAttendanceRepository scheduleEventAttendanceRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    /**
     * Lấy danh sách tất cả các lịch công việc với phân trang
     * Lọc theo phòng ban của người dùng, trừ các role thuộc nhóm CHI_HUY_CUC
     */
    public Page<ScheduleDTO> getAllSchedules(Pageable pageable) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        // Kiểm tra xem user có thuộc nhóm CHI_HUY_CUC không
        boolean hasChiHuyCucRole = currentUser.getRoles().stream()
                .anyMatch(role -> RoleGroupUtil.isChiHuyCuc(role.getName()));

        List<Schedule> schedules = scheduleRepository.findAllWithDepartmentAndCreator();

        // Nếu có role CHI_HUY_CUC, trả về tất cả schedules
        if (hasChiHuyCucRole) {
            // Tạo trang kết quả
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), schedules.size());
            List<Schedule> pageContent = start < end ? schedules.subList(start, end) : Collections.emptyList();

            List<ScheduleDTO> dtoList = pageContent.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

            return new PageImpl<>(dtoList, pageable, schedules.size());
        }

        // Nếu không có role CHI_HUY_CUC, chỉ trả về schedules của department của user và department con
        Long userDepartmentId = currentUser.getDepartment() != null ? currentUser.getDepartment().getId() : null;
        if (userDepartmentId == null) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        // Lấy tất cả department IDs (bao gồm department con) của user
        Set<Long> userDepartmentIds = getAllDepartmentIds(userDepartmentId);

        List<Schedule> filteredSchedules = schedules.stream()
                .filter(schedule -> schedule.getDepartment() != null &&
                        userDepartmentIds.contains(schedule.getDepartment().getId()))
                .collect(Collectors.toList());

        // Tạo trang kết quả
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filteredSchedules.size());
        List<Schedule> pageContent = start < end ? filteredSchedules.subList(start, end) : Collections.emptyList();

        List<ScheduleDTO> dtoList = pageContent.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, filteredSchedules.size());
    }

    /**
     * Lấy danh sách tất cả các lịch công việc (không phân trang - deprecated)
     * @deprecated Sử dụng getAllSchedules(Pageable pageable) thay thế
     */
    @Deprecated
    public List<ScheduleDTO> getAllSchedules() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return Collections.emptyList();
        }

        // Kiểm tra xem user có thuộc nhóm CHI_HUY_CUC không
        boolean hasChiHuyCucRole = currentUser.getRoles().stream()
                .anyMatch(role -> RoleGroupUtil.isChiHuyCuc(role.getName()));

        List<Schedule> schedules = scheduleRepository.findAllWithDepartmentAndCreator();

        // Nếu có role CHI_HUY_CUC, trả về tất cả schedules
        if (hasChiHuyCucRole) {
            return schedules.stream().map(this::convertToDTO).collect(Collectors.toList());
        }

        // Nếu không có role CHI_HUY_CUC, chỉ trả về schedules của department của user và department con
        Long userDepartmentId = currentUser.getDepartment() != null ? currentUser.getDepartment().getId() : null;
        if (userDepartmentId == null) {
            return Collections.emptyList();
        }

        // Lấy tất cả department IDs (bao gồm department con) của user
        Set<Long> userDepartmentIds = getAllDepartmentIds(userDepartmentId);

        return schedules.stream()
                .filter(schedule -> schedule.getDepartment() != null &&
                        userDepartmentIds.contains(schedule.getDepartment().getId()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User currentUser = userRepository.findByName(username).orElse(null);
        return currentUser;
    }

    /**
     * Lấy danh sách lịch có phân trang và lọc theo các tiêu chí
     * Lọc theo phòng ban của người dùng, trừ các role thuộc nhóm CHI_HUY_CUC
     */
    public Page<ScheduleDTO> getSchedules(Long departmentId, String status, LocalDate fromDate, LocalDate toDate,
            Pageable pageable) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        // Kiểm tra xem user có thuộc nhóm CHI_HUY_CUC không
        boolean hasChiHuyCucRole = currentUser.getRoles().stream()
                .anyMatch(role -> RoleGroupUtil.isChiHuyCuc(role.getName()));

        // Lấy tất cả lịch và lọc trong bộ nhớ (thực tế nên tạo query tùy chỉnh để tối
        // ưu hơn)
        List<Schedule> schedules = scheduleRepository.findAllWithDepartmentAndCreator();

        // Convert frontend status to backend statuses for filtering
        final List<String> targetBackendStatuses = new ArrayList<>();
        if (status != null) {
            ScheduleStatus frontendStatus = ScheduleStatus.fromFrontendCode(status);
            if (frontendStatus != null) {
                // Get all backend statuses that map to this frontend status
                for (ScheduleStatus scheduleStatus : ScheduleStatus.values()) {
                    if (scheduleStatus.getFrontendCode().equals(status)) {
                        targetBackendStatuses.add(scheduleStatus.getBackendStatus());
                    }
                }
            } else {
                // Fallback to direct backend status matching
                targetBackendStatuses.add(status);
            }
        }

        // Áp dụng logic role-based filtering
        if (!hasChiHuyCucRole) {
            // Nếu không có role CHI_HUY_CUC, chỉ lấy schedules của department của user và department con
            Long userDepartmentId = currentUser.getDepartment() != null ? currentUser.getDepartment().getId() : null;
            if (userDepartmentId == null) {
                return new PageImpl<>(Collections.emptyList(), pageable, 0);
            }

            // Lấy tất cả department IDs (bao gồm department con) của user
            Set<Long> userDepartmentIds = getAllDepartmentIds(userDepartmentId);

            // Nếu departmentId được truyền vào, kiểm tra xem có thuộc về department hierarchy của user không
            if (departmentId != null && !userDepartmentIds.contains(departmentId)) {
                return new PageImpl<>(Collections.emptyList(), pageable, 0);
            }

            // Filter schedules by user's department hierarchy
            schedules = schedules.stream()
                    .filter(s -> s.getDepartment() != null && userDepartmentIds.contains(s.getDepartment().getId()))
                    .collect(Collectors.toList());
        }

        // Lấy danh sách department IDs để filter (bao gồm department con) nếu có departmentId
        Set<Long> filterDepartmentIds = null;
        if (departmentId != null) {
            filterDepartmentIds = getAllDepartmentIds(departmentId);
        }
        final Set<Long> finalFilterDepartmentIds = filterDepartmentIds;

        // Lọc theo các tiêu chí
        List<Schedule> filteredSchedules = schedules.stream()
                .filter(s -> departmentId == null || 
                        (s.getDepartment() != null && finalFilterDepartmentIds.contains(s.getDepartment().getId())))
                .filter(s -> status == null || targetBackendStatuses.contains(s.getStatus()))
                .filter(s -> {
                    if (fromDate == null && toDate == null) {
                        return true;
                    }

                    LocalDateTime createdAt = s.getCreatedAt();
                    LocalDate createdDate = createdAt != null ? createdAt.toLocalDate() : null;

                    boolean afterFromDate = fromDate == null
                            || (createdDate != null && !createdDate.isBefore(fromDate));
                    boolean beforeToDate = toDate == null || (createdDate != null && !createdDate.isAfter(toDate));

                    return afterFromDate && beforeToDate;
                })
                .collect(Collectors.toList());

        // Tạo trang kết quả
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filteredSchedules.size());
        List<Schedule> pageContent = start < end ? filteredSchedules.subList(start, end) : Collections.emptyList();

        List<ScheduleDTO> dtoList = pageContent.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, filteredSchedules.size());
    }

    /**
     * Lấy một lịch công việc theo ID
     */
    public Optional<ScheduleDTO> getScheduleById(Long id) {
        return scheduleRepository.findById(id).map(this::convertToDTO);
    }

    /**
     * Lấy danh sách lịch công việc theo department ID với phân trang (bao gồm cả department con)
     * Áp dụng role-based filtering tương tự như getAllSchedules và getSchedules
     */
    public Page<ScheduleDTO> getSchedulesByDepartmentId(Long departmentId, Pageable pageable) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        // Kiểm tra xem user có thuộc nhóm CHI_HUY_CUC không
        boolean hasChiHuyCucRole = currentUser.getRoles().stream()
                .anyMatch(role -> RoleGroupUtil.isChiHuyCuc(role.getName()));

        // Lấy tất cả department IDs (bao gồm department con)
        Set<Long> departmentIds = getAllDepartmentIds(departmentId);

        List<Schedule> schedules;

        // Nếu có role CHI_HUY_CUC, cho phép lấy schedules của bất kỳ department nào
        if (hasChiHuyCucRole) {
            schedules = scheduleRepository.findAllWithDepartmentAndCreator();
            schedules = schedules.stream()
                    .filter(s -> s.getDepartment() != null && departmentIds.contains(s.getDepartment().getId()))
                    .collect(Collectors.toList());
        } else {
            // Nếu không có role CHI_HUY_CUC, kiểm tra quyền truy cập department hierarchy
            Long userDepartmentId = currentUser.getDepartment() != null ? currentUser.getDepartment().getId() : null;
            if (userDepartmentId == null) {
                return new PageImpl<>(Collections.emptyList(), pageable, 0);
            }

            // Lấy tất cả department IDs mà user có quyền truy cập (bao gồm department con)
            Set<Long> userDepartmentIds = getAllDepartmentIds(userDepartmentId);

            // Kiểm tra xem departmentId có thuộc về department hierarchy của user không
            if (!userDepartmentIds.contains(departmentId)) {
                return new PageImpl<>(Collections.emptyList(), pageable, 0);
            }

            schedules = scheduleRepository.findAllWithDepartmentAndCreator();
            schedules = schedules.stream()
                    .filter(s -> s.getDepartment() != null && departmentIds.contains(s.getDepartment().getId()))
                    .collect(Collectors.toList());
        }

        // Tạo trang kết quả
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), schedules.size());
        List<Schedule> pageContent = start < end ? schedules.subList(start, end) : Collections.emptyList();

        List<ScheduleDTO> dtoList = pageContent.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new PageImpl<>(dtoList, pageable, schedules.size());
    }

    /**
     * Lấy danh sách lịch công việc theo department ID (bao gồm cả department con) - không phân trang
     * @deprecated Sử dụng getSchedulesByDepartmentId(Long departmentId, Pageable pageable) thay thế
     */
    @Deprecated
    public List<ScheduleDTO> getSchedulesByDepartmentId(Long departmentId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return Collections.emptyList();
        }

        // Kiểm tra xem user có thuộc nhóm CHI_HUY_CUC không
        boolean hasChiHuyCucRole = currentUser.getRoles().stream()
                .anyMatch(role -> RoleGroupUtil.isChiHuyCuc(role.getName()));

        // Lấy tất cả department IDs (bao gồm department con)
        Set<Long> departmentIds = getAllDepartmentIds(departmentId);

        // Nếu có role CHI_HUY_CUC, cho phép lấy schedules của bất kỳ department nào
        if (hasChiHuyCucRole) {
            List<Schedule> schedules = scheduleRepository.findAllWithDepartmentAndCreator();
            return schedules.stream()
                    .filter(s -> s.getDepartment() != null && departmentIds.contains(s.getDepartment().getId()))
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }

        // Nếu không có role CHI_HUY_CUC, kiểm tra quyền truy cập department hierarchy
        Long userDepartmentId = currentUser.getDepartment() != null ? currentUser.getDepartment().getId() : null;
        if (userDepartmentId == null) {
            return Collections.emptyList();
        }

        // Lấy tất cả department IDs mà user có quyền truy cập (bao gồm department con)
        Set<Long> userDepartmentIds = getAllDepartmentIds(userDepartmentId);

        // Kiểm tra xem departmentId có thuộc về department hierarchy của user không
        if (!userDepartmentIds.contains(departmentId)) {
            return Collections.emptyList();
        }

        List<Schedule> schedules = scheduleRepository.findAllWithDepartmentAndCreator();
        return schedules.stream()
                .filter(s -> s.getDepartment() != null && departmentIds.contains(s.getDepartment().getId()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy lịch công việc theo tuần với phân trang
     */
    public Page<ScheduleDTO> getSchedulesByWeek(int year, int week, Pageable pageable) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        boolean hasChiHuyCucRole = currentUser.getRoles().stream()
                .anyMatch(role -> RoleGroupUtil.isChiHuyCuc(role.getName()));

        Page<Schedule> schedulesPage = scheduleRepository.findByYearAndWeek(year, week, pageable);
        
        // Nếu có role CHI_HUY_CUC, trả về tất cả
        if (hasChiHuyCucRole) {
            return schedulesPage.map(this::convertToDTO);
        }

        // Lọc theo department của user
        Long userDepartmentId = currentUser.getDepartment() != null ? currentUser.getDepartment().getId() : null;
        if (userDepartmentId == null) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        Set<Long> userDepartmentIds = getAllDepartmentIds(userDepartmentId);
        List<ScheduleDTO> filteredSchedules = schedulesPage.getContent().stream()
                .filter(s -> s.getDepartment() != null && userDepartmentIds.contains(s.getDepartment().getId()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new PageImpl<>(filteredSchedules, pageable, filteredSchedules.size());
    }

    /**
     * Lấy lịch công việc theo tháng với phân trang
     */
    public Page<ScheduleDTO> getSchedulesByMonth(int year, int month, Pageable pageable) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        boolean hasChiHuyCucRole = currentUser.getRoles().stream()
                .anyMatch(role -> RoleGroupUtil.isChiHuyCuc(role.getName()));

        Page<Schedule> schedulesPage = scheduleRepository.findByYearAndMonth(year, month, pageable);
        
        // Nếu có role CHI_HUY_CUC, trả về tất cả
        if (hasChiHuyCucRole) {
            return schedulesPage.map(this::convertToDTO);
        }

        // Lọc theo department của user
        Long userDepartmentId = currentUser.getDepartment() != null ? currentUser.getDepartment().getId() : null;
        if (userDepartmentId == null) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        Set<Long> userDepartmentIds = getAllDepartmentIds(userDepartmentId);
        List<ScheduleDTO> filteredSchedules = schedulesPage.getContent().stream()
                .filter(s -> s.getDepartment() != null && userDepartmentIds.contains(s.getDepartment().getId()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new PageImpl<>(filteredSchedules, pageable, filteredSchedules.size());
    }

    /**
     * Lấy lịch công việc theo năm với phân trang
     */
    public Page<ScheduleDTO> getSchedulesByYear(int year, Pageable pageable) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        boolean hasChiHuyCucRole = currentUser.getRoles().stream()
                .anyMatch(role -> RoleGroupUtil.isChiHuyCuc(role.getName()));

        Page<Schedule> schedulesPage = scheduleRepository.findByYear(year, pageable);
        
        // Nếu có role CHI_HUY_CUC, trả về tất cả
        if (hasChiHuyCucRole) {
            return schedulesPage.map(this::convertToDTO);
        }

        // Lọc theo department của user
        Long userDepartmentId = currentUser.getDepartment() != null ? currentUser.getDepartment().getId() : null;
        if (userDepartmentId == null) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        Set<Long> userDepartmentIds = getAllDepartmentIds(userDepartmentId);
        List<ScheduleDTO> filteredSchedules = schedulesPage.getContent().stream()
                .filter(s -> s.getDepartment() != null && userDepartmentIds.contains(s.getDepartment().getId()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new PageImpl<>(filteredSchedules, pageable, filteredSchedules.size());
    }

    /**
     * Lấy lịch công việc theo phòng ban và tuần với phân trang
     */
    public Page<ScheduleDTO> getSchedulesByDepartmentAndWeek(Long departmentId, int year, int week, Pageable pageable) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        boolean hasChiHuyCucRole = currentUser.getRoles().stream()
                .anyMatch(role -> RoleGroupUtil.isChiHuyCuc(role.getName()));

        // Lấy tất cả department IDs (bao gồm department con)
        Set<Long> departmentIds = getAllDepartmentIds(departmentId);
        List<Long> departmentIdsList = new ArrayList<>(departmentIds);

        if (!hasChiHuyCucRole) {
            // Kiểm tra quyền truy cập department
            Long userDepartmentId = currentUser.getDepartment() != null ? currentUser.getDepartment().getId() : null;
            if (userDepartmentId == null) {
                return new PageImpl<>(Collections.emptyList(), pageable, 0);
            }

            Set<Long> userDepartmentIds = getAllDepartmentIds(userDepartmentId);
            if (!userDepartmentIds.contains(departmentId)) {
                return new PageImpl<>(Collections.emptyList(), pageable, 0);
            }
        }

        Page<Schedule> schedulesPage = scheduleRepository.findByDepartmentIdsAndYearAndWeek(departmentIdsList, year, week, pageable);
        return schedulesPage.map(this::convertToDTO);
    }

    /**
     * Lấy lịch công việc theo phòng ban và tháng với phân trang
     */
    public Page<ScheduleDTO> getSchedulesByDepartmentAndMonth(Long departmentId, int year, int month, Pageable pageable) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        boolean hasChiHuyCucRole = currentUser.getRoles().stream()
                .anyMatch(role -> RoleGroupUtil.isChiHuyCuc(role.getName()));

        // Lấy tất cả department IDs (bao gồm department con)
        Set<Long> departmentIds = getAllDepartmentIds(departmentId);
        List<Long> departmentIdsList = new ArrayList<>(departmentIds);

        if (!hasChiHuyCucRole) {
            // Kiểm tra quyền truy cập department
            Long userDepartmentId = currentUser.getDepartment() != null ? currentUser.getDepartment().getId() : null;
            if (userDepartmentId == null) {
                return new PageImpl<>(Collections.emptyList(), pageable, 0);
            }

            Set<Long> userDepartmentIds = getAllDepartmentIds(userDepartmentId);
            if (!userDepartmentIds.contains(departmentId)) {
                return new PageImpl<>(Collections.emptyList(), pageable, 0);
            }
        }

        Page<Schedule> schedulesPage = scheduleRepository.findByDepartmentIdsAndYearAndMonth(departmentIdsList, year, month, pageable);
        return schedulesPage.map(this::convertToDTO);
    }

    /**
     * Lấy lịch công việc theo phòng ban và năm với phân trang
     */
    public Page<ScheduleDTO> getSchedulesByDepartmentAndYear(Long departmentId, int year, Pageable pageable) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        boolean hasChiHuyCucRole = currentUser.getRoles().stream()
                .anyMatch(role -> RoleGroupUtil.isChiHuyCuc(role.getName()));

        // Lấy tất cả department IDs (bao gồm department con)
        Set<Long> departmentIds = getAllDepartmentIds(departmentId);
        List<Long> departmentIdsList = new ArrayList<>(departmentIds);

        if (!hasChiHuyCucRole) {
            // Kiểm tra quyền truy cập department
            Long userDepartmentId = currentUser.getDepartment() != null ? currentUser.getDepartment().getId() : null;
            if (userDepartmentId == null) {
                return new PageImpl<>(Collections.emptyList(), pageable, 0);
            }

            Set<Long> userDepartmentIds = getAllDepartmentIds(userDepartmentId);
            if (!userDepartmentIds.contains(departmentId)) {
                return new PageImpl<>(Collections.emptyList(), pageable, 0);
            }
        }

        Page<Schedule> schedulesPage = scheduleRepository.findByDepartmentIdsAndYear(departmentIdsList, year, pageable);
        return schedulesPage.map(this::convertToDTO);
    }

    /**
     * Lấy một sự kiện theo ID
     */
    public Optional<ScheduleEventDTO> getEventById(Long id) {
        return scheduleEventRepository.findById(id)
                .map(this::convertEventToDTO);
    }

    /**
     * Lấy danh sách sự kiện theo các tham số
     */
    public List<ScheduleEventDTO> getScheduleEvents(LocalDate date, Long excludeId, Long departmentId) {
        List<ScheduleEvent> events;

        // Nếu có date, lọc theo ngày
        if (date != null) {
            if (departmentId != null) {
                events = scheduleEventRepository.findByDateAndDepartmentId(date, departmentId);
            } else {
                events = scheduleEventRepository.findByDate(date);
            }
        }
        // Nếu không có date nhưng có departmentId, lọc theo phòng ban
        else if (departmentId != null) {
            events = scheduleEventRepository.findByDepartmentId(departmentId);
        }
        // Trường hợp không có bất kỳ điều kiện nào
        else {
            events = scheduleEventRepository.findAll();
        }

        // Loại trừ sự kiện theo ID nếu có
        if (excludeId != null) {
            events = events.stream()
                    .filter(event -> !event.getId().equals(excludeId))
                    .collect(Collectors.toList());
        }

        return events.stream()
                .map(this::convertEventToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách lịch liên quan đến một lịch cụ thể
     */
    public List<ScheduleDTO> getRelatedSchedules(Long id) {
        // Lấy lịch hiện tại
        Optional<Schedule> currentSchedule = scheduleRepository.findById(id);

        if (currentSchedule.isEmpty()) {
            return Collections.emptyList();
        }

        Schedule schedule = currentSchedule.get();

        // Lấy các lịch cùng phòng ban và cùng thời kỳ
        List<Schedule> relatedSchedules;
        if (schedule.getDepartment() != null && schedule.getPeriod() != null) {
            relatedSchedules = scheduleRepository.findByDepartmentIdAndPeriodAndIdNot(
                    schedule.getDepartment().getId(),
                    schedule.getPeriod(),
                    id);
        }
        // Lấy các lịch cùng phòng ban nếu không có thời kỳ
        else if (schedule.getDepartment() != null) {
            relatedSchedules = scheduleRepository.findByDepartmentIdAndIdNot(
                    schedule.getDepartment().getId(),
                    id);
        }
        // Lấy các lịch cùng thời kỳ nếu không có phòng ban
        else if (schedule.getPeriod() != null) {
            relatedSchedules = scheduleRepository.findByPeriodAndIdNot(
                    schedule.getPeriod(),
                    id);
        }
        // Trường hợp không có cả phòng ban và thời kỳ, trả về danh sách trống
        else {
            relatedSchedules = Collections.emptyList();
        }

        return relatedSchedules.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Tạo lịch công việc mới
     */
    @Transactional
    public ScheduleDTO createSchedule(ScheduleDTO scheduleDTO, User currentUser) {
        Schedule schedule = convertToEntity(scheduleDTO);
        schedule.setCreatedBy(currentUser);

        // Tìm phòng ban
        if (scheduleDTO.getDepartmentId() != null) {
            Department department = departmentRepository.findById(scheduleDTO.getDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Không tìm thấy phòng ban với ID: " + scheduleDTO.getDepartmentId()));
            schedule.setDepartment(department);
        }

        schedule.setStatus("DRAFT");

        // Lưu lịch công việc
        Schedule savedSchedule = scheduleRepository.save(schedule);

        // Xử lý các sự kiện trong lịch
        if (scheduleDTO.getEvents() != null && !scheduleDTO.getEvents().isEmpty()) {
            List<ScheduleEvent> events = scheduleDTO.getEvents().stream()
                    .map(eventDTO -> {
                        ScheduleEvent event = convertEventToEntity(eventDTO);
                        event.setSchedule(savedSchedule);
                        return event;
                    })
                    .collect(Collectors.toList());

            savedSchedule.setEvents(events);
            scheduleRepository.save(savedSchedule);
        }

        return convertToDTO(savedSchedule);
    }

    /**
     * Cập nhật lịch công việc
     */
    @Transactional
    public ScheduleDTO updateSchedule(Long id, ScheduleDTO scheduleDTO, User currentUser) {
        Schedule existingSchedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy lịch công việc với ID: " + id));

        // Chỉ cho phép cập nhật nếu lịch đang ở trạng thái DRAFT hoặc người dùng là
        // admin
        if (!existingSchedule.getStatus().equals("DRAFT") && !isAdmin(currentUser)) {
            throw new IllegalStateException(
                    "Không thể cập nhật lịch công việc ở trạng thái " + existingSchedule.getStatus());
        }

        // Cập nhật thông tin cơ bản
        existingSchedule.setTitle(scheduleDTO.getTitle());
        existingSchedule.setDescription(scheduleDTO.getDescription());

        // Cập nhật phòng ban nếu có thay đổi
        if (scheduleDTO.getDepartmentId() != null &&
                (existingSchedule.getDepartment() == null
                        || !existingSchedule.getDepartment().getId().equals(scheduleDTO.getDepartmentId()))) {
            Department department = departmentRepository.findById(scheduleDTO.getDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Không tìm thấy phòng ban với ID: " + scheduleDTO.getDepartmentId()));
            existingSchedule.setDepartment(department);
        }

        // Cập nhật các sự kiện
        if (scheduleDTO.getEvents() != null) {
            // Xóa các sự kiện hiện có
            existingSchedule.getEvents().clear();

            // Thêm các sự kiện mới
            List<ScheduleEvent> events = scheduleDTO.getEvents().stream()
                    .map(eventDTO -> {
                        ScheduleEvent event = convertEventToEntity(eventDTO);
                        event.setSchedule(existingSchedule);
                        return event;
                    })
                    .collect(Collectors.toList());

            existingSchedule.getEvents().addAll(events);
        }

        Schedule updatedSchedule = scheduleRepository.save(existingSchedule);
        return convertToDTO(updatedSchedule);
    }

    /**
     * Gửi lịch công việc để phê duyệt
     */
    @Transactional
    public ScheduleDTO submitSchedule(Long id, User currentUser) {
        Schedule existingSchedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy lịch công việc với ID: " + id));

        // Kiểm tra quyền
        if (!isCreatorOrAdmin(existingSchedule, currentUser)) {
            throw new IllegalStateException("Bạn không có quyền gửi lịch công việc này để phê duyệt");
        }

        // Kiểm tra trạng thái hiện tại
        if (!existingSchedule.getStatus().equals("DRAFT")) {
            throw new IllegalStateException("Chỉ có thể gửi lịch công việc đang ở trạng thái DRAFT");
        }

        // Cập nhật trạng thái
        existingSchedule.setStatus("SUBMITTED");

        Schedule updatedSchedule = scheduleRepository.save(existingSchedule);
        return convertToDTO(updatedSchedule);
    }

    /**
     * Phê duyệt hoặc từ chối lịch công việc
     */
    @Transactional
    public ScheduleDTO approveSchedule(Long id, Boolean approved, String comments, User currentUser) {
        Schedule existingSchedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy lịch công việc với ID: " + id));

        // Kiểm tra quyền
        if (!isAdmin(currentUser)) {
            throw new IllegalStateException("Bạn không có quyền phê duyệt lịch công việc");
        }

        // Kiểm tra trạng thái hiện tại
        if (!existingSchedule.getStatus().equals("SUBMITTED")) {
            throw new IllegalStateException("Chỉ có thể phê duyệt lịch công việc đang ở trạng thái SUBMITTED");
        }

        // Cập nhật trạng thái
        existingSchedule.setStatus(approved ? "APPROVED" : "REJECTED");
        existingSchedule.setApprovalComments(comments);
        existingSchedule.setApprovalDate(LocalDateTime.now());
        existingSchedule.setApprovedBy(currentUser);

        Schedule updatedSchedule = scheduleRepository.save(existingSchedule);
        return convertToDTO(updatedSchedule);
    }

    /**
     * Xóa lịch công việc
     */
    @Transactional
    public boolean deleteSchedule(Long id, User currentUser) {
        Schedule existingSchedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy lịch công việc với ID: " + id));

        // Kiểm tra quyền
        if (!isCreatorOrAdmin(existingSchedule, currentUser)) {
            throw new IllegalStateException("Bạn không có quyền xóa lịch công việc này");
        }

        scheduleRepository.delete(existingSchedule);
        return true;
    }

    /**
     * Lấy danh sách sự kiện trong ngày
     */
    public List<ScheduleEventDTO> getDailyEvents(LocalDate date, Long departmentId, Long userId) {
        List<ScheduleEvent> events;

        if (departmentId != null) {
            events = scheduleEventRepository.findByDateAndDepartmentId(date, departmentId);
        } else if (userId != null) {
            events = scheduleEventRepository.findByDateAndParticipant(date, userId);
        } else {
            events = scheduleEventRepository.findByDate(date);
        }

        return events.stream()
                .map(this::convertEventToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách sự kiện trong tháng
     */
    public Map<LocalDate, List<ScheduleEventDTO>> getMonthlyEvents(int year, int month, Long departmentId,
            Long userId) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate firstDay = yearMonth.atDay(1);
        LocalDate lastDay = yearMonth.atEndOfMonth();

        List<ScheduleEvent> events;

        if (departmentId != null) {
            events = scheduleEventRepository.findByDepartmentId(departmentId).stream()
                    .filter(e -> !e.getDate().isBefore(firstDay) && !e.getDate().isAfter(lastDay))
                    .collect(Collectors.toList());
        } else if (userId != null) {
            events = scheduleEventRepository.findByParticipantId(userId).stream()
                    .filter(e -> !e.getDate().isBefore(firstDay) && !e.getDate().isAfter(lastDay))
                    .collect(Collectors.toList());
        } else {
            events = scheduleEventRepository.findByDateRange(firstDay, lastDay);
        }

        Map<LocalDate, List<ScheduleEventDTO>> result = new HashMap<>();
        events.forEach(event -> {
            result.computeIfAbsent(event.getDate(), k -> new ArrayList<>())
                    .add(convertEventToDTO(event));
        });

        return result;
    }

    /**
     * Cập nhật trạng thái tham dự sự kiện
     */
    @Transactional
    public Map<String, Object> updateAttendanceStatus(Long eventId, Long userId, String status, String comments) {
        ScheduleEvent event = scheduleEventRepository.findById(eventId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy sự kiện với ID: " + eventId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy người dùng với ID: " + userId));

        // Kiểm tra xem người dùng có trong danh sách tham dự không
        boolean isParticipant = event.getParticipants().contains(userId);
        if (!isParticipant) {
            throw new IllegalStateException("Người dùng không nằm trong danh sách tham dự sự kiện");
        }

        // Lưu trạng thái tham dự vào cơ sở dữ liệu
        Optional<ScheduleEventAttendance> existingAttendance = scheduleEventAttendanceRepository
                .findByEventIdAndUserId(eventId, userId);

        ScheduleEventAttendance attendance;
        if (existingAttendance.isPresent()) {
            // Cập nhật trạng thái hiện có
            attendance = existingAttendance.get();
            attendance.setStatus(status);
            attendance.setComments(comments);
            attendance.setUpdatedAt(LocalDateTime.now());
        } else {
            // Tạo mới
            attendance = new ScheduleEventAttendance();
            attendance.setEvent(event);
            attendance.setUser(user);
            attendance.setStatus(status);
            attendance.setComments(comments);
        }

        ScheduleEventAttendance savedAttendance = scheduleEventAttendanceRepository.save(attendance);

        // Trả về thông tin cập nhật
        Map<String, Object> result = new HashMap<>();
        result.put("eventId", eventId);
        result.put("userId", userId);
        result.put("status", savedAttendance.getStatus());
        result.put("comments", savedAttendance.getComments());
        result.put("updatedAt", savedAttendance.getUpdatedAt());

        return result;
    }

    /**
     * Chuyển đổi từ Schedule sang ScheduleDTO với status mapping cho frontend
     */
    private ScheduleDTO convertToDTO(Schedule schedule) {
        ScheduleDTO dto = new ScheduleDTO();
        dto.setId(schedule.getId());
        dto.setTitle(schedule.getTitle());
        dto.setDescription(schedule.getDescription());

        if (schedule.getDepartment() != null) {
            dto.setDepartmentId(schedule.getDepartment().getId());
            dto.setDepartmentName(schedule.getDepartment().getName());
        }

        // Map backend status to frontend status
        ScheduleStatus status = ScheduleStatus.fromBackendStatus(schedule.getStatus());
        dto.setStatus(status != null ? status.getFrontendCode() : schedule.getStatus());

        dto.setPeriod(schedule.getPeriod());
        if (schedule.getCreatedBy() != null) {
            dto.setCreatedById(schedule.getCreatedBy().getId());
            dto.setCreatedByName(schedule.getCreatedBy().getFullName());
        }

        if (schedule.getApprovedBy() != null) {
            dto.setApprovedById(schedule.getApprovedBy().getId());
            dto.setApprovedByName(schedule.getApprovedBy().getFullName());
        }

        dto.setApprovalDate(schedule.getApprovalDate());
        dto.setApprovalComments(schedule.getApprovalComments());
        dto.setCreatedAt(schedule.getCreatedAt());
        dto.setUpdatedAt(schedule.getUpdatedAt());

        if (schedule.getEvents() != null && !schedule.getEvents().isEmpty()) {
            dto.setEvents(schedule.getEvents().stream()
                    .map(this::convertEventToDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    /**
     * Chuyển đổi từ ScheduleDTO sang Schedule
     */
    private Schedule convertToEntity(ScheduleDTO dto) {
        Schedule schedule = new Schedule();
        schedule.setTitle(dto.getTitle());
        schedule.setDescription(dto.getDescription());
        schedule.setStatus(dto.getStatus() != null ? dto.getStatus() : "DRAFT");
        schedule.setPeriod(dto.getPeriod());
        // Phòng ban và ngư ời dùng sẽ được thiết lập bên ngoài phương thức này

        return schedule;
    }

    /**
     * Chuyển đổi từ ScheduleEvent sang ScheduleEventDTO
     */
    private ScheduleEventDTO convertEventToDTO(ScheduleEvent event) {
        ScheduleEventDTO dto = new ScheduleEventDTO();
        dto.setId(event.getId());
        dto.setTitle(event.getTitle());
        dto.setDescription(event.getDescription());
        dto.setDate(event.getDate());
        dto.setStartTime(event.getStartTime());
        dto.setEndTime(event.getEndTime());
        dto.setLocation(event.getLocation());
        dto.setType(event.getType());

        if (event.getParticipants() != null) {
            dto.setParticipants(new HashSet<>(event.getParticipants()));

            // Lấy tên của người tham dự
            Set<String> participantNames = event.getParticipants().stream()
                    .map(userId -> userRepository.findById(userId)
                            .map(User::getFullName)
                            .orElse("Unknown User"))
                    .collect(Collectors.toSet());
            dto.setParticipantNames(participantNames);
        }

        if (event.getSchedule() != null) {
            dto.setScheduleId(event.getSchedule().getId());
        }

        dto.setCreatedAt(event.getCreatedAt());
        dto.setUpdatedAt(event.getUpdatedAt());

        return dto;
    }

    /**
     * Chuyển đổi từ ScheduleEventDTO sang ScheduleEvent
     */
    private ScheduleEvent convertEventToEntity(ScheduleEventDTO dto) {
        ScheduleEvent event = new ScheduleEvent();
        event.setTitle(dto.getTitle());
        event.setDescription(dto.getDescription());
        event.setDate(dto.getDate());
        event.setStartTime(dto.getStartTime());
        event.setEndTime(dto.getEndTime());
        event.setLocation(dto.getLocation());
        event.setType(dto.getType() != null ? dto.getType() : "MEETING");

        if (dto.getParticipants() != null) {
            event.setParticipants(new HashSet<>(dto.getParticipants()));
        }

        return event;
    }

    /**
     * Kiểm tra xem người dùng có phải là admin hay không
     */
    private boolean isAdmin(User user) {
        return user.getRoles().stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase("ROLE_ADMIN"));
    }

    /**
     * Kiểm tra xem người dùng có phải là người tạo hoặc admin hay không
     */
    private boolean isCreatorOrAdmin(Schedule schedule, User user) {
        if (isAdmin(user)) {
            return true;
        }

        return schedule.getCreatedBy() != null && schedule.getCreatedBy().getId().equals(user.getId());
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
}