"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
  incomingDocumentsAPI,
  documentTypesAPI,
  DocumentTypeDTO,
  workflowAPI,
  IncomingDocumentDTO,
  DocumentWorkflowDTO,
} from "@/lib/api";

export function useDocumentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentCode, setDocumentCode] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentSummary, setDocumentSummary] = useState("");
  const [documentDate, setDocumentDate] = useState<Date | undefined>(
    new Date()
  );
  const [receivedDate, setReceivedDate] = useState<Date | undefined>(
    new Date()
  );
  const [documentNotes, setDocumentNotes] = useState("");
  const [selectedDocumentType, setSelectedDocumentType] = useState<
    string | null
  >("OFFICIAL_LETTER");
  const [files, setFiles] = useState<File[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDTO[]>([]);
  const [isLoadingDocumentTypes, setIsLoadingDocumentTypes] = useState(false);
  const [urgencyLevel, setUrgencyLevel] = useState("NORMAL");
  const [securityLevel, setSecurityLevel] = useState("NORMAL");
  const [closureRequest, setClosureRequest] = useState(false);
  const [closureDeadline, setClosureDeadline] = useState<string>("");
  const [sendingDepartmentName, setSendingDepartmentName] = useState("");
  const [emailSource, setEmailSource] = useState("");

  const { toast } = useToast();
  const router = useRouter();

  // File management helper functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setFiles([]);
  };

  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  // Fetch document types
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        setIsLoadingDocumentTypes(true);
        const response = await documentTypesAPI.getAllDocumentTypes();
       
        setDocumentTypes(response);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách loại công văn",
          variant: "destructive",
        });
      } finally {
        setIsLoadingDocumentTypes(false);
      }
    };

    fetchDocumentTypes();
  }, [toast]);

  // Form submit handler
  const handleSubmit = async (
    primaryDepartment: number | null,
    secondaryDepartments: number[],
    documentPurpose: "PROCESS" | "NOTIFICATION" = "PROCESS",
    notificationScope?: "ALL_UNITS" | "SPECIFIC_UNITS"
  ) => {
    // if (documentPurpose === "PROCESS" && !primaryDepartment) {
    //   toast({
    //     title: "Lỗi",
    //     description: "Vui lòng chọn phòng ban xử lý chính",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    if (
      documentPurpose === "NOTIFICATION" &&
      notificationScope === "SPECIFIC_UNITS" &&
      secondaryDepartments.length === 0
    ) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ít nhất một phòng ban để thông báo",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare document data
      const incomingDTO: IncomingDocumentDTO = {
        title: documentTitle,
        documentType: selectedDocumentType || "OFFICIAL_LETTER",
        documentNumber: documentNumber,
        referenceNumber: documentCode,
        issuingAuthority: sendingDepartmentName,
        urgencyLevel: urgencyLevel,
        securityLevel: securityLevel,
        summary: documentSummary,
        notes: documentNotes,
        signingDate: documentDate
          ? documentDate.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        receivedDate: receivedDate || new Date(),
        processingStatus:
          documentPurpose === "PROCESS" ? "PENDING" : "NOTIFIED",
        closureRequest: closureRequest,
        closureDeadline: closureDeadline
          ? new Date(closureDeadline)
          : undefined,
        sendingDepartmentName: sendingDepartmentName,
        emailSource: emailSource,
      };

      // Prepare workflow data
      const deadlineDate = closureDeadline
        ? new Date(closureDeadline)
        : undefined;

      const workflowData: DocumentWorkflowDTO = {
        status: documentPurpose === "PROCESS" ? "REGISTERED" : "NOTIFIED",
        statusDisplayName:
          documentPurpose === "PROCESS" ? "Đã đăng ký" : "Đã thông báo",
        comments: documentNotes,
        primaryDepartmentId:
          documentPurpose === "PROCESS"
            ? primaryDepartment || undefined
            : undefined,
        collaboratingDepartmentIds: secondaryDepartments,
        closureDeadline:
          documentPurpose === "PROCESS" ? deadlineDate : undefined,
      };

      const data = {
        document: incomingDTO,
        workflow: workflowData,
      };

      if (files.length > 0) {
        try {
          // Try to send all files using the multi-attachment endpoint
          await workflowAPI.createFullDocument(data, files);
        } catch (error: any) {
          // If multi-attachment fails (403 or other errors), fallback to single file
          if (
            error.response?.status === 403 ||
            error.message?.includes("403")
          ) {
           
            await workflowAPI.createFullDocument(data, [files[0]]);

            if (files.length > 1) {
              toast({
                title: "Cảnh báo",
                description: `Chỉ có thể upload 1 file. ${
                  files.length - 1
                } file khác đã bị bỏ qua.`,
                variant: "destructive",
              });
            }
          } else {
            throw error; // Re-throw other errors
          }
        }
      } else {
        // If no files, create document without attachment using existing createFullDocument
        await workflowAPI.createFullDocument(data, []);
      }

      toast({
        title: "Thành công",
        description:
          documentPurpose === "PROCESS"
            ? "công văn đến đã được tạo và chuyển xử lý thành công"
            : "công văn đến đã được tạo và thông báo thành công",
      });

      router.push("/van-ban-den");
    } catch (error) {
      toast({
        title: "Lỗi",
        description:
          error instanceof Error
            ? error.message
            : "Có lỗi xảy ra khi tạo công văn",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
    handleSubmit,
    // File management functions
    handleFileChange,
    handleRemoveFile,
    clearFiles,
    addFiles,
  };
}
