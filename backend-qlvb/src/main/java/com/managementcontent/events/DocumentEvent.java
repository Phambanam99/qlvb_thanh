package com.managementcontent.events;

import com.managementcontent.model.Document;
import com.managementcontent.model.User;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class DocumentEvent extends ApplicationEvent {
    private final Long documentId;
    private final DocumentProcessingStatus status;
    private final User actor;
    private final String comments;
    private final EventType eventType;
    
    public enum EventType {
        STATUS_CHANGE,
        ASSIGNMENT,
        ATTACHMENT_ADDED,
        DOCUMENT_CREATED,
        DOCUMENT_UPDATED,
        DOCUMENT_DELETED
    }
    
    public DocumentEvent(Object source, Long documentId, DocumentProcessingStatus status, 
                         User actor, String comments, EventType eventType) {
        super(source);
        this.documentId = documentId;
        this.status = status;
        this.actor = actor;
        this.comments = comments;
        this.eventType = eventType;
    }
}