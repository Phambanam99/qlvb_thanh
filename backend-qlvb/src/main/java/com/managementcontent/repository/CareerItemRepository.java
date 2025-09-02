package com.managementcontent.repository;

import com.managementcontent.model.CareerItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CareerItemRepository extends JpaRepository<CareerItem, Long> {
    
    List<CareerItem> findByProfileIdOrderBySortOrder(Long profileId);
    
    @Query("SELECT ci FROM CareerItem ci WHERE ci.profile.id = :profileId ORDER BY ci.sortOrder")
    List<CareerItem> findByProfileIdOrderBySortOrderQuery(@Param("profileId") Long profileId);
}
