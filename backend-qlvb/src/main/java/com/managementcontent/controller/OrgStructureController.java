package com.managementcontent.controller;

import com.managementcontent.dto.*;
import com.managementcontent.service.OrgStructureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/org-structure")
public class OrgStructureController {

    @Autowired
    private OrgStructureService orgStructureService;

    @GetMapping("/unit-tree")
    public ResponseEntity<ResponseDTO<UnitNodeDTO>> getUnitTree(@RequestParam(defaultValue = "current") String period) {
        try {
            UnitNodeDTO unitTree = orgStructureService.getUnitTree();
            return ResponseEntity.ok(ResponseDTO.success(unitTree));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Error getting unit tree: " + e.getMessage()));
        }
    }

    @GetMapping("/position-holders/{unitId}")
    public ResponseEntity<ResponseDTO<List<PositionHolderDTO>>> getPositionHolders(@PathVariable Long unitId) {
        try {
            List<PositionHolderDTO> holders = orgStructureService.getPositionHolders(unitId);
            return ResponseEntity.ok(ResponseDTO.success(holders));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Error getting position holders: " + e.getMessage()));
        }
    }

    @GetMapping("/grouped-holders/{unitId}")
    public ResponseEntity<ResponseDTO<List<GroupedHoldersDTO>>> getGroupedHolders(@PathVariable Long unitId) {
        try {
            List<GroupedHoldersDTO> grouped = orgStructureService.getGroupedHolders(unitId);
            return ResponseEntity.ok(ResponseDTO.success(grouped));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Error getting grouped holders: " + e.getMessage()));
        }
    }

    @GetMapping("/profile/{personId}")
    public ResponseEntity<ResponseDTO<ProfileSummaryDTO>> getProfileSummary(@PathVariable Long personId) {
        try {
            ProfileSummaryDTO profile = orgStructureService.getProfileSummary(personId);
            return ResponseEntity.ok(ResponseDTO.success(profile));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Error getting profile: " + e.getMessage()));
        }
    }

    @GetMapping("/career/{personId}")
    public ResponseEntity<ResponseDTO<List<CareerItemDTO>>> getCareerTimeline(@PathVariable Long personId) {
        try {
            List<CareerItemDTO> career = orgStructureService.getCareerTimeline(personId);
            return ResponseEntity.ok(ResponseDTO.success(career));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Error getting career timeline: " + e.getMessage()));
        }
    }
}