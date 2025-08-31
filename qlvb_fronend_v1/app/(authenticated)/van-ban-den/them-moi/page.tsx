"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Import hooks and components
import { DepartmentTree } from "@/components/department-tree";
import { useDepartmentSelection } from "@/hooks/use-department-selection";
import { useDocumentForm } from "@/hooks/use-document-form";
import { useDepartmentUsers } from "@/hooks/use-department-users";
import { useDocumentTypeManagement } from "@/hooks/use-document-type-management";
import { useSenderManagement } from "@/hooks/use-sender-management";

// Import new components
import { DocumentPurposeSelector } from "./components/document-purpose-selector";
import { ProcessingSection } from "./components/processing-section";
import { NotificationSection } from "./components/notification-section";
import { DocumentInfoForm } from "./components/document-info-form";
import { PageHeader } from "./components/page-header";
import { DepartmentSelection } from "./components/department-selection";

// Import utilities and hooks
import { leadershipRoleOrder } from "./lib/constants";
import { useAddDocumentForm } from "./hooks/use-add-document-form";

export default function AddIncomingDocumentPage() {
  // Use custom hooks
  const {
    departments,
    expandedDepartments,
    isLoading: isLoadingDepartmentList,
    primaryDepartment,
    secondaryDepartments,
    toggleDepartment,
    selectPrimaryDepartment,
    selectSecondaryDepartment,
    clearSelection,
    findDepartmentById,
  } = useDepartmentSelection();

  const {
    documentNumber,
    setDocumentNumber,
    documentCode,
    setDocumentCode,
    documentTitle,
    setDocumentTitle,
    documentSummary,
    setDocumentSummary,
    documentDate,
    setDocumentDate,
    receivedDate,
    setReceivedDate,
    documentNotes,
    setDocumentNotes,
    selectedDocumentType,
    setSelectedDocumentType,
    files,
    setFiles,
    documentTypes,
    urgencyLevel,
    setUrgencyLevel,
    securityLevel,
    setSecurityLevel,
    closureRequest,
    setClosureRequest,
    closureDeadline,
    setClosureDeadline,
    sendingDepartmentName,
    setSendingDepartmentName,
    emailSource,
    setEmailSource,
    isLoadingDocumentTypes,
    isSubmitting,
    handleSubmit: submitDocument,
    // File management functions
    handleFileChange,
    handleRemoveFile,
    clearFiles,
  } = useDocumentForm();

  const {
    departmentUsers,
    isLoadingUsers,
    fetchDepartmentUsers,
    getLeadershipRole,
  } = useDepartmentUsers(leadershipRoleOrder);

  const {
    newDocumentType,
    setNewDocumentType,
    isDocumentTypeDialogOpen,
    setIsDocumentTypeDialogOpen,
    isCreatingDocumentType,
    documentTypeError,
    setDocumentTypeError,
    createDocumentType,
  } = useDocumentTypeManagement();

  const {
    departments: senderDepartments,
    isLoadingDepartments,
    newSender,
    setNewSender,
    dialogOpen,
    setDialogOpen,
    isCreatingSender,
    senderError,
    setSenderError,
    createSender,
  } = useSenderManagement();

  // Form logic hook
  const {
    validationErrors,
    validationErrorsForComponents,
    setValidationErrors,
    documentPurpose,
    setDocumentPurpose,
    notificationScope,
    setNotificationScope,
    handleSelectPrimaryDepartment,
    handleSelectSecondaryDepartment,
    handleRemovePrimaryDepartment,
    handleRemoveSecondaryDepartment,
    handleNotificationScopeChange,
    handleSubmit,
    handleReset,
    getRoleDisplayName,
    findUserByIdHelper,
  } = useAddDocumentForm();

  // Handle document type creation
  const handleAddDocumentType = async () => {
    const updatedTypes = await createDocumentType(documentTypes);
    if (updatedTypes) {
      setIsDocumentTypeDialogOpen(false);
    }
  };

  // Check if form should be disabled
  const isFormDisabled =
    documentPurpose === "NOTIFICATION" &&
    notificationScope === "SPECIFIC_UNITS" &&
    secondaryDepartments.length === 0;

  return (
    <div className="container mx-auto max-w-7xl space-y-6">
      <PageHeader
        isSubmitting={isSubmitting}
        isFormDisabled={isFormDisabled}
        onReset={handleReset}
      />

      <form
        id="document-form"
        onSubmit={(e) =>
          handleSubmit(
            e,
            {
              documentNumber,
              documentTitle,
              sendingDepartmentName,
              primaryDepartment,
              secondaryDepartments,
            },
            submitDocument
          )
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Document Information Card */}
          <Card className="bg-card">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg">Thông tin công văn</CardTitle>
              <CardDescription>
                Nhập thông tin chi tiết của công văn đến
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <DocumentInfoForm
                documentNumber={documentNumber}
                setDocumentNumber={setDocumentNumber}
                documentCode={documentCode}
                setDocumentCode={setDocumentCode}
                documentTitle={documentTitle}
                setDocumentTitle={setDocumentTitle}
                documentSummary={documentSummary}
                setDocumentSummary={setDocumentSummary}
                documentDate={documentDate}
                setDocumentDate={setDocumentDate}
                receivedDate={receivedDate}
                setReceivedDate={setReceivedDate}
                sendingDepartmentName={sendingDepartmentName}
                setSendingDepartmentName={setSendingDepartmentName}
                selectedDocumentType={selectedDocumentType}
                setSelectedDocumentType={setSelectedDocumentType}
                urgencyLevel={urgencyLevel}
                setUrgencyLevel={setUrgencyLevel}
                securityLevel={securityLevel}
                setSecurityLevel={setSecurityLevel}
                files={files}
                handleFileChange={handleFileChange}
                handleRemoveFile={handleRemoveFile}
                documentTypes={documentTypes}
                isLoadingDocumentTypes={isLoadingDocumentTypes}
                newDocumentType={newDocumentType}
                setNewDocumentType={setNewDocumentType}
                isDocumentTypeDialogOpen={isDocumentTypeDialogOpen}
                setIsDocumentTypeDialogOpen={setIsDocumentTypeDialogOpen}
                isCreatingDocumentType={isCreatingDocumentType}
                documentTypeError={documentTypeError}
                setDocumentTypeError={setDocumentTypeError}
                handleAddDocumentType={handleAddDocumentType}
                senderDepartments={senderDepartments}
                isLoadingDepartments={isLoadingDepartments}
                newSender={newSender}
                setNewSender={setNewSender}
                dialogOpen={dialogOpen}
                setDialogOpen={setDialogOpen}
                isCreatingSender={isCreatingSender}
                senderError={senderError}
                setSenderError={setSenderError}
                createSender={createSender}
                validationErrors={validationErrorsForComponents}
                setValidationErrors={setValidationErrors}
              />
            </CardContent>
          </Card>

          {/* Processing Assignment Card */}
          <Card className="bg-card">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle>Phân loại công văn</CardTitle>
              <CardDescription>Chọn mục đích của công văn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Document Purpose Selection */}
              <DocumentPurposeSelector
                documentPurpose={documentPurpose}
                onPurposeChange={setDocumentPurpose}
              />

              {/* Processing Section - Only show when PROCESS is selected */}
              {documentPurpose === "PROCESS" && (
                <ProcessingSection
                  primaryDepartment={primaryDepartment}
                  secondaryDepartments={secondaryDepartments as number[]}
                  validationErrors={validationErrorsForComponents}
                  findDepartmentById={findDepartmentById}
                  onRemovePrimaryDepartment={() =>
                    handleRemovePrimaryDepartment(selectPrimaryDepartment)
                  }
                  onRemoveSecondaryDepartment={(id) =>
                    handleRemoveSecondaryDepartment(
                      id,
                      secondaryDepartments,
                      clearSelection,
                      selectPrimaryDepartment,
                      selectSecondaryDepartment,
                      primaryDepartment
                    )
                  }
                  onClearSelection={clearSelection}
                />
              )}

              {/* Notification Section - Only show when NOTIFICATION is selected */}
              {documentPurpose === "NOTIFICATION" && (
                <NotificationSection
                  notificationScope={notificationScope}
                  secondaryDepartments={secondaryDepartments}
                  findDepartmentById={findDepartmentById}
                  findUserById={(deptId, userId) =>
                    findUserByIdHelper(departmentUsers, deptId, userId)
                  }
                  getLeadershipRole={getLeadershipRole}
                  getRoleDisplayName={getRoleDisplayName}
                  onScopeChange={(scope) =>
                    handleNotificationScopeChange(scope, clearSelection)
                  }
                  onRemoveSecondaryDepartment={(id) =>
                    handleRemoveSecondaryDepartment(
                      id,
                      secondaryDepartments,
                      clearSelection,
                      selectPrimaryDepartment,
                      selectSecondaryDepartment,
                      primaryDepartment
                    )
                  }
                  onClearSelection={clearSelection}
                />
              )}

              {/* Department Selection Tree */}
              <DepartmentSelection
                documentPurpose={documentPurpose}
                notificationScope={notificationScope}
                departments={departments}
                expandedDepartments={expandedDepartments}
                isLoadingDepartmentList={isLoadingDepartmentList}
                primaryDepartment={primaryDepartment}
                secondaryDepartments={secondaryDepartments}
                departmentUsers={departmentUsers}
                isLoadingUsers={isLoadingUsers}
                documentNotes={documentNotes}
                closureDeadline={closureDeadline}
                findDepartmentById={findDepartmentById}
                getLeadershipRole={getLeadershipRole}
                getRoleDisplayName={getRoleDisplayName}
                toggleDepartment={toggleDepartment}
                onSelectPrimaryDepartment={(id) =>
                  handleSelectPrimaryDepartment(id, selectPrimaryDepartment)
                }
                onSelectSecondaryDepartment={(id) =>
                  handleSelectSecondaryDepartment(id, selectSecondaryDepartment)
                }
                fetchDepartmentUsers={fetchDepartmentUsers}
                setDocumentNotes={setDocumentNotes}
                setClosureDeadline={setClosureDeadline}
              />
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
