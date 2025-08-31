package com.managementcontent.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicDocumentDTO {
    private Long id;
    private String title;
    private String type;
    private String documentNumber;
    private String issuingAgency;
    private String uploaderName;
    private Long downloadCount;
    private LocalDateTime publishedAt;
    private Boolean isPublic;
    private List<String> categoryNames;
}
