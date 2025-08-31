package com.managementcontent.service;

import com.managementcontent.model.EquipmentCategory;
import com.managementcontent.model.EquipmentCondition;
import com.managementcontent.model.EquipmentStatus;
import com.managementcontent.repository.EquipmentCategoryRepository;
import com.managementcontent.repository.EquipmentConditionRepository;
import com.managementcontent.repository.EquipmentStatusRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class EquipmentLookupService {
    private final EquipmentCategoryRepository categoryRepository;
    private final EquipmentStatusRepository statusRepository;
    private final EquipmentConditionRepository conditionRepository;

    public EquipmentLookupService(EquipmentCategoryRepository categoryRepository,
            EquipmentStatusRepository statusRepository,
            EquipmentConditionRepository conditionRepository) {
        this.categoryRepository = categoryRepository;
        this.statusRepository = statusRepository;
        this.conditionRepository = conditionRepository;
    }

    public List<EquipmentCategory> getActiveCategories() {
        return categoryRepository.findByIsActiveTrue();
    }

    public List<EquipmentStatus> getActiveStatuses() {
        return statusRepository.findByIsActiveTrue();
    }

    public List<EquipmentCondition> getActiveConditions() {
        return conditionRepository.findByIsActiveTrue();
    }

    public List<EquipmentCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    public List<EquipmentStatus> getAllStatuses() {
        return statusRepository.findAll();
    }

    public List<EquipmentCondition> getAllConditions() {
        return conditionRepository.findAll();
    }

    @Transactional
    public EquipmentCategory createCategory(EquipmentCategory payload) {
        if (payload.getCode() == null || payload.getCode().isBlank())
            throw new IllegalArgumentException("Mã không được trống");
        if (categoryRepository.existsByCode(payload.getCode()))
            throw new IllegalArgumentException("Mã đã tồn tại");
        payload.setIsActive(payload.getIsActive() != null ? payload.getIsActive() : true);
        return categoryRepository.save(payload);
    }

    @Transactional
    public Optional<EquipmentCategory> updateCategory(Long id, EquipmentCategory payload) {
        return categoryRepository.findById(id).map(existing -> {
            if (payload.getCode() != null && !payload.getCode().equals(existing.getCode())
                    && categoryRepository.existsByCode(payload.getCode())) {
                throw new IllegalArgumentException("Mã đã tồn tại");
            }
            if (payload.getCode() != null)
                existing.setCode(payload.getCode());
            if (payload.getName() != null)
                existing.setName(payload.getName());
            if (payload.getIsActive() != null)
                existing.setIsActive(payload.getIsActive());
            return categoryRepository.save(existing);
        });
    }

    @Transactional
    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }

    @Transactional
    public EquipmentStatus createStatus(EquipmentStatus payload) {
        if (payload.getCode() == null || payload.getCode().isBlank())
            throw new IllegalArgumentException("Mã không được trống");
        if (statusRepository.existsByCode(payload.getCode()))
            throw new IllegalArgumentException("Mã đã tồn tại");
        payload.setIsActive(payload.getIsActive() != null ? payload.getIsActive() : true);
        return statusRepository.save(payload);
    }

    @Transactional
    public Optional<EquipmentStatus> updateStatus(Long id, EquipmentStatus payload) {
        return statusRepository.findById(id).map(existing -> {
            if (payload.getCode() != null && !payload.getCode().equals(existing.getCode())
                    && statusRepository.existsByCode(payload.getCode())) {
                throw new IllegalArgumentException("Mã đã tồn tại");
            }
            if (payload.getCode() != null)
                existing.setCode(payload.getCode());
            if (payload.getName() != null)
                existing.setName(payload.getName());
            if (payload.getIsActive() != null)
                existing.setIsActive(payload.getIsActive());
            return statusRepository.save(existing);
        });
    }

    @Transactional
    public void deleteStatus(Long id) {
        statusRepository.deleteById(id);
    }

    @Transactional
    public EquipmentCondition createCondition(EquipmentCondition payload) {
        if (payload.getCode() == null || payload.getCode().isBlank())
            throw new IllegalArgumentException("Mã không được trống");
        if (conditionRepository.existsByCode(payload.getCode()))
            throw new IllegalArgumentException("Mã đã tồn tại");
        payload.setIsActive(payload.getIsActive() != null ? payload.getIsActive() : true);
        return conditionRepository.save(payload);
    }

    @Transactional
    public Optional<EquipmentCondition> updateCondition(Long id, EquipmentCondition payload) {
        return conditionRepository.findById(id).map(existing -> {
            if (payload.getCode() != null && !payload.getCode().equals(existing.getCode())
                    && conditionRepository.existsByCode(payload.getCode())) {
                throw new IllegalArgumentException("Mã đã tồn tại");
            }
            if (payload.getCode() != null)
                existing.setCode(payload.getCode());
            if (payload.getName() != null)
                existing.setName(payload.getName());
            if (payload.getIsActive() != null)
                existing.setIsActive(payload.getIsActive());
            return conditionRepository.save(existing);
        });
    }

    @Transactional
    public void deleteCondition(Long id) {
        conditionRepository.deleteById(id);
    }

    @Transactional
    public void initializeDefaults() {
        String[][] categories = new String[][] {
                { "WEAPON", "Vũ khí" },
                { "EQUIPMENT", "Trang bị" },
                { "VEHICLE", "Phương tiện" },
                { "OTHER", "Khác" }
        };
        for (String[] c : categories) {
            if (!categoryRepository.existsByCode(c[0])) {
                EquipmentCategory ec = new EquipmentCategory();
                ec.setCode(c[0]);
                ec.setName(c[1]);
                ec.setIsActive(true);
                categoryRepository.save(ec);
            }
        }
        String[][] statuses = new String[][] {
                { "ACTIVE", "Đang sử dụng" },
                { "INACTIVE", "Ngừng sử dụng" },
                { "UNDER_MAINTENANCE", "Bảo dưỡng" }
        };
        for (String[] s : statuses) {
            if (!statusRepository.existsByCode(s[0])) {
                EquipmentStatus es = new EquipmentStatus();
                es.setCode(s[0]);
                es.setName(s[1]);
                es.setIsActive(true);
                statusRepository.save(es);
            }
        }
        String[][] conditions = new String[][] {
                { "NEW", "Mới" },
                { "GOOD", "Tốt" },
                { "FAIR", "Trung bình" },
                { "POOR", "Kém" }
        };
        for (String[] d : conditions) {
            if (!conditionRepository.existsByCode(d[0])) {
                EquipmentCondition ec = new EquipmentCondition();
                ec.setCode(d[0]);
                ec.setName(d[1]);
                ec.setIsActive(true);
                conditionRepository.save(ec);
            }
        }
    }
}
