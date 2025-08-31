import type { DocumentPurpose, NotificationScope } from "./constants";

/**
 * Form submission logic
 */
export interface SubmissionData {
  documentPurpose: DocumentPurpose;
  primaryDepartment: number | null;
  secondaryDepartments: (number | string)[];
  notificationScope?: NotificationScope;
}

/**
 * Prepare processing data for submission
 */
export const prepareProcessingData = (
  documentPurpose: DocumentPurpose,
  notificationScope: NotificationScope,
  primaryDepartment: number | null,
  secondaryDepartments: (number | string)[]
): SubmissionData => {
  return {
    documentPurpose,
    primaryDepartment: documentPurpose === "PROCESS" ? primaryDepartment : null,
    secondaryDepartments:
      documentPurpose === "NOTIFICATION" && notificationScope === "ALL_UNITS"
        ? [] // Empty array for ALL_UNITS - backend will handle this
        : secondaryDepartments,
    notificationScope:
      documentPurpose === "NOTIFICATION" ? notificationScope : undefined,
  };
};

/**
 * Handle form reset
 */
export const handleFormReset = (onConfirm?: () => void) => {
  if (confirm("Bạn có chắc muốn đặt lại form? Tất cả dữ liệu sẽ bị mất.")) {
    if (onConfirm) {
      onConfirm();
    } else {
      window.location.reload();
    }
  }
};
