package com.managementcontent.service;

import com.managementcontent.dto.WorkPlanDTO;
import com.managementcontent.dto.WorkPlanTaskDTO;
import com.managementcontent.model.Department;
import com.managementcontent.model.User;
import com.managementcontent.repository.DepartmentRepository;
import com.managementcontent.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WorkPlanDemoService {

    private final WorkPlanService workPlanService;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    // Danh sách tiêu đề kế hoạch công việc đa dạng
    private static final String[] WORKPLAN_TITLES = {
        "Kế hoạch phát triển sản phẩm", "Chiến lược marketing", "Kế hoạch đào tạo nhân viên",
        "Dự án cải tiến quy trình", "Kế hoạch kinh doanh", "Chiến lược mở rộng thị trường",
        "Kế hoạch nghiên cứu", "Dự án số hóa", "Kế hoạch quản lý chất lượng",
        "Chiến lược nhân sự", "Kế hoạch bảo trì thiết bị", "Dự án an toàn lao động",
        "Kế hoạch tài chính", "Chiến lược đầu tư", "Kế hoạch hợp tác đối tác",
        "Dự án môi trường", "Kế hoạch xuất khẩu", "Chiến lược công nghệ",
        "Kế hoạch CSR", "Dự án tự động hóa", "Kế hoạch logistics",
        "Chiến lược branding", "Kế hoạch R&D", "Dự án lean manufacturing",
        "Kế hoạch compliance", "Chiến lược ESG", "Kế hoạch digital transformation",
        "Dự án customer experience", "Kế hoạch supply chain", "Chiến lược innovation"
    };

    // Danh sách mô tả kế hoạch
    private static final String[] WORKPLAN_DESCRIPTIONS = {
        "Thực hiện theo lộ trình đã được phê duyệt với các mốc thời gian cụ thể",
        "Đảm bảo phối hợp chặt chẽ giữa các bộ phận liên quan",
        "Tập trung vào hiệu quả và chất lượng trong quá trình thực hiện",
        "Áp dụng các phương pháp quản lý tiên tiến và công nghệ hiện đại",
        "Đánh giá và báo cáo tiến độ định kỳ theo từng giai đoạn",
        "Tuân thủ các quy định pháp luật và tiêu chuẩn ngành",
        "Tối ưu hóa nguồn lực và giảm thiểu rủi ro trong quá trình triển khai",
        "Đào tạo và nâng cao năng lực đội ngũ thực hiện",
        "Xây dựng hệ thống giám sát và đánh giá hiệu quả",
        "Cải tiến liên tục và học hỏi từ kinh nghiệm thực tế"
    };

    // Danh sách tên nhiệm vụ đa dạng
    private static final String[] TASK_TITLES = {
        "Nghiên cứu thị trường", "Phân tích đối thủ cạnh tranh", "Xây dựng kế hoạch chi tiết",
        "Thiết kế sản phẩm", "Phát triển prototype", "Test và đánh giá",
        "Chuẩn bị tài liệu kỹ thuật", "Đào tạo đội ngũ", "Triển khai pilot",
        "Thu thập feedback", "Cải tiến và tối ưu", "Launch sản phẩm",
        "Marketing và quảng bá", "Đánh giá hiệu quả", "Báo cáo kết quả",
        "Phân tích dữ liệu", "Xây dựng dashboard", "Tối ưu quy trình",
        "Quản lý rủi ro", "Đảm bảo chất lượng", "Kiểm tra an toàn",
        "Cập nhật hệ thống", "Sao lưu dữ liệu", "Bảo trì thiết bị",
        "Đào tạo người dùng", "Viết tài liệu hướng dẫn", "Hỗ trợ kỹ thuật",
        "Kiểm tra tuân thủ", "Audit nội bộ", "Cải tiến liên tục",
        "Xây dựng KPI", "Theo dõi hiệu suất", "Phân tích xu hướng",
        "Lập kế hoạch dự phòng", "Đánh giá tác động", "Tối ưu chi phí"
    };

    // Danh sách mô tả nhiệm vụ
    private static final String[] TASK_DESCRIPTIONS = {
        "Thực hiện theo đúng quy trình và tiêu chuẩn đã được thiết lập",
        "Phối hợp chặt chẽ với các bộ phận liên quan để đảm bảo tiến độ",
        "Áp dụng các công cụ và phương pháp hiện đại để nâng cao hiệu quả",
        "Đảm bảo chất lượng đầu ra đáp ứng yêu cầu kỹ thuật",
        "Ghi nhận và báo cáo tiến độ thực hiện hàng tuần",
        "Tuân thủ các quy định về an toàn và bảo mật thông tin",
        "Linh hoạt điều chỉnh phương án khi có thay đổi yêu cầu",
        "Tận dụng tối đa nguồn lực có sẵn và tối ưu chi phí",
        "Học hỏi và chia sẻ kinh nghiệm với đồng nghiệp",
        "Chuẩn bị kế hoạch dự phòng cho các tình huống bất ngờ"
    };

    @Transactional
    public void createDemoWorkPlans() {
        List<Department> departments = departmentRepository.findAll();
        List<User> users = userRepository.findAll();
        
        if (departments.isEmpty() || users.isEmpty()) {
            throw new RuntimeException("Cần có dữ liệu phòng ban và người dùng trước khi tạo demo work plans");
        }

        Random random = new Random();
        
        for (Department department : departments) {
            // Tạo 100 work plan cho mỗi phòng ban
            for (int i = 0; i < 100; i++) {
                WorkPlanDTO workPlanDTO = createRandomWorkPlan(department, users, random, i);
                
                try {
                    // Tìm user trong phòng ban này để làm creator
                    User creator = users.stream()
                        .filter(u -> u.getDepartment() != null && u.getDepartment().getId().equals(department.getId()))
                        .findFirst()
                        .orElse(users.get(random.nextInt(users.size())));
                        
                    workPlanService.createWorkPlan(workPlanDTO, creator);
                } catch (Exception e) {
                    System.err.println("Lỗi tạo work plan " + i + " cho phòng " + department.getName() + ": " + e.getMessage());
                }
            }
        }
    }

    private WorkPlanDTO createRandomWorkPlan(Department department, List<User> users, Random random, int index) {
        WorkPlanDTO workPlan = new WorkPlanDTO();
        
        // Tạo tiêu đề và mô tả ngẫu nhiên
        workPlan.setTitle(WORKPLAN_TITLES[random.nextInt(WORKPLAN_TITLES.length)] + " - " + department.getName() + " " + (index + 1));
        workPlan.setDescription(WORKPLAN_DESCRIPTIONS[random.nextInt(WORKPLAN_DESCRIPTIONS.length)]);
        
        // Set department
        workPlan.setDepartmentId(department.getId());
        workPlan.setDepartment(department.getName());
        
        // Thời gian thực hiện (từ 1-6 tháng)
        LocalDateTime startDate = LocalDateTime.now().plusDays(random.nextInt(30)); // Bắt đầu trong 30 ngày tới
        LocalDateTime endDate = startDate.plusMonths(1 + random.nextInt(6)); // Kéo dài 1-6 tháng
        
        workPlan.setStartDate(startDate);
        workPlan.setEndDate(endDate);
        
        // Status ngẫu nhiên
        String[] statuses = {"draft", "pending", "approved", "rejected", "in_progress", "completed"};
        workPlan.setStatus(statuses[random.nextInt(statuses.length)]);
        
        // Tạo 5-15 tasks cho mỗi work plan
        int taskCount = 5 + random.nextInt(11);
        List<WorkPlanTaskDTO> tasks = new ArrayList<>();
        
        for (int i = 0; i < taskCount; i++) {
            tasks.add(createRandomTask(startDate, endDate, random, i));
        }
        
        workPlan.setTasks(tasks);
        
        return workPlan;
    }

    private WorkPlanTaskDTO createRandomTask(LocalDateTime planStart, LocalDateTime planEnd, Random random, int index) {
        WorkPlanTaskDTO task = new WorkPlanTaskDTO();
        
        // Tạo tên nhiệm vụ
        task.setTitle(TASK_TITLES[random.nextInt(TASK_TITLES.length)] + " " + (index + 1));
        task.setDescription(TASK_DESCRIPTIONS[random.nextInt(TASK_DESCRIPTIONS.length)]);
        
        // Thời gian task nằm trong khoảng thời gian của work plan
        long daysBetween = java.time.Duration.between(planStart, planEnd).toDays();
        LocalDateTime taskStart = planStart.plusDays(random.nextInt((int) Math.max(1, daysBetween / 2)));
        LocalDateTime taskEnd = taskStart.plusDays(1 + random.nextInt(30)); // Task kéo dài 1-30 ngày
        
        // Đảm bảo task end không vượt quá plan end
        if (taskEnd.isAfter(planEnd)) {
            taskEnd = planEnd;
        }
        
        task.setStartDate(taskStart);
        task.setEndDate(taskEnd);
        
        // Priority ngẫu nhiên
        String[] priorities = {"HIGH", "MEDIUM", "LOW"};
        task.setPriority(priorities[random.nextInt(priorities.length)]);
        
        // Status ngẫu nhiên
        String[] taskStatuses = {"TODO", "IN_PROGRESS", "COMPLETED", "BLOCKED"};
        task.setStatus(taskStatuses[random.nextInt(taskStatuses.length)]);
        
        // Progress ngẫu nhiên (0-100%)
        task.setProgress(random.nextInt(101));
        
        // Ghi chú ngẫu nhiên
        String[] notes = {
            "Cần phối hợp với phòng ban khác",
            "Yêu cầu approval từ ban giám đốc",
            "Đã hoàn thành phase 1",
            "Đang chờ feedback từ khách hàng",
            "Cần bổ sung tài liệu kỹ thuật",
            "Tiến độ đang đúng kế hoạch",
            "Có thể hoàn thành trước deadline",
            "Cần hỗ trợ thêm nhân lực"
        };
        task.setNotes(notes[random.nextInt(notes.length)]);
        
        return task;
    }

    public long countTotalWorkPlans() {
        return workPlanService.getAllWorkPlans().size();
    }
}
