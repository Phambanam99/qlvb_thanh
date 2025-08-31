package com.managementcontent.model.enums;

public enum NotificationType {
    // Thông báo chung cho Document
    STATUS_CHANGE,
    DEADLINE_REMINDER,
    NEW_DOCUMENT,
    ASSIGNMENT,
    NEW_COMMENT,
    DOCUMENT_UPDATE,

    // Thông báo cho Internal Document
    INTERNAL_DOCUMENT_SENT,
    INTERNAL_DOCUMENT_READ,
    INTERNAL_DOCUMENT_RECEIVED,
    INTERNAL_DOCUMENT_UPDATED,
    PUBLIC_DOCUMENT_UPLOADED
}
