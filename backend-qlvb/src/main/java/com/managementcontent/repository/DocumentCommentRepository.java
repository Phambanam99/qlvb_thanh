package com.managementcontent.repository;

import com.managementcontent.model.Document;
import com.managementcontent.model.DocumentComment;
import com.managementcontent.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentCommentRepository extends JpaRepository<DocumentComment, Long> {
    /**
     * Find all comments for a specific document
     * 
     * @param document the document to find comments for
     * @return List of document comments
     */
    List<DocumentComment> findByDocumentOrderByCreatedDesc(Document document);

    /**
     * Find paginated comments for a specific document
     * 
     * @param document the document to find comments for
     * @param pageable pagination information
     * @return Page of document comments
     */
    Page<DocumentComment> findByDocument(Document document, Pageable pageable);

    /**
     * Find all comments by a specific user
     * 
     * @param user the user who created the comments
     * @return List of document comments
     */
    List<DocumentComment> findByUser(User user);

    /**
     * Find comments by type for a specific document
     * 
     * @param document    the document to find comments for
     * @param commentType the type of comments to find
     * @return List of document comments of specified type
     */
    List<DocumentComment> findByDocumentAndCommentType(Document document, String commentType);
}