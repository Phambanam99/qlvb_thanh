package com.managementcontent.dto;

import lombok.*;

/**
 * DTO representing a file attachment associated with a document.
 */
@Getter
@AllArgsConstructor
@Setter
@Data
@NoArgsConstructor
public class DocumentAttachmentDTO {
    /** Unique identifier for the attachment */
    private Long id;
    
    /** Filename of the attachment */
    private String name;
    
    /** File size in bytes */
    private Long size;
    
    /** MIME type of the file */
    private String type;
    
    /** Date when the file was uploaded */
    private String uploadDate;
    
    /** Username of the person who uploaded the file */
    private String uploadedBy;
}