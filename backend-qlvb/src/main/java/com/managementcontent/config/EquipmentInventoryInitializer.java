package com.managementcontent.config;

import com.managementcontent.model.*;
import com.managementcontent.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class EquipmentInventoryInitializer implements CommandLineRunner {
    
    @Autowired
    private WeaponRepository weaponRepository;
    
    @Autowired
    private AmmunitionRepository ammunitionRepository;
    
    @Autowired
    private VehicleRepository vehicleRepository;
    
    @Autowired
    private PowerStationRepository powerStationRepository;
    
    @Override
    public void run(String... args) throws Exception {
        if (weaponRepository.count() == 0) {
            seedWeapons();
        }
        
        if (ammunitionRepository.count() == 0) {
            seedAmmunitions();
        }
        
        if (vehicleRepository.count() == 0) {
            seedVehicles();
        }
        
        if (powerStationRepository.count() == 0) {
            seedPowerStations();
        }
    }
    
    private void seedWeapons() {
        // Súng ngắn 7,62mm K54
        Weapon weapon1 = new Weapon();
        weapon1.setName("Súng ngắn 7,62mm K54");
        weapon1.setOrigin("LX");
        weapon1.setUnit("Khẩu");
        weapon1.setGrade("+");
        weapon1.setQuantity(57);
        weapon1.setNote(null);
        weapon1.setIsActive(true);
        
        Weapon.WeaponDistribution dist1 = new Weapon.WeaponDistribution();
        dist1.setTotal(57);
        dist1.setTm(9);
        dist1.setD1(0);
        dist1.setD2(0);
        dist1.setD3(12);
        dist1.setKhoLu(36);
        weapon1.setDistribution(dist1);
        
        weaponRepository.save(weapon1);
        
        // Súng ngắn 9mm K59
        Weapon weapon2 = new Weapon();
        weapon2.setName("Súng ngắn 9mm K59");
        weapon2.setOrigin("LX");
        weapon2.setUnit("Khẩu");
        weapon2.setGrade("+");
        weapon2.setQuantity(5);
        weapon2.setNote(null);
        weapon2.setIsActive(true);
        
        Weapon.WeaponDistribution dist2 = new Weapon.WeaponDistribution();
        dist2.setTotal(5);
        dist2.setTm(2);
        dist2.setD1(0);
        dist2.setD2(0);
        dist2.setD3(0);
        dist2.setKhoLu(3);
        weapon2.setDistribution(dist2);
        
        weaponRepository.save(weapon2);
        
        // Tiểu liên AK
        Weapon weapon3 = new Weapon();
        weapon3.setName("Tiểu liên AK");
        weapon3.setOrigin("VN");
        weapon3.setUnit("Khẩu");
        weapon3.setGrade("2");
        weapon3.setQuantity(120);
        weapon3.setNote(null);
        weapon3.setIsActive(true);
        
        Weapon.WeaponDistribution dist3 = new Weapon.WeaponDistribution();
        dist3.setTotal(120);
        dist3.setTm(10);
        dist3.setD1(35);
        dist3.setD2(30);
        dist3.setD3(20);
        dist3.setKhoLu(25);
        weapon3.setDistribution(dist3);
        
        weaponRepository.save(weapon3);
        
        // Súng trường CKC
        Weapon weapon4 = new Weapon();
        weapon4.setName("Súng trường CKC");
        weapon4.setOrigin("TQ");
        weapon4.setUnit("Khẩu");
        weapon4.setGrade("2");
        weapon4.setQuantity(80);
        weapon4.setNote(null);
        weapon4.setIsActive(true);
        
        Weapon.WeaponDistribution dist4 = new Weapon.WeaponDistribution();
        dist4.setTotal(80);
        dist4.setTm(8);
        dist4.setD1(10);
        dist4.setD2(12);
        dist4.setD3(15);
        dist4.setKhoLu(35);
        weapon4.setDistribution(dist4);
        
        weaponRepository.save(weapon4);
        
        // Trung liên RPD
        Weapon weapon5 = new Weapon();
        weapon5.setName("Trung liên RPD");
        weapon5.setOrigin("LX");
        weapon5.setUnit("Khẩu");
        weapon5.setGrade("2");
        weapon5.setQuantity(18);
        weapon5.setNote(null);
        weapon5.setIsActive(true);
        
        Weapon.WeaponDistribution dist5 = new Weapon.WeaponDistribution();
        dist5.setTotal(18);
        dist5.setTm(2);
        dist5.setD1(4);
        dist5.setD2(4);
        dist5.setD3(3);
        dist5.setKhoLu(5);
        weapon5.setDistribution(dist5);
        
        weaponRepository.save(weapon5);
    }
    
    private void seedAmmunitions() {
        // Đạn 7,62mm K51
        Ammunition ammo1 = new Ammunition();
        ammo1.setName("Đạn 7,62mm K51");
        ammo1.setUnit("Viên");
        ammo1.setGrade("2");
        ammo1.setQuantity(4486);
        ammo1.setWeightTon(BigDecimal.valueOf(0.063));
        ammo1.setIsActive(true);
        
        Ammunition.AmmunitionDistribution dist1 = new Ammunition.AmmunitionDistribution();
        dist1.setTm(216);
        dist1.setD1(0);
        dist1.setD2(0);
        dist1.setD3(288);
        dist1.setKhoLu(3982);
        dist1.setKhoK820(0);
        ammo1.setDistribution(dist1);
        
        ammunitionRepository.save(ammo1);
        
        // Đạn 7,62mm K56
        Ammunition ammo2 = new Ammunition();
        ammo2.setName("Đạn 7,62mm K56");
        ammo2.setUnit("Viên");
        ammo2.setGrade("2");
        ammo2.setQuantity(52290);
        ammo2.setWeightTon(BigDecimal.valueOf(1.150));
        ammo2.setIsActive(true);
        
        Ammunition.AmmunitionDistribution dist2 = new Ammunition.AmmunitionDistribution();
        dist2.setTm(4620);
        dist2.setD1(700);
        dist2.setD2(2760);
        dist2.setD3(5450);
        dist2.setKhoLu(38760);
        dist2.setKhoK820(0);
        ammo2.setDistribution(dist2);
        
        ammunitionRepository.save(ammo2);
        
        // Đạn 5,45mm
        Ammunition ammo3 = new Ammunition();
        ammo3.setName("Đạn 5,45mm");
        ammo3.setUnit("Viên");
        ammo3.setGrade("2");
        ammo3.setQuantity(102340);
        ammo3.setWeightTon(BigDecimal.valueOf(1.350));
        ammo3.setIsActive(true);
        
        Ammunition.AmmunitionDistribution dist3 = new Ammunition.AmmunitionDistribution();
        dist3.setTm(1200);
        dist3.setD1(350);
        dist3.setD2(820);
        dist3.setD3(960);
        dist3.setKhoLu(99010);
        dist3.setKhoK820(0);
        ammo3.setDistribution(dist3);
        
        ammunitionRepository.save(ammo3);
        
        // Đạn 12,7mm
        Ammunition ammo4 = new Ammunition();
        ammo4.setName("Đạn 12,7mm");
        ammo4.setUnit("Viên");
        ammo4.setGrade("2");
        ammo4.setQuantity(1560);
        ammo4.setWeightTon(BigDecimal.valueOf(1.120));
        ammo4.setIsActive(true);
        
        Ammunition.AmmunitionDistribution dist4 = new Ammunition.AmmunitionDistribution();
        dist4.setTm(120);
        dist4.setD1(40);
        dist4.setD2(60);
        dist4.setD3(70);
        dist4.setKhoLu(1270);
        dist4.setKhoK820(0);
        ammo4.setDistribution(dist4);
        
        ammunitionRepository.save(ammo4);
        
        // Lựu đạn
        Ammunition ammo5 = new Ammunition();
        ammo5.setName("Lựu đạn");
        ammo5.setUnit("Quả");
        ammo5.setGrade("2");
        ammo5.setQuantity(890);
        ammo5.setWeightTon(BigDecimal.valueOf(0.239));
        ammo5.setIsActive(true);
        
        Ammunition.AmmunitionDistribution dist5 = new Ammunition.AmmunitionDistribution();
        dist5.setTm(50);
        dist5.setD1(10);
        dist5.setD2(20);
        dist5.setD3(30);
        dist5.setKhoLu(780);
        dist5.setKhoK820(0);
        ammo5.setDistribution(dist5);
        
        ammunitionRepository.save(ammo5);
    }
    
    private void seedVehicles() {
        // Regular vehicles
        Vehicle vehicle1 = new Vehicle();
        vehicle1.setRegistration("BC-20-84");
        vehicle1.setMakeModel("UAZ-469");
        vehicle1.setChassisNo("476191");
        vehicle1.setEngineNo("2057357");
        vehicle1.setManufactureYear(1995);
        vehicle1.setStartUseYear(1995);
        vehicle1.setOrigin("TBQP");
        vehicle1.setStationedAt("HC-KT");
        vehicle1.setQualityGrade("C3");
        vehicle1.setStatus("SDTX");
        vehicle1.setVehicleType(Vehicle.VehicleType.REGULAR);
        vehicle1.setIsActive(true);
        
        vehicleRepository.save(vehicle1);
        
        Vehicle vehicle2 = new Vehicle();
        vehicle2.setRegistration("BC-40-16");
        vehicle2.setMakeModel("UAZ-31512");
        vehicle2.setChassisNo("3929");
        vehicle2.setEngineNo("1105466");
        vehicle2.setManufactureYear(2002);
        vehicle2.setStartUseYear(2004);
        vehicle2.setOrigin("TBQP");
        vehicle2.setStationedAt("HC-KT");
        vehicle2.setQualityGrade("C2");
        vehicle2.setStatus("SDTX");
        vehicle2.setVehicleType(Vehicle.VehicleType.REGULAR);
        vehicle2.setIsActive(true);
        
        vehicleRepository.save(vehicle2);
        
        Vehicle vehicle3 = new Vehicle();
        vehicle3.setRegistration("BC-42-78");
        vehicle3.setMakeModel("UAZ-31512");
        vehicle3.setChassisNo("467735");
        vehicle3.setEngineNo("40102195");
        vehicle3.setManufactureYear(2002);
        vehicle3.setStartUseYear(2012);
        vehicle3.setOrigin("TBQP");
        vehicle3.setStationedAt("d2");
        vehicle3.setQualityGrade("C2");
        vehicle3.setStatus("SDTX");
        vehicle3.setVehicleType(Vehicle.VehicleType.REGULAR);
        vehicle3.setIsActive(true);
        
        vehicleRepository.save(vehicle3);
        
        Vehicle vehicle4 = new Vehicle();
        vehicle4.setRegistration("BC-41-39");
        vehicle4.setMakeModel("UAZ-31519");
        vehicle4.setChassisNo("552863");
        vehicle4.setEngineNo("500773");
        vehicle4.setManufactureYear(2006);
        vehicle4.setStartUseYear(2007);
        vehicle4.setOrigin("TBQP");
        vehicle4.setStationedAt("HC-KT");
        vehicle4.setQualityGrade("C2");
        vehicle4.setStatus("SDTX");
        vehicle4.setVehicleType(Vehicle.VehicleType.REGULAR);
        vehicle4.setIsActive(true);
        
        vehicleRepository.save(vehicle4);
        
        Vehicle vehicle5 = new Vehicle();
        vehicle5.setRegistration("BC-44-29");
        vehicle5.setMakeModel("FORD");
        vehicle5.setChassisNo("HW769870");
        vehicle5.setEngineNo("AT-2511098");
        vehicle5.setManufactureYear(2017);
        vehicle5.setStartUseYear(2017);
        vehicle5.setOrigin("TBQP");
        vehicle5.setStationedAt("TM");
        vehicle5.setQualityGrade("C2");
        vehicle5.setStatus("SDTX");
        vehicle5.setVehicleType(Vehicle.VehicleType.REGULAR);
        vehicle5.setIsActive(true);
        
        vehicleRepository.save(vehicle5);
        
        // Engineering vehicles
        Vehicle engVehicle1 = new Vehicle();
        engVehicle1.setRegistration("CB-01-01");
        engVehicle1.setMakeModel("UAZ-469");
        engVehicle1.setChassisNo("476191");
        engVehicle1.setEngineNo("2057357");
        engVehicle1.setManufactureYear(1995);
        engVehicle1.setStartUseYear(1995);
        engVehicle1.setOrigin("TBQP");
        engVehicle1.setStationedAt("HC-KT");
        engVehicle1.setQualityGrade("C3");
        engVehicle1.setStatus("SDTX");
        engVehicle1.setVehicleType(Vehicle.VehicleType.ENGINEERING);
        engVehicle1.setIsActive(true);
        
        vehicleRepository.save(engVehicle1);
        
        Vehicle engVehicle2 = new Vehicle();
        engVehicle2.setRegistration("CB-02-16");
        engVehicle2.setMakeModel("UAZ-31512");
        engVehicle2.setChassisNo("3929");
        engVehicle2.setEngineNo("1105466");
        engVehicle2.setManufactureYear(2002);
        engVehicle2.setStartUseYear(2004);
        engVehicle2.setOrigin("TBQP");
        engVehicle2.setStationedAt("HC-KT");
        engVehicle2.setQualityGrade("C2");
        engVehicle2.setStatus("SDTX");
        engVehicle2.setVehicleType(Vehicle.VehicleType.ENGINEERING);
        engVehicle2.setIsActive(true);
        
        vehicleRepository.save(engVehicle2);
        
        Vehicle engVehicle3 = new Vehicle();
        engVehicle3.setRegistration("CB-03-22");
        engVehicle3.setMakeModel("KAMAZ-43253");
        engVehicle3.setChassisNo("XK23910");
        engVehicle3.setEngineNo("D902341");
        engVehicle3.setManufactureYear(2012);
        engVehicle3.setStartUseYear(2013);
        engVehicle3.setOrigin("TBQP");
        engVehicle3.setStationedAt("d3");
        engVehicle3.setQualityGrade("C2");
        engVehicle3.setStatus("SDTX");
        engVehicle3.setVehicleType(Vehicle.VehicleType.ENGINEERING);
        engVehicle3.setIsActive(true);
        
        vehicleRepository.save(engVehicle3);
    }
    
    private void seedPowerStations() {
        PowerStation ps1 = new PowerStation();
        ps1.setName("Phát điện CUMINS-0NAN");
        ps1.setFuel("DIESEL");
        ps1.setStationCode("Đ-191");
        ps1.setManufactureYear(1998);
        ps1.setStartUseYear(2000);
        ps1.setQualityLevel("4");
        ps1.setPurpose("XDCT");
        ps1.setStatus("TX");
        ps1.setUnitName("HC-KT");
        ps1.setIsActive(true);
        
        powerStationRepository.save(ps1);
        
        PowerStation ps2 = new PowerStation();
        ps2.setName("Phát điện ESD-50/VS400");
        ps2.setFuel("DIESEL");
        ps2.setStationCode("Đ-166");
        ps2.setManufactureYear(1985);
        ps2.setStartUseYear(1985);
        ps2.setQualityLevel("2");
        ps2.setPurpose("TC");
        ps2.setStatus("NCNH");
        ps2.setUnitName("HC-KT");
        ps2.setIsActive(true);
        
        powerStationRepository.save(ps2);
        
        PowerStation ps3 = new PowerStation();
        ps3.setName("Phát điện ESD-30/VS");
        ps3.setFuel("DIESEL");
        ps3.setStationCode("Đ-219");
        ps3.setManufactureYear(1982);
        ps3.setStartUseYear(1986);
        ps3.setQualityLevel("2");
        ps3.setPurpose("TC");
        ps3.setStatus("NCDH");
        ps3.setUnitName("HC-KT");
        ps3.setIsActive(true);
        
        powerStationRepository.save(ps3);
        
        PowerStation ps4 = new PowerStation();
        ps4.setName("Phát điện ESB-12/VS");
        ps4.setFuel("Xăng");
        ps4.setStationCode("Đ-254");
        ps4.setManufactureYear(1985);
        ps4.setStartUseYear(1985);
        ps4.setQualityLevel("2");
        ps4.setPurpose("XDCT");
        ps4.setStatus("NCDH");
        ps4.setUnitName("HC-KT");
        ps4.setIsActive(true);
        
        powerStationRepository.save(ps4);
    }
}
