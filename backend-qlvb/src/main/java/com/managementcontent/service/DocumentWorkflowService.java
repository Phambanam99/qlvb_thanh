package com.managementcontent.service;

import com.managementcontent.model.*;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import com.managementcontent.model.enums.NotificationType;
import com.managementcontent.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DocumentWorkflowService {

    private final DocumentRepository<Document> documentRepository;
    private final DocumentHistoryRepository documentHistoryRepository;
    private final DocumentDepartmentRepository documentDepartmentRepository;
    private final DepartmentRepository departmentRepository;
    private final DocumentDepartmentService documentDepartmentService;
    private final UserRepository userRepository;
    private final DocumentRelationshipRepository documentRelationshipRepository;
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private DocumentTypeRepository documentTypeRepository;

    public DocumentWorkflowService(DocumentRepository<Document> documentRepository,
            DocumentHistoryRepository documentHistoryRepository,
            DocumentDepartmentRepository documentDepartmentRepository,
            DepartmentRepository departmentRepository,
            DocumentDepartmentService documentDepartmentService,
            UserRepository userRepository,
            DocumentRelationshipRepository documentRelationshipRepository) {
        this.documentRepository = documentRepository;
        this.documentHistoryRepository = documentHistoryRepository;
        this.documentDepartmentRepository = documentDepartmentRepository;
        this.departmentRepository = departmentRepository;
        this.documentDepartmentService = documentDepartmentService;
        this.userRepository = userRepository;
        this.documentRelationshipRepository = documentRelationshipRepository;
    }

    /**
     * Change the status of a document and record the change in document history
     *
     * @param documentId ID of the document
     * @param newStatus  new status to set
     * @param actor      user performing the action
     * @param comments   optional comments about the status change
     * @return updated document
     */
    @Transactional
    public Optional<Document> changeDocumentStatus(Long documentId, DocumentProcessingStatus newStatus,
            User actor, String comments) {
        return documentRepository.findById(documentId).map(document -> {
            String previousStatus = String.valueOf(document.getStatus());

            // Update document status
            document.setStatus(newStatus);
            Document updatedDocument = (Document) documentRepository.save(document);
            // Record history
            DocumentHistory history = new DocumentHistory();
            history.setDocument(document);
            history.setPreviousStatus(previousStatus);
            history.setNewStatus(String.valueOf(newStatus.ordinal()));
            history.setComments(comments);
            history.setPerformedBy(actor); // Lưu thông tin người thực hiện hành động

            history.setAction("STATUS_CHANGE");
            DocumentHistory savedHistory = documentHistoryRepository.save(history);

            // After saving history
            notificationService.createAndSendNotification(
                    document,
                    actor,
                    NotificationType.STATUS_CHANGE,
                    "Document status changed from " + previousStatus + " to " + newStatus.getDisplayName());

            // update DocumentDepartment
            // Update the status of all DocumentDepartment entries related to this document
            // Set<DocumentDepartment> documentDepartments = documentDepartmentRepository
            // .findByDocumentIdAndDepartmentId(documentId, actor.getDepartment().getId());
            return updatedDocument;
        });
    }

    // set process deadline for documemt if exists document id
    @Transactional
    public void setProcessDeadline(Long documentId, Date deadline) {
        documentRepository.findById(documentId).map(document -> {
            document.setProcessDeadline(deadline);
            return documentRepository.save(document);
        });
    }

    /**
     * Assign a document to a user and record the assignment in document history
     *
     * @param documentId ID of the document
     * @param assignedTo user being assigned
     * @param actor      user performing the assignment
     * @param comments   optional comments about the assignment
     * @return updated document history entry
     */
    @Transactional
    public Optional<DocumentHistory> assignDocument(Long documentId, User assignedTo, User actor, String comments) {
        return documentRepository.findById(documentId).map(document -> {
            // Create assignment record
            DocumentHistory history = new DocumentHistory();
            history.setDocument(document);
            history.setAction("ASSIGNMENT");
            document.setUserPrimaryProcessor(assignedTo);
            documentRepository.save(document);
            history.setPreviousStatus(document.getStatus().name());
            history.setNewStatus(String.valueOf(DocumentProcessingStatus.HEADER_DEPARTMENT_COMMENTED.ordinal()));
            // Giữ nguyên trạng thái
            history.setComments(comments);
            history.setPerformedBy(actor); // Lưu thông tin người thực hiện hành động

            history.setAssignedTo(assignedTo);

            return documentHistoryRepository.save(history);
        });
    }

    @Transactional
    public Department getDocumentAssigneePrimary(Long documentId) {
        return documentRepository.findById(documentId)
                .flatMap(document -> documentHistoryRepository
                        .findFirstByDocumentAndActionOrderByTimestampDesc(document, "ASSIGNMENT"))
                .map(DocumentHistory::getPrimaryDepartment)
                .orElse(null);
    }

    @Transactional
    public Set<Department> getDocumentAssigneesCollabs(Long documentId) {
        return documentRepository.findById(documentId)
                .map(document -> documentHistoryRepository.findByDocumentAndActionOrderByTimestampDesc(
                        document, "ASSIGNMENT"))
                .orElse(List.of())
                .stream()
                .flatMap(history -> history.getCollaboratingDepartments().stream()) // Flatten all departments
                .collect(Collectors.toSet()); // Avoid duplicates
    }

    /**
     * Get the complete history of a document
     *
     * @param documentId ID of the document
     * @return list of document history entries in descending chronological order
     */
    public List<DocumentHistory> getDocumentHistory(Long documentId) {
        return documentRepository.findById(documentId)
                .map(documentHistoryRepository::findByDocumentOrderByTimestampDesc)
                .orElse(List.of());
    }

    /**
     * Check if the document can transition to a specified status based on Quy trình
     * 10.1
     *
     * @param documentId   ID of the document
     * @param targetStatus status to check if transition is allowed
     * @return true if transition is allowed, false otherwise
     */
    public boolean canChangeStatus(Long documentId, DocumentProcessingStatus targetStatus) {
        return documentRepository.findById(documentId).map(document -> {
            DocumentProcessingStatus currentStatus = document.getStatus();

            // Implement transition rules based on Quy trình 10.1
            if (currentStatus == DocumentProcessingStatus.DRAFT) {
                // Van thu can register the document
                return targetStatus == DocumentProcessingStatus.REGISTERED;
            } else if (currentStatus == DocumentProcessingStatus.REGISTERED) {
                // After registration, document is distributed to departments
                return targetStatus == DocumentProcessingStatus.DISTRIBUTED;
            } else if (currentStatus == DocumentProcessingStatus.DISTRIBUTED) {
                // Department heads can assign to specialists or start reviewing themselves
                // Can also go back to registered if need to fix registration info
                return targetStatus == DocumentProcessingStatus.DEPT_ASSIGNED ||
                        targetStatus == DocumentProcessingStatus.HEADER_DEPARTMENT_REVIEWING ||
                        targetStatus == DocumentProcessingStatus.REGISTERED;
            } else if (currentStatus == DocumentProcessingStatus.DEPT_ASSIGNED) {
                // Specialists can process the document
                // Can also go back to distributed if need to reassign to different department
                return targetStatus == DocumentProcessingStatus.SPECIALIST_PROCESSING ||
                        targetStatus == DocumentProcessingStatus.DISTRIBUTED;
            } else if (currentStatus == DocumentProcessingStatus.SPECIALIST_PROCESSING) {
                // Specialists can submit for review or request approval
                return targetStatus == DocumentProcessingStatus.SPECIALIST_SUBMITTED ||
                        targetStatus == DocumentProcessingStatus.PENDING_APPROVAL;
            } else if (currentStatus == DocumentProcessingStatus.PENDING_APPROVAL) {
                // Department head forwards to leadership or reviews themselves
                return targetStatus == DocumentProcessingStatus.LEADER_REVIEWING ||
                        targetStatus == DocumentProcessingStatus.HEADER_DEPARTMENT_REVIEWING;
            } else if (currentStatus == DocumentProcessingStatus.SPECIALIST_SUBMITTED) {
                // Submitted documents can be reviewed by leaders or department headers
                return targetStatus == DocumentProcessingStatus.LEADER_REVIEWING ||
                        targetStatus == DocumentProcessingStatus.HEADER_DEPARTMENT_REVIEWING;
            } else if (currentStatus == DocumentProcessingStatus.LEADER_REVIEWING) {
                // Leaders can approve, comment, or reject
                return targetStatus == DocumentProcessingStatus.LEADER_APPROVED ||
                        targetStatus == DocumentProcessingStatus.LEADER_COMMENTED ||
                        targetStatus == DocumentProcessingStatus.REJECTED;
            } else if (currentStatus == DocumentProcessingStatus.LEADER_COMMENTED) {
                // After comments, can go back to specialist processing or be approved
                return targetStatus == DocumentProcessingStatus.SPECIALIST_PROCESSING ||
                        targetStatus == DocumentProcessingStatus.LEADER_APPROVED;
            } else if (currentStatus == DocumentProcessingStatus.LEADER_APPROVED) {
                // Approved documents can be completed or published (for outgoing docs)
                return targetStatus == DocumentProcessingStatus.COMPLETED ||
                        targetStatus == DocumentProcessingStatus.PUBLISHED;
            } else if (currentStatus == DocumentProcessingStatus.HEADER_DEPARTMENT_REVIEWING) {
                // Department headers can approve, comment, or reject
                return targetStatus == DocumentProcessingStatus.HEADER_DEPARTMENT_APPROVED ||
                        targetStatus == DocumentProcessingStatus.HEADER_DEPARTMENT_COMMENTED ||
                        targetStatus == DocumentProcessingStatus.REJECTED;
            } else if (currentStatus == DocumentProcessingStatus.HEADER_DEPARTMENT_COMMENTED) {
                // After comments, can go back to specialist processing or be approved
                return targetStatus == DocumentProcessingStatus.SPECIALIST_PROCESSING ||
                        targetStatus == DocumentProcessingStatus.HEADER_DEPARTMENT_APPROVED;
            } else if (currentStatus == DocumentProcessingStatus.HEADER_DEPARTMENT_APPROVED) {
                // Department header approved documents can be forwarded to leader, completed,
                // or published
                return targetStatus == DocumentProcessingStatus.LEADER_REVIEWING ||
                        targetStatus == DocumentProcessingStatus.COMPLETED ||
                        targetStatus == DocumentProcessingStatus.PUBLISHED;
            } else if (currentStatus == DocumentProcessingStatus.COMPLETED) {
                // Completed documents can be archived
                return targetStatus == DocumentProcessingStatus.ARCHIVED;
            } else if (currentStatus == DocumentProcessingStatus.PUBLISHED) {
                // Published documents are considered complete or can be archived
                return targetStatus == DocumentProcessingStatus.COMPLETED ||
                        targetStatus == DocumentProcessingStatus.ARCHIVED;
            } else if (currentStatus == DocumentProcessingStatus.REJECTED) {
                // Rejected documents can be resubmitted as draft or archived
                return targetStatus == DocumentProcessingStatus.DRAFT ||
                        targetStatus == DocumentProcessingStatus.ARCHIVED;
            } else if (currentStatus == DocumentProcessingStatus.ARCHIVED) {
                // Archived documents cannot change status
                return false;
            } else {
                return false;
            }
        }).orElse(false);
    }

    /**
     * Get all users who have been assigned to a document
     *
     * @param documentId ID of the document
     * @return list of users assigned to the document
     */
    public List<User> getDocumentAssignees(Long documentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User currentUser = userRepository.findByName(username).orElse(null);
        Long departmentId = currentUser.getDepartment().getId();

        List<User> users = documentRepository.findById(documentId)
                .map(document -> documentHistoryRepository.findByDocumentAndActionOrderByTimestampDesc(
                        document, "ASSIGNMENT"))

                .orElse(List.of())
                .stream()
                .map(DocumentHistory::getAssignedTo)
                // .filter(user -> user.getDepartment().getId().equals(departmentId))
                .distinct()
                .toList();
        Set<String> currentUserRoles = currentUser.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
        if (currentUserRoles.contains("ROLE_CUC_TRUONG")
                || currentUserRoles.contains("ROLE_CUC_PHO")
                || currentUserRoles.contains("ROLE_VAN_THU")
                || currentUserRoles.contains("ROLE_CHINH_UY")
                || currentUserRoles.contains("ROLE_PHO_CHINH_UY")) {
            return users;
        } else {
            return users.stream()
                    .filter(user -> user.getDepartment().getId().equals(departmentId))
                    .collect(Collectors.toList());
        }

    }

    /**
     * Get the current status of a document as an enum
     *
     * @param documentId ID of the document
     * @return current document status as enum or null if document not found
     */
    public DocumentProcessingStatus getDocumentStatus(Long documentId) {
        return documentRepository.findById(documentId)
                .map(Document::getStatus)
                .orElse(null);
    }

    /**
     * 1. Văn thư: Register a newly received document
     */
    @Transactional
    public Optional<Document> registerIncomingDocument(Long documentId, User clerk, String comments) {
        return changeDocumentStatus(documentId, DocumentProcessingStatus.REGISTERED, clerk, comments);
    }

    /**
     * 1. Văn thư: Publish an outgoing document
     */
    @Transactional
    public Optional<Document> publishOutgoingDocument(Long documentId, User clerk, String comments) {
        return changeDocumentStatus(documentId, DocumentProcessingStatus.PUBLISHED, clerk, comments);
    }

    /**
     * 2. Phân công văn: Distribute document to relevant departments
     * Tối ưu phương thức này để tận dụng DocumentDepartment
     * 
     * @param documentId                 ID của công văn
     * @param primaryDepartmentId        ID của phòng ban xử lý chính
     * @param collaboratingDepartmentIds Danh sách các ID của phòng ban phối hợp
     * @param distributor                Người phân phối
     * @param comments                   Ghi chú về việc phân phối
     * @return công văn đã được cập nhật
     */
    @Transactional
    public Optional<Document> distributeDocument(
            Long documentId,
            Long primaryDepartmentId,
            List<Long> collaboratingDepartmentIds,
            User distributor,
            String comments) {

        // Đầu tiên thay đổi trạng thái của công văn sang DISTRIBUTED
        Optional<Document> documentOpt = changeDocumentStatus(documentId, DocumentProcessingStatus.DISTRIBUTED,
                distributor, comments);

        if (documentOpt.isPresent()) {
            Document document = documentOpt.get();

            // Gán phòng ban xử lý chính nếu có
            if (primaryDepartmentId != null) {
                documentDepartmentService.assignDocumentToDepartment(
                        documentId,
                        primaryDepartmentId,
                        distributor.getId(),
                        true, // là phòng ban xử lý chính
                        "Phân công xử lý chính: " + comments,
                        null); // không đặt deadline cụ thể
            }

            // Gán các phòng ban phối hợp nếu có
            if (collaboratingDepartmentIds != null && !collaboratingDepartmentIds.isEmpty()) {
                for (Long deptId : collaboratingDepartmentIds) {
                    // Bỏ qua nếu trùng với phòng ban xử lý chính
                    if (primaryDepartmentId != null && primaryDepartmentId.equals(deptId)) {
                        continue;
                    }

                    documentDepartmentService.assignDocumentToDepartment(
                            documentId,
                            deptId,
                            distributor.getId(),
                            false, // không phải phòng ban xử lý chính
                            "Phân công phối hợp: " + comments,
                            null); // không đặt deadline cụ thể
                }
            }
        }

        return documentOpt;
    }

    /**
     * Phương thức đơn giản hóa cho trường hợp chỉ có comments
     */
    @Transactional
    public Optional<Document> distributeDocument(Long documentId, User distributor, String comments) {
        // Chỉ cập nhật trạng thái công văn mà không gán cho phòng/ban nào
        return changeDocumentStatus(documentId, DocumentProcessingStatus.DISTRIBUTED, distributor, comments);
    }

    /**
     * 3. Trưởng phòng: Assign document to specialists
     */
    @Transactional
    public Optional<DocumentHistory> assignToSpecialist(Long documentId, User specialist, User departmentHead,
            String comments) {
        // First change status to assigned
        changeDocumentStatus(documentId, DocumentProcessingStatus.DEPT_ASSIGNED, departmentHead,
                "Phân công cho chuyên viên xử lý: " + specialist.getName());

        // Then create the assignment entry
        return assignDocument(documentId, specialist, departmentHead, comments);
    }

    /**
     * 3. Trưởng phòng: Forward document for leader approval
     */
    @Transactional
    public Optional<Document> forwardToLeadership(Long documentId, User departmentHead, String comments) {
        return changeDocumentStatus(documentId, DocumentProcessingStatus.LEADER_REVIEWING, departmentHead, comments);
    }

    /**
     * 4. Chuyên viên: Start processing document
     */
    @Transactional
    public Optional<Document> startProcessingDocument(Long documentId, User specialist, String comments) {
        return changeDocumentStatus(documentId, DocumentProcessingStatus.SPECIALIST_PROCESSING, specialist, comments);
    }

    /**
     * 4. Chuyên viên: Submit document to leadership
     */
    @Transactional
    public Optional<Document> submitToLeadership(Long documentId, User specialist, String comments) {
        return changeDocumentStatus(documentId, DocumentProcessingStatus.SPECIALIST_SUBMITTED, specialist, comments);
    }

    /**
     * 5. Lãnh đạo: Start reviewing document
     */
    @Transactional
    public Optional<Document> startReviewingDocument(Long documentId, User leader, String comments) {
        return changeDocumentStatus(documentId, DocumentProcessingStatus.LEADER_REVIEWING, leader, comments);
    }

    /**
     * 5. Lãnh đạo: Provide feedback on document
     */
    @Transactional
    public Optional<Document> provideDocumentFeedback(Long documentId, User leader, String comments) {
        return changeDocumentStatus(documentId, DocumentProcessingStatus.LEADER_COMMENTED, leader, comments);
    }

    /**
     * 5. Lãnh đạo: Provide feedback on document with attachment
     */
    @Transactional
    public Optional<Document> provideDocumentFeedbackWithAttachment(Long documentId, User leader, String comments,
            String attachmentFilename) {
        Optional<Document> docOpt = documentRepository.findById(documentId);
        if (docOpt.isPresent()) {
            Document document = docOpt.get();
            DocumentHistory history = new DocumentHistory();
            history.setDocument(document);
            history.setPerformedBy(leader);
            history.setAction("STATUS_CHANGE");
            // Lưu tên file đính kèm mới vào lịch sử nếu có
            if (attachmentFilename != null) {

                history.setComments(comments + "\n Đính kèm file phản hồi: " + attachmentFilename);

                history.setAttachmentPath("uploads/" + attachmentFilename);

            } else {
                history.setComments(comments + "\n Không có file đính kèm phản hồi.");
            }
            documentHistoryRepository.save(history);
            // Nếu đây là công văn đi, cập nhật lịch sử cho công văn đến liên quan
            updateHistoryForRelates(comments, leader, attachmentFilename, document);
            // Thay đổi trạng thái công văn
            return changeDocumentStatus(documentId, DocumentProcessingStatus.LEADER_COMMENTED, leader, comments);
        }
        return Optional.empty();
    }

    /**
     * 5. Lãnh đạo: Approve document
     */
    @Transactional
    public Optional<Document> approveDocument(Long documentId, User leader, String comments) {
        Optional<Document> docOpt = documentRepository.findById(documentId);
        if (docOpt.isPresent()) {
            Document document = docOpt.get();

            // Cập nhật lịch sử cho các công văn đến liên quan
            updateHistoryForApproval(comments, leader, document, DocumentProcessingStatus.LEADER_APPROVED);

            // Thay đổi trạng thái công văn
            return changeDocumentStatus(documentId, DocumentProcessingStatus.LEADER_APPROVED, leader, comments);
        }
        return Optional.empty();
    }

    /**
     * Mark document as completed (end of workflow)
     */
    @Transactional
    public Optional<Document> completeDocument(Long documentId, User actor, String comments) {
        return changeDocumentStatus(documentId, DocumentProcessingStatus.COMPLETED, actor, comments);
    }

    /**
     * Mark document as archived (for long-term storage)
     */
    @Transactional
    public Optional<Document> archiveDocument(Long documentId, User actor, String comments) {
        return changeDocumentStatus(documentId, DocumentProcessingStatus.ARCHIVED, actor, comments);
    }

    /**
     * Reject document at any stage
     */
    @Transactional
    public Optional<Document> rejectDocument(Long documentId, User actor, String comments) {
        return changeDocumentStatus(documentId, DocumentProcessingStatus.REJECTED, actor, comments);
    }

    /**
     * Đánh dấu công văn đến là đã được trả lời
     */
    @Transactional
    public void updateIncomingDocumentAsResponded(Long documentId, User actor, String comments) {
        changeDocumentStatus(documentId, DocumentProcessingStatus.SPECIALIST_SUBMITTED, actor, comments);
    }

    /**
     * Đăng ký công văn đi
     */
    @Transactional
    public Optional<Document> registerOutgoingDocument(Long documentId, User actor, String comments) {
        // First step: Mark as draft
        return changeDocumentStatus(documentId, DocumentProcessingStatus.DRAFT, actor, comments);

        // Next step: Register outgoing document
        // return changeDocumentStatus(documentId, DocumentProcessingStatus.REGISTERED,
        // actor, comments);
    }

    /**
     * Tạo công văn đi độc lập (không liên quan đến công văn đến)
     * Phương thức này xử lý việc tạo công văn đi mới mà không phải là trả lời cho
     * công văn đến nào
     *
     * @param documentId ID của công văn đi đã được tạo
     * @param actor      Người tạo công văn
     * @param comments   Ghi chú khi tạo công văn
     */
    @Transactional
    public void createStandaloneOutgoingDocument(Long documentId, User actor, String comments) {
        // Đặt trạng thái DRAFT cho công văn đi độc lập
        changeDocumentStatus(documentId, DocumentProcessingStatus.DRAFT, actor,
                comments != null && !comments.isEmpty() ? comments : "Tạo công văn đi mới độc lập");
    }

    /**
     * Thêm một bản ghi lịch sử cho công văn mà không thay đổi trạng thái
     * Hữu ích cho các hành động như chỉnh sửa thông tin, upload file, v.v.
     *
     * @param documentId ID của công văn
     * @param action     Loại hành động (ví dụ: "UPDATE", "UPLOAD", "COMMENT")
     * @param actor      Người thực hiện hành động
     * @param comments   Ghi chú về hành động
     */
    @Transactional
    public void addDocumentHistoryEntry(Long documentId, String action, User actor, String comments) {
        documentRepository.findById(documentId).map(document -> {
            DocumentHistory history = new DocumentHistory();
            history.setDocument(document);
            history.setAction(action);
            history.setComments(comments);
            history.setPerformedBy(actor);
            history.setPreviousStatus(document.getStatus().toString());
            history.setNewStatus(document.getStatus().toString()); // Giữ nguyên trạng thái

            DocumentHistory savedHistory = documentHistoryRepository.save(history);

            // Gửi thông báo về hành động
            notificationService.createAndSendNotification(
                    document,
                    actor,
                    NotificationType.DOCUMENT_UPDATE,
                    "Document was updated: " + comments);

            return savedHistory;
        }).orElseThrow(() -> new RuntimeException("Document not found with ID: " + documentId));
    }

    /**
     * Chỉ huy đơn vị: Bắt đầu xem xét công văn
     * 
     * @param documentId       ID của công văn
     * @param headerDepartment Chỉ huy đơn vị thực hiện xem xét
     * @param comments         Ghi chú của chỉ huy
     * @return công văn đã cập nhật trạng thái
     */
    @Transactional
    public Optional<Document> startHeaderDepartmentReviewing(Long documentId, User headerDepartment, String comments) {
        return changeDocumentStatus(documentId, DocumentProcessingStatus.HEADER_DEPARTMENT_REVIEWING, headerDepartment,
                comments);
    }

    /**
     * Chỉ huy đơn vị: Phê duyệt công văn
     * 
     * @param documentId       ID của công văn
     * @param headerDepartment Chỉ huy đơn vị thực hiện phê duyệt
     * @param comments         Ghi chú phê duyệt
     * @return công văn đã cập nhật trạng thái
     */
    @Transactional
    public Optional<Document> approveHeaderDepartment(Long documentId, User headerDepartment, String comments) {
        Optional<Document> docOpt = documentRepository.findById(documentId);
        if (docOpt.isPresent()) {
            Document document = docOpt.get();

            // Cập nhật lịch sử cho các công văn đến liên quan
            updateHistoryForApproval(comments, headerDepartment, document,
                    DocumentProcessingStatus.HEADER_DEPARTMENT_APPROVED);

            // Lấy phòng ban hiện tại của người duyệt
            Department currentDepartment = headerDepartment.getDepartment();

            // Kiểm tra xem phòng ban có phòng ban cha hay không
            Department parentDepartment = currentDepartment.getParentDepartment();

            if (parentDepartment != null) {
                // Có phòng ban cha, chuyển công văn lên phòng ban cha để tiếp tục xem xét
                // Tìm kiếm các chỉ huy của phòng ban cha để thông báo


                // Đánh dấu phòng ban cha là đơn vị xử lý chính
                documentDepartmentService.assignDocumentToDepartment(
                        documentId,
                        parentDepartment.getId(),
                        headerDepartment.getId(),
                        true, // Đánh dấu là đơn vị xử lý chính
                        "Chuyển công văn lên cấp trên phê duyệt sau khi được " + headerDepartment.getName()
                                + " phê duyệt",
                        null // Không đặt deadline cụ thể
                );

                // Vẫn giữ nguyên trạng thái đã phê duyệt ở cấp phòng ban
                return changeDocumentStatus(documentId, DocumentProcessingStatus.HEADER_DEPARTMENT_APPROVED,
                        headerDepartment, comments + " - Chuyển tiếp tới " + parentDepartment.getName());
            } else {
                // Không có phòng ban cha (đã là cấp cao nhất), hoàn tất phê duyệt
                return changeDocumentStatus(documentId, DocumentProcessingStatus.HEADER_DEPARTMENT_APPROVED,
                        headerDepartment, comments + " - Phê duyệt cuối cùng");
            }
        }
        return Optional.empty();
    }

    /**
     * Chỉ huy đơn vị: Cho ý kiến về công văn
     * 
     * @param documentId       ID của công văn
     * @param headerDepartment Chỉ huy đơn vị cho ý kiến
     * @param comments         Nội dung ý kiến
     * @return công văn đã cập nhật trạng thái
     */
    @Transactional
    public Optional<Document> commentHeaderDepartment(Long documentId, User headerDepartment, String comments) {
        return changeDocumentStatus(documentId, DocumentProcessingStatus.HEADER_DEPARTMENT_COMMENTED, headerDepartment,
                comments);
    }

    /**
     * Chỉ huy đơn vị: Cho ý kiến về công văn với file đính kèm
     * 
     * @param documentId         ID của công văn
     * @param headerDepartment   Chỉ huy đơn vị cho ý kiến
     * @param comments           Nội dung ý kiến
     * @param attachmentFilename Tên file đính kèm (có thể null)
     * @return công văn đã cập nhật trạng thái
     */
    @Transactional
    public Optional<Document> commentHeaderDepartmentWithAttachment(Long documentId, User headerDepartment,
            String comments, String attachmentFilename) {
        Optional<Document> docOpt = documentRepository.findById(documentId);
        if (docOpt.isPresent()) {
            Document document = docOpt.get();
            DocumentHistory history = new DocumentHistory();
            history.setDocument(document);
            history.setPerformedBy(headerDepartment);
            history.setAction("STATUS_CHANGE");

            // Lưu tên file đính kèm mới vào lịch sử nếu có
            if (attachmentFilename != null) {

                history.setComments(comments + "\nĐính kèm file phản hồi: " + attachmentFilename);
                history.setAttachmentPath("uploads/" + attachmentFilename);
                documentHistoryRepository.save(history);
            }
            // Nếu đây là công văn đi, cập nhật lịch sử cho công văn đến liên quan
            updateHistoryForRelates(comments, headerDepartment, attachmentFilename, document);

            // Thay đổi trạng thái công văn
            return changeDocumentStatus(documentId, DocumentProcessingStatus.HEADER_DEPARTMENT_COMMENTED,
                    headerDepartment, comments);
        }
        return Optional.empty();
    }

    private void updateHistoryForRelates(String comment, User headerDepartment, String attachmentFilename,
            Document document) {
        if (document.getType().equals("outgoing_document")) {
            try {
                OutgoingDocument outgoingDoc = (OutgoingDocument) document;
                // Tìm các công văn đến liên quan
                List<IncomingDocument> relatedIncomingDocs = documentRelationshipRepository
                        .findIncomingDocumentsForOutgoingDocument(outgoingDoc.getId());

                // Cập nhật lịch sử cho từng công văn đến
                for (IncomingDocument incomingDoc : relatedIncomingDocs) {
                    DocumentHistory relatedHistory = new DocumentHistory();
                    relatedHistory.setDocument(incomingDoc);
                    relatedHistory.setAction("STATUS_CHANGE");
                    if (attachmentFilename == null) {
                        relatedHistory.setComments(comment);
                    } else {
                        // Chỉ thêm tên file nếu có
                        relatedHistory.setComments(comment +
                                "\n Đính kèm phản hồi cho công văn đi liên quan: " + attachmentFilename);
                        relatedHistory.setAttachmentPath("uploads/" + attachmentFilename);
                    }

                    relatedHistory.setPerformedBy(headerDepartment);

                    relatedHistory.setPreviousStatus(incomingDoc.getStatus().toString());
                    if (isLeader(headerDepartment)) {
                        relatedHistory.setNewStatus(
                                String.valueOf(DocumentProcessingStatus.LEADER_COMMENTED.ordinal()));
                    } else if (isDepartmentHead(headerDepartment)) {
                        relatedHistory.setNewStatus(String.valueOf(
                                DocumentProcessingStatus.HEADER_DEPARTMENT_COMMENTED.ordinal()));
                    }

                    documentHistoryRepository.save(relatedHistory);
                }
            } catch (ClassCastException e) {
                // Xử lý nếu không thể ép kiểu
                System.err.println("Không thể ép kiểu document thành OutgoingDocument: " + e.getMessage());
            }

        }
    }

    /**
     * Kiểm tra người dùng có phải là chỉ huy cục hay không
     * 
     * @param user Người dùng cần kiểm tra
     * @return true nếu người dùng có vai trò chỉ huy cục, false nếu không
     */
    public boolean isLeader(User user) {
        Set<String> userRoles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return userRoles.contains("ROLE_CUC_TRUONG")
                || userRoles.contains("ROLE_CUC_PHO")
                || userRoles.contains("ROLE_CHINH_UY")
                || userRoles.contains("ROLE_PHO_CHINH_UY");
    }

    /**
     * Kiểm tra người dùng có phải là chỉ huy đơn vị hay không
     * 
     * @param user Người dùng cần kiểm tra
     * @return true nếu người dùng có vai trò chỉ huy đơn vị, false nếu không
     */
    public boolean isDepartmentHead(User user) {
        Set<String> userRoles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return userRoles.contains("ROLE_TRUONG_PHONG")
                || userRoles.contains("ROLE_PHO_PHONG")
                || userRoles.contains("ROLE_TRAM_TRUONG")
                || userRoles.contains("ROLE_CUM_TRUONG")
                || userRoles.contains("ROLE_TRUONG_BAN");
    }

    /**
     * Reject document with attachment
     */
    @Transactional
    public Optional<Document> rejectDocumentWithAttachment(Long documentId, User actor, String comments,
            String attachmentFilename) {
        Optional<Document> docOpt = documentRepository.findById(documentId);
        if (docOpt.isPresent()) {
            Document document = docOpt.get();

            // Lưu tên file đính kèm mới vào lịch sử nếu có
            if (attachmentFilename != null) {
                DocumentHistory history = new DocumentHistory();
                history.setDocument(document);
                history.setAction("REJECTION_ATTACHMENT");
                history.setComments("Đính kèm file từ chối: " + attachmentFilename);
                history.setPerformedBy(actor);
                history.setAttachmentPath("uploads/" + attachmentFilename);
                documentHistoryRepository.save(history);

                // Nếu đây là công văn đi, cập nhật lịch sử cho công văn đến liên quan
                if (document.getType().equals("outgoing_document")) {
                    try {
                        OutgoingDocument outgoingDoc = (OutgoingDocument) document;
                        // Tìm các công văn đến liên quan
                        List<IncomingDocument> relatedIncomingDocs = documentRelationshipRepository
                                .findIncomingDocumentsForOutgoingDocument(outgoingDoc.getId());

                        // Cập nhật lịch sử cho từng công văn đến
                        for (IncomingDocument incomingDoc : relatedIncomingDocs) {
                            DocumentHistory relatedHistory = new DocumentHistory();
                            relatedHistory.setDocument(incomingDoc);
                            relatedHistory.setAction("RELATED_REJECTION_ATTACHMENT");
                            relatedHistory.setComments(
                                    "Đính kèm file từ chối cho công văn đi liên quan: " + attachmentFilename);
                            relatedHistory.setPerformedBy(actor);
                            relatedHistory.setAttachmentPath("uploads/" + attachmentFilename);
                            relatedHistory.setPreviousStatus(incomingDoc.getStatus().toString());
                            relatedHistory.setNewStatus(incomingDoc.getStatus().toString()); // Giữ nguyên trạng thái
                            documentHistoryRepository.save(relatedHistory);
                        }
                    } catch (ClassCastException e) {
                        // Xử lý nếu không thể ép kiểu
                        System.err.println("Không thể ép kiểu document thành OutgoingDocument: " + e.getMessage());
                    }
                }
            }

            // Thay đổi trạng thái công văn
            return changeDocumentStatus(documentId, DocumentProcessingStatus.REJECTED, actor, comments);
        }
        return Optional.empty();
    }

    /**
     * Set document type for a document
     *
     * @param documentId     ID of the document
     * @param documentTypeId ID of the document type
     * @param actor          user performing the action
     * @param comments       optional comments about the change
     * @return updated document
     */
    @Transactional
    public Optional<Document> setDocumentType(Long documentId, Long documentTypeId, User actor, String comments) {
        return documentRepository.findById(documentId).map(document -> {
            Optional<DocumentType> documentTypeOpt = documentTypeRepository.findById(documentTypeId);
            if (!documentTypeOpt.isPresent()) {
                throw new IllegalArgumentException("Document type not found with ID: " + documentTypeId);
            }

            DocumentType previousType = document.getDocumentType();
            String previousTypeDesc = previousType != null ? previousType.getName() : "None";

            // Update document type
            document.setDocumentType(documentTypeOpt.get());
            Document updatedDocument = documentRepository.save(document);

            // Record history
            DocumentHistory history = new DocumentHistory();
            history.setDocument(document);
            history.setAction("DOCUMENT_TYPE_CHANGE");
            history.setComments(comments != null ? comments
                    : "Document type changed from " + previousTypeDesc + " to " + documentTypeOpt.get().getName());
            history.setPerformedBy(actor);
            history.setPreviousStatus(String.valueOf(document.getStatus()));
            history.setNewStatus(String.valueOf(document.getStatus())); // Status doesn't change
            documentHistoryRepository.save(history);

            // Send notification
            notificationService.createAndSendNotification(
                    document,
                    actor,
                    NotificationType.DOCUMENT_UPDATE,
                    "Document type changed to " + documentTypeOpt.get().getName());

            return updatedDocument;
        });
    }

    /**
     * Get document type for a document
     *
     * @param documentId ID of the document
     * @return document type or null if not set
     */
    public DocumentType getDocumentType(Long documentId) {
        return documentRepository.findById(documentId)
                .map(Document::getDocumentType)
                .orElse(null);
    }

    /**
     * Cập nhật lịch sử cho các công văn đến liên quan khi công văn đi được phê duyệt
     * 
     * @param comment   Nội dung bình luận/phê duyệt
     * @param actor     Người thực hiện phê duyệt
     * @param document  công văn đang được phê duyệt
     * @param newStatus Trạng thái mới của công văn sau khi phê duyệt
     */
    private void updateHistoryForApproval(String comment, User actor, Document document,
            DocumentProcessingStatus newStatus) {
        if (document.getType().equals("outgoing_document")) {
            try {
                OutgoingDocument outgoingDoc = (OutgoingDocument) document;
                // Tìm các công văn đến liên quan
                List<IncomingDocument> relatedIncomingDocs = documentRelationshipRepository
                        .findIncomingDocumentsForOutgoingDocument(outgoingDoc.getId());

                // Cập nhật lịch sử cho từng công văn đến
                for (IncomingDocument incomingDoc : relatedIncomingDocs) {
                    DocumentHistory relatedHistory = new DocumentHistory();
                    relatedHistory.setDocument(incomingDoc);
                    relatedHistory.setAction("STATUS_CHANGE");

                    // Tạo thông báo phê duyệt tương ứng
                    String statusName = newStatus == DocumentProcessingStatus.LEADER_APPROVED ? "Thủ trưởng"
                            : "Chỉ huy đơn vị";
                    relatedHistory.setComments("\ncông văn trả lời đã được " + statusName + " phê duyệt");

                    relatedHistory.setPerformedBy(actor);
                    relatedHistory.setPreviousStatus(incomingDoc.getStatus().toString());

                    // Giữ nguyên trạng thái của công văn đến, chỉ ghi nhận là công văn đi đã được phê
                    // duyệt
                    relatedHistory.setNewStatus(DocumentProcessingStatus.LEADER_APPROVED.ordinal() + "");

                    documentHistoryRepository.save(relatedHistory);
                }
            } catch (ClassCastException e) {
                // Xử lý nếu không thể ép kiểu
                System.err.println("Không thể ép kiểu document thành OutgoingDocument: " + e.getMessage());
            }
        }
    }

    /**
     * Văn thư: Từ chối công văn đi để chỉnh sửa thể thức trước khi cấp số
     * 
     * @param documentId ID của công văn cần chỉnh sửa thể thức
     * @param clerk      Văn thư thực hiện từ chối
     * @param comments   Lý do từ chối và hướng dẫn chỉnh sửa
     * @return công văn đã được cập nhật trạng thái
     */
    @Transactional
    public Optional<Document> rejectForFormatCorrection(Long documentId, User clerk, String comments) {
        return changeDocumentStatus(documentId, DocumentProcessingStatus.FORMAT_CORRECTION, clerk, comments);
    }

    /**
     * Văn thư: Từ chối công văn đi để chỉnh sửa thể thức kèm file đính kèm
     * 
     * @param documentId         ID của công văn cần chỉnh sửa thể thức
     * @param clerk              Văn thư thực hiện từ chối
     * @param comments           Lý do từ chối và hướng dẫn chỉnh sửa
     * @param attachmentFilename Tên file đính kèm (template/mẫu chuẩn)
     * @return công văn đã được cập nhật trạng thái
     */
    @Transactional
    public Optional<Document> rejectForFormatCorrectionWithAttachment(Long documentId, User clerk,
            String comments, String attachmentFilename) {
        Optional<Document> docOpt = documentRepository.findById(documentId);
        if (docOpt.isPresent()) {
            Document document = docOpt.get();

            // Lưu tên file đính kèm mới vào lịch sử nếu có
            if (attachmentFilename != null) {
                DocumentHistory history = new DocumentHistory();
                history.setDocument(document);
                history.setAction("FORMAT_CORRECTION_ATTACHMENT");
                history.setComments("Đính kèm hướng dẫn/mẫu thể thức: " + attachmentFilename);
                history.setPerformedBy(clerk);
                history.setAttachmentPath("uploads/" + attachmentFilename);
                documentHistoryRepository.save(history);
            }

            // Thay đổi trạng thái công văn
            return changeDocumentStatus(documentId, DocumentProcessingStatus.FORMAT_CORRECTION, clerk, comments);
        }
        return Optional.empty();
    }

    /**
     * Tái trình công văn đã chỉnh sửa thể thức trực tiếp cho văn thư
     * Phương thức này dùng để tái trình công văn sau khi chuyên viên đã chỉnh sửa
     * theo yêu cầu của văn thư.
     * công văn sẽ đi trực tiếp đến văn thư để xem xét cấp số, không cần qua chỉ huy
     * phòng.
     * 
     * @param documentId ID của công văn đã chỉnh sửa thể thức
     * @param staff      Nhân viên/trợ lý thực hiện chỉnh sửa và gửi lại
     * @param comments   Ghi chú về các chỉnh sửa đã thực hiện
     * @return công văn đã được cập nhật trạng thái
     */
    @Transactional
    public Optional<Document> resubmitAfterFormatCorrection(Long documentId, User staff, String comments) {
        return changeDocumentStatus(documentId, DocumentProcessingStatus.FORMAT_CORRECTED, staff, comments);
    }
}