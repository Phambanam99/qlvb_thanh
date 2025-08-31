package com.managementcontent.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Data
public class FullIncomingDocumentDTO {
    @JsonProperty("document")
    private IncomingDocumentDTO document;

    @JsonProperty("workflow")
    private DocumentWorkflowDTO workflow;


}
