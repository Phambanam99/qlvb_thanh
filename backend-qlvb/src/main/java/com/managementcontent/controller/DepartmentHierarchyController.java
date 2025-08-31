package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.model.Department;
import com.managementcontent.repository.DepartmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentHierarchyController {

    private final DepartmentRepository departmentRepository;

    public DepartmentHierarchyController(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @GetMapping("/hierarchy")
    public ResponseEntity<ResponseDTO<List<Department>>> getDepartmentHierarchy() {
        try {
            List<Department> departments = departmentRepository.findRootDepartments();
            return ResponseEntity.ok(ResponseDTO.success(departments));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy cấu trúc phòng ban: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/children")
    public ResponseEntity<ResponseDTO<List<Department>>> getChildDepartments(@PathVariable Long id) {
        try {
            Department parent = departmentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng ban"));
            List<Department> children = departmentRepository.findByParentDepartment(parent);
            return ResponseEntity.ok(ResponseDTO.success(children));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách phòng ban con: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/parent")
    public ResponseEntity<ResponseDTO<Department>> updateParentDepartment(
            @PathVariable Long id,
            @RequestBody Long parentId) {
        try {
            Department department = departmentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng ban"));

            Department parent = parentId != null ? departmentRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng ban cha")) : null;

            department.setParentDepartment(parent);
            Department updatedDepartment = departmentRepository.save(department);
            return ResponseEntity.ok(ResponseDTO.success("Cập nhật phòng ban thành công", updatedDepartment));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi cập nhật phòng ban cha: " + e.getMessage()));
        }
    }
}
