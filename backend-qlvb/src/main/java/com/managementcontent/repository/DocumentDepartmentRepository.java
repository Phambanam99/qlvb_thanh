package com.managementcontent.repository;

import com.managementcontent.model.Department;
import com.managementcontent.model.Document;
import com.managementcontent.model.DocumentDepartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface DocumentDepartmentRepository extends JpaRepository<DocumentDepartment, Long> {

    /**
     * Find all departments a document has been distributed to
     */
    List<DocumentDepartment> findByDocument(Document document);

    /**
     * Find all documents assigned to a specific department
     */
    List<DocumentDepartment> findByDepartment(Department department);

    /**
     * Find primary departments for a document
     * Changed from Optional to List to handle multiple primary departments
     */
    List<DocumentDepartment> findByDocumentAndIsPrimaryTrue(Document document);

    /**
     * Find all collaborating departments for a document
     */
    List<DocumentDepartment> findByDocumentAndIsPrimaryFalse(Document document);

    /**
     * Check if a document has been assigned to a department
     */
    boolean existsByDocumentAndDepartment(Document document, Department department);

    /**
     * Find all department IDs associated with a specific document ID
     * sorted by is_primary
     */
    @Query(value = "SELECT department_id FROM document_department WHERE document_id = :documentId ORDER BY is_primary DESC", nativeQuery = true)

    List<Long> findDepartmentIdsByDocumentId(Long documentId);

    /**
     * Find primary department with document id
     * 
     * @param documentId
     * @return Department Id
     */
    @Query(value = "SELECT department_id FROM document_department WHERE document_id = :documentId And is_primary = true", nativeQuery = true)
    Long findPrimaryDepartmentIdByDocumentId(Long documentId);

    /**
     * Delete all assignments for a document
     */
    void deleteByDocument(Document document);

    Set<DocumentDepartment> findByDocumentId(Long documentId);

    Set<DocumentDepartment> findByDocumentIdAndDepartmentId(Long documentId, Long departmentId);
}