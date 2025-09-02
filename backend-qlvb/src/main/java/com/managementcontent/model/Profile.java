package com.managementcontent.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Profile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "position_holder_id", nullable = false)
    private PositionHolder positionHolder;
    
    @Column(name = "photo_url")
    private String photoUrl;
    
    @Column(name = "service_number")
    private String serviceNumber;
    
    @Column(name = "birth_date")
    private String birthDate;
    
    private String ethnicity;
    private String religion;
    
    @Column(nullable = false)
    private String hometown;
    
    @Column(name = "current_residence", nullable = false)
    private String currentResidence;
    
    @Column(name = "enlist_date")
    private String enlistDate;
    
    @Column(name = "demobilization_date")
    private String demobilizationDate;
    
    @Column(name = "party_join_date")
    private String partyJoinDate;
    
    @Column(name = "party_official_date")
    private String partyOfficialDate;
    
    @Column(name = "general_education")
    private String generalEducation;
    
    @ElementCollection
    @CollectionTable(name = "profile_training", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "training")
    private List<String> training;
    
    private String titles;
    
    @ElementCollection
    @CollectionTable(name = "profile_awards", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "award")
    private List<String> awards;
    
    private String discipline;
    
    @Column(nullable = false)
    private String rank;
    
    @Column(name = "party_member", nullable = false)
    private Boolean partyMember;
    
    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CareerItem> careerItems;
}
