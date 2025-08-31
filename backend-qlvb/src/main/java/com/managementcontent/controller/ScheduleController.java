package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.dto.ScheduleDTO;
import com.managementcontent.dto.ScheduleEventDTO;
import com.managementcontent.model.User;
import com.managementcontent.service.ScheduleService;
import com.managementcontent.service.ScheduleDemoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
@Tag(name = "Schedule", description = "API quản lý lịch công việc")
public class ScheduleController {

        private final ScheduleService scheduleService;
        private final ScheduleDemoService scheduleDemoService;

        @GetMapping
        @Operation(summary = "Lấy danh sách lịch công việc", description = "Trả về danh sách lịch công việc, có thể lọc theo phòng ban và trạng thái")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách lịch thành công"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Page<ScheduleDTO>>> getSchedules(
                        @Parameter(description = "ID phòng ban") @RequestParam(required = false) Long departmentId,
                        @Parameter(description = "Trạng thái lịch (DRAFT, SUBMITTED, APPROVED, REJECTED)") @RequestParam(required = false) String status,
                        @Parameter(description = "Từ ngày") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
                        @Parameter(description = "Đến ngày") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
                        Pageable pageable) {

                try {
                        Page<ScheduleDTO> schedules = scheduleService.getSchedules(departmentId, status, fromDate,
                                        toDate, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(schedules));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy danh sách lịch công việc: " + e.getMessage()));
                }
        }

        @GetMapping("/{id}")
        @Operation(summary = "Lấy chi tiết lịch công việc", description = "Trả về thông tin chi tiết của một lịch công việc cụ thể")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy chi tiết lịch thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy lịch"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<ScheduleDTO>> getScheduleById(@PathVariable Long id) {
                try {
                        Optional<ScheduleDTO> schedule = scheduleService.getScheduleById(id);
                        return schedule.map(s -> ResponseEntity.ok(ResponseDTO.success(s)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy lịch công việc")));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy chi tiết lịch công việc: " + e.getMessage()));
                }
        }

        @GetMapping("/all")
        @Operation(summary = "Lấy tất cả lịch công việc với phân trang", description = "Trả về tất cả lịch công việc mà người dùng có quyền truy cập với phân trang")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách lịch thành công"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Page<ScheduleDTO>>> getAllSchedules(Pageable pageable) {
                try {
                        Page<ScheduleDTO> schedules = scheduleService.getAllSchedules(pageable);
                        return ResponseEntity.ok(ResponseDTO.success(schedules));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách lịch công việc: " + e.getMessage()));
                }
        }

        @GetMapping("/department/{departmentId}")
        @Operation(summary = "Lấy danh sách lịch công việc theo phòng ban", description = "Trả về danh sách lịch công việc của một phòng ban cụ thể")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách lịch theo phòng ban thành công"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập"),
                        @ApiResponse(responseCode = "400", description = "ID phòng ban không hợp lệ")
        })
        public ResponseEntity<ResponseDTO<Page<ScheduleDTO>>> getSchedulesByDepartmentId(
                        @Parameter(description = "ID của phòng ban") @PathVariable Long departmentId,
                        Pageable pageable) {
                try {
                        Page<ScheduleDTO> schedules = scheduleService.getSchedulesByDepartmentId(departmentId, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(schedules));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách lịch theo phòng ban: "
                                                        + e.getMessage()));
                }
        }

        @GetMapping("/week/{year}/{week}")
        @Operation(summary = "Lấy danh sách lịch công việc theo tuần", description = "Trả về danh sách lịch công việc trong tuần cụ thể với phân trang")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách lịch theo tuần thành công"),
                        @ApiResponse(responseCode = "400", description = "Tham số không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Page<ScheduleDTO>>> getSchedulesByWeek(
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
                        
                        Page<ScheduleDTO> schedules = scheduleService.getSchedulesByWeek(year, week, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(schedules));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách lịch theo tuần: "
                                                        + e.getMessage()));
                }
        }

        @GetMapping("/month/{year}/{month}")
        @Operation(summary = "Lấy danh sách lịch công việc theo tháng", description = "Trả về danh sách lịch công việc trong tháng cụ thể với phân trang")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách lịch theo tháng thành công"),
                        @ApiResponse(responseCode = "400", description = "Tham số không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Page<ScheduleDTO>>> getSchedulesByMonth(
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
                        
                        Page<ScheduleDTO> schedules = scheduleService.getSchedulesByMonth(year, month, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(schedules));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách lịch theo tháng: "
                                                        + e.getMessage()));
                }
        }

        @GetMapping("/year/{year}")
        @Operation(summary = "Lấy danh sách lịch công việc theo năm", description = "Trả về danh sách lịch công việc trong năm cụ thể với phân trang")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách lịch theo năm thành công"),
                        @ApiResponse(responseCode = "400", description = "Tham số không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Page<ScheduleDTO>>> getSchedulesByYear(
                        @Parameter(description = "Năm (VD: 2024, 2025)") @PathVariable int year,
                        Pageable pageable) {
                try {
                        if (year < 1900 || year > 2100) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Năm phải trong khoảng 1900-2100"));
                        }
                        
                        Page<ScheduleDTO> schedules = scheduleService.getSchedulesByYear(year, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(schedules));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách lịch theo năm: "
                                                        + e.getMessage()));
                }
        }

        @GetMapping("/department/{departmentId}/week/{year}/{week}")
        @Operation(summary = "Lấy danh sách lịch công việc theo phòng ban và tuần", description = "Trả về danh sách lịch công việc của phòng ban trong tuần cụ thể với phân trang")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách lịch theo phòng ban và tuần thành công"),
                        @ApiResponse(responseCode = "400", description = "Tham số không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Page<ScheduleDTO>>> getSchedulesByDepartmentAndWeek(
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
                        
                        Page<ScheduleDTO> schedules = scheduleService.getSchedulesByDepartmentAndWeek(departmentId, year, week, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(schedules));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách lịch theo phòng ban và tuần: "
                                                        + e.getMessage()));
                }
        }

        @GetMapping("/department/{departmentId}/month/{year}/{month}")
        @Operation(summary = "Lấy danh sách lịch công việc theo phòng ban và tháng", description = "Trả về danh sách lịch công việc của phòng ban trong tháng cụ thể với phân trang")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách lịch theo phòng ban và tháng thành công"),
                        @ApiResponse(responseCode = "400", description = "Tham số không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Page<ScheduleDTO>>> getSchedulesByDepartmentAndMonth(
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
                        
                        Page<ScheduleDTO> schedules = scheduleService.getSchedulesByDepartmentAndMonth(departmentId, year, month, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(schedules));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách lịch theo phòng ban và tháng: "
                                                        + e.getMessage()));
                }
        }

        @GetMapping("/department/{departmentId}/year/{year}")
        @Operation(summary = "Lấy danh sách lịch công việc theo phòng ban và năm", description = "Trả về danh sách lịch công việc của phòng ban trong năm cụ thể với phân trang")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách lịch theo phòng ban và năm thành công"),
                        @ApiResponse(responseCode = "400", description = "Tham số không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Page<ScheduleDTO>>> getSchedulesByDepartmentAndYear(
                        @Parameter(description = "ID của phòng ban") @PathVariable Long departmentId,
                        @Parameter(description = "Năm (VD: 2024, 2025)") @PathVariable int year,
                        Pageable pageable) {
                try {
                        if (year < 1900 || year > 2100) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Năm phải trong khoảng 1900-2100"));
                        }
                        
                        Page<ScheduleDTO> schedules = scheduleService.getSchedulesByDepartmentAndYear(departmentId, year, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(schedules));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách lịch theo phòng ban và năm: "
                                                        + e.getMessage()));
                }
        }

        @PostMapping
        @Operation(summary = "Tạo lịch công việc mới", description = "Tạo một lịch công việc mới")
        @ApiResponses({
                        @ApiResponse(responseCode = "201", description = "Tạo lịch thành công"),
                        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền tạo lịch")
        })
        public ResponseEntity<ResponseDTO<ScheduleDTO>> createSchedule(
                        @RequestBody ScheduleDTO scheduleDTO) {
                try {
                        User currentUser = scheduleService.getCurrentUser();
                        System.out.println("Current User: " + currentUser.getFullName());
                        ScheduleDTO createdSchedule = scheduleService.createSchedule(scheduleDTO, currentUser);
                        return ResponseEntity.status(HttpStatus.CREATED)
                                        .body(ResponseDTO.success("Tạo lịch công việc thành công", createdSchedule));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi tạo lịch công việc: " + e.getMessage()));
                }
        }

        @PutMapping("/{id}")
        @Operation(summary = "Cập nhật lịch công việc", description = "Cập nhật thông tin một lịch công việc đã tồn tại")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Cập nhật lịch thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy lịch"),
                        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền cập nhật lịch")
        })
        public ResponseEntity<ResponseDTO<ScheduleDTO>> updateSchedule(
                        @PathVariable Long id,
                        @RequestBody ScheduleDTO scheduleDTO) {
                try {
                        User currentUser = scheduleService.getCurrentUser();
                        System.out.println("Current User: " + currentUser.getFullName());
                        ScheduleDTO updatedSchedule = scheduleService.updateSchedule(id, scheduleDTO, currentUser);
                        return ResponseEntity
                                        .ok(ResponseDTO.success("Cập nhật lịch công việc thành công", updatedSchedule));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi cập nhật lịch công việc: " + e.getMessage()));
                }
        }

        @PatchMapping("/{id}/submit")
        @Operation(summary = "Gửi lịch để phê duyệt", description = "Chuyển trạng thái lịch sang SUBMITTED để đợi phê duyệt")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Gửi thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy lịch"),
                        @ApiResponse(responseCode = "400", description = "Không thể gửi (ví dụ: lịch không ở trạng thái DRAFT)"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền gửi lịch")
        })
        public ResponseEntity<ResponseDTO<ScheduleDTO>> submitSchedule(
                        @PathVariable Long id) {
                try {
                        User currentUser = scheduleService.getCurrentUser();
                        System.out.println("Current User: " + currentUser.getFullName());
                        ScheduleDTO submittedSchedule = scheduleService.submitSchedule(id, currentUser);
                        return ResponseEntity
                                        .ok(ResponseDTO.success("Gửi lịch công việc thành công", submittedSchedule));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi gửi lịch công việc: " + e.getMessage()));
                }
        }

        @PostMapping("/{id}/approve")
        @Operation(summary = "Phê duyệt lịch", description = "Phê duyệt lịch đã được gửi")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Phê duyệt thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy lịch"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền phê duyệt")
        })
        public ResponseEntity<ResponseDTO<ScheduleDTO>> approveSchedule(
                        @PathVariable Long id,
                        @RequestBody Map<String, String> approvalData) {
                try {
                        User currentUser = scheduleService.getCurrentUser();
                        String comments = approvalData.get("comments");

                        ScheduleDTO approvedSchedule = scheduleService.approveSchedule(id, true, comments, currentUser);
                        return ResponseEntity.ok(
                                        ResponseDTO.success("Phê duyệt lịch công việc thành công", approvedSchedule));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi phê duyệt lịch công việc: " + e.getMessage()));
                }
        }

        @PostMapping("/{id}/reject")
        @Operation(summary = "Từ chối lịch", description = "Từ chối lịch đã được gửi")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Từ chối thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy lịch"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền từ chối")
        })
        public ResponseEntity<ResponseDTO<ScheduleDTO>> rejectSchedule(
                        @PathVariable Long id,
                        @RequestBody Map<String, String> rejectionData) {
                try {
                        User currentUser = scheduleService.getCurrentUser();
                        String comments = rejectionData.get("comments");

                        ScheduleDTO rejectedSchedule = scheduleService.approveSchedule(id, false, comments,
                                        currentUser);
                        return ResponseEntity
                                        .ok(ResponseDTO.success("Từ chối lịch công việc thành công", rejectedSchedule));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi từ chối lịch công việc: " + e.getMessage()));
                }
        }

        @DeleteMapping("/{id}")
        @Operation(summary = "Xóa lịch công việc", description = "Xóa một lịch công việc")
        @ApiResponses({
                        @ApiResponse(responseCode = "204", description = "Xóa lịch thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy lịch"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền xóa lịch")
        })
        public ResponseEntity<ResponseDTO<String>> deleteSchedule(
                        @PathVariable Long id) {
                try {
                        User currentUser = scheduleService.getCurrentUser();
                        System.out.println("Current User: " + currentUser.getFullName());
                        boolean deleted = scheduleService.deleteSchedule(id, currentUser);
                        return ResponseEntity.ok(ResponseDTO.success("Xóa lịch công việc thành công"));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi xóa lịch công việc: " + e.getMessage()));
                }
        }

        @GetMapping("/events/daily")
        @Operation(summary = "Lấy danh sách sự kiện trong ngày", description = "Trả về danh sách sự kiện cho một ngày cụ thể")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách sự kiện thành công"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<List<ScheduleEventDTO>>> getDailyEvents(
                        @Parameter(description = "Ngày cần lấy sự kiện (định dạng YYYY-MM-DD)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                        @Parameter(description = "ID phòng ban (tùy chọn)") @RequestParam(required = false) Long departmentId,
                        @Parameter(description = "ID người dùng (tùy chọn)") @RequestParam(required = false) Long userId) {

                try {
                        List<ScheduleEventDTO> events = scheduleService.getDailyEvents(date, departmentId, userId);
                        return ResponseEntity.ok(ResponseDTO.success(events));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy danh sách sự kiện trong ngày: " + e.getMessage()));
                }
        }

        @GetMapping("/events/monthly")
        @Operation(summary = "Lấy danh sách sự kiện trong tháng", description = "Trả về danh sách sự kiện cho một tháng cụ thể")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách sự kiện thành công"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
        })
        public ResponseEntity<ResponseDTO<Map<LocalDate, List<ScheduleEventDTO>>>> getMonthlyEvents(
                        @Parameter(description = "Năm") @RequestParam int year,
                        @Parameter(description = "Tháng (1-12)") @RequestParam int month,
                        @Parameter(description = "ID phòng ban (tùy chọn)") @RequestParam(required = false) Long departmentId,
                        @Parameter(description = "ID người dùng (tùy chọn)") @RequestParam(required = false) Long userId) {

                try {
                        Map<LocalDate, List<ScheduleEventDTO>> events = scheduleService.getMonthlyEvents(year, month,
                                        departmentId, userId);
                        return ResponseEntity.ok(ResponseDTO.success(events));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách sự kiện trong tháng: "
                                                        + e.getMessage()));
                }
        }

        @GetMapping("/events/{id}")
        @Operation(summary = "Lấy chi tiết sự kiện", description = "Trả về thông tin chi tiết của một sự kiện cụ thể")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy chi tiết sự kiện thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy sự kiện")
        })
        public ResponseEntity<ResponseDTO<ScheduleEventDTO>> getEventById(@PathVariable Long id) {
                try {
                        Optional<ScheduleEventDTO> event = scheduleService.getEventById(id);
                        return event.map(e -> ResponseEntity.ok(ResponseDTO.success(e)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy sự kiện")));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy chi tiết sự kiện: " + e.getMessage()));
                }
        }

        @GetMapping("/events")
        @Operation(summary = "Lấy danh sách sự kiện", description = "Trả về danh sách sự kiện theo các tham số")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách sự kiện thành công")
        })
        public ResponseEntity<ResponseDTO<List<ScheduleEventDTO>>> getScheduleEvents(
                        @Parameter(description = "Ngày sự kiện") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                        @Parameter(description = "Loại trừ ID") @RequestParam(required = false) Long excludeId,
                        @Parameter(description = "ID phòng ban") @RequestParam(required = false) Long departmentId) {

                try {
                        List<ScheduleEventDTO> events = scheduleService.getScheduleEvents(date, excludeId,
                                        departmentId);
                        return ResponseEntity.ok(ResponseDTO.success(events));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách sự kiện: " + e.getMessage()));
                }
        }

        @PatchMapping("/events/{eventId}/attendance")
        @Operation(summary = "Cập nhật trạng thái tham dự sự kiện", description = "Cập nhật trạng thái tham dự của một người dùng cho sự kiện")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Cập nhật trạng thái tham dự thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy sự kiện"),
                        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền cập nhật")
        })
        public ResponseEntity<ResponseDTO<Map<String, Object>>> updateAttendanceStatus(
                        @PathVariable Long eventId,
                        @RequestBody Map<String, Object> attendanceData) {

                try {
                        Long userId = Long.valueOf(attendanceData.get("userId").toString());
                        String status = (String) attendanceData.get("status");
                        String comments = (String) attendanceData.get("comments");

                        Map<String, Object> result = scheduleService.updateAttendanceStatus(eventId, userId, status,
                                        comments);
                        return ResponseEntity.ok(ResponseDTO.success("Cập nhật trạng thái tham dự thành công", result));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi cập nhật trạng thái tham dự: " + e.getMessage()));
                }
        }

        @GetMapping("/{id}/related")
        @Operation(summary = "Lấy danh sách lịch liên quan", description = "Trả về danh sách lịch công việc liên quan tới lịch hiện tại")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy danh sách lịch liên quan thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy lịch")
        })
        public ResponseEntity<ResponseDTO<List<ScheduleDTO>>> getRelatedSchedules(@PathVariable Long id) {
                try {
                        List<ScheduleDTO> relatedSchedules = scheduleService.getRelatedSchedules(id);
                        return ResponseEntity.ok(ResponseDTO.success(relatedSchedules));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy danh sách lịch liên quan: " + e.getMessage()));
                }
        }

        /**
         * Tạo demo schedules cho tất cả phòng ban
         */
        @Operation(summary = "Tạo demo schedules", 
                   description = "Tạo 100 lịch công tác demo cho mỗi phòng ban với nội dung đa dạng")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tạo dữ liệu demo thành công"),
            @ApiResponse(responseCode = "500", description = "Lỗi khi tạo dữ liệu demo")
        })
        @PostMapping("/demo/create")
        public ResponseEntity<ResponseDTO<String>> createDemoSchedules() {
                try {
                        scheduleDemoService.createDemoSchedules();
                        return ResponseEntity.ok(ResponseDTO.success("Đã tạo thành công demo schedules cho tất cả phòng ban"));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ResponseDTO.error("Lỗi khi tạo dữ liệu demo: " + e.getMessage()));
                }
        }

        /**
         * Kiểm tra số lượng schedules hiện có
         */
        @Operation(summary = "Kiểm tra số lượng schedules", 
                   description = "Trả về tổng số lịch công tác hiện có trong hệ thống")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy thông tin thành công")
        })
        @GetMapping("/demo/count")
        public ResponseEntity<ResponseDTO<Long>> countSchedules() {
                try {
                        long count = scheduleDemoService.countTotalSchedules();
                        return ResponseEntity.ok(ResponseDTO.success(count));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ResponseDTO.error("Lỗi khi đếm schedules: " + e.getMessage()));
                }
        }
}