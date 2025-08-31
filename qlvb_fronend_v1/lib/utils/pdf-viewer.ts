/**
 * PDF Viewer Utilities
 * Functions to handle PDF preview and viewing across the application
 */

import { downloadAttachment } from "@/lib/api/internalDocumentApi";
import { addUserWatermarkToPdf, isPdfFile } from "./pdf-watermark";

export interface PDFViewerOptions {
  title?: string;
  width?: string;
  height?: string;
  allowDownload?: boolean;
  allowPrint?: boolean;
}


/**
 * Check if a file is a PDF based on file type or extension
 */
export const isPDFFile = (fileType: string, fileName?: string): boolean => {
  // Check MIME type
  if (fileType.toLowerCase().includes("pdf")) {
    return true;
  }

  // Check file extension as fallback
  if (fileName) {
    const extension = fileName.toLowerCase().split(".").pop();
    return extension === "pdf";
  }

  return false;
};

/**
 * Create a blob URL for PDF viewing
 */
export const createPDFBlobUrl = (blob: Blob): string => {
  return window.URL.createObjectURL(blob);
};

/**
 * Cleanup blob URL to free memory
 */
export const cleanupBlobUrl = (url: string): void => {
  window.URL.revokeObjectURL(url);
};

/**
 * Get file type icon based on file type
 */
export const getFileTypeIcon = (fileType: string) => {
  const type = fileType.toLowerCase();

  if (type.includes("pdf")) return "FileText";
  if (type.includes("video") || type.includes("mp4") || type.includes("avi"))
    return "Video";
  if (
    type.includes("image") ||
    type.includes("png") ||
    type.includes("jpg") ||
    type.includes("jpeg")
  )
    return "Image";
  if (type.includes("word") || type.includes("doc")) return "FileText";
  if (type.includes("excel") || type.includes("xls")) return "FileSpreadsheet";
  if (type.includes("powerpoint") || type.includes("ppt"))
    return "Presentation";

  return "File";
};

/**
 * Format file size from bytes to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Download file with proper filename
 */
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Open PDF in new window/tab
 */
export const openPDFInNewWindow = (
  blob: Blob,
  title?: string
): Window | null => {
  const url = createPDFBlobUrl(blob);
  const newWindow = window.open(url, "_blank");

  if (newWindow && title) {
    newWindow.document.title = title;
  }

  // Cleanup URL after some delay (window should have loaded by then)
  setTimeout(() => {
    cleanupBlobUrl(url);
  }, 5000);

  return newWindow;
};

/**
 * Check if browser supports PDF viewing
 */
export const supportsPDFViewing = (): boolean => {
  // Most modern browsers support PDF viewing
  return true;
};

/**
 * Get PDF viewer URL with options
 */
export const getPDFViewerUrl = (
  blobUrl: string,
  options: PDFViewerOptions = {}
): string => {
  const params = new URLSearchParams();

  if (!options.allowDownload) {
    params.append("toolbar", "0");
  }

  if (!options.allowPrint) {
    params.append("navpanes", "0");
  }

  const queryString = params.toString();
  return queryString ? `${blobUrl}#${queryString}` : blobUrl;
};
