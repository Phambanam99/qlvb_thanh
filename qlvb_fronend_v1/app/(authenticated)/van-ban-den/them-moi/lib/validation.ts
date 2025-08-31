import type {
  ValidationErrors,
  DocumentPurpose,
  NotificationScope,
} from "./constants";

/**
 * Form validation logic
 */
export const validateDocumentForm = (
  documentNumber: string,
  documentTitle: string,
  sendingDepartmentName: string,
  documentPurpose: DocumentPurpose,
  notificationScope: NotificationScope,
  primaryDepartment: number | null,
  secondaryDepartments: (number | string)[]
): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Basic required fields
  if (!documentNumber.trim()) {
    errors.documentNumber = "Số văn bản là bắt buộc";
  }

  if (!documentTitle.trim()) {
    errors.documentTitle = "Trích yếu là bắt buộc";
  }

  if (!sendingDepartmentName.trim()) {
    errors.sendingDepartmentName = "Đơn vị gửi là bắt buộc";
  }

  // Validate processing department for PROCESS purpose
  if (documentPurpose === "PROCESS" && !primaryDepartment) {
    errors.primaryDepartment = "Phòng ban xử lý chính là bắt buộc";
  }

  // Validate notification scope
  if (
    documentPurpose === "NOTIFICATION" &&
    notificationScope === "SPECIFIC_UNITS" &&
    secondaryDepartments.length === 0
  ) {
    errors.notificationDepartments =
      "Vui lòng chọn ít nhất một phòng ban nhận thông báo";
  }

  return errors;
};

/**
 * Check if form has validation errors
 */
export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * Convert ValidationErrors to Record<string, string> for components
 */
export const convertValidationErrors = (
  errors: ValidationErrors
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
};
