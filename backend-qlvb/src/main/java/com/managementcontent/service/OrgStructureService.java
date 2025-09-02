package com.managementcontent.service;

import com.managementcontent.dto.*;
import com.managementcontent.model.*;
import com.managementcontent.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrgStructureService {
    
    @Autowired
    private UnitRepository unitRepository;
    
    @Autowired
    private PositionHolderRepository positionHolderRepository;
    
    @Autowired
    private ProfileRepository profileRepository;
    
    @Autowired
    private CareerItemRepository careerItemRepository;
    
    public UnitNodeDTO getUnitTree() {
        List<Unit> rootUnits = unitRepository.findRootUnits();
        if (rootUnits.isEmpty()) {
            return null;
        }
        
        Unit rootUnit = rootUnits.get(0); // Assuming single root
        return convertToUnitNodeDTO(rootUnit);
    }
    
    public List<PositionHolderDTO> getPositionHolders(Long unitId) {
        List<PositionHolder> holders = positionHolderRepository.findByUnitIdAndIsActiveTrueOrderBySortOrder(unitId);
        return holders.stream()
                .map(this::convertToPositionHolderDTO)
                .collect(Collectors.toList());
    }
    
    public List<GroupedHoldersDTO> getGroupedHolders(Long unitId) {
        List<PositionHolder> holders = positionHolderRepository.findByUnitIdAndIsActiveTrueOrderBySortOrder(unitId);
        
        // Simple grouping logic - can be enhanced based on business rules
        Map<String, List<PositionHolder>> grouped = holders.stream()
                .collect(Collectors.groupingBy(holder -> {
                    String title = holder.getPositionTitle().toLowerCase();
                    if (title.contains("trưởng") || title.contains("chỉ huy")) {
                        return "Chỉ huy";
                    } else if (title.contains("phó")) {
                        return "Phó";
                    } else if (title.contains("chính trị")) {
                        return "Chính trị";
                    } else {
                        return "Nhân sự";
                    }
                }));
        
        return grouped.entrySet().stream()
                .map(entry -> new GroupedHoldersDTO(entry.getKey(), 
                        entry.getValue().stream()
                                .map(this::convertToPositionHolderDTO)
                                .collect(Collectors.toList())))
                .collect(Collectors.toList());
    }
    
    public ProfileSummaryDTO getProfileSummary(Long personId) {
        Optional<Profile> profileOpt = profileRepository.findByPositionHolderId(personId);
        if (profileOpt.isEmpty()) {
            return null;
        }
        
        Profile profile = profileOpt.get();
        return convertToProfileSummaryDTO(profile);
    }
    
    public List<CareerItemDTO> getCareerTimeline(Long personId) {
        Optional<Profile> profileOpt = profileRepository.findByPositionHolderId(personId);
        if (profileOpt.isEmpty()) {
            return Collections.emptyList();
        }
        
        List<CareerItem> careerItems = careerItemRepository.findByProfileIdOrderBySortOrder(profileOpt.get().getId());
        return careerItems.stream()
                .map(this::convertToCareerItemDTO)
                .collect(Collectors.toList());
    }
    
    // Conversion methods
    private UnitNodeDTO convertToUnitNodeDTO(Unit unit) {
        List<UnitNodeDTO> children = unit.getChildren() != null ? 
                unit.getChildren().stream()
                        .filter(Unit::getIsActive)
                        .sorted(Comparator.comparing(Unit::getSortOrder, Comparator.nullsLast(Comparator.naturalOrder())))
                        .map(this::convertToUnitNodeDTO)
                        .collect(Collectors.toList()) : 
                Collections.emptyList();
        
        return new UnitNodeDTO(unit.getId(), unit.getName(), unit.getType().name(), children);
    }
    
    private PositionHolderDTO convertToPositionHolderDTO(PositionHolder holder) {
        return new PositionHolderDTO(holder.getId(), holder.getFullName(), holder.getPositionTitle());
    }
    
    private ProfileSummaryDTO convertToProfileSummaryDTO(Profile profile) {
        return new ProfileSummaryDTO(
                profile.getId(),
                profile.getPositionHolder().getFullName(),
                profile.getPhotoUrl(),
                profile.getServiceNumber(),
                profile.getBirthDate(),
                profile.getEthnicity(),
                profile.getReligion(),
                profile.getHometown(),
                profile.getCurrentResidence(),
                profile.getEnlistDate(),
                profile.getDemobilizationDate(),
                profile.getPartyJoinDate(),
                profile.getPartyOfficialDate(),
                profile.getGeneralEducation(),
                profile.getTraining() != null ? profile.getTraining() : Collections.emptyList(),
                profile.getTitles(),
                profile.getAwards() != null ? profile.getAwards() : Collections.emptyList(),
                profile.getDiscipline(),
                profile.getRank(),
                profile.getPartyMember()
        );
    }
    
    private CareerItemDTO convertToCareerItemDTO(CareerItem item) {
        CareerItemDTO dto = new CareerItemDTO();
        dto.setFromDate(item.getFrom());
        dto.setToDate(item.getTo());
        dto.setUnit(item.getUnit());
        dto.setRole(item.getRole());
        dto.setRankAtThatTime(item.getRankAtThatTime());
        dto.setPartyRole(item.getPartyRole());
        dto.setNote(item.getNote());
        return dto;
    }
}
