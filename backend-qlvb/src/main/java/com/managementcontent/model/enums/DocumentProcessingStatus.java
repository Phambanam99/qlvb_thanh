package com.managementcontent.model.enums;

import lombok.Getter;
import org.hibernate.sql.Update;

/**
 * Enum representing the processing status of documents in ISO-compliant
 * workflow
 * Enhanced for Quy trình 10.1 - Xử lý Văn bản đến, đi
 */
@Getter
public enum DocumentProcessingStatus {
    // Initial statuses
    DRAFT("draft", "Dự thảo"),
    REGISTERED("registered", "Đã đăng ký"),

    // Văn thư statuses
    FORMAT_CORRECTION("format_correction", "Cần chỉnh sửa thể thức"),
    FORMAT_CORRECTED("format_corrected", "Đã chỉnh sửa thể thức"),

    // 2. Văn thư phân phối statuses
    DISTRIBUTED("distributed", "Đã phân phối"),

    // 3. Trưởng phòng statuses
    DEPT_ASSIGNED("dept_assigned", "Phòng đã phân công"),
    PENDING_APPROVAL("pending_approval", "Chờ phê duyệt"),

    // 4. Chuyên viên statuses
    SPECIALIST_PROCESSING("specialist_processing", "Trợ lý đang xử lý"),
    SPECIALIST_SUBMITTED("specialist_submitted", "Trợ lý đã trình"),

    // 5. Lãnh đạo statuses
    LEADER_REVIEWING("leader_reviewing", "Thủ trưởng đang xem xét"),
    LEADER_APPROVED("leader_approved", "Thủ trưởng đã phê duyệt"),
    LEADER_COMMENTED("leader_commented", "Thủ trưởng đã cho ý kiến"),

    // Processing status for document tracking
    NOT_PROCESSED("not_processed", "Chưa xử lý"),
    IN_PROCESS("in_process", "Đang xử lý"),
    PROCESSED("processed", "Đã xử lý"),

    // Final statuses
    PUBLISHED("published", "Đã ban hành"),
    COMPLETED("completed", "Hoàn thành"),
    REJECTED("rejected", "Từ chối"),
    ARCHIVED("archived", "Lưu trữ"),
    HEADER_DEPARTMENT_REVIEWING("department_reviewing", "Chỉ  huy đang xem xét"),
    HEADER_DEPARTMENT_APPROVED("department_approved", "Chỉ huy đã phê duyệt"),
    HEADER_DEPARTMENT_COMMENTED("department_commented", "Chỉ huy đã cho ý kiến"),
    UPDATE("updated","Văn bản đã được chỉnh sửa");
    private final String code;
    private final String displayName;

    DocumentProcessingStatus(String code, String displayName) {
        this.code = code;
        this.displayName = displayName;
    }

    /**
     * Get DocumentProcessingStatus from string code
     * 
     * @param code string code of status
     * @return corresponding DocumentProcessingStatus enum or null if not found
     */
    public static DocumentProcessingStatus fromCode(String code) {
        for (DocumentProcessingStatus status : DocumentProcessingStatus.values()) {
            if (status.getCode().equals(code)) {
                return status;
            }
        }
        return null;
    }

    /**
     * Get DocumentProcessingStatus from display name
     * 
     * @param displayName display name of status
     * @return corresponding DocumentProcessingStatus enum or null if not found
     */
    public static DocumentProcessingStatus fromDisplayName(String displayName) {
        for (DocumentProcessingStatus status : DocumentProcessingStatus.values()) {
            if (status.getDisplayName().equals(displayName)) {
                return status;
            }
        }
        return null;
    }
}