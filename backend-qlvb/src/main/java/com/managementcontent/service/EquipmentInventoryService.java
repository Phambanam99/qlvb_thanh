package com.managementcontent.service;

import com.managementcontent.dto.*;
import com.managementcontent.model.*;
import com.managementcontent.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class EquipmentInventoryService {
    
    @Autowired
    private WeaponRepository weaponRepository;
    
    @Autowired
    private AmmunitionRepository ammunitionRepository;
    
    @Autowired
    private VehicleRepository vehicleRepository;
    
    @Autowired
    private PowerStationRepository powerStationRepository;
    
    // Weapon methods
    public List<WeaponInventoryDTO> getWeapons(String query) {
        List<Weapon> weapons;
        if (query != null && !query.trim().isEmpty()) {
            weapons = weaponRepository.searchWeapons(query.trim());
        } else {
            weapons = weaponRepository.findAllActive();
        }
        
        return weapons.stream()
                .map(this::convertToWeaponInventoryDTO)
                .toList();
    }
    
    public WeaponInventoryDTO updateWeapon(Long id, WeaponInventoryDTO dto) {
        Optional<Weapon> weaponOpt = weaponRepository.findById(id);
        if (weaponOpt.isEmpty()) {
            throw new RuntimeException("Weapon not found with id: " + id);
        }
        
        Weapon weapon = weaponOpt.get();
        updateWeaponFromDTO(weapon, dto);
        Weapon savedWeapon = weaponRepository.save(weapon);
        
        return convertToWeaponInventoryDTO(savedWeapon);
    }
    
    // Ammunition methods
    public List<AmmunitionInventoryDTO> getAmmunitions(String query) {
        List<Ammunition> ammunitions;
        if (query != null && !query.trim().isEmpty()) {
            ammunitions = ammunitionRepository.searchAmmunitions(query.trim());
        } else {
            ammunitions = ammunitionRepository.findAllActive();
        }
        
        return ammunitions.stream()
                .map(this::convertToAmmunitionInventoryDTO)
                .toList();
    }
    
    public AmmunitionInventoryDTO updateAmmunition(Long id, AmmunitionInventoryDTO dto) {
        Optional<Ammunition> ammunitionOpt = ammunitionRepository.findById(id);
        if (ammunitionOpt.isEmpty()) {
            throw new RuntimeException("Ammunition not found with id: " + id);
        }
        
        Ammunition ammunition = ammunitionOpt.get();
        updateAmmunitionFromDTO(ammunition, dto);
        Ammunition savedAmmunition = ammunitionRepository.save(ammunition);
        
        return convertToAmmunitionInventoryDTO(savedAmmunition);
    }
    
    // Vehicle methods
    public List<VehicleInventoryDTO> getVehicles(String query) {
        List<Vehicle> vehicles;
        if (query != null && !query.trim().isEmpty()) {
            vehicles = vehicleRepository.searchVehicles(query.trim());
        } else {
            vehicles = vehicleRepository.findByVehicleTypeAndIsActiveTrue(Vehicle.VehicleType.REGULAR);
        }
        
        return vehicles.stream()
                .map(this::convertToVehicleInventoryDTO)
                .toList();
    }
    
    public VehicleInventoryDTO updateVehicle(Long id, VehicleInventoryDTO dto) {
        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(id);
        if (vehicleOpt.isEmpty()) {
            throw new RuntimeException("Vehicle not found with id: " + id);
        }
        
        Vehicle vehicle = vehicleOpt.get();
        updateVehicleFromDTO(vehicle, dto);
        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        
        return convertToVehicleInventoryDTO(savedVehicle);
    }
    
    // Engineering Vehicle methods
    public List<VehicleInventoryDTO> getEngineeringVehicles(String query) {
        List<Vehicle> vehicles;
        if (query != null && !query.trim().isEmpty()) {
            vehicles = vehicleRepository.searchVehiclesByType(Vehicle.VehicleType.ENGINEERING, query.trim());
        } else {
            vehicles = vehicleRepository.findByVehicleTypeAndIsActiveTrue(Vehicle.VehicleType.ENGINEERING);
        }
        
        return vehicles.stream()
                .map(this::convertToVehicleInventoryDTO)
                .toList();
    }
    
    public VehicleInventoryDTO updateEngineeringVehicle(Long id, VehicleInventoryDTO dto) {
        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(id);
        if (vehicleOpt.isEmpty()) {
            throw new RuntimeException("Engineering vehicle not found with id: " + id);
        }
        
        Vehicle vehicle = vehicleOpt.get();
        updateVehicleFromDTO(vehicle, dto);
        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        
        return convertToVehicleInventoryDTO(savedVehicle);
    }
    
    // Power Station methods
    public List<PowerStationDTO> getPowerStations(String query) {
        List<PowerStation> powerStations;
        if (query != null && !query.trim().isEmpty()) {
            powerStations = powerStationRepository.searchPowerStations(query.trim());
        } else {
            powerStations = powerStationRepository.findAllActive();
        }
        
        return powerStations.stream()
                .map(this::convertToPowerStationDTO)
                .toList();
    }
    
    public PowerStationDTO updatePowerStation(Long id, PowerStationDTO dto) {
        Optional<PowerStation> powerStationOpt = powerStationRepository.findById(id);
        if (powerStationOpt.isEmpty()) {
            throw new RuntimeException("Power station not found with id: " + id);
        }
        
        PowerStation powerStation = powerStationOpt.get();
        updatePowerStationFromDTO(powerStation, dto);
        PowerStation savedPowerStation = powerStationRepository.save(powerStation);
        
        return convertToPowerStationDTO(savedPowerStation);
    }
    
    // Conversion methods
    private WeaponInventoryDTO convertToWeaponInventoryDTO(Weapon weapon) {
        WeaponInventoryDTO.WeaponDistribution distribution = null;
        if (weapon.getDistribution() != null) {
            distribution = new WeaponInventoryDTO.WeaponDistribution(
                    weapon.getDistribution().getTotal(),
                    weapon.getDistribution().getTm(),
                    weapon.getDistribution().getD1(),
                    weapon.getDistribution().getD2(),
                    weapon.getDistribution().getD3(),
                    weapon.getDistribution().getKhoLu()
            );
        }
        
        return new WeaponInventoryDTO(
                weapon.getId(),
                weapon.getName(),
                weapon.getOrigin(),
                weapon.getUnit(),
                weapon.getGrade(),
                weapon.getQuantity(),
                distribution,
                weapon.getNote()
        );
    }
    
    private AmmunitionInventoryDTO convertToAmmunitionInventoryDTO(Ammunition ammunition) {
        AmmunitionInventoryDTO.AmmunitionDistribution distribution = null;
        if (ammunition.getDistribution() != null) {
            distribution = new AmmunitionInventoryDTO.AmmunitionDistribution(
                    ammunition.getDistribution().getTm(),
                    ammunition.getDistribution().getD1(),
                    ammunition.getDistribution().getD2(),
                    ammunition.getDistribution().getD3(),
                    ammunition.getDistribution().getKhoLu(),
                    ammunition.getDistribution().getKhoK820()
            );
        }
        
        return new AmmunitionInventoryDTO(
                ammunition.getId(),
                ammunition.getName(),
                ammunition.getUnit(),
                ammunition.getGrade(),
                ammunition.getQuantity(),
                ammunition.getWeightTon() != null ? ammunition.getWeightTon().doubleValue() : null,
                distribution
        );
    }
    
    private VehicleInventoryDTO convertToVehicleInventoryDTO(Vehicle vehicle) {
        return new VehicleInventoryDTO(
                vehicle.getId(),
                vehicle.getRegistration(),
                vehicle.getMakeModel(),
                vehicle.getChassisNo(),
                vehicle.getEngineNo(),
                vehicle.getManufactureYear(),
                vehicle.getStartUseYear(),
                vehicle.getOrigin(),
                vehicle.getStationedAt(),
                vehicle.getQualityGrade(),
                vehicle.getStatus()
        );
    }
    
    private PowerStationDTO convertToPowerStationDTO(PowerStation powerStation) {
        return new PowerStationDTO(
                powerStation.getId(),
                powerStation.getName(),
                powerStation.getFuel(),
                powerStation.getStationCode(),
                powerStation.getManufactureYear(),
                powerStation.getStartUseYear(),
                powerStation.getQualityLevel(),
                powerStation.getPurpose(),
                powerStation.getStatus(),
                powerStation.getUnitName()
        );
    }
    
    // Update methods
    private void updateWeaponFromDTO(Weapon weapon, WeaponInventoryDTO dto) {
        weapon.setName(dto.getName());
        weapon.setOrigin(dto.getOrigin());
        weapon.setUnit(dto.getUnit());
        weapon.setGrade(dto.getGrade());
        weapon.setQuantity(dto.getQuantity());
        weapon.setNote(dto.getNote());
        
        if (dto.getDistribution() != null) {
            Weapon.WeaponDistribution distribution = new Weapon.WeaponDistribution();
            distribution.setTotal(dto.getDistribution().getTotal());
            distribution.setTm(dto.getDistribution().getTm());
            distribution.setD1(dto.getDistribution().getD1());
            distribution.setD2(dto.getDistribution().getD2());
            distribution.setD3(dto.getDistribution().getD3());
            distribution.setKhoLu(dto.getDistribution().getKhoLu());
            weapon.setDistribution(distribution);
        }
    }
    
    private void updateAmmunitionFromDTO(Ammunition ammunition, AmmunitionInventoryDTO dto) {
        ammunition.setName(dto.getName());
        ammunition.setUnit(dto.getUnit());
        ammunition.setGrade(dto.getGrade());
        ammunition.setQuantity(dto.getQuantity());
        ammunition.setWeightTon(dto.getWeightTon() != null ? java.math.BigDecimal.valueOf(dto.getWeightTon()) : null);
        
        if (dto.getDistribution() != null) {
            Ammunition.AmmunitionDistribution distribution = new Ammunition.AmmunitionDistribution();
            distribution.setTm(dto.getDistribution().getTm());
            distribution.setD1(dto.getDistribution().getD1());
            distribution.setD2(dto.getDistribution().getD2());
            distribution.setD3(dto.getDistribution().getD3());
            distribution.setKhoLu(dto.getDistribution().getKhoLu());
            distribution.setKhoK820(dto.getDistribution().getKhoK820());
            ammunition.setDistribution(distribution);
        }
    }
    
    private void updateVehicleFromDTO(Vehicle vehicle, VehicleInventoryDTO dto) {
        vehicle.setRegistration(dto.getRegistration());
        vehicle.setMakeModel(dto.getMakeModel());
        vehicle.setChassisNo(dto.getChassisNo());
        vehicle.setEngineNo(dto.getEngineNo());
        vehicle.setManufactureYear(dto.getManufactureYear());
        vehicle.setStartUseYear(dto.getStartUseYear());
        vehicle.setOrigin(dto.getOrigin());
        vehicle.setStationedAt(dto.getStationedAt());
        vehicle.setQualityGrade(dto.getQualityGrade());
        vehicle.setStatus(dto.getStatus());
    }
    
    private void updatePowerStationFromDTO(PowerStation powerStation, PowerStationDTO dto) {
        powerStation.setName(dto.getName());
        powerStation.setFuel(dto.getFuel());
        powerStation.setStationCode(dto.getStationCode());
        powerStation.setManufactureYear(dto.getManufactureYear());
        powerStation.setStartUseYear(dto.getStartUseYear());
        powerStation.setQualityLevel(dto.getQualityLevel());
        powerStation.setPurpose(dto.getPurpose());
        powerStation.setStatus(dto.getStatus());
        powerStation.setUnitName(dto.getUnitName());
    }
}
