package com.managementcontent.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Data
public class FullOutgoingDocumentDTO {
    @JsonProperty("document")
    private OutgoingDocumentDTO document;

    @JsonProperty("workflow")
    private DocumentWorkflowDTO workflow;
    
    @JsonProperty("incomingDocumentId")
    private Long incomingDocumentId;
}