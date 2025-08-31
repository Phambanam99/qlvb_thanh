package com.managementcontent.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.managementcontent.model.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String name;

    @Column(nullable = false, length = 100)
    private String pass;

    @Column
    private String fullName;

    @Column(length = 64)
    private String mail;

    @Column(length = 20)
    private String phone;

    @Builder.Default
    @Column(nullable = false)
    private Integer status = UserStatus.ACTIVE.getValue();

    @Column(name = "created")
    private LocalDateTime created;

    @Column(name = "access")
    private LocalDateTime lastAccess;

    @Column(name = "login")
    private LocalDateTime lastLogin;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "users_roles", joinColumns = @JoinColumn(name = "uid"), inverseJoinColumns = @JoinColumn(name = "rid"))
    @Builder.Default
    @JsonIgnore
    private Set<Role> roles = new HashSet<>();

    // Add department relationship
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    /**
     * Đánh dấu người dùng có phải là chỉ huy đơn vị hay không
     */
    @Builder.Default
    @Column(name = "is_commander_of_unit", nullable = false)
    private Boolean isCommanderOfUnit = false;

    /**
     * Get user status as enum
     * 
     * @return UserStatus enum
     */
    @Transient
    public UserStatus getUserStatus() {
        return UserStatus.fromValue(status);
    }

    /**
     * Set user status from enum
     * 
     * @param userStatus UserStatus enum
     */
    public void setUserStatus(UserStatus userStatus) {
        this.status = userStatus.getValue();
    }

    @PrePersist
    protected void onCreate() {
        created = LocalDateTime.now();
    }


}