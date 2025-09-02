package com.managementcontent.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileSummaryDTO {
    private Long id;
    private String fullName;
    private String photoUrl;
    private String serviceNumber;
    private String birthDate;
    private String ethnicity;
    private String religion;
    private String hometown;
    private String currentResidence;
    private String enlistDate;
    private String demobilizationDate;
    private String partyJoinDate;
    private String partyOfficialDate;
    private String generalEducation;
    private List<String> training;
    private String titles;
    private List<String> awards;
    private String discipline;
    private String rank;
    private Boolean partyMember;
}
