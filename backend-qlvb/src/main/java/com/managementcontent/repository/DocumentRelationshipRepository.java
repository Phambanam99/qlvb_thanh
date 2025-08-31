package com.managementcontent.repository;

import com.managementcontent.model.DocumentRelationship;
import com.managementcontent.model.IncomingDocument;
import com.managementcontent.model.OutgoingDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRelationshipRepository extends JpaRepository<DocumentRelationship, Long> {

    Optional<DocumentRelationship> findByIncomingDocumentAndOutgoingDocument(
            IncomingDocument incomingDocument, OutgoingDocument outgoingDocument);

    @Query("SELECT dr.outgoingDocument FROM DocumentRelationship dr WHERE dr.incomingDocument.id = :incomingDocId")
    List<OutgoingDocument> findResponsesForIncomingDocument(@Param("incomingDocId") Long incomingDocId);

    @Query("SELECT dr.incomingDocument FROM DocumentRelationship dr WHERE dr.outgoingDocument.id = :outgoingDocId")
    List<IncomingDocument> findIncomingDocumentsForOutgoingDocument(@Param("outgoingDocId") Long outgoingDocId);

    List<DocumentRelationship> findByIncomingDocument_Id(Long incomingDocumentId);

    List<DocumentRelationship> findByOutgoingDocument_Id(Long outgoingDocumentId);

    @Query("SELECT dr FROM DocumentRelationship dr WHERE dr.relationshipType = :relationshipType")
    List<DocumentRelationship> findByRelationshipType(@Param("relationshipType") String relationshipType);
}