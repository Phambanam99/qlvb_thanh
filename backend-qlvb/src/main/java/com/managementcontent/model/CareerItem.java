package com.managementcontent.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "career_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CareerItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile profile;
    
    @Column(name = "from_date", nullable = false)
    private String from;
    
    @Column(name = "to_date", nullable = false)
    private String to;
    
    @Column(nullable = false)
    private String unit;
    
    @Column(nullable = false)
    private String role;
    
    @Column(name = "rank_at_that_time")
    private String rankAtThatTime;
    
    @Column(name = "party_role")
    private String partyRole;
    
    private String note;
    
    @Column(name = "sort_order")
    private Integer sortOrder;
}
