package com.managementcontent.repository;

import com.managementcontent.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, Long> {
    
    Optional<Profile> findByPositionHolderId(Long positionHolderId);
    
    @Query("SELECT p FROM Profile p WHERE p.positionHolder.id = :positionHolderId")
    Optional<Profile> findByPositionHolderIdQuery(@Param("positionHolderId") Long positionHolderId);
}
