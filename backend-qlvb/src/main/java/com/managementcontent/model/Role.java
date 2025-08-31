package com.managementcontent.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.beans.Transient;
import java.util.HashSet;
import java.util.Set;

import com.managementcontent.model.enums.UserRole;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
// Remove @EqualsAndHashCode - it's causing the problem by accessing lazy
// collections
// Remove @Data as it includes @EqualsAndHashCode
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long rid;

    @Column(nullable = false, length = 60, unique = true)
    private String name;

    @ManyToMany(mappedBy = "roles")
    @ToString.Exclude
    // Don't include this in equals/hashCode
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private Set<User> users = new HashSet<>();

    @Column(name = "description")
    private String description;
    @Column(name = "display_name")
    private String displayName;

    // Implement custom equals and hashCode that only use the id and name
    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Role role = (Role) o;
        return rid != null && rid.equals(role.rid);
    }

    @Override
    public int hashCode() {
        // Use a constant value for non-persisted entities (rid == null)
        return rid != null ? rid.hashCode() : 31;
    }

    /**
     * Get role as UserRole enum
     * 
     * @return UserRole enum
     */
    @Transient
    public UserRole getUserRole() {
        return UserRole.fromCode(name);
    }

    /**
     * Set role from UserRole enum
     * 
     * @param userRole UserRole enum
     */
    public void setUserRole(UserRole userRole) {
        this.name = userRole.getCode();
    }

    /**
     * Get the display name for this role
     * 
     * @return display name of the role
     */

    @Transient
    public String getDisplayName() {
        // Ưu tiên sử dụng displayName từ database nếu có
        if (displayName != null && !displayName.isEmpty()) {
            return displayName;
        }
        // Nếu không có trong database, lấy từ enum
        UserRole role = UserRole.fromCode(name);
        return (role != null) ? role.getDisplayName() : name;
    }

    /**
     * Set custom display name for this role
     * 
     * @param customDisplayName the custom display name to set
     */
    public void setDisplayName(String customDisplayName) {
        this.displayName = customDisplayName;
    }
}