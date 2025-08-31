package com.managementcontent.service;

import com.managementcontent.dto.EquipmentDTO;
import com.managementcontent.dto.EquipmentStatsDTO;
import com.managementcontent.model.Department;
import com.managementcontent.model.Equipment;
import com.managementcontent.model.Role;
import com.managementcontent.model.User;
import com.managementcontent.repository.DepartmentRepository;
import com.managementcontent.repository.EquipmentRepository;
import com.managementcontent.repository.UserRepository;
import com.managementcontent.util.RoleGroupUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EquipmentService {
    private final EquipmentRepository equipmentRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    public EquipmentService(EquipmentRepository equipmentRepository, DepartmentRepository departmentRepository,
            UserRepository userRepository) {
        this.equipmentRepository = equipmentRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
    }

    public Page<EquipmentDTO> list(Pageable pageable, Long departmentId) {
        Page<Equipment> page = departmentId == null
                ? equipmentRepository.findAll(pageable)
                : equipmentRepository.findByDepartment_Id(departmentId, pageable);
        return page.map(this::toDTO);
    }

    public Optional<EquipmentDTO> getById(Long id) {
        return equipmentRepository.findById(id).map(this::toDTO);
    }

    @Transactional
    public EquipmentDTO create(EquipmentDTO dto) {
        if (dto == null || dto.name == null || dto.name.trim().isEmpty()) {
            throw new IllegalArgumentException("Tên trang bị là bắt buộc");
        }
        if (dto.quantity != null && dto.quantity < 0) {
            throw new IllegalArgumentException("Số lượng không hợp lệ");
        }
        User currentUser = getCurrentUserOrThrow();
        Long targetDeptId = dto.departmentId;

        if (!isAdmin(currentUser)) {
            // If commander and no department provided, default to user's department
            if (targetDeptId == null && isUnitCommander(currentUser)) {
                if (currentUser.getDepartment() == null) {
                    throw new IllegalArgumentException("Bạn chưa được gán vào đơn vị");
                }
                targetDeptId = currentUser.getDepartment().getId();
                dto.departmentId = targetDeptId;
            }
            // Enforce permission on target department
            if (!canManageDepartment(currentUser, targetDeptId)) {
                throw new IllegalArgumentException("Bạn không có quyền tạo trang bị cho đơn vị này");
            }
        }

        Equipment entity = new Equipment();
        apply(dto, entity);
        entity = equipmentRepository.save(entity);
        return toDTO(entity);
    }

    @Transactional
    public Optional<EquipmentDTO> update(Long id, EquipmentDTO dto) {
        return equipmentRepository.findById(id).map(existing -> {
            if (dto.name != null && dto.name.trim().isEmpty()) {
                throw new IllegalArgumentException("Tên trang bị không hợp lệ");
            }
            if (dto.quantity != null && dto.quantity < 0) {
                throw new IllegalArgumentException("Số lượng không hợp lệ");
            }
            User currentUser = getCurrentUserOrThrow();
            Long existingDeptId = existing.getDepartment() != null ? existing.getDepartment().getId() : null;

            if (!isAdmin(currentUser)) {
                // Must be able to manage the existing equipment's department
                if (!canManageDepartment(currentUser, existingDeptId)) {
                    throw new IllegalArgumentException("Bạn không có quyền cập nhật trang bị này");
                }
                // Prevent moving to another department unless admin
                if (dto.departmentId != null && !dto.departmentId.equals(existingDeptId)) {
                    throw new IllegalArgumentException("Không được phép chuyển trang bị sang đơn vị khác");
                }
            }

            apply(dto, existing);
            Equipment saved = equipmentRepository.save(existing);
            return toDTO(saved);
        });
    }

    @Transactional
    public boolean delete(Long id) {
        Optional<Equipment> found = equipmentRepository.findById(id);
        if (found.isEmpty())
            return false;
        User currentUser = getCurrentUserOrThrow();
        Long deptId = found.get().getDepartment() != null ? found.get().getDepartment().getId() : null;
        if (!isAdmin(currentUser) && !canManageDepartment(currentUser, deptId)) {
            throw new IllegalArgumentException("Bạn không có quyền xóa trang bị này");
        }
        equipmentRepository.deleteById(id);
        return true;
    }

    public EquipmentStatsDTO stats(Long departmentId) {
        EquipmentStatsDTO stats = new EquipmentStatsDTO();
        long total = departmentId == null ? equipmentRepository.count()
                : equipmentRepository.findByDepartment_Id(departmentId, Pageable.unpaged()).getTotalElements();
        stats.total = total;

        Map<String, Long> byCategory = new HashMap<>();
        for (Object[] row : equipmentRepository.countByCategory(departmentId)) {
            String key = (String) row[0];
            Long cnt = (Long) row[1];
            byCategory.put(key == null ? "UNKNOWN" : key, cnt);
        }
        stats.byCategory = byCategory;

        Map<String, Long> byStatus = new HashMap<>();
        for (Object[] row : equipmentRepository.countByStatus(departmentId)) {
            String key = (String) row[0];
            Long cnt = (Long) row[1];
            byStatus.put(key == null ? "UNKNOWN" : key, cnt);
        }
        stats.byStatus = byStatus;
        return stats;
    }

    private void apply(EquipmentDTO dto, Equipment entity) {
        if (dto.name != null)
            entity.setName(dto.name.trim());
        if (dto.category != null)
            entity.setCategory(dto.category);
        if (dto.serialNumber != null)
            entity.setSerialNumber(dto.serialNumber);
        if (dto.status != null)
            entity.setStatus(dto.status);
        if (dto.conditionLabel != null)
            entity.setConditionLabel(dto.conditionLabel);
        if (dto.quantity != null)
            entity.setQuantity(dto.quantity);
        if (dto.purchaseDate != null)
            entity.setPurchaseDate(dto.purchaseDate);
        if (dto.lastMaintenanceDate != null)
            entity.setLastMaintenanceDate(dto.lastMaintenanceDate);
        if (dto.notes != null)
            entity.setNotes(dto.notes);
        if (dto.departmentId != null) {
            Department dept = departmentRepository.findById(dto.departmentId)
                    .orElseThrow(() -> new IllegalArgumentException("Department not found: " + dto.departmentId));
            entity.setDepartment(dept);
        } else if (entity.getId() == null) {
            entity.setDepartment(null);
        }
        if (entity.getQuantity() == null)
            entity.setQuantity(0);
    }

    private EquipmentDTO toDTO(Equipment e) {
        EquipmentDTO dto = new EquipmentDTO();
        dto.id = e.getId();
        dto.name = e.getName();
        dto.category = e.getCategory();
        dto.serialNumber = e.getSerialNumber();
        dto.status = e.getStatus();
        dto.conditionLabel = e.getConditionLabel();
        dto.quantity = e.getQuantity();
        dto.purchaseDate = e.getPurchaseDate();
        dto.lastMaintenanceDate = e.getLastMaintenanceDate();
        dto.notes = e.getNotes();
        if (e.getDepartment() != null) {
            dto.departmentId = e.getDepartment().getId();
            dto.departmentName = e.getDepartment().getName();
        }
        dto.createdAt = e.getCreatedAt();
        dto.updatedAt = e.getUpdatedAt();
        return dto;
    }

    private User getCurrentUserOrThrow() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalArgumentException("Chưa xác thực người dùng");
        }
        return userRepository.findByName(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
    }

    private boolean isAdmin(User user) {
        if (user == null || user.getRoles() == null)
            return false;
        return user.getRoles().stream().map(Role::getName).anyMatch(r -> r.equals("ROLE_ADMIN"));
    }

    private boolean isUnitCommander(User user) {
        if (user == null)
            return false;
        if (Boolean.TRUE.equals(user.getIsCommanderOfUnit()))
            return true;
        Set<String> roleCodes = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        return roleCodes.stream().anyMatch(RoleGroupUtil.ROLE_CHI_HUY_DON_VI::contains);
    }

    private boolean canManageDepartment(User user, Long targetDepartmentId) {
        if (isAdmin(user))
            return true;
        if (!isUnitCommander(user))
            return false;
        if (user.getDepartment() == null || targetDepartmentId == null)
            return false;
        return user.getDepartment().getId().equals(targetDepartmentId);
    }
}
