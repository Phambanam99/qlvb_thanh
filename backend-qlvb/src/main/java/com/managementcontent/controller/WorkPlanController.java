package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.dto.WorkPlanDTO;
import com.managementcontent.dto.WorkPlanTaskDTO;
import com.managementcontent.model.User;
import com.managementcontent.model.enums.WorkPlanStatus;
import com.managementcontent.repository.UserRepository;
import com.managementcontent.service.WorkPlanService;
import com.managementcontent.service.WorkPlanDemoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/work-plans")
@RequiredArgsConstructor
@Tag(name = "WorkPlan", description = "API quản lý kế hoạch công việc")
public class WorkPlanController {

        private final WorkPlanService workPlanService;
        private final UserRepository userRepository;
        private final WorkPlanDemoService workPlanDemoService;

        @GetMapping
        @Operation(summary = "Lấy danh sách kế hoạch công việc", description = "Trả về danh sách kế hoạch công việc, có thể lọc theo phòng ban và trạng thái")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách kế hoạch thành công"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<List<WorkPlanDTO>>> getAllWorkPlans(
                        @Parameter(description = "ID phòng ban") @RequestParam(required = false) Long departmentId,
                        @Parameter(description = "Trạng thái kế hoạch (draft, pending, approved, rejected, in_progress, completed)") @RequestParam(required = false) String status,
                        @Parameter(description = "Ngày bắt đầu") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @Parameter(description = "Ngày kết thúc") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

                try {
                        List<WorkPlanDTO> workPlans;
                        
                        // Sử dụng các methods cụ thể thay vì method với nhiều tham số
                        if (departmentId != null && (startDate != null || endDate != null)) {
                                workPlans = workPlanService.getWorkPlansByDepartmentAndDateRange(departmentId, startDate, endDate);
                        } else if (departmentId != null && status != null) {
                                workPlans = workPlanService.getWorkPlansByDepartmentAndStatus(departmentId, status);
                        } else if (departmentId != null) {
                                workPlans = workPlanService.getWorkPlansByDepartment(departmentId);
                        } else if (startDate != null || endDate != null) {
                                workPlans = workPlanService.getWorkPlansByDateRange(startDate, endDate);
                        } else if (status != null) {
                                workPlans = workPlanService.getWorkPlansByStatus(status);
                        } else {
                                workPlans = workPlanService.getAllWorkPlans();
                        }
                        
                        // Lọc thêm theo status nếu có và chưa được lọc
                        if (status != null && departmentId != null && (startDate != null || endDate != null)) {
                                String finalStatus = status;
                                workPlans = workPlans.stream()
                                        .filter(wp -> finalStatus.equals(wp.getStatus()))
                                        .collect(Collectors.toList());
                        }
                        
                        return ResponseEntity.ok(ResponseDTO.success(workPlans));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách kế hoạch: " + e.getMessage()));
                }
        }

        @GetMapping("/paged")
        @Operation(summary = "Lấy danh sách kế hoạch công việc với phân trang", description = "Trả về danh sách kế hoạch công việc với phân trang, có thể lọc theo phòng ban và trạng thái")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách kế hoạch thành công"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Page<WorkPlanDTO>>> getAllWorkPlansWithPagination(
                        @Parameter(description = "ID phòng ban") @RequestParam(required = false) Long departmentId,
                        @Parameter(description = "Trạng thái kế hoạch (draft, pending, approved, rejected, in_progress, completed)") @RequestParam(required = false) String status,
                        @Parameter(description = "Ngày bắt đầu") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @Parameter(description = "Ngày kết thúc") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                        Pageable pageable) {

                try {

                        Page<WorkPlanDTO> workPlans;
                        
                        // Sử dụng các methods cụ thể với pagination
                        if (departmentId != null && status != null) {
                                workPlans = workPlanService.getWorkPlansByDepartmentAndStatus(departmentId, status, pageable);
                        } else if (departmentId != null) {
                                workPlans = workPlanService.getWorkPlansByDepartment(departmentId, pageable);
                        } else if (startDate != null || endDate != null) {
                                workPlans = workPlanService.getWorkPlansByDateRange(startDate, endDate, pageable);
                        } else if (status != null) {
                                workPlans = workPlanService.getWorkPlansByStatus(status, pageable);
                        } else {
                                workPlans = workPlanService.getAllWorkPlans(pageable);
                        }
                        
                        return ResponseEntity.ok(ResponseDTO.success(workPlans));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách kế hoạch: " + e.getMessage()));
                }
        }

        @GetMapping("/all")
        @Operation(summary = "Lấy tất cả kế hoạch công việc với phân trang", description = "Trả về tất cả kế hoạch công việc mà người dùng có quyền truy cập với phân trang")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách kế hoạch thành công"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Page<WorkPlanDTO>>> getAllWorkPlansSimple(Pageable pageable) {
                try {
                        Page<WorkPlanDTO> workPlans = workPlanService.getAllWorkPlans(pageable);
                        return ResponseEntity.ok(ResponseDTO.success(workPlans));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách kế hoạch: " + e.getMessage()));
                }
        }

        @GetMapping("/department/{departmentId}")
        @Operation(summary = "Lấy danh sách kế hoạch công việc theo phòng ban", description = "Trả về danh sách kế hoạch công việc của một phòng ban cụ thể với phân trang")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách kế hoạch theo phòng ban thành công"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập"),
                        @ApiResponse(responseCode = "400", description = "ID phòng ban không hợp lệ")
        })
        public ResponseEntity<ResponseDTO<Page<WorkPlanDTO>>> getWorkPlansByDepartmentId(
                        @Parameter(description = "ID của phòng ban") @PathVariable Long departmentId,
                        Pageable pageable) {
                try {
                        Page<WorkPlanDTO> workPlans = workPlanService.getWorkPlansByDepartment(departmentId, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(workPlans));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách kế hoạch theo phòng ban: "
                                                        + e.getMessage()));
                }
        }

        @GetMapping("/week/{year}/{week}")
        @Operation(summary = "Lấy danh sách kế hoạch công việc theo tuần", description = "Trả về danh sách kế hoạch công việc trong tuần cụ thể với phân trang")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách kế hoạch theo tuần thành công"),
                        @ApiResponse(responseCode = "400", description = "Tham số không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Page<WorkPlanDTO>>> getWorkPlansByWeek(
                        @Parameter(description = "Năm (VD: 2024, 2025)") @PathVariable int year,
                        @Parameter(description = "Tuần trong năm (1-53)") @PathVariable int week,
                        Pageable pageable) {
                try {
                        if (year < 1900 || year > 2100) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Năm phải trong khoảng 1900-2100"));
                        }
                        if (week < 1 || week > 53) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Tuần phải trong khoảng 1-53"));
                        }
                        
                        Page<WorkPlanDTO> workPlans = workPlanService.getWorkPlansByWeek(year, week, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(workPlans));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách kế hoạch theo tuần: "
                                                        + e.getMessage()));
                }
        }

        @GetMapping("/month/{year}/{month}")
        @Operation(summary = "Lấy danh sách kế hoạch công việc theo tháng", description = "Trả về danh sách kế hoạch công việc trong tháng cụ thể với phân trang")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách kế hoạch theo tháng thành công"),
                        @ApiResponse(responseCode = "400", description = "Tham số không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Page<WorkPlanDTO>>> getWorkPlansByMonth(
                        @Parameter(description = "Năm (VD: 2024, 2025)") @PathVariable int year,
                        @Parameter(description = "Tháng (1-12)") @PathVariable int month,
                        Pageable pageable) {
                try {
                        if (year < 1900 || year > 2100) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Năm phải trong khoảng 1900-2100"));
                        }
                        if (month < 1 || month > 12) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Tháng phải trong khoảng 1-12"));
                        }
                        
                        Page<WorkPlanDTO> workPlans = workPlanService.getWorkPlansByMonth(year, month, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(workPlans));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách kế hoạch theo tháng: "
                                                        + e.getMessage()));
                }
        }

        @GetMapping("/year/{year}")
        @Operation(summary = "Lấy danh sách kế hoạch công việc theo năm", description = "Trả về danh sách kế hoạch công việc trong năm cụ thể với phân trang")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách kế hoạch theo năm thành công"),
                        @ApiResponse(responseCode = "400", description = "Tham số không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Page<WorkPlanDTO>>> getWorkPlansByYear(
                        @Parameter(description = "Năm (VD: 2024, 2025)") @PathVariable int year,
                        Pageable pageable) {
                try {
                        if (year < 1900 || year > 2100) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Năm phải trong khoảng 1900-2100"));
                        }
                        
                        Page<WorkPlanDTO> workPlans = workPlanService.getWorkPlansByYear(year, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(workPlans));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách kế hoạch theo năm: "
                                                        + e.getMessage()));
                }
        }

        @GetMapping("/department/{departmentId}/week/{year}/{week}")
        @Operation(summary = "Lấy danh sách kế hoạch công việc theo phòng ban và tuần", description = "Trả về danh sách kế hoạch công việc của phòng ban trong tuần cụ thể với phân trang")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách kế hoạch theo phòng ban và tuần thành công"),
                        @ApiResponse(responseCode = "400", description = "Tham số không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Page<WorkPlanDTO>>> getWorkPlansByDepartmentAndWeek(
                        @Parameter(description = "ID của phòng ban") @PathVariable Long departmentId,
                        @Parameter(description = "Năm (VD: 2024, 2025)") @PathVariable int year,
                        @Parameter(description = "Tuần trong năm (1-53)") @PathVariable int week,
                        Pageable pageable) {
                try {
                        if (year < 1900 || year > 2100) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Năm phải trong khoảng 1900-2100"));
                        }
                        if (week < 1 || week > 53) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Tuần phải trong khoảng 1-53"));
                        }
                        
                        Page<WorkPlanDTO> workPlans = workPlanService.getWorkPlansByDepartmentAndWeek(departmentId, year, week, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(workPlans));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách kế hoạch theo phòng ban và tuần: "
                                                        + e.getMessage()));
                }
        }

        @GetMapping("/department/{departmentId}/month/{year}/{month}")
        @Operation(summary = "Lấy danh sách kế hoạch công việc theo phòng ban và tháng", description = "Trả về danh sách kế hoạch công việc của phòng ban trong tháng cụ thể với phân trang")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách kế hoạch theo phòng ban và tháng thành công"),
                        @ApiResponse(responseCode = "400", description = "Tham số không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Page<WorkPlanDTO>>> getWorkPlansByDepartmentAndMonth(
                        @Parameter(description = "ID của phòng ban") @PathVariable Long departmentId,
                        @Parameter(description = "Năm (VD: 2024, 2025)") @PathVariable int year,
                        @Parameter(description = "Tháng (1-12)") @PathVariable int month,
                        Pageable pageable) {
                try {
                        if (year < 1900 || year > 2100) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Năm phải trong khoảng 1900-2100"));
                        }
                        if (month < 1 || month > 12) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Tháng phải trong khoảng 1-12"));
                        }
                        
                        Page<WorkPlanDTO> workPlans = workPlanService.getWorkPlansByDepartmentAndMonth(departmentId, year, month, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(workPlans));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách kế hoạch theo phòng ban và tháng: "
                                                        + e.getMessage()));
                }
        }

        @GetMapping("/department/{departmentId}/year/{year}")
        @Operation(summary = "Lấy danh sách kế hoạch công việc theo phòng ban và năm", description = "Trả về danh sách kế hoạch công việc của phòng ban trong năm cụ thể với phân trang")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách kế hoạch theo phòng ban và năm thành công"),
                        @ApiResponse(responseCode = "400", description = "Tham số không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Page<WorkPlanDTO>>> getWorkPlansByDepartmentAndYear(
                        @Parameter(description = "ID của phòng ban") @PathVariable Long departmentId,
                        @Parameter(description = "Năm (VD: 2024, 2025)") @PathVariable int year,
                        Pageable pageable) {
                try {
                        if (year < 1900 || year > 2100) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Năm phải trong khoảng 1900-2100"));
                        }
                        
                        Page<WorkPlanDTO> workPlans = workPlanService.getWorkPlansByDepartmentAndYear(departmentId, year, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(workPlans));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách kế hoạch theo phòng ban và năm: "
                                                        + e.getMessage()));
                }
        }

        @GetMapping("/{id}")
        @Operation(summary = "Lấy chi tiết kế hoạch công việc", description = "Trả về thông tin chi tiết của một kế hoạch công việc cụ thể")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy chi tiết kế hoạch thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy kế hoạch"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<WorkPlanDTO>> getWorkPlanById(@PathVariable Long id) {
                try {
                        Optional<WorkPlanDTO> workPlan = workPlanService.getWorkPlanById(id);
                        return workPlan.map(plan -> ResponseEntity.ok(ResponseDTO.success(plan)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy kế hoạch")));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy chi tiết kế hoạch: " + e.getMessage()));
                }
        }

        @PostMapping
        @Operation(summary = "Tạo kế hoạch công việc mới", description = "Tạo một kế hoạch công việc mới")
        @ApiResponses({
                        @ApiResponse(responseCode = "201", description = "Tạo kế hoạch thành công"),
                        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền tạo kế hoạch")
        })
        public ResponseEntity<ResponseDTO<WorkPlanDTO>> createWorkPlan(
                        @RequestBody WorkPlanDTO workPlanDTO) {
                try {
                        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                        String username = auth.getName();
                        User currentUser = userRepository.findByName(username).orElse(null);
                        WorkPlanDTO createdWorkPlan = workPlanService.createWorkPlan(workPlanDTO, currentUser);
                        return ResponseEntity.status(HttpStatus.CREATED)
                                        .body(ResponseDTO.success("Tạo kế hoạch thành công", createdWorkPlan));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi tạo kế hoạch: " + e.getMessage()));
                }
        }

        @PostMapping("/force-update-statuses")
        @Operation(summary = "Force update tất cả work plan statuses", description = "Kiểm tra và cập nhật trạng thái cho tất cả kế hoạch dựa trên tiến độ tasks")
        @ApiResponses({
                @ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
                @ApiResponse(responseCode = "403", description = "Không có quyền thực hiện")
        })
        public ResponseEntity<ResponseDTO<String>> forceUpdateAllStatuses() {
                try {
                        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                        String username = auth.getName();
                        User currentUser = userRepository.findByName(username).orElse(null);
                        
                        // Chỉ admin mới có quyền thực hiện
                        if (currentUser == null || !currentUser.getRoles().stream()
                                .anyMatch(role -> role.getName().contains("ADMIN"))) {
                                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                        .body(ResponseDTO.error("Chỉ admin mới có quyền thực hiện chức năng này"));
                        }
                        
                        workPlanService.forceUpdateAllWorkPlanStatuses();
                        
                        return ResponseEntity.ok(ResponseDTO.success("Đã cập nhật trạng thái cho tất cả kế hoạch thành công", null));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                .body(ResponseDTO.error("Lỗi khi cập nhật trạng thái: " + e.getMessage()));
                }
        }

        @PutMapping("/{id}")
        @Operation(summary = "Cập nhật kế hoạch công việc", description = "Cập nhật thông tin một kế hoạch công việc đã tồn tại")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Cập nhật kế hoạch thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy kế hoạch"),
                        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền cập nhật kế hoạch")
        })
        public ResponseEntity<ResponseDTO<WorkPlanDTO>> updateWorkPlan(
                        @PathVariable Long id,
                        @RequestBody WorkPlanDTO workPlanDTO) {
                try {
                        Optional<WorkPlanDTO> updatedWorkPlan = workPlanService.updateWorkPlan(id, workPlanDTO);
                        return updatedWorkPlan
                                        .map(plan -> ResponseEntity
                                                        .ok(ResponseDTO.success("Cập nhật kế hoạch thành công", plan)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy kế hoạch")));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi cập nhật kế hoạch: " + e.getMessage()));
                }
        }

        @PatchMapping("/{id}/submit")
        @Operation(summary = "Gửi kế hoạch để phê duyệt", description = "Chuyển trạng thái kế hoạch sang SUBMITTED để đợi phê duyệt")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Gửi thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy kế hoạch"),
                        @ApiResponse(responseCode = "400", description = "Không thể gửi (ví dụ: kế hoạch không ở trạng thái DRAFT)"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền gửi kế hoạch")
        })
        public ResponseEntity<ResponseDTO<WorkPlanDTO>> submitWorkPlan(
                        @PathVariable Long id) {
                try {
                        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                        String username = auth.getName();
                        User currentUser = userRepository.findByName(username).orElse(null);
                        System.out.println("currentUser = " + currentUser);
                        Optional<WorkPlanDTO> submittedWorkPlan = workPlanService.submitWorkPlan(id, currentUser);
                        return submittedWorkPlan
                                        .map(plan -> ResponseEntity
                                                        .ok(ResponseDTO.success("Gửi kế hoạch thành công", plan)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy kế hoạch")));
                } catch (IllegalStateException e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Không thể gửi kế hoạch: " + e.getMessage()));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi gửi kế hoạch: " + e.getMessage()));
                }
        }

        @PatchMapping("/{id}/approve")
        @Operation(summary = "Phê duyệt hoặc từ chối kế hoạch", description = "Phê duyệt hoặc từ chối kế hoạch đã được gửi")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Phê duyệt/từ chối thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy kế hoạch"),
                        @ApiResponse(responseCode = "400", description = "Không thể phê duyệt (ví dụ: kế hoạch không ở trạng thái SUBMITTED)"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền phê duyệt kế hoạch")
        })
        public ResponseEntity<ResponseDTO<WorkPlanDTO>> approveWorkPlan(
                        @PathVariable Long id,
                        @RequestBody Map<String, Object> approvalData) {
                try {
                        Boolean approved = (Boolean) approvalData.get("approved");
                        String comments = (String) approvalData.get("comments");

                        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                        String username = auth.getName();
                        User currentUser = userRepository.findByName(username).orElse(null);
                        Optional<WorkPlanDTO> workPlanDTO = workPlanService.approveOrRejectWorkPlan(id, approved,
                                        comments,
                                        currentUser);
                        String message = approved ? "Phê duyệt kế hoạch thành công" : "Từ chối kế hoạch thành công";
                        return workPlanDTO
                                        .map(plan -> ResponseEntity.ok(ResponseDTO.success(message, plan)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy kế hoạch")));
                } catch (IllegalStateException e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Không thể thực hiện phê duyệt: " + e.getMessage()));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi phê duyệt kế hoạch: " + e.getMessage()));
                }
        }

        @PatchMapping("/{id}/start")
        @Operation(summary = "Bắt đầu thực hiện kế hoạch", description = "Chuyển kế hoạch từ trạng thái APPROVED sang IN_PROGRESS")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Bắt đầu kế hoạch thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy kế hoạch"),
                        @ApiResponse(responseCode = "400", description = "Không thể bắt đầu kế hoạch (chưa được phê duyệt)"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền bắt đầu kế hoạch")
        })
        public ResponseEntity<ResponseDTO<WorkPlanDTO>> startWorkPlan(@PathVariable Long id) {
                try {
                        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                        String username = auth.getName();
                        User currentUser = userRepository.findByName(username).orElse(null);
                        
                        Optional<WorkPlanDTO> startedWorkPlan = workPlanService.startWorkPlan(id, currentUser);
                        return startedWorkPlan
                                        .map(plan -> ResponseEntity.ok(ResponseDTO.success("Bắt đầu kế hoạch thành công", plan)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy kế hoạch")));
                } catch (IllegalStateException e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Không thể bắt đầu kế hoạch: " + e.getMessage()));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi bắt đầu kế hoạch: " + e.getMessage()));
                }
        }

        @PatchMapping("/{id}/complete")
        @Operation(summary = "Hoàn thành kế hoạch", description = "Chuyển kế hoạch từ trạng thái IN_PROGRESS sang COMPLETED")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Hoàn thành kế hoạch thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy kế hoạch"),
                        @ApiResponse(responseCode = "400", description = "Không thể hoàn thành kế hoạch (chưa bắt đầu hoặc còn task chưa hoàn thành)"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền hoàn thành kế hoạch")
        })
        public ResponseEntity<ResponseDTO<WorkPlanDTO>> completeWorkPlan(@PathVariable Long id) {
                try {
                        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                        String username = auth.getName();
                        User currentUser = userRepository.findByName(username).orElse(null);
                        
                        Optional<WorkPlanDTO> completedWorkPlan = workPlanService.completeWorkPlan(id, currentUser);
                        return completedWorkPlan
                                        .map(plan -> ResponseEntity.ok(ResponseDTO.success("Hoàn thành kế hoạch thành công", plan)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy kế hoạch")));
                } catch (IllegalStateException e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Không thể hoàn thành kế hoạch: " + e.getMessage()));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi hoàn thành kế hoạch: " + e.getMessage()));
                }
        }

        @PatchMapping("/{id}/tasks/{taskId}/status")
        @Operation(summary = "Cập nhật trạng thái nhiệm vụ", description = "Cập nhật trạng thái và tiến độ của một nhiệm vụ trong kế hoạch")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Cập nhật trạng thái nhiệm vụ thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy kế hoạch hoặc nhiệm vụ"),
                        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền cập nhật nhiệm vụ")
        })
        public ResponseEntity<ResponseDTO<WorkPlanTaskDTO>> updateTaskStatus(
                        @PathVariable Long id,
                        @PathVariable Long taskId,
                        @RequestBody Map<String, Object> statusUpdate) {
                try {
                        String status = (String) statusUpdate.get("status");
                        Integer progress = (Integer) statusUpdate.get("progress");
                        String comments = (String) statusUpdate.get("comments");

                        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                        String username = auth.getName();
                        User currentUser = userRepository.findByName(username).orElse(null);

                        Optional<WorkPlanTaskDTO> updatedTask = workPlanService.updateTaskStatus(taskId, status,
                                        progress, comments, currentUser);
                        return updatedTask
                                        .map(task -> ResponseEntity
                                                        .ok(ResponseDTO.success("Cập nhật trạng thái nhiệm vụ thành công", task)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy nhiệm vụ")));
                } catch (Exception e) {
                        return ResponseEntity.badRequest().body(
                                        ResponseDTO.error("Lỗi khi cập nhật trạng thái nhiệm vụ: " + e.getMessage()));
                }
        }

        @DeleteMapping("/{id}")
        @Operation(summary = "Xóa kế hoạch công việc", description = "Xóa một kế hoạch công việc")
        @ApiResponses({
                        @ApiResponse(responseCode = "204", description = "Xóa kế hoạch thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy kế hoạch"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền xóa kế hoạch")
        })
        public ResponseEntity<ResponseDTO<String>> deleteWorkPlan(
                        @PathVariable Long id) {
                try {
                        workPlanService.deleteWorkPlan(id);
                        return ResponseEntity.ok(ResponseDTO.success("Xóa kế hoạch thành công"));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(ResponseDTO.error("Không thể xóa kế hoạch: " + e.getMessage()));
                }
        }

        /**
         * Tạo demo work plans cho tất cả phòng ban
         */
        @Operation(summary = "Tạo demo work plans", 
                   description = "Tạo 100 kế hoạch công việc demo cho mỗi phòng ban với nội dung đa dạng")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tạo dữ liệu demo thành công"),
            @ApiResponse(responseCode = "500", description = "Lỗi khi tạo dữ liệu demo")
        })
        @PostMapping("/demo/create")
        public ResponseEntity<ResponseDTO<String>> createDemoWorkPlans() {
                try {
                        workPlanDemoService.createDemoWorkPlans();
                        return ResponseEntity.ok(ResponseDTO.success("Đã tạo thành công demo work plans cho tất cả phòng ban"));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ResponseDTO.error("Lỗi khi tạo dữ liệu demo: " + e.getMessage()));
                }
        }

        /**
         * Kiểm tra số lượng work plans hiện có
         */
        @Operation(summary = "Kiểm tra số lượng work plans", 
                   description = "Trả về tổng số kế hoạch công việc hiện có trong hệ thống")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy thông tin thành công")
        })
        @GetMapping("/demo/count")
        public ResponseEntity<ResponseDTO<Long>> countWorkPlans() {
                try {
                        long count = workPlanDemoService.countTotalWorkPlans();
                        return ResponseEntity.ok(ResponseDTO.success(count));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ResponseDTO.error("Lỗi khi đếm work plans: " + e.getMessage()));
                }
        }
}