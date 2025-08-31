package com.managementcontent.service;

import com.managementcontent.dto.InternalDocumentDTO;
import com.managementcontent.model.InternalDocument;
import com.managementcontent.model.User;
import com.managementcontent.repository.InternalDocumentRepository;
import com.managementcontent.util.DateTimeRange;
import com.managementcontent.util.RoleGroupUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.function.Function;

/**
 * Service quản lý authorization logic cho document queries
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentAuthorizationService {

    private final InternalDocumentRepository internalDocumentRepository;
    private final DocumentAccessControlService accessControlService;

    /**
     * Execute document query với role-based authorization
     */
    public Page<InternalDocumentDTO> executeWithRoleBasedAccess(
            User currentUser,
            Pageable pageable,
            Function<RoleGroupUtil.RoleGroup, Page<InternalDocument>> actionByRole,
            Function<InternalDocument, InternalDocumentDTO> converter) {

        if (currentUser == null) {
            return Page.empty(pageable);
        }

        RoleGroupUtil.RoleGroup highestRoleGroup = accessControlService.getUserRoleGroup(currentUser);
        if (highestRoleGroup == null) {
            return Page.empty(pageable);
        }

        Page<InternalDocument> documents = actionByRole.apply(highestRoleGroup);
        return documents.map(converter);
    }

    /**
     * Get sent documents với role-based access
     */
    public Page<InternalDocument> getSentDocumentsByRole(
            User currentUser,
            RoleGroupUtil.RoleGroup roleGroup,
            Pageable pageable) {

        switch (roleGroup) {
            case CHI_HUY_CUC:
                // Chỉ huy cục: Xem tất cả văn bản nội bộ
                return internalDocumentRepository.findAll(pageable);

            case CHI_HUY_DON_VI:
            case VAN_THU:
                // Chỉ huy đơn vị và văn thư: Xem văn bản của phòng ban
                if (currentUser.getDepartment() != null) {
                    List<InternalDocument> allDocs = internalDocumentRepository.findAll();
                    List<InternalDocument> deptDocs = allDocs.stream()
                            .filter(doc -> {
                                boolean sentByDept = doc.getSender() != null &&
                                        doc.getSender().getDepartment() != null &&
                                        doc.getSender().getDepartment().getId()
                                                .equals(currentUser.getDepartment().getId());
                                return sentByDept;
                            })
                            .toList();

                    return createPageFromList(deptDocs, pageable);
                } else {
                    return internalDocumentRepository.findBySenderOrderByCreatedAtDesc(currentUser, pageable);
                }

            case NHAN_VIEN:
            default:
                // Nhân viên: Chỉ xem văn bản do họ gửi
                return internalDocumentRepository.findBySenderOrderByCreatedAtDesc(currentUser, pageable);
        }
    }

    /**
     * Get sent documents by year/month với role-based access
     */
    public Page<InternalDocument> getSentDocumentsByYearAndRole(
            User currentUser,
            RoleGroupUtil.RoleGroup roleGroup,
            DateTimeRange dateRange,
            Pageable pageable,
            int year,
            Integer month) {

        switch (roleGroup) {
            case CHI_HUY_CUC:
                // Chỉ huy cục: Xem tất cả văn bản trong khoảng thời gian
                return internalDocumentRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(
                        dateRange.getStartDate(), dateRange.getEndDate(), pageable);

            case CHI_HUY_DON_VI:
            case VAN_THU:
                // Chỉ huy đơn vị: Xem văn bản của phòng ban trong khoảng thời gian
                if (currentUser.getDepartment() != null) {
                    List<InternalDocument> allDocs = internalDocumentRepository
                            .findByCreatedAtBetweenOrderByCreatedAtDesc(
                                    dateRange.getStartDate(), dateRange.getEndDate(), Pageable.unpaged())
                            .getContent();

                    List<InternalDocument> deptDocs = allDocs.stream()
                            .filter(doc -> {
                                boolean sentByDept = doc.getSender() != null &&
                                        doc.getSender().getDepartment() != null &&
                                        doc.getSender().getDepartment().getId()
                                                .equals(currentUser.getDepartment().getId());
                                return sentByDept;
                            })
                            .toList();

                    return createPageFromList(deptDocs, pageable);
                } else {
                    // Fallback to user's documents
                    if (month != null) {
                        return internalDocumentRepository.findBySenderAndYearAndMonth(currentUser, year, month,
                                pageable);
                    } else {
                        return internalDocumentRepository.findBySenderAndYear(currentUser, year, pageable);
                    }
                }

            case NHAN_VIEN:
            default:
                // Nhân viên: Chỉ xem văn bản do họ gửi trong khoảng thời gian
                if (month != null) {
                    return internalDocumentRepository.findBySenderAndYearAndMonth(currentUser, year, month, pageable);
                } else {
                    return internalDocumentRepository.findBySenderAndYear(currentUser, year, pageable);
                }
        }
    }

    /**
     * Get received documents với role-based access
     */
    public Page<InternalDocument> getReceivedDocumentsByRole(
            User currentUser,
            RoleGroupUtil.RoleGroup roleGroup,
            List<Long> userDepartmentIds,
            Pageable pageable) {

        switch (roleGroup) {
            case CHI_HUY_CUC:
                // Chỉ huy cục: Xem tất cả văn bản nội bộ
                return internalDocumentRepository.findAll(pageable);

            case CHI_HUY_DON_VI:
            case VAN_THU:
                // Chỉ huy đơn vị và văn thư: Xem văn bản nhận của phòng ban
                return internalDocumentRepository.findDocumentsReceivedByUser(currentUser, userDepartmentIds, pageable);

            case NHAN_VIEN:
            default:
                // Nhân viên: Chỉ xem văn bản được gửi cho họ
                return internalDocumentRepository.findDocumentsReceivedByUser(currentUser, userDepartmentIds, pageable);
        }
    }

    /**
     * Get received documents by year/month với role-based access
     */
    public Page<InternalDocument> getReceivedDocumentsByYearAndRole(
            User currentUser,
            RoleGroupUtil.RoleGroup roleGroup,
            List<Long> userDepartmentIds,
            DateTimeRange dateRange,
            Pageable pageable,
            int year,
            Integer month) {

        switch (roleGroup) {
            case CHI_HUY_CUC:
                // Chỉ huy cục: Xem tất cả văn bản trong khoảng thời gian
                return internalDocumentRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(
                        dateRange.getStartDate(), dateRange.getEndDate(), pageable);

            case CHI_HUY_DON_VI:
            case VAN_THU:
                // Chỉ huy đơn vị: Xem văn bản nhận của phòng ban trong khoảng thời gian
                if (month != null) {
                    return internalDocumentRepository.findDocumentsReceivedByUserAndYearAndMonth(
                            currentUser, userDepartmentIds, year, month, pageable);
                } else {
                    return internalDocumentRepository.findDocumentsReceivedByUserAndYear(
                            currentUser, userDepartmentIds, year, pageable);
                }

            case NHAN_VIEN:
            default:
                // Nhân viên: Xem văn bản được gửi cho họ trong khoảng thời gian
                if (month != null) {
                    return internalDocumentRepository.findDocumentsReceivedByUserAndYearAndMonth(
                            currentUser, userDepartmentIds, year, month, pageable);
                } else {
                    return internalDocumentRepository.findDocumentsReceivedByUserAndYear(
                            currentUser, userDepartmentIds, year, pageable);
                }
        }
    }

    /**
     * Helper method để tạo Page từ List
     */
    private Page<InternalDocument> createPageFromList(List<InternalDocument> list, Pageable pageable) {
        final int start = (int) pageable.getOffset();
        final int end = Math.min((start + pageable.getPageSize()), list.size());
        final List<InternalDocument> pageContent = start < end ? list.subList(start, end) : List.of();

        return new PageImpl<>(pageContent, pageable, list.size());
    }
}
