package com.managementcontent.service;

import com.managementcontent.model.InternalDocument;
import com.managementcontent.model.User;
import com.managementcontent.util.RoleGroupUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import com.managementcontent.repository.UserRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service quản lý access control cho documents
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentAccessControlService {

    private final UserRepository userRepository;

    /**
     * Lấy current user từ SecurityContext
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("No authentication context found");
        }

        String username = authentication.getName();
        return userRepository.findByName(username)
                .orElseThrow(() -> new RuntimeException("Current user not found: " + username));
    }

    /**
     * Lấy department IDs của user
     */
    public List<Long> getUserDepartmentIds(User user) {
        List<Long> departmentIds = new ArrayList<>();
        if (user.getDepartment() != null) {
            departmentIds.add(user.getDepartment().getId());
        }
        return departmentIds;
    }

    /**
     * Xác định role group cao nhất của user
     */
    public RoleGroupUtil.RoleGroup getUserRoleGroup(User user) {
        if (user == null) {
            return null;
        }

        Set<String> userRoles = user.getRoles().stream()
                .map(role -> role.getName())
                .collect(Collectors.toSet());

        return RoleGroupUtil.getHighestRoleGroup(userRoles);
    }

    /**
     * Kiểm tra user có thể access document không
     */
    public boolean canUserAccessDocument(InternalDocument document, User user, List<Long> userDepartmentIds) {
        // User can access if they are sender
        if (document.getSender().equals(user)) {
            return true;
        }

        // Check if user is CHI_HUY_CUC (can access all)
        boolean isChiHuyCuc = user.getRoles().stream()
                .anyMatch(role -> RoleGroupUtil.isChiHuyCuc(role.getName()));
        if (isChiHuyCuc) {
            return true;
        }

        // Check if user is recipient (individual or department)
        boolean isRecipient = document.getRecipients().stream()
                .anyMatch(r -> (r.getUser() != null && r.getUser().equals(user)) ||
                        (r.getUser() == null && userDepartmentIds.contains(r.getDepartment().getId())));

        if (isRecipient) {
            return true;
        }

        // Check if user is department leadership and document involves their department
        if (user.getRoles() != null && !user.getRoles().isEmpty() && user.getDepartment() != null) {
            boolean isChiHuyDonVi = user.getRoles().stream()
                    .anyMatch(role -> RoleGroupUtil.isChiHuyDonVi(role.getName()));

            if (isChiHuyDonVi) {
                // Check if sender is from same department
                boolean isDepartmentInvolved = false;

                if (document.getSender().getDepartment() != null &&
                        document.getSender().getDepartment().getId().equals(user.getDepartment().getId())) {
                    isDepartmentInvolved = true;
                }

                // Check if any recipient department matches user's department
                if (!isDepartmentInvolved) {
                    isDepartmentInvolved = document.getRecipients().stream()
                            .anyMatch(r -> r.getDepartment() != null &&
                                    r.getDepartment().getId().equals(user.getDepartment().getId()));
                }

                return isDepartmentInvolved;
            }
        }

        return false;
    }
}
