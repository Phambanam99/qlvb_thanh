package com.managementcontent.repository;

import com.managementcontent.model.Sender;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SenderRepository extends JpaRepository<Sender, Long> {
    boolean existsByName(String name);
    Optional<Sender> findByName(String name);
}