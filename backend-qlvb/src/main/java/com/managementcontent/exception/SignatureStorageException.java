package com.managementcontent.exception;

public class SignatureStorageException extends RuntimeException {
    public SignatureStorageException(String message) {
        super(message);
    }

    public SignatureStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}