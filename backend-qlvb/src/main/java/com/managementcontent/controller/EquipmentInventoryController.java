package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.dto.WeaponInventoryDTO;
import com.managementcontent.dto.AmmunitionInventoryDTO;
import com.managementcontent.dto.VehicleInventoryDTO;
import com.managementcontent.dto.PowerStationDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/equipment-inventory")
public class EquipmentInventoryController {

    // Simple in-memory demo store (replace with service/repository as needed)
    private final List<WeaponInventoryDTO> weapons = new ArrayList<>();
    private final List<AmmunitionInventoryDTO> ammunitions = new ArrayList<>();
    private final List<VehicleInventoryDTO> vehicles = new ArrayList<>();
    private final List<VehicleInventoryDTO> engineering = new ArrayList<>();
    private final List<PowerStationDTO> powerStations = new ArrayList<>();

    public EquipmentInventoryController() {
        // Seed minimal demo data similar to frontend mocks
        weapons.add(new WeaponInventoryDTO(1, "Súng ngắn 7,62mm K54", "LX", "Khẩu", "+", 57,
                new WeaponInventoryDTO.WeaponDistribution(57, 9, 0, 0, 12, 36), null));
        weapons.add(new WeaponInventoryDTO(2, "Súng ngắn 9mm K59", "LX", "Khẩu", "+", 5,
                new WeaponInventoryDTO.WeaponDistribution(5, 2, 0, 0, 0, 3), null));
        weapons.add(new WeaponInventoryDTO(3, "Tiểu liên AK", "VN", "Khẩu", "2", 120,
                new WeaponInventoryDTO.WeaponDistribution(120, 10, 35, 30, 20, 25), null));
        weapons.add(new WeaponInventoryDTO(4, "Súng trường CKC", "TQ", "Khẩu", "2", 80,
                new WeaponInventoryDTO.WeaponDistribution(80, 8, 10, 12, 15, 35), null));
        weapons.add(new WeaponInventoryDTO(5, "Trung liên RPD", "LX", "Khẩu", "2", 18,
                new WeaponInventoryDTO.WeaponDistribution(18, 2, 4, 4, 3, 5), null));

        ammunitions.add(new AmmunitionInventoryDTO(1, "Đạn 7,62mm K51", "Viên", "2", 4486, 0.063,
                new AmmunitionInventoryDTO.AmmunitionDistribution(216, 0, 0, 288, 3982, 0)));
        ammunitions.add(new AmmunitionInventoryDTO(2, "Đạn 7,62mm K56", "Viên", "2", 52290, 1.150,
                new AmmunitionInventoryDTO.AmmunitionDistribution(4620, 700, 2760, 5450, 38760, 0)));
        ammunitions.add(new AmmunitionInventoryDTO(3, "Đạn 5,45mm", "Viên", "2", 102340, 1.350,
                new AmmunitionInventoryDTO.AmmunitionDistribution(1200, 350, 820, 960, 99010, 0)));
        ammunitions.add(new AmmunitionInventoryDTO(4, "Đạn 12,7mm", "Viên", "2", 1560, 1.120,
                new AmmunitionInventoryDTO.AmmunitionDistribution(120, 40, 60, 70, 1270, 0)));
        ammunitions.add(new AmmunitionInventoryDTO(5, "Lựu đạn", "Quả", "2", 890, 0.239,
                new AmmunitionInventoryDTO.AmmunitionDistribution(50, 10, 20, 30, 780, 0)));

        vehicles.add(new VehicleInventoryDTO(1, "BC-20-84", "UAZ-469", "476191", "2057357", 1995, 1995, "TBQP", "HC-KT", "C3", "SDTX"));
        vehicles.add(new VehicleInventoryDTO(2, "BC-40-16", "UAZ-31512", "3929", "1105466", 2002, 2004, "TBQP", "HC-KT", "C2", "SDTX"));
        vehicles.add(new VehicleInventoryDTO(3, "BC-42-78", "UAZ-31512", "467735", "40102195", 2002, 2012, "TBQP", "d2", "C2", "SDTX"));
        vehicles.add(new VehicleInventoryDTO(4, "BC-41-39", "UAZ-31519", "552863", "500773", 2006, 2007, "TBQP", "HC-KT", "C2", "SDTX"));
        vehicles.add(new VehicleInventoryDTO(5, "BC-44-29", "FORD", "HW769870", "AT-2511098", 2017, 2017, "TBQP", "TM", "C2", "SDTX"));

        engineering.add(new VehicleInventoryDTO(1, "CB-01-01", "UAZ-469", "476191", "2057357", 1995, 1995, "TBQP", "HC-KT", "C3", "SDTX"));
        engineering.add(new VehicleInventoryDTO(2, "CB-02-16", "UAZ-31512", "3929", "1105466", 2002, 2004, "TBQP", "HC-KT", "C2", "SDTX"));
        engineering.add(new VehicleInventoryDTO(3, "CB-03-22", "KAMAZ-43253", "XK23910", "D902341", 2012, 2013, "TBQP", "d3", "C2", "SDTX"));

        powerStations.add(new PowerStationDTO(1, "Phát điện CUMINS-0NAN", "DIESEL", "Đ-191", 1998, 2000, "4", "XDCT", "TX", "HC-KT"));
        powerStations.add(new PowerStationDTO(2, "Phát điện ESD-50/VS400", "DIESEL", "Đ-166", 1985, 1985, "2", "TC", "NCNH", "HC-KT"));
        powerStations.add(new PowerStationDTO(3, "Phát điện ESD-30/VS", "DIESEL", "Đ-219", 1982, 1986, "2", "TC", "NCDH", "HC-KT"));
        powerStations.add(new PowerStationDTO(4, "Phát điện ESB-12/VS", "Xăng", "Đ-254", 1985, 1985, "2", "XDCT", "NCDH", "HC-KT"));
    }

    private <T> List<T> search(List<T> list, String q, java.util.function.Function<T, String> fields) {
        if (q == null || q.isBlank()) return list;
        final String k = q.toLowerCase();
        return list.stream().filter(it -> Optional.ofNullable(fields.apply(it)).orElse("").toLowerCase().contains(k)).collect(Collectors.toList());
    }

    @GetMapping("/weapons")
    public ResponseEntity<ResponseDTO<List<WeaponInventoryDTO>>> weapons(@RequestParam(required = false) String q) {
        List<WeaponInventoryDTO> res = weapons;
        if (q != null && !q.isBlank()) {
            res = weapons.stream().filter(w -> (w.getName()+" "+w.getOrigin()+" "+w.getUnit()+" "+w.getGrade()).toLowerCase().contains(q.toLowerCase())).collect(Collectors.toList());
        }
        return ResponseEntity.ok(ResponseDTO.success(res));
    }

    @PutMapping("/weapons/{id}")
    public ResponseEntity<ResponseDTO<WeaponInventoryDTO>> updateWeapon(@PathVariable("id") Object id, @RequestBody WeaponInventoryDTO payload) {
        for (int i = 0; i < weapons.size(); i++) {
            if (Objects.equals(weapons.get(i).getId(), id)) {
                weapons.set(i, payload);
                return ResponseEntity.ok(ResponseDTO.success(payload));
            }
        }
        return ResponseEntity.ok(ResponseDTO.error("Not found"));
    }

    @GetMapping("/ammunitions")
    public ResponseEntity<ResponseDTO<List<AmmunitionInventoryDTO>>> ammunitions(@RequestParam(required = false) String q) {
        List<AmmunitionInventoryDTO> res = ammunitions;
        if (q != null && !q.isBlank()) {
            res = ammunitions.stream().filter(a -> (a.getName()+" "+a.getUnit()+" "+a.getGrade()).toLowerCase().contains(q.toLowerCase())).collect(Collectors.toList());
        }
        return ResponseEntity.ok(ResponseDTO.success(res));
    }

    @PutMapping("/ammunitions/{id}")
    public ResponseEntity<ResponseDTO<AmmunitionInventoryDTO>> updateAmmo(@PathVariable("id") Object id, @RequestBody AmmunitionInventoryDTO payload) {
        for (int i = 0; i < ammunitions.size(); i++) {
            if (Objects.equals(ammunitions.get(i).getId(), id)) {
                ammunitions.set(i, payload);
                return ResponseEntity.ok(ResponseDTO.success(payload));
            }
        }
        return ResponseEntity.ok(ResponseDTO.error("Not found"));
    }

    @GetMapping("/vehicles")
    public ResponseEntity<ResponseDTO<List<VehicleInventoryDTO>>> vehicles(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(ResponseDTO.success(search(vehicles, q, v -> v.getRegistration()+" "+v.getMakeModel()+" "+v.getStationedAt()+" "+v.getQualityGrade()+" "+v.getStatus())));
    }

    @PutMapping("/vehicles/{id}")
    public ResponseEntity<ResponseDTO<VehicleInventoryDTO>> updateVehicle(@PathVariable("id") Object id, @RequestBody VehicleInventoryDTO payload) {
        for (int i = 0; i < vehicles.size(); i++) {
            if (Objects.equals(vehicles.get(i).getId(), id)) {
                vehicles.set(i, payload);
                return ResponseEntity.ok(ResponseDTO.success(payload));
            }
        }
        return ResponseEntity.ok(ResponseDTO.error("Not found"));
    }

    @GetMapping("/engineering-vehicles")
    public ResponseEntity<ResponseDTO<List<VehicleInventoryDTO>>> engineering(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(ResponseDTO.success(search(engineering, q, v -> v.getRegistration()+" "+v.getMakeModel()+" "+v.getStationedAt()+" "+v.getQualityGrade()+" "+v.getStatus())));
    }

    @PutMapping("/engineering-vehicles/{id}")
    public ResponseEntity<ResponseDTO<VehicleInventoryDTO>> updateEngineering(@PathVariable("id") Object id, @RequestBody VehicleInventoryDTO payload) {
        for (int i = 0; i < engineering.size(); i++) {
            if (Objects.equals(engineering.get(i).getId(), id)) {
                engineering.set(i, payload);
                return ResponseEntity.ok(ResponseDTO.success(payload));
            }
        }
        return ResponseEntity.ok(ResponseDTO.error("Not found"));
    }

    @GetMapping("/power-stations")
    public ResponseEntity<ResponseDTO<List<PowerStationDTO>>> power(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(ResponseDTO.success(search(powerStations, q, p -> p.getName()+" "+p.getFuel()+" "+String.valueOf(p.getQualityLevel())+" "+p.getPurpose()+" "+p.getStatus()+" "+p.getUnitName())));
    }

    @PutMapping("/power-stations/{id}")
    public ResponseEntity<ResponseDTO<PowerStationDTO>> updatePower(@PathVariable("id") Object id, @RequestBody PowerStationDTO payload) {
        for (int i = 0; i < powerStations.size(); i++) {
            if (Objects.equals(powerStations.get(i).getId(), id)) {
                powerStations.set(i, payload);
                return ResponseEntity.ok(ResponseDTO.success(payload));
            }
        }
        return ResponseEntity.ok(ResponseDTO.error("Not found"));
    }
}


