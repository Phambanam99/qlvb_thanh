package com.managementcontent.repository;

import com.managementcontent.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    
    List<Vehicle> findByIsActiveTrue();
    
    List<Vehicle> findByVehicleTypeAndIsActiveTrue(Vehicle.VehicleType vehicleType);
    
    @Query("SELECT v FROM Vehicle v WHERE v.isActive = true AND " +
           "(LOWER(v.registration) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.makeModel) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.stationedAt) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.qualityGrade) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.status) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Vehicle> searchVehicles(@Param("query") String query);
    
    @Query("SELECT v FROM Vehicle v WHERE v.vehicleType = :vehicleType AND v.isActive = true AND " +
           "(LOWER(v.registration) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.makeModel) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.stationedAt) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.qualityGrade) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.status) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Vehicle> searchVehiclesByType(@Param("vehicleType") Vehicle.VehicleType vehicleType, @Param("query") String query);
}
