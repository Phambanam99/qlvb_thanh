import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import type {
  DocumentPurpose,
  NotificationScope,
  ValidationErrors,
} from "../lib/constants";
import {
  validateDocumentForm,
  hasValidationErrors,
  convertValidationErrors,
} from "../lib/validation";
import { prepareProcessingData, handleFormReset } from "../lib/form-submission";
import {
  getRoleDisplayName,
  findUserById,
  convertDepartmentId,
  removeSecondaryDepartment,
} from "../lib/utils";

export function useAddDocumentForm() {
  const { toast } = useToast();

  // Local state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [documentPurpose, setDocumentPurpose] =
    useState<DocumentPurpose>("PROCESS");
  const [notificationScope, setNotificationScope] =
    useState<NotificationScope>("ALL_UNITS");

  // Validation function
  const validateForm = (
    documentNumber: string,
    documentTitle: string,
    sendingDepartmentName: string,
    primaryDepartment: number | null,
    secondaryDepartments: (number | string)[]
  ) => {
    const errors = validateDocumentForm(
      documentNumber,
      documentTitle,
      sendingDepartmentName,
      documentPurpose,
      notificationScope,
      primaryDepartment,
      secondaryDepartments
    );

    setValidationErrors(errors);
    return !hasValidationErrors(errors);
  };

  // Handle primary department selection
  const handleSelectPrimaryDepartment = (
    deptId: number | string,
    selectPrimaryDepartment: (id: number) => void
  ) => {
    const id = convertDepartmentId(deptId);
    selectPrimaryDepartment(id);
  };

  // Handle secondary department selection
  const handleSelectSecondaryDepartment = (
    deptId: number | string,
    selectSecondaryDepartment: (id: number) => void
  ) => {
    const id = convertDepartmentId(deptId);
    selectSecondaryDepartment(id);
  };

  // Handle removing primary department
  const handleRemovePrimaryDepartment = (
    selectPrimaryDepartment: (id: any) => void
  ) => {
    selectPrimaryDepartment(null);
  };

  // Handle removing secondary department
  const handleRemoveSecondaryDepartment = (
    deptId: number | string,
    secondaryDepartments: (number | string)[],
    clearSelection: () => void,
    selectPrimaryDepartment: (id: any) => void,
    selectSecondaryDepartment: (id: number) => void,
    primaryDepartment: number | null
  ) => {
    removeSecondaryDepartment(
      deptId,
      secondaryDepartments,
      clearSelection,
      selectPrimaryDepartment,
      selectSecondaryDepartment,
      primaryDepartment
    );
  };

  // Handle notification scope change
  const handleNotificationScopeChange = (
    scope: NotificationScope,
    clearSelection: () => void
  ) => {
    setNotificationScope(scope);
    if (scope === "ALL_UNITS") {
      clearSelection();
    }
  };

  // Handle form submission
  const handleSubmit = async (
    e: React.FormEvent,
    formData: {
      documentNumber: string;
      documentTitle: string;
      sendingDepartmentName: string;
      primaryDepartment: number | null;
      secondaryDepartments: (number | string)[];
    },
    submitDocument: (
      primaryDepartment: number | null,
      secondaryDepartments: number[],
      documentPurpose?: "PROCESS" | "NOTIFICATION",
      notificationScope?: "ALL_UNITS" | "SPECIFIC_UNITS"
    ) => Promise<void>
  ) => {
    e.preventDefault();

    // Validate form first
    if (
      !validateForm(
        formData.documentNumber,
        formData.documentTitle,
        formData.sendingDepartmentName,
        formData.primaryDepartment,
        formData.secondaryDepartments
      )
    ) {
      toast({
        title: "Lỗi validation",
        description: "Vui lòng kiểm tra và điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    // Prepare processing data
    const processingData = prepareProcessingData(
      documentPurpose,
      notificationScope,
      formData.primaryDepartment,
      formData.secondaryDepartments
    );

    // Convert secondary departments to numbers only
    const numericSecondaryDepartments = processingData.secondaryDepartments
      .map((id) => (typeof id === "string" ? parseInt(id.split("-")[0]) : id))
      .filter((id) => !isNaN(id));

    // Submit using the hook
    await submitDocument(
      processingData.primaryDepartment,
      numericSecondaryDepartments,
      documentPurpose,
      processingData.notificationScope
    );
  };

  // Handle form reset
  const handleReset = () => {
    handleFormReset();
  };

  // Helper functions
  const findUserByIdHelper = (
    departmentUsers: Record<number, any[]>,
    deptId: number,
    userId: number
  ) => {
    return findUserById(departmentUsers, deptId, userId);
  };

  return {
    // State
    validationErrors,
    validationErrorsForComponents: convertValidationErrors(validationErrors),
    setValidationErrors,
    documentPurpose,
    setDocumentPurpose,
    notificationScope,
    setNotificationScope,

    // Actions
    validateForm,
    handleSelectPrimaryDepartment,
    handleSelectSecondaryDepartment,
    handleRemovePrimaryDepartment,
    handleRemoveSecondaryDepartment,
    handleNotificationScopeChange,
    handleSubmit,
    handleReset,

    // Helpers
    getRoleDisplayName,
    findUserByIdHelper,
  };
}
