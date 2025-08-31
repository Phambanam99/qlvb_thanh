package com.managementcontent.repository;

import com.managementcontent.model.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentTypeRepository extends JpaRepository<DocumentType, Long> {

    List<DocumentType> findByIsActiveTrue();


    Optional<DocumentType> findByName(String documentType);

    boolean existsByName(String name);
}