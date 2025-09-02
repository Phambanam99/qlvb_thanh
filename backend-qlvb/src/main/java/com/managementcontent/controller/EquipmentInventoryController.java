package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.dto.WeaponInventoryDTO;
import com.managementcontent.dto.AmmunitionInventoryDTO;
import com.managementcontent.dto.VehicleInventoryDTO;
import com.managementcontent.dto.PowerStationDTO;
import com.managementcontent.service.EquipmentInventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipment-inventory")
public class EquipmentInventoryController {

    @Autowired
    private EquipmentInventoryService equipmentInventoryService;



    @GetMapping("/weapons")
    public ResponseEntity<ResponseDTO<List<WeaponInventoryDTO>>> weapons(@RequestParam(required = false) String q) {
        try {
            List<WeaponInventoryDTO> weapons = equipmentInventoryService.getWeapons(q);
            return ResponseEntity.ok(ResponseDTO.success(weapons));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Error getting weapons: " + e.getMessage()));
        }
    }

    @PutMapping("/weapons/{id}")
    public ResponseEntity<ResponseDTO<WeaponInventoryDTO>> updateWeapon(@PathVariable("id") Long id, @RequestBody WeaponInventoryDTO payload) {
        try {
            WeaponInventoryDTO updatedWeapon = equipmentInventoryService.updateWeapon(id, payload);
            return ResponseEntity.ok(ResponseDTO.success(updatedWeapon));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Error updating weapon: " + e.getMessage()));
        }
    }

    @GetMapping("/ammunitions")
    public ResponseEntity<ResponseDTO<List<AmmunitionInventoryDTO>>> ammunitions(@RequestParam(required = false) String q) {
        try {
            List<AmmunitionInventoryDTO> ammunitions = equipmentInventoryService.getAmmunitions(q);
            return ResponseEntity.ok(ResponseDTO.success(ammunitions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Error getting ammunitions: " + e.getMessage()));
        }
    }

    @PutMapping("/ammunitions/{id}")
    public ResponseEntity<ResponseDTO<AmmunitionInventoryDTO>> updateAmmo(@PathVariable("id") Long id, @RequestBody AmmunitionInventoryDTO payload) {
        try {
            AmmunitionInventoryDTO updatedAmmunition = equipmentInventoryService.updateAmmunition(id, payload);
            return ResponseEntity.ok(ResponseDTO.success(updatedAmmunition));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Error updating ammunition: " + e.getMessage()));
        }
    }

    @GetMapping("/vehicles")
    public ResponseEntity<ResponseDTO<List<VehicleInventoryDTO>>> vehicles(@RequestParam(required = false) String q) {
        try {
            List<VehicleInventoryDTO> vehicles = equipmentInventoryService.getVehicles(q);
            return ResponseEntity.ok(ResponseDTO.success(vehicles));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Error getting vehicles: " + e.getMessage()));
        }
    }

    @PutMapping("/vehicles/{id}")
    public ResponseEntity<ResponseDTO<VehicleInventoryDTO>> updateVehicle(@PathVariable("id") Long id, @RequestBody VehicleInventoryDTO payload) {
        try {
            VehicleInventoryDTO updatedVehicle = equipmentInventoryService.updateVehicle(id, payload);
            return ResponseEntity.ok(ResponseDTO.success(updatedVehicle));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Error updating vehicle: " + e.getMessage()));
        }
    }

    @GetMapping("/engineering-vehicles")
    public ResponseEntity<ResponseDTO<List<VehicleInventoryDTO>>> engineering(@RequestParam(required = false) String q) {
        try {
            List<VehicleInventoryDTO> engineeringVehicles = equipmentInventoryService.getEngineeringVehicles(q);
            return ResponseEntity.ok(ResponseDTO.success(engineeringVehicles));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Error getting engineering vehicles: " + e.getMessage()));
        }
    }

    @PutMapping("/engineering-vehicles/{id}")
    public ResponseEntity<ResponseDTO<VehicleInventoryDTO>> updateEngineering(@PathVariable("id") Long id, @RequestBody VehicleInventoryDTO payload) {
        try {
            VehicleInventoryDTO updatedVehicle = equipmentInventoryService.updateEngineeringVehicle(id, payload);
            return ResponseEntity.ok(ResponseDTO.success(updatedVehicle));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Error updating engineering vehicle: " + e.getMessage()));
        }
    }

    @GetMapping("/power-stations")
    public ResponseEntity<ResponseDTO<List<PowerStationDTO>>> power(@RequestParam(required = false) String q) {
        try {
            List<PowerStationDTO> powerStations = equipmentInventoryService.getPowerStations(q);
            return ResponseEntity.ok(ResponseDTO.success(powerStations));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Error getting power stations: " + e.getMessage()));
        }
    }

    @PutMapping("/power-stations/{id}")
    public ResponseEntity<ResponseDTO<PowerStationDTO>> updatePower(@PathVariable("id") Long id, @RequestBody PowerStationDTO payload) {
        try {
            PowerStationDTO updatedPowerStation = equipmentInventoryService.updatePowerStation(id, payload);
            return ResponseEntity.ok(ResponseDTO.success(updatedPowerStation));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ResponseDTO.error("Error updating power station: " + e.getMessage()));
        }
    }
}


