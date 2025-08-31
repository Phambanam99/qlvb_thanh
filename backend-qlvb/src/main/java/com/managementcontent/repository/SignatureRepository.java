package com.managementcontent.repository;

import com.managementcontent.model.Signature;
import com.managementcontent.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SignatureRepository extends JpaRepository<Signature, Long> {
    List<Signature> findByUser(User user);
}