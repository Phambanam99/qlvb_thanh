package com.managementcontent.service;

import com.managementcontent.dto.DocumentCommentDTO;
import com.managementcontent.model.Document;
import com.managementcontent.model.DocumentComment;
import com.managementcontent.model.User;
import com.managementcontent.repository.DocumentCommentRepository;
import com.managementcontent.repository.DocumentRepository;
import com.managementcontent.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentCommentService {

    private final DocumentCommentRepository commentRepository;
    private final DocumentRepository<Document> documentRepository;
    private final UserRepository userRepository;

    /**
     * Add a new comment to a document
     * 
     * @param documentId  ID of the document to comment on
     * @param userId      ID of the user adding the comment
     * @param content     Comment text content
     * @param commentType Type of comment (optional)
     * @return Added comment as DTO
     */
    @Transactional
    public DocumentCommentDTO addComment(Long documentId, Long userId, String content, String commentType) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with ID: " + documentId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        DocumentComment comment = new DocumentComment();
        comment.setDocument(document);
        comment.setUser(user);
        comment.setContent(content);

        if (commentType != null && !commentType.isEmpty()) {
            comment.setCommentType(commentType);
        }

        DocumentComment savedComment = commentRepository.save(comment);

        return convertToDTO(savedComment);
    }

    /**
     * Add a new comment to a document (using the default comment type)
     */
    @Transactional
    public DocumentCommentDTO addComment(Long documentId, Long userId, String content) {
        return addComment(documentId, userId, content, null);
    }

    /**
     * Get all comments for a document
     * 
     * @param documentId ID of the document
     * @return List of comments as DTOs
     */
    public List<DocumentCommentDTO> getCommentsByDocumentId(Long documentId) {
        return documentRepository.findById(documentId)
                .map(document -> {
                    List<DocumentComment> comments = commentRepository.findByDocumentOrderByCreatedDesc(document);
                    return comments.stream()
                            .map(this::convertToDTO)
                            .collect(Collectors.toList());
                })
                .orElse(new ArrayList<>());
    }

    /**
     * Get comments of a specific type for a document
     * 
     * @param documentId  ID of the document
     * @param commentType Type of comments to retrieve
     * @return List of comments as DTOs
     */
    public List<DocumentCommentDTO> getCommentsByDocumentIdAndType(Long documentId, String commentType) {
        return documentRepository.findById(documentId)
                .map(document -> {
                    List<DocumentComment> comments = commentRepository.findByDocumentAndCommentType(document,
                            commentType);
                    return comments.stream()
                            .map(this::convertToDTO)
                            .collect(Collectors.toList());
                })
                .orElse(new ArrayList<>());
    }

    /**
     * Get paginated comments for a document
     * 
     * @param documentId ID of the document
     * @param pageable   Pagination information
     * @return Page of comments as DTOs
     */
    public Page<DocumentCommentDTO> getCommentsByDocumentIdPaginated(Long documentId, Pageable pageable) {
        return documentRepository.findById(documentId)
                .map(document -> commentRepository.findByDocument(document, pageable)
                        .map(this::convertToDTO))
                .orElse(Page.empty(pageable));
    }

    /**
     * Delete a comment by its ID
     * 
     * @param commentId ID of the comment to delete
     * @return True if successfully deleted, false otherwise
     */
    @Transactional
    public boolean deleteComment(Long commentId) {
        Optional<DocumentComment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isPresent()) {
            commentRepository.delete(commentOpt.get());
            return true;
        }
        return false;
    }

    /**
     * Convert a DocumentComment entity to a DTO
     */
    private DocumentCommentDTO convertToDTO(DocumentComment comment) {
        DocumentCommentDTO dto = new DocumentCommentDTO();
        dto.setId(comment.getId());
        dto.setDocumentId(comment.getDocument().getId());
        dto.setDocumentTitle(comment.getDocument().getTitle());
        dto.setUserId(comment.getUser().getId());
        dto.setUserName(comment.getUser().getName());

        dto.setContent(comment.getContent());
        dto.setCreated(comment.getCreated());
        dto.setType(comment.getCommentType());

        return dto;
    }
}