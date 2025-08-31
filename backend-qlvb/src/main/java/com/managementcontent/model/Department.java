package com.managementcontent.model;

import jakarta.persistence.*;
import lombok.*;

import java.beans.Transient;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;

/**
 * Entity representing a Department/Organizational Unit in the document
 * management system.
 * Maps to the legacy table content_type_009_danhba.
 */
@Entity
@Table
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    /**
     * Primary identifier for the department
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column()
    private Long id;

    /**
     * Full name of the department
     */
    @Column()
    private String name;

    /**
     * Abbreviated/short name of the department
     */
    @Column()
    private String abbreviation;
    @Column()
    private String storageLocation;
    /**
     * Official email address of the department
     */
    @Column()
    private String email;


    @Column()
    private String codeDepartment;
    /**
     * Type of department (numeric code)
     * 
     * @see com.managementcontent.model.enums.DepartmentType
     */
    @Column()
    private Integer typeCode;

    /**
     * External/legacy system identifier
     */
    @Column()
    private String externalId;

    /**
     * Group or category the department belongs to
     */
    @Column(name = "dept_group")
    private String group;

    /**
     * Parent department
     */
    @ManyToOne
    @JoinColumn(name = "parent_department_id")
    @JsonBackReference
    @EqualsAndHashCode.Exclude
    private Department parentDepartment;

    /**
     * Child departments
     */
    @OneToMany(mappedBy = "parentDepartment", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonManagedReference
    @Builder.Default
    private Set<Department> childDepartments = new HashSet<>();

    /**
     * Documents assigned to this department for processing
     */
    @OneToMany(mappedBy = "department")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonManagedReference("department-documents")
    @Builder.Default
    private Set<DocumentDepartment> assignedDocuments = new HashSet<>();

    /**
     * Get the type of this department as an enum
     * 
     * @return The department type as enum or null if invalid
     */
    @Transient
    public com.managementcontent.model.enums.DepartmentType getType() {
        return com.managementcontent.model.enums.DepartmentType.fromCode(typeCode);
    }

    /**
     * Set the department type using enum
     * 
     * @param type The department type enum
     */
    public void setType(com.managementcontent.model.enums.DepartmentType type) {
        this.typeCode = type != null ? type.getCode() : null;
    }
}