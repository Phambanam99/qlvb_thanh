package com.managementcontent.service;

import com.managementcontent.model.*;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import com.managementcontent.model.enums.SecurityLevel;
import com.managementcontent.model.enums.DistributionType;
import com.managementcontent.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Service để tạo dữ liệu demo cho công văn nội bộ
 * Tạo 1000 công văn nội bộ với dữ liệu ngẫu nhiên nhưng thực tế
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InternalDocumentDemoService {

    private final InternalDocumentRepository internalDocumentRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    // Dữ liệu mẫu cho công văn
    private static final String[] DOCUMENT_TYPES = {
        "Công văn", "Quyết định", "Chỉ thị", "Thông báo", "Báo cáo", 
        "Tờ trình", "Đề án", "Kế hoạch", "Hướng dẫn", "Quy định"
    };

    private static final String[] TITLE_PREFIXES = {
        "Về việc", "Thông báo về", "Hướng dẫn về", "Quyết định về", "Báo cáo về",
        "Đề xuất về", "Kế hoạch", "Triển khai", "Thực hiện", "Tổ chức"
    };

    private static final String[] TITLE_SUBJECTS = {
        "tổ chức họp định kỳ", "triển khai kế hoạch công tác", "thực hiện quy định mới",
        "cập nhật thông tin nhân sự", "báo cáo tiến độ dự án", "tăng cường kỷ luật lao động",
        "phối hợp công tác giữa các phòng ban", "nâng cao chất lượng dịch vụ", 
        "tiết kiệm điện năng", "bảo đảm an toàn lao động", "cải thiện môi trường làm việc",
        "đào tạo và phát triển nhân lực", "ứng dụng công nghệ thông tin", 
        "quản lý tài liệu và lưu trữ", "thực hiện nhiệm vụ năm 2025"
    };

    private static final String[] SUMMARY_TEMPLATES = {
        "công văn thông báo về việc {subject} nhằm {purpose}.",
        "Hướng dẫn cụ thể về quy trình {subject} áp dụng từ ngày {date}.",
        "Báo cáo kết quả thực hiện {subject} trong tháng vừa qua.",
        "Đề xuất phương án {subject} để nâng cao hiệu quả công việc.",
        "Thông báo lịch trình và nội dung {subject} dành cho toàn thể cán bộ.",
        "Quyết định về việc {subject} có hiệu lực từ ngày ban hành.",
        "Kế hoạch chi tiết cho việc {subject} trong quý tới.",
        "Chỉ đạo về việc {subject} nhằm đảm bảo tiến độ và chất lượng."
    };

    private static final String[] PURPOSES = {
        "nâng cao hiệu quả công việc", "đảm bảo tuân thủ quy định", 
        "cải thiện chất lượng dịch vụ", "tăng cường phối hợp liên ngành",
        "tiết kiệm chi phí vận hành", "bảo đảm an toàn và bảo mật",
        "thúc đẩy đổi mới sáng tạo", "nâng cao năng lực cán bộ"
    };

    private static final String[] ISSUING_AGENCIES = {
        "Ban Giám đốc", "Phòng Tổ chức - Nhân sự", "Phòng Kế hoạch - Tài chính",
        "Phòng Hành chính - Quản trị", "Ban Chỉ đạo", "Văn phòng",
        "Phòng Kỹ thuật", "Phòng Pháp chế", "Phòng Đào tạo"
    };

    /**
     * Tạo 1000 công văn nội bộ demo
     */
    @Transactional
    public void createDemoInternalDocuments() {
        log.info("Bắt đầu tạo 1000 công văn nội bộ demo...");
        
        // Lấy danh sách users và departments
        List<User> users = userRepository.findAll();
        List<Department> departments = departmentRepository.findAll();
        
        if (users.isEmpty() || departments.isEmpty()) {
            log.error("Không tìm thấy users hoặc departments trong hệ thống!");
            return;
        }

        int successCount = 0;
        int errorCount = 0;

        for (int i = 1; i <= 5000; i++) {
            try {
                InternalDocument document = createRandomInternalDocument(i, users, departments);
                internalDocumentRepository.save(document);
                successCount++;
                
                if (i % 100 == 0) {
                    log.info("Đã tạo {} công văn...", i);
                }
            } catch (Exception e) {
                log.error("Lỗi khi tạo công văn thứ {}: {}", i, e.getMessage());
                errorCount++;
            }
        }

        log.info("Hoàn thành tạo dữ liệu demo! Thành công: {}, Lỗi: {}", successCount, errorCount);
    }

    /**
     * Tạo một công văn nội bộ ngẫu nhiên
     */
    private InternalDocument createRandomInternalDocument(int index, List<User> users, List<Department> departments) {
        Random random = new Random();
        
        // Chọn ngẫu nhiên sender và department
        User sender = users.get(random.nextInt(users.size()));
        Department draftingDept = departments.get(random.nextInt(departments.size()));
        User signer = users.get(random.nextInt(users.size()));
        
        // Tạo số công văn
        String documentNumber = generateDocumentNumber(index);
        
        // Tạo tiêu đề
        String title = generateTitle();
        
        // Tạo tóm tắt
        String summary = generateSummary();
        
        // Tạo ngày tháng ngẫu nhiên trong 2 năm gần đây
        LocalDateTime signingDate = generateRandomDate();
        LocalDateTime processingDeadline = signingDate.plusDays(random.nextInt(30) + 7);
        
        // Tạo công văn
        InternalDocument document = InternalDocument.builder()
                .documentNumber(documentNumber)
                .numberReceive((long) (random.nextInt(9999) + 1))
                .title(title)
                .summary(summary)
                .documentType(DOCUMENT_TYPES[random.nextInt(DOCUMENT_TYPES.length)])
                .signingDate(signingDate)
                .signer(signer.getFullName())
                .urgencyLevel(getRandomPriority())
                .notes(generateNotes())
                .status(getRandomStatus())
                .sender(sender)
                .draftingDepartment(draftingDept)
                .securityLevel(getRandomSecurityLevel())
                .documentSigner(signer)
                .isSecureTransmission(random.nextBoolean())
                .processingDeadline(processingDeadline)
                .issuingAgency(ISSUING_AGENCIES[random.nextInt(ISSUING_AGENCIES.length)])
                .distributionType(getRandomDistributionType())
                .numberOfCopies(random.nextInt(20) + 1)
                .numberOfPages(random.nextInt(50) + 1)
                .noPaperCopy(random.nextBoolean())
                .createdAt(signingDate.minusDays(random.nextInt(5)))
                .updatedAt(LocalDateTime.now())
                .build();

        // Thêm người nhận
        addRandomRecipients(document, users, departments, random);
        
        return document;
    }

    /**
     * Tạo số công văn
     */
    private String generateDocumentNumber(int index) {
        String[] prefixes = {"CV", "QD", "CT", "TB", "BC", "TT", "DA", "KH", "HD", "QC"};
        Random random = new Random();
        String prefix = prefixes[random.nextInt(prefixes.length)];
        int year = 2025;
        return String.format("%s-%04d/%d", prefix, index, year);
    }

    /**
     * Tạo tiêu đề công văn
     */
    private String generateTitle() {
        Random random = new Random();
        String prefix = TITLE_PREFIXES[random.nextInt(TITLE_PREFIXES.length)];
        String subject = TITLE_SUBJECTS[random.nextInt(TITLE_SUBJECTS.length)];
        return prefix + " " + subject;
    }

    /**
     * Tạo tóm tắt công văn
     */
    private String generateSummary() {
        Random random = new Random();
        String template = SUMMARY_TEMPLATES[random.nextInt(SUMMARY_TEMPLATES.length)];
        String subject = TITLE_SUBJECTS[random.nextInt(TITLE_SUBJECTS.length)];
        String purpose = PURPOSES[random.nextInt(PURPOSES.length)];
        String date = "01/01/2025";
        
        return template.replace("{subject}", subject)
                      .replace("{purpose}", purpose)
                      .replace("{date}", date);
    }

    /**
     * Tạo ghi chú
     */
    private String generateNotes() {
        String[] notes = {
            "Đề nghị các đơn vị liên quan phối hợp thực hiện.",
            "Báo cáo kết quả về Văn phòng trước ngày 30 hàng tháng.",
            "Trong quá trình thực hiện có vướng mắc liên hệ Văn phòng để được hướng dẫn.",
            "công văn có hiệu lực kể từ ngày ký.",
            "Đề nghị thực hiện nghiêm túc và đúng thời hạn.",
            null // Một số công văn không có ghi chú
        };
        Random random = new Random();
        return notes[random.nextInt(notes.length)];
    }

    /**
     * Tạo ngày ngẫu nhiên trong 2 năm gần đây
     */
    private LocalDateTime generateRandomDate() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime twoYearsAgo = now.minusYears(2);
        
        long daysBetween = java.time.Duration.between(twoYearsAgo, now).toDays();
        long randomDays = ThreadLocalRandom.current().nextLong(0, daysBetween + 1);
        
        return twoYearsAgo.plusDays(randomDays);
    }

    /**
     * Lấy mức độ ưu tiên ngẫu nhiên
     */
    private InternalDocument.Priority getRandomPriority() {
        InternalDocument.Priority[] priorities = InternalDocument.Priority.values();
        Random random = new Random();
        return priorities[random.nextInt(priorities.length)];
    }

    /**
     * Lấy trạng thái ngẫu nhiên
     */
    private DocumentProcessingStatus getRandomStatus() {
        DocumentProcessingStatus[] statuses = {
            DocumentProcessingStatus.DRAFT,
            DocumentProcessingStatus.PENDING_APPROVAL,
            DocumentProcessingStatus.REGISTERED,
            DocumentProcessingStatus.DISTRIBUTED,
            DocumentProcessingStatus.DEPT_ASSIGNED,
            DocumentProcessingStatus.COMPLETED
        };
        Random random = new Random();
        return statuses[random.nextInt(statuses.length)];
    }

    /**
     * Lấy mức độ bảo mật ngẫu nhiên
     */
    private SecurityLevel getRandomSecurityLevel() {
        SecurityLevel[] levels = SecurityLevel.values();
        Random random = new Random();
        return levels[random.nextInt(levels.length)];
    }

    /**
     * Lấy loại phân phối ngẫu nhiên
     */
    private DistributionType getRandomDistributionType() {
        DistributionType[] types = DistributionType.values();
        Random random = new Random();
        return types[random.nextInt(types.length)];
    }

    /**
     * Thêm người nhận ngẫu nhiên cho công văn
     */
    private void addRandomRecipients(InternalDocument document, List<User> users, 
                                   List<Department> departments, Random random) {
        // Mỗi công văn có từ 1-5 người nhận
        int recipientCount = random.nextInt(5) + 1;
        Set<Long> addedDepartments = new HashSet<>();
        
        for (int i = 0; i < recipientCount; i++) {
            Department dept = departments.get(random.nextInt(departments.size()));
            
            // Tránh trùng lặp department
            if (addedDepartments.contains(dept.getId())) {
                continue;
            }
            addedDepartments.add(dept.getId());
            
            // 70% gửi cho cả phòng ban, 30% gửi cho user cụ thể
            if (random.nextDouble() < 0.7) {
                document.addRecipient(dept, null); // Gửi cho cả phòng ban
            } else {
                // Tìm user trong phòng ban này
                List<User> deptUsers = users.stream()
                    .filter(u -> u.getDepartment() != null && u.getDepartment().getId().equals(dept.getId()))
                    .toList();
                
                if (!deptUsers.isEmpty()) {
                    User specificUser = deptUsers.get(random.nextInt(deptUsers.size()));
                    document.addRecipient(dept, specificUser);
                } else {
                    document.addRecipient(dept, null); // Fallback to department
                }
            }
        }
    }

    /**
     * Xóa tất cả công văn demo (để test lại)
     */
    @Transactional
    public void deleteAllDemoDocuments() {
        log.info("Xóa tất cả công văn demo...");
        
        // Xóa các công văn có pattern số công văn demo
        List<InternalDocument> demoDocuments = internalDocumentRepository.findAll().stream()
            .filter(doc -> doc.getDocumentNumber() != null && 
                          (doc.getDocumentNumber().matches(".*-\\d{4}/2025") || 
                           doc.getDocumentNumber().contains("DEMO")))
            .toList();
        
        internalDocumentRepository.deleteAll(demoDocuments);
        log.info("Đã xóa {} công văn demo", demoDocuments.size());
    }

    /**
     * Kiểm tra số lượng công văn hiện có
     */
    public long countTotalDocuments() {
        return internalDocumentRepository.count();
    }
}
