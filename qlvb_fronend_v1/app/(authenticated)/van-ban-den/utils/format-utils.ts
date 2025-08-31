/**
 * Formatting utilities for văn bản đến
 * Centralizes all formatting logic for consistency
 */

/**
 * Format date string to Vietnamese locale
 * @param dateString - Date string to format
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string | Date | null | undefined
): string => {
  if (!dateString) return "N/A";

  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    return "N/A";
  }
};

/**
 * Format datetime string to Vietnamese locale with time
 * @param dateString - Date string to format
 * @returns Formatted datetime string
 */
export const formatDateTime = (
  dateString: string | Date | null | undefined
): string => {
  if (!dateString) return "N/A";

  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "N/A";
  }
};

/**
 * Truncate text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (
  text: string | null | undefined,
  maxLength: number
): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

/**
 * Format file size in bytes to human readable format
 * @param bytes - File size in bytes
 * @returns Human readable file size
 */
export const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes || bytes === 0) return "0 B";

  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Format urgency level for display
 * @param urgency - Urgency level code
 * @returns Display name for urgency
 */
export const formatUrgencyLevel = (
  urgency: string | null | undefined
): string => {
  if (!urgency) return "Bình thường";

  switch (urgency.toLowerCase()) {
    case "urgent":
    case "khan":
      return "Khẩn";
    case "very_urgent":
    case "rat_khan":
      return "Rất khẩn";
    case "extremely_urgent":
    case "hoa_toc":
      return "Hỏa tốc";
    case "normal":
    case "binh_thuong":
    default:
      return "Bình thường";
  }
};

/**
 * Get safe property value with fallback
 * @param obj - Object to get property from
 * @param path - Property path (dot notation supported)
 * @param fallback - Fallback value if property doesn't exist
 * @returns Property value or fallback
 */
export const safeGet = (obj: any, path: string, fallback: any = null): any => {
  try {
    return (
      path.split(".").reduce((current, prop) => current?.[prop], obj) ??
      fallback
    );
  } catch {
    return fallback;
  }
};
