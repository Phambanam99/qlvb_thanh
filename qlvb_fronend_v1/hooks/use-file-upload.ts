"use client";

import { useState, useCallback } from "react";
import axios from "axios";

interface FileUploadState {
  files: File[];
  uploadProgress: number;
  isUploading: boolean;
  error: string | null;
  cancelTokenSource: any;
}

interface FileValidationOptions {
  maxSize?: number; // in MB
  allowedTypes?: string[];
  maxFiles?: number;
}

const DEFAULT_VALIDATION: FileValidationOptions = {
  maxSize: 200,
  //allow all files
  allowedTypes: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "image/jpeg",
    "image/png",
    "image/gif",
    "text/plain",
    "application/x-rar-compressed", 
    "application/zip",
  ],
  maxFiles: 10,
};

export const useFileUpload = (
  validationOptions: FileValidationOptions = {}
) => {
  const options = { ...DEFAULT_VALIDATION, ...validationOptions };

  const [state, setState] = useState<FileUploadState>({
    files: [],
    uploadProgress: 0,
    isUploading: false,
    error: null,
    cancelTokenSource: null,
  });

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (options.maxSize && file.size > options.maxSize * 1024 * 1024) {
        return `File "${file.name}" quá lớn. Kích thước tối đa là ${options.maxSize}MB`;
      }

      // // Check file type
      // if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      //   return `File "${
      //     file.name
      //   }" không được hỗ trợ. Chỉ chấp nhận: ${options.allowedTypes.join(
      //     ", "
      //   )}`;
      // }

      return null;
    },
    [options]
  );

  const validateFiles = useCallback(
    (files: File[]): string | null => {
      // Check max files
      if (options.maxFiles && files.length > options.maxFiles) {
        return `Chỉ được phép tải lên tối đa ${options.maxFiles} files`;
      }

      // Validate each file
      for (const file of files) {
        const error = validateFile(file);
        if (error) return error;
      }

      return null;
    },
    [options, validateFile]
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const allFiles = [...state.files, ...newFiles];
      const error = validateFiles(allFiles);

      if (error) {
        setState((prev) => ({ ...prev, error }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        files: allFiles,
        error: null,
      }));
      return true;
    },
    [state.files, validateFiles]
  );

  const removeFile = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
      error: null,
    }));
  }, []);

  const clearFiles = useCallback(() => {
    setState((prev) => ({
      ...prev,
      files: [],
      error: null,
    }));
  }, []);

  const setUploadProgress = useCallback((progress: number) => {
    setState((prev) => ({ ...prev, uploadProgress: progress }));
  }, []);

  const setUploading = useCallback((isUploading: boolean) => {
    setState((prev) => ({ ...prev, isUploading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const createCancelToken = useCallback(() => {
    const cancelTokenSource = axios.CancelToken.source();
    setState((prev) => ({ ...prev, cancelTokenSource }));
    return cancelTokenSource;
  }, []);

  const cancelUpload = useCallback(() => {
    if (state.cancelTokenSource) {
      state.cancelTokenSource.cancel("Upload cancelled by user");
      setState((prev) => ({
        ...prev,
        isUploading: false,
        uploadProgress: 0,
        cancelTokenSource: null,
      }));
    }
  }, [state.cancelTokenSource]);

  const resetUpload = useCallback(() => {
    setState((prev) => ({
      ...prev,
      uploadProgress: 0,
      isUploading: false,
      error: null,
      cancelTokenSource: null,
    }));
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  }, []);

  const getTotalSize = useCallback((): string => {
    const totalBytes = state.files.reduce((sum, file) => sum + file.size, 0);
    return formatFileSize(totalBytes);
  }, [state.files, formatFileSize]);

  return {
    files: state.files,
    uploadProgress: state.uploadProgress,
    isUploading: state.isUploading,
    error: state.error,
    addFiles,
    removeFile,
    clearFiles,
    setUploadProgress,
    setUploading,
    setError,
    createCancelToken,
    cancelUpload,
    resetUpload,
    formatFileSize,
    getTotalSize,
    validateFiles,
  };
};
