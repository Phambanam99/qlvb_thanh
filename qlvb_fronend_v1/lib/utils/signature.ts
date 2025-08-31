import { SIGNATURE_CONFIG } from "@/lib/constants/signature";

/**
 * Constructs the public URL for a signature image
 * @param fileName - The signature file name
 * @returns The complete URL path to the signature image
 */
export const getSignatureImageUrl = (fileName: string): string => {
  return `${SIGNATURE_CONFIG.API_ENDPOINTS.UPLOADS_PATH}/${fileName}`;
};

/**
 * Validates if a file is an accepted image type for signatures
 * @param file - The file to validate
 * @returns True if the file type is accepted
 */
export const isValidSignatureImageFile = (file: File): boolean => {
  const acceptedTypes = SIGNATURE_CONFIG.ACCEPTED_IMAGE_TYPES.split(",");
  return acceptedTypes.includes(file.type);
};

/**
 * Validates if a file is a PDF
 * @param file - The file to validate
 * @returns True if the file is a PDF
 */
export const isValidPdfFile = (file: File): boolean => {
  return file.type === SIGNATURE_CONFIG.ACCEPTED_PDF_TYPE;
};

/**
 * Generates a unique instance ID for placed signatures
 * @returns A unique timestamp-based ID
 */
export const generateSignatureInstanceId = (): number => {
  return Date.now();
};

/**
 * Creates a download link and triggers download
 * @param blob - The blob to download
 * @param fileName - The name for the downloaded file
 */
export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Resets a file input element
 * @param inputId - The ID of the file input element
 */
export const resetFileInput = (inputId: string): void => {
  const fileInput = document.getElementById(inputId) as HTMLInputElement;
  if (fileInput) {
    fileInput.value = "";
  }
};

/**
 * Formats a signed PDF filename
 * @param originalFileName - The original PDF filename
 * @returns The formatted signed filename
 */
export const formatSignedFileName = (originalFileName: string): string => {
  return `signed-${originalFileName}`;
};
