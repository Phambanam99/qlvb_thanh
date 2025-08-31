package com.managementcontent.service;

import com.managementcontent.dto.ScheduleDTO;
import com.managementcontent.dto.ScheduleEventDTO;
import com.managementcontent.model.Department;
import com.managementcontent.model.User;
import com.managementcontent.repository.DepartmentRepository;
import com.managementcontent.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class ScheduleDemoService {

    private final ScheduleService scheduleService;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    // Danh sách tiêu đề lịch công tác đa dạng
    private static final String[] SCHEDULE_TITLES = {
        "Lịch công tác tuần", "Kế hoạch họp hành", "Lịch kiểm tra định kỳ",
        "Chương trình đào tạo", "Lịch tiếp khách", "Họp Ban chấp hành",
        "Kiểm tra an toàn lao động", "Họp tổng kết tháng", "Lịch công tác quý",
        "Chương trình tập huấn", "Hội nghị trực tuyến", "Kiểm tra nội bộ",
        "Lịch báo cáo tiến độ", "Họp điều hành", "Lịch thăm quan học tập",
        "Chương trình giao lưu", "Họp phòng ban", "Lịch công tác ngoại tỉnh",
        "Kiểm tra chất lượng", "Hội thảo chuyên môn", "Lịch triển khai dự án",
        "Chương trình khen thưởng", "Họp đánh giá", "Lịch công tác khẩn cấp",
        "Kiểm tra tài sản", "Hội nghị phụ huynh", "Lịch bảo trì thiết bị",
        "Chương trình sinh hoạt", "Họp kế hoạch", "Lịch công tác đặc biệt"
    };

    // Danh sách mô tả cho lịch
    private static final String[] SCHEDULE_DESCRIPTIONS = {
        "Thực hiện theo kế hoạch đã được phê duyệt",
        "Đảm bảo tham gia đầy đủ các thành viên",
        "Chuẩn bị đầy đủ tài liệu và báo cáo",
        "Tuân thủ đúng thời gian và địa điểm",
        "Phối hợp chặt chẽ giữa các phòng ban",
        "Đảm bảo chất lượng và hiệu quả công việc",
        "Báo cáo kết quả thực hiện đúng hạn",
        "Lưu ý các vấn đề an toàn và bảo mật",
        "Cập nhật thông tin và trao đổi kinh nghiệm",
        "Đánh giá và rút kinh nghiệm sau mỗi hoạt động"
    };

    // Danh sách tên sự kiện đa dạng
    private static final String[] EVENT_TITLES = {
        "Họp ban giám đốc", "Kiểm tra tài chính", "Đào tạo nhân viên mới",
        "Họp phòng kế toán", "Kiểm tra an toàn", "Tập huấn kỹ năng",
        "Gặp gỡ đối tác", "Báo cáo tiến độ", "Họp điều hành",
        "Kiểm tra chất lượng", "Đào tạo công nghệ", "Họp tổng kết",
        "Thăm quan khách hàng", "Kiểm tra nội bộ", "Hội thảo chuyên môn",
        "Họp kế hoạch", "Đánh giá hiệu suất", "Tập huấn quy trình",
        "Gặp gỡ nhà cung cấp", "Kiểm tra tài sản", "Đào tạo quản lý",
        "Họp phòng nhân sự", "Báo cáo tài chính", "Tập huấn an toàn",
        "Thăm quan dự án", "Kiểm tra thiết bị", "Hội nghị trực tuyến",
        "Họp chiến lược", "Đánh giá rủi ro", "Đào tạo kỹ thuật",
        "Gặp mặt cán bộ", "Kiểm tra quy trình", "Hội thảo đổi mới",
        "Họp điều chỉnh", "Báo cáo hoạt động", "Tập huấn ISO",
        "Thăm quan công ty", "Kiểm tra môi trường", "Đào tạo lãnh đạo"
    };

    // Danh sách địa điểm
    private static final String[] LOCATIONS = {
        "Phòng họp A", "Phòng họp B", "Hội trường chính", "Phòng họp VIP",
        "Phòng đào tạo", "Khu vực tiếp khách", "Phòng họp điều hành",
        "Sảnh chính", "Phòng họp nhỏ", "Khu vực ngoài trời",
        "Phòng hội nghị", "Văn phòng giám đốc", "Phòng làm việc chung",
        "Khu vực triển lãm", "Phòng thí nghiệm", "Khu vực sản xuất",
        "Nhà máy", "Chi nhánh", "Trụ sở chính", "Kho vật tư"
    };

    // Danh sách mô tả sự kiện
    private static final String[] EVENT_DESCRIPTIONS = {
        "Thảo luận về kế hoạch phát triển",
        "Đánh giá tình hình hoạt động",
        "Chia sẻ kinh nghiệm và học hỏi",
        "Cập nhật thông tin mới nhất",
        "Giải quyết các vấn đề tồn động",
        "Lập kế hoạch cho giai đoạn tới",
        "Kiểm tra và đánh giá tiến độ",
        "Trao đổi ý kiến và góp ý",
        "Báo cáo kết quả thực hiện",
        "Thống nhất phương hướng làm việc"
    };

    @Transactional
    public void createDemoSchedules() {
        List<Department> departments = departmentRepository.findAll();
        List<User> users = userRepository.findAll();
        
        if (departments.isEmpty() || users.isEmpty()) {
            throw new RuntimeException("Cần có dữ liệu phòng ban và người dùng trước khi tạo demo schedules");
        }

        Random random = new Random();
        
        for (Department department : departments) {
            // Tạo 100 schedule cho mỗi phòng ban
            for (int i = 0; i < 100; i++) {
                ScheduleDTO scheduleDTO = createRandomSchedule(department, users, random, i);
                
                try {
                    // Tìm user trong phòng ban này để làm creator
                    User creator = users.stream()
                        .filter(u -> u.getDepartment() != null && u.getDepartment().getId().equals(department.getId()))
                        .findFirst()
                        .orElse(users.get(random.nextInt(users.size())));
                        
                    scheduleService.createSchedule(scheduleDTO, creator);
                } catch (Exception e) {
                    System.err.println("Lỗi tạo schedule " + i + " cho phòng " + department.getName() + ": " + e.getMessage());
                }
            }
        }
    }

    private ScheduleDTO createRandomSchedule(Department department, List<User> users, Random random, int index) {
        ScheduleDTO schedule = new ScheduleDTO();
        
        // Tạo tiêu đề và mô tả ngẫu nhiên
        schedule.setTitle(SCHEDULE_TITLES[random.nextInt(SCHEDULE_TITLES.length)] + " - " + department.getName() + " " + (index + 1));
        schedule.setDescription(SCHEDULE_DESCRIPTIONS[random.nextInt(SCHEDULE_DESCRIPTIONS.length)]);
        
        // Set department
        schedule.setDepartmentId(department.getId());
        schedule.setDepartmentName(department.getName());
        
        // Random period (tuần/tháng/quý)
        String[] periods = {"WEEKLY", "MONTHLY", "QUARTERLY"};
        schedule.setPeriod(periods[random.nextInt(periods.length)]);
        
        // Status ngẫu nhiên
        String[] statuses = {"DRAFT", "SUBMITTED", "APPROVED", "REJECTED"};
        schedule.setStatus(statuses[random.nextInt(statuses.length)]);
        
        // Tạo 3-8 events cho mỗi schedule
        int eventCount = 3 + random.nextInt(6);
        List<ScheduleEventDTO> events = new ArrayList<>();
        
        for (int i = 0; i < eventCount; i++) {
            events.add(createRandomEvent(random, i));
        }
        
        schedule.setEvents(events);
        
        return schedule;
    }

    private ScheduleEventDTO createRandomEvent(Random random, int index) {
        ScheduleEventDTO event = new ScheduleEventDTO();
        
        // Tạo tên sự kiện
        event.setTitle(EVENT_TITLES[random.nextInt(EVENT_TITLES.length)] + " " + (index + 1));
        event.setDescription(EVENT_DESCRIPTIONS[random.nextInt(EVENT_DESCRIPTIONS.length)]);
        
        // Địa điểm ngẫu nhiên
        event.setLocation(LOCATIONS[random.nextInt(LOCATIONS.length)]);
        
        // Thời gian ngẫu nhiên trong vòng 30 ngày tới
        LocalDate startDate = LocalDate.now().plusDays(random.nextInt(30));
        LocalTime startTime = LocalTime.of(8 + random.nextInt(10), random.nextInt(4) * 15); // 8:00 - 17:45
        
        // Thời gian kết thúc từ 1-4 giờ sau thời gian bắt đầu
        LocalTime endTime = startTime.plusHours(1 + random.nextInt(4)).plusMinutes(random.nextInt(4) * 15);
        
        event.setDate(startDate);
        event.setStartTime(startTime);
        event.setEndTime(endTime);
        
        // Ghi chú ngẫu nhiên
        String[] notes = {
            "Yêu cầu tham gia đầy đủ",
            "Chuẩn bị tài liệu báo cáo",
            "Mang theo laptop cá nhân",
            "Dress code: công sở",
            "Có bữa ăn nhẹ",
            "Ghi chú và chụp ảnh",
            "Câu hỏi gửi trước qua email",
            "Đúng giờ và không vắng mặt"
        };
        event.setNotes(notes[random.nextInt(notes.length)]);
        
        return event;
    }

    public long countTotalSchedules() {
        return scheduleService.getAllSchedules().size();
    }
}
