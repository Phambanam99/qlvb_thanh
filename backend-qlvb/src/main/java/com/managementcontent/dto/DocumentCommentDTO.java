package com.managementcontent.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a comment or note associated with a document.
 */
@Data
@NoArgsConstructor
public class DocumentCommentDTO {
    /** Unique identifier for the comment */
    private Long id;

    /** ID of the document associated with the comment */
    private Long documentId;

    /** Title of the document associated with the comment */
    private String documentTitle;

    /** ID of the user who created the comment */
    private Long userId;

    /** Name of the user who created the comment */
    private String userName;

    /** Avatar of the user who created the comment */
    private String userAvatar;

    /** Text content of the comment */
    private String content;

    /** Timestamp when the comment was created */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime created;

    /** Type of comment (comment, instruction, feedback, or approval) */
    private String type;
}