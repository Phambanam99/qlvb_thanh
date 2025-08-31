"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  Save,
  Building,
  User,
  Users,
  Calendar,
  FileText,
  X,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { useToast } from "@/components/ui/use-toast";
import { UrgencyLevel, URGENCY_LEVELS } from "@/lib/types/urgency";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  workflowAPI,
  usersAPI,
  departmentsAPI,
  documentTypesAPI,
  DocumentTypeDTO,
} from "@/lib/api";
import { UserDTO } from "@/lib/api/users";
import { DepartmentTree } from "@/components/department-tree";
import { useDepartmentSelection } from "@/hooks/use-department-selection";
import { useDepartmentUsers } from "@/hooks/use-department-users";
import { updateInternalDocument, getDocumentById, CreateInternalDocumentDTO } from "@/lib/api/internalDocumentApi";
import { RichTextEditor } from "@/components/ui";
import { useFileUpload } from "@/hooks/use-file-upload";
import { FileUploadProgress } from "@/components/ui/file-upload-progress";

const leadershipRoleOrder: Record<string, number> = {
  ROLE_CUC_TRUONG: 1,
  ROLE_CUC_PHO: 2,
  ROLE_CHINH_UY: 3,
  ROLE_PHO_CHINH_UY: 4,
  ROLE_TRUONG_PHONG: 5,
  ROLE_PHO_PHONG: 6,
  ROLE_TRAM_TRUONG: 7,
  ROLE_PHO_TRAM_TRUONG: 8,
  ROLE_CHINH_TRI_VIEN_TRAM: 9,
  ROLE_CUM_TRUONG: 10,
  ROLE_PHO_CUM_TRUONG: 11,
  ROLE_CHINH_TRI_VIEN_CUM: 12,
  ROLE_TRUONG_BAN: 13,
};

// Get role display name helper
const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case "ROLE_CUC_TRUONG":
      return "Cục trưởng";
    case "ROLE_CUC_PHO":
      return "Cục phó";
    case "ROLE_CHINH_UY":
      return "Chính ủy";
    case "ROLE_PHO_CHINH_UY":
      return "Phó Chính ủy";
    case "ROLE_TRUONG_PHONG":
      return "Trưởng phòng";
    case "ROLE_PHO_PHONG":
      return "Phó phòng";
    case "ROLE_TRAM_TRUONG":
      return "Trạm trưởng";
    case "ROLE_PHO_TRAM_TRUONG":
      return "Phó Trạm trưởng";
    case "ROLE_CHINH_TRI_VIEN_TRAM":
      return "Chính trị viên trạm";
    case "ROLE_CUM_TRUONG":
      return "Cụm trưởng";
    case "ROLE_PHO_CUM_TRUONG":
      return "Phó cụm trưởng";
    case "ROLE_CHINH_TRI_VIEN_CUM":
      return "Chính trị viên cụm";
    case "ROLE_TRUONG_BAN":
      return "Trưởng Ban";
    default:
      return role.replace("ROLE_", "").replace(/_/g, " ").toLowerCase();
  }
};

// Leadership roles for filtering document signers
const LEADERSHIP_ROLES = [
  "ROLE_CUC_TRUONG",
  "ROLE_CUC_PHO", 
  "ROLE_CHINH_UY",
  "ROLE_PHO_CHINH_UY",
  "ROLE_TRUONG_PHONG",
  "ROLE_PHO_PHONG",
  "ROLE_TRUONG_BAN",
  "ROLE_PHO_BAN",
  "ROLE_CUM_TRUONG",
  "ROLE_PHO_CUM_TRUONG",
  "ROLE_TRAM_TRUONG"
];

export default function UpdateInternalOutgoingDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  // Get document ID from route params
  const documentId = params.id as string;

  // Use custom hooks for department selection
  const {
    departments,
    expandedDepartments,
    isLoading: isLoadingDepartmentList,
    primaryDepartment,
    secondaryDepartments,
    toggleDepartment,
    expandDepartment,
    selectPrimaryDepartment,
    selectSecondaryDepartment,
    clearSelection,
    findDepartmentById,
  } = useDepartmentSelection();

  const {
    departmentUsers,
    isLoadingUsers,
    fetchDepartmentUsers,
    getLeadershipRole,
  } = useDepartmentUsers(leadershipRoleOrder);

  // State for document signers (leadership users in current department)
  const [leadershipUsers, setLeadershipUsers] = useState<UserDTO[]>([]);
  const [isLoadingLeadershipUsers, setIsLoadingLeadershipUsers] = useState(false);

  // Master loading state to ensure all critical data is loaded before showing form
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  // State for form data
  const [formData, setFormData] = useState({
    documentNumber: "",
    signingDate: new Date(),
    documentType: "",
    title: "",
    summary: "",
    urgencyLevel: URGENCY_LEVELS.KHAN,
    notes: "",
    signer: "",
    draftingDepartmentId: undefined as number | undefined,
    securityLevel: 'NORMAL' as 'NORMAL' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET',
    documentSignerId: undefined as number | undefined,
    isSecureTransmission: false,
    processingDeadline: undefined as Date | undefined,
    issuingAgency: "",
    distributionType: 'REGULAR' as 'REGULAR' | 'CONFIDENTIAL' | 'COPY_BOOK' | 'PARTY' | 'STEERING_COMMITTEE',
    numberOfCopies: undefined as number | undefined,
    numberOfPages: undefined as number | undefined,
    noPaperCopy: false,
  });

  // Use file upload hook
  const fileUpload = useFileUpload({
    maxSize: 200, // 200MB max per file
    maxFiles: 10,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDocumentData, setIsLoadingDocumentData] = useState(true);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // State for storing recipients data during loading
  const [storedRecipients, setStoredRecipients] = useState<any[] | null>(null);

  // State for document types
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDTO[]>([]);
  const [isLoadingDocumentTypes, setIsLoadingDocumentTypes] = useState(false);

  // Load document types on component mount
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        setIsLoadingDocumentTypes(true);
        const types_ = await documentTypesAPI.getAllDocumentTypes();
        setDocumentTypes(Array.isArray(types_) ? types_ : []);
      } catch (error) {
        console.error('Error loading document types:', error);
        setDocumentTypes([]);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách loại văn bản",
          variant: "destructive",
        });
      } finally {
        setIsLoadingDocumentTypes(false);
      }
    };

    fetchDocumentTypes();
  }, []); // Remove toast dependency to prevent infinite loop

  // Master effect to check if all initial data is loaded
  useEffect(() => {
    const checkInitialDataLoaded = () => {
      // Check if all critical data has been loaded
      const isDocumentTypesReady = !isLoadingDocumentTypes;
      const isDepartmentsReady = !isLoadingDepartmentList && departments.length > 0;
      const isDocumentDataReady = !isLoadingDocumentData;
      
      // In update mode, also check if document data is loaded
      // Note: Leadership users will be loaded after drafting department is set, so we don't wait for them here
      const allDataReady = isDocumentTypesReady && isDepartmentsReady && isDocumentDataReady;
      
      console.log('🔍 Checking initial data loaded:', {
        isDocumentTypesReady,
        isDepartmentsReady,
        isDocumentDataReady,
        allDataReady,
        documentTypesCount: documentTypes.length,
        departmentsCount: departments.length
      });
      
      if (allDataReady && !isInitialDataLoaded) {
        console.log('✅ All initial data loaded successfully');
        setIsInitialDataLoaded(true);
      }
    };

    checkInitialDataLoaded();
  }, [
    isLoadingDocumentTypes,
    isLoadingDepartmentList, 
    isLoadingDocumentData,
    departments.length,
    documentTypes.length,
    isInitialDataLoaded
  ]);

  // Load document data for update
  useEffect(() => {
    if (documentId && !isNaN(parseInt(documentId))) {
      const loadDocumentForUpdate = async () => {
        try {
          setIsLoadingDocumentData(true);
          const response = await getDocumentById(parseInt(documentId));
          const document = response.data;
          console.log('Document loaded for update:', document);
          console.log('🔍 Document Signer Details:', {
            documentSigner: document.documentSigner,
            hasDocumentSigner: !!document.documentSigner,
            documentSignerKeys: document.documentSigner ? Object.keys(document.documentSigner) : 'No signer'
          });
          console.log('🔍 Drafting Department Details:', {
            draftingDepartment: document.draftingDepartment,
            hasDraftingDepartment: !!document.draftingDepartment,
            draftingDepartmentKeys: document.draftingDepartment ? Object.keys(document.draftingDepartment) : 'No drafting dept'
          });

          // Fill form with existing document data
          setFormData({
            documentNumber: document.documentNumber || "",
            title: document.title || "",
            summary: document.summary || "",
            documentType: document.documentType || "",
            signingDate: document.signingDate ? new Date(document.signingDate) : new Date(),
            urgencyLevel: document.urgencyLevel || URGENCY_LEVELS.KHAN,
            notes: document.notes || "",
            signer: document.signer || "",
            draftingDepartmentId: document.draftingDepartment?.id,
            securityLevel: document.securityLevel || "NORMAL",
            documentSignerId: document.documentSigner?.id,
            isSecureTransmission: document.isSecureTransmission || false,
            processingDeadline: document.processingDeadline ? new Date(document.processingDeadline) : undefined,
            issuingAgency: document.issuingAgency || "",
            distributionType: document.distributionType || "REGULAR",
            numberOfCopies: document.numberOfCopies || 1,
            numberOfPages: document.numberOfPages || 1,
            noPaperCopy: document.noPaperCopy || false,
          });

          console.log('📋 Document form data set:', {
            draftingDepartmentId: document.draftingDepartment?.id,
            draftingDepartmentName: document.draftingDepartment?.name,
            documentSignerId: document.documentSigner?.id,
            documentSignerName: document.documentSigner?.fullName
          });

          // Store recipients data to be processed after departments are loaded
          if (document.recipients && document.recipients.length > 0) {
            console.log('Storing recipients for later processing:', document.recipients);
            setStoredRecipients(document.recipients);
          }

          toast({
            title: "Thành công",
            description: "Đã tải dữ liệu văn bản để chỉnh sửa",
          });
        } catch (error) {
          console.error('Error loading document for update:', error);
          toast({
            title: "Lỗi",
            description: "Không thể tải dữ liệu văn bản để chỉnh sửa",
            variant: "destructive",
          });
          // Redirect back if document not found
          router.push('/van-ban-di');
        } finally {
          setIsLoadingDocumentData(false);
        }
      };

      loadDocumentForUpdate();
    } else {
      // Invalid document ID, redirect back
      toast({
        title: "Lỗi",
        description: "ID văn bản không hợp lệ",
        variant: "destructive",
      });
      router.push('/van-ban-di');
    }
  }, [documentId, router]);

  // Process stored recipients after departments are loaded
  useEffect(() => {
    if (storedRecipients && storedRecipients.length > 0 && departments && departments.length > 0 && !isLoadingDepartmentList) {
      console.log('🔍 Processing stored recipients now that departments are loaded:', {
        storedRecipients,
        departmentsLength: departments.length,
        currentSecondaryDepartments: secondaryDepartments
      });

      storedRecipients.forEach((recipient: any, index: number) => {
        console.log(`📋 Processing recipient ${index + 1}/${storedRecipients.length}:`, recipient);
        if (recipient.departmentId) {
          // Check if this is an individual user (has userId) or department
          if (recipient.userId) {
            // Individual user: need to expand department and fetch users first
            console.log('👤 Processing individual user:', recipient.userName, 'in department:', recipient.departmentName);
            
            // 1. Expand the department to show users
            expandDepartment(recipient.departmentId);
            
            // 2. Fetch users for this department
            fetchDepartmentUsers(recipient.departmentId);
            
            // 3. Select the composite ID (departmentId-userId) with forceAdd to prevent removal
            const compositeId = `${recipient.departmentId}-${recipient.userId}`;
            console.log('👤 Selecting individual user:', compositeId, recipient.userName);
            selectSecondaryDepartment(compositeId, true); // forceAdd = true
          } else {
            // Department: use departmentId directly with forceAdd to prevent removal
            const dept = findDepartmentById(recipient.departmentId);
            console.log('🏢 Found department:', dept);
            if (dept) {
              console.log('🏢 Selecting department:', recipient.departmentId, recipient.departmentName);
              selectSecondaryDepartment(recipient.departmentId, true); // forceAdd = true
            } else {
              console.warn('⚠️ Department not found:', recipient.departmentId, recipient.departmentName);
            }
          }
        }
      });

      console.log('✅ Recipients processing completed. Current selections:', secondaryDepartments);
      // Clear stored recipients after processing
      setStoredRecipients(null);
    }
  }, [storedRecipients, departments, isLoadingDepartmentList]); // Remove function dependencies to prevent infinite loop

  // Monitor secondaryDepartments changes
  useEffect(() => {
    console.log('📊 Secondary departments changed:', secondaryDepartments);
  }, [secondaryDepartments]);

  // Load leadership users for drafting department
  useEffect(() => {
    const loadLeadershipUsers = async () => {
      // Determine which department to use for loading leadership users
      let departmentIdToUse = formData.draftingDepartmentId;
      
      // If no drafting department, try to use user's department as fallback
      if (!departmentIdToUse && user?.departmentId) {
        console.log('⚠️ No drafting department found, using user department as fallback. User department ID:', user.departmentId);
        departmentIdToUse = user.departmentId;
      }
      
      if (departmentIdToUse) {
        try {
          setIsLoadingLeadershipUsers(true);
          console.log('🔍 Loading leadership users for department ID:', departmentIdToUse);
          
          const leaders = await usersAPI.getUsersByRoleAndDepartment(
            LEADERSHIP_ROLES,
            departmentIdToUse
          );
          console.log('👥 Leadership users loaded:', leaders);
          setLeadershipUsers(Array.isArray(leaders) ? leaders : []);
        } catch (error) {
          console.error('❌ Error loading leadership users:', error);
          setLeadershipUsers([]);
          toast({
            title: "Lỗi", 
            description: "Không thể tải danh sách lãnh đạo đơn vị soạn thảo",
            variant: "destructive",
          });
        } finally {
          setIsLoadingLeadershipUsers(false);
        }
      } else {
        console.log('⚠️ No department available for loading leadership users');
        setLeadershipUsers([]);
        setIsLoadingLeadershipUsers(false);
      }
    };

    loadLeadershipUsers();
  }, [formData.draftingDepartmentId, user?.departmentId]);

  // Ensure document signer is in leadership users list - Enhanced version
  useEffect(() => {
    if (formData.documentSignerId) {
      const addDocumentSignerToList = async () => {
        try {
          const response = await getDocumentById(parseInt(documentId));
          const document = response.data;
          
          if (document.documentSigner) {
            console.log('🔍 Checking if document signer exists in current leadership list...');
            
            setLeadershipUsers(prevList => {
              const signerExists = prevList.some(user => user.id === formData.documentSignerId);
              
              if (!signerExists) {
                console.log('➕ Adding document signer to leadership list:', document.documentSigner.fullName);
                return [...prevList, document.documentSigner];
              } else {
                console.log('✅ Document signer already exists in leadership list');
                return prevList;
              }
            });
          }
        } catch (error) {
          console.error('❌ Error fetching document signer details:', error);
        }
      };

      addDocumentSignerToList();
    }
  }, [formData.documentSignerId, documentId, leadershipUsers.length]); // Include leadershipUsers.length to trigger after leadership users are loaded

  // Input change handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRichTextChange = (name: string) => (html: string) => {
    setFormData((prev) => ({ ...prev, [name]: html }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, signingDate: date }));
    }
  };

  const handleProcessingDeadlineChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, processingDeadline: date }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? undefined : parseInt(value);
    setFormData((prev) => ({ ...prev, [name]: numValue }));
  };

  const handleCheckboxChange = (name: string) => (checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      fileUpload.addFiles(newFiles);
      // Reset input to allow selecting the same file again
      e.target.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    fileUpload.removeFile(index);
  };

  const findUserById = (deptId: number, userId: number) => {
    const deptUsers = departmentUsers[deptId] || [];
    return deptUsers.find((user) => user.id === userId);
  };

  // Helper function to parse recipient info
  const getRecipientInfo = (recipientId: number | string) => {
    if (typeof recipientId === "string" && recipientId.includes("-")) {
      const [deptId, userId] = recipientId.split("-").map(Number);
      const dept = findDepartmentById(deptId);
      const user = findUserById(deptId, userId);
      return {
        type: "user" as const,
        department: dept,
        user: user,
        displayName: user ? `${dept?.name} - ${user.fullName}` : `${dept?.name} - User not found`
      };
    } else {
      const dept = findDepartmentById(Number(recipientId));
      return {
        type: "department" as const,
        department: dept,
        user: null,
        displayName: dept?.name || "Department not found"
      };
    }
  };

  // Helper function to get unique recipients (remove duplicates)
  const getUniqueRecipients = () => {
    const uniqueMap = new Map();
    
    secondaryDepartments.forEach((recipientId: any) => {
      if (typeof recipientId === "string" && recipientId.includes("-")) {
        // Individual user: use composite ID as unique key
        uniqueMap.set(recipientId, recipientId);
      } else {
        // Department: use department ID as unique key
        const deptId = Number(recipientId);
        uniqueMap.set(`dept-${deptId}`, recipientId);
      }
    });
    
    return Array.from(uniqueMap.values());
  };

  const handleSelectSecondaryDepartment = (deptId: number | string) => {
    // Handle both department IDs and composite user IDs (departmentId-userId)
    if (typeof deptId === "string" && deptId.includes("-")) {
      // This is a composite ID (departmentId-userId)
      const [departmentId] = deptId.split("-").map(Number);
      selectSecondaryDepartment(deptId as any); // Normal toggle behavior for UI
      fetchDepartmentUsers(departmentId);
    } else {
      // This is a regular department ID
      const numericId = typeof deptId === "string" ? parseInt(deptId) : deptId;
      selectSecondaryDepartment(numericId); // Normal toggle behavior for UI
      fetchDepartmentUsers(numericId);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.documentNumber.trim()) {
      errors.documentNumber = "Số văn bản là bắt buộc";
    }

    if (!formData.title.trim()) {
      errors.title = "Tiêu đề là bắt buộc";
    }

    // Recipients are optional in update mode (may keep existing recipients)
    if (secondaryDepartments.length === 0) {
      console.warn("No recipients selected in update mode - keeping existing recipients");
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Lỗi validation",
        description: "Vui lòng kiểm tra lại thông tin cần chỉnh sửa",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      fileUpload.setUploading(true);
      fileUpload.resetUpload();

      const documentData: CreateInternalDocumentDTO = {
        documentNumber: formData.documentNumber,
        title: formData.title,
        summary: formData.summary,
        documentType: formData.documentType,
        urgencyLevel: formData.urgencyLevel,
        notes: formData.notes,
        signingDate: formData.signingDate.toISOString(),
        signer: formData.signer,
        draftingDepartmentId: formData.draftingDepartmentId,
        securityLevel: formData.securityLevel,
        documentSignerId: formData.documentSignerId,
        isSecureTransmission: formData.isSecureTransmission,
        processingDeadline: formData.processingDeadline?.toISOString(),
        issuingAgency: formData.issuingAgency,
        distributionType: formData.distributionType,
        numberOfCopies: formData.numberOfCopies,
        numberOfPages: formData.numberOfPages,
        noPaperCopy: formData.noPaperCopy,
        recipients: secondaryDepartments.map((recipient: any) => {
          if (typeof recipient === "string" && recipient.includes("-")) {
            // This is a composite ID (departmentId-userId)
            const [departmentId, userId] = recipient.split("-").map(Number);
            return { departmentId, userId };
          } else {
            // This is a regular department ID
            return { departmentId: Number(recipient) };
          }
        }),
      };

      // Create cancel token for upload
      const cancelTokenSource = fileUpload.createCancelToken();

      // Filter out existing files - only send new files
      const newFilesToUpload = fileUpload.files.filter(file => !(file as any).isExisting);
      console.log('Files to upload:', { 
        total: fileUpload.files.length, 
        existing: fileUpload.files.filter(f => (f as any).isExisting).length,
        new: newFilesToUpload.length 
      });

      // Update existing document
      const response = await updateInternalDocument(
        documentId,
        documentData,
        newFilesToUpload.length > 0 ? newFilesToUpload : undefined,
        undefined, // descriptions
        (progressEvent: any) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          fileUpload.setUploadProgress(percentCompleted);
        },
        cancelTokenSource.token
      );

      addNotification({
        title: "Văn bản đã được cập nhật",
        message: `Văn bản "${formData.title}" đã được cập nhật thành công.`,
        type: "success",
      });

      toast({
        title: "Thành công",
        description: "Văn bản đã được cập nhật thành công",
      });

      router.push("/van-ban-di");
    } catch (error: any) {
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        fileUpload.setError(
          "Tải lên bị timeout. Vui lòng thử lại với file nhỏ hơn."
        );
      } else if (error.message.includes("cancelled")) {
        fileUpload.setError("Tải lên đã bị hủy.");
      } else {
        fileUpload.setError(error.message || "Không thể tải lên file");
      }

      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật văn bản",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      fileUpload.setUploading(false);
    }
  };

  const showAllUsers = (user: any) => null;

  // Show loading screen if document data is still loading OR initial data not ready
  if (isLoadingDocumentData || !isInitialDataLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center space-x-4">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {isLoadingDocumentData ? "Đang tải dữ liệu văn bản..." : "Đang khởi tạo dữ liệu..."}
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${!isLoadingDocumentTypes ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span>Loại văn bản {!isLoadingDocumentTypes ? '✓' : '...'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${!isLoadingDepartmentList && departments.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span>Danh sách phòng ban {!isLoadingDepartmentList && departments.length > 0 ? '✓' : '...'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${!isLoadingDocumentData ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span>Dữ liệu văn bản {!isLoadingDocumentData ? '✓' : '...'}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                Vui lòng chờ trong giây lát...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-[1536px] mx-auto py-6 max-w-5xl px-4">
        {/* Header */}
        <div className="mb-6 p-4 rounded-lg border-l-4 bg-amber-50 border-l-amber-500 dark:bg-amber-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="icon" asChild>
                <Link href="/van-ban-di">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-300">
                  Cập nhật văn bản nội bộ
                </h1>
                <p className="text-sm mt-1 text-amber-600 dark:text-amber-400">
                  Đang chỉnh sửa văn bản: {formData.documentNumber || documentId}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                Chế độ cập nhật
              </Badge>
              <Button
                type="submit"
                form="document-form"
                disabled={isSubmitting || !isInitialDataLoaded}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : !isInitialDataLoaded ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tải dữ liệu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Cập nhật văn bản
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <form ref={formRef} id="document-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Document Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">
                    Số văn bản <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="documentNumber"
                    name="documentNumber"
                    value={formData.documentNumber}
                    onChange={handleInputChange}
                    placeholder="Nhập số văn bản"
                    required
                    className={
                      validationErrors.documentNumber ? "border-red-500" : ""
                    }
                  />
                  {validationErrors.documentNumber && (
                    <p className="text-sm text-red-500">
                      {validationErrors.documentNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sentDate">Ngày ký</Label>
                  <DatePicker
                    date={formData.signingDate}
                    setDate={handleDateChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentType">Loại văn bản</Label>
                  <SearchableSelect
                    items={(documentTypes || []).map((type): SearchableSelectItem => ({
                      value: type.name,
                      label: type.name,
                    }))}
                    value={formData.documentType}
                    onValueChange={(value) =>
                      handleSelectChange("documentType", value)
                    }
                    placeholder="Chọn loại văn bản"
                    searchPlaceholder="Tìm kiếm loại văn bản..."
                    emptyMessage="Không tìm thấy loại văn bản phù hợp"
                    loading={isLoadingDocumentTypes}
                    loadingMessage="Đang tải danh sách loại văn bản..."
                    disabled={isLoadingDocumentTypes}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Tiêu đề <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Nhập tiêu đề văn bản"
                    required
                    className={validationErrors.title ? "border-red-500" : ""}
                  />
                  {validationErrors.title && (
                    <p className="text-sm text-red-500">
                      {validationErrors.title}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Độ Khẩn</Label>
                  <Select
                    value={formData.urgencyLevel}
                    onValueChange={(value) =>
                      handleSelectChange("urgencyLevel", value)
                    }
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Chọn độ ưu tiên" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={URGENCY_LEVELS.KHAN}>Khẩn</SelectItem>
                      <SelectItem value={URGENCY_LEVELS.THUONG_KHAN}>
                        Thượng khẩn
                      </SelectItem>
                      <SelectItem value={URGENCY_LEVELS.HOA_TOC}>
                        Hỏa tốc
                      </SelectItem>
                      <SelectItem value={URGENCY_LEVELS.HOA_TOC_HEN_GIO}>
                        Hỏa tốc hẹn giờ
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid gap-6 md:grid-cols-3 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="securityLevel">Độ mật</Label>
                  <Select
                    value={formData.securityLevel}
                    onValueChange={(value) =>
                      handleSelectChange("securityLevel", value)
                    }
                  >
                    <SelectTrigger id="securityLevel">
                      <SelectValue placeholder="Chọn độ mật" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">Thường</SelectItem>
                      <SelectItem value="CONFIDENTIAL">Mật</SelectItem>
                      <SelectItem value="SECRET">Tối mật</SelectItem>
                      <SelectItem value="TOP_SECRET">Tuyệt mật</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentSignerId">Người ký duyệt</Label>
                  <Select
                    value={formData.documentSignerId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData(prev => ({ 
                        ...prev, 
                        documentSignerId: value ? parseInt(value) : undefined 
                      }))
                    }
                    disabled={isLoadingLeadershipUsers}
                  >
                    <SelectTrigger id="documentSignerId">
                      <SelectValue placeholder={
                        isLoadingLeadershipUsers 
                          ? "Đang tải danh sách lãnh đạo..." 
                          : "Chọn người ký duyệt"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(leadershipUsers) && leadershipUsers.map((leader) => (
                        <SelectItem key={leader.id} value={leader.id!.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{leader.fullName}</span>
                            <span className="text-sm text-gray-500">
                              {leader.roleDisplayNames?.join(", ") || "Lãnh đạo"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {(!Array.isArray(leadershipUsers) || leadershipUsers.length === 0) && !isLoadingLeadershipUsers && (
                        <SelectItem value="no-leaders" disabled>
                          Không có lãnh đạo trong đơn vị
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="processingDeadline">Hạn xử lý</Label>
                  <DatePicker
                    date={formData.processingDeadline}
                    setDate={handleProcessingDeadlineChange}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="issuingAgency">Cơ quan ban hành</Label>
                  <Input
                    id="issuingAgency"
                    name="issuingAgency"
                    value={formData.issuingAgency}
                    onChange={handleInputChange}
                    placeholder="Nhập cơ quan ban hành"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distributionType">Khối phân phối</Label>
                  <Select
                    value={formData.distributionType}
                    onValueChange={(value) =>
                      handleSelectChange("distributionType", value)
                    }
                  >
                    <SelectTrigger id="distributionType">
                      <SelectValue placeholder="Chọn khối phân phối" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REGULAR">Đi thường</SelectItem>
                      <SelectItem value="CONFIDENTIAL">Đi mật</SelectItem>
                      <SelectItem value="COPY_BOOK">Sổ sao</SelectItem>
                      <SelectItem value="PARTY">Đi đảng</SelectItem>
                      <SelectItem value="STEERING_COMMITTEE">Đi ban chỉ đạo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isSecureTransmission"
                      checked={formData.isSecureTransmission}
                      onCheckedChange={handleCheckboxChange("isSecureTransmission")}
                    />
                    <Label htmlFor="isSecureTransmission">Chuyển bằng điện mật</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="noPaperCopy"
                      checked={formData.noPaperCopy}
                      onCheckedChange={handleCheckboxChange("noPaperCopy")}
                    />
                    <Label htmlFor="noPaperCopy">Không gửi bản giấy</Label>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="numberOfCopies">Số bản sao</Label>
                  <Input
                    id="numberOfCopies"
                    name="numberOfCopies"
                    type="number"
                    value={formData.numberOfCopies || ""}
                    onChange={handleNumberInputChange}
                    placeholder="Nhập số bản sao"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfPages">Số trang</Label>
                  <Input
                    id="numberOfPages"
                    name="numberOfPages"
                    type="number"
                    value={formData.numberOfPages || ""}
                    onChange={handleNumberInputChange}
                    placeholder="Nhập số trang"
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content and Recipients */}
          <div className="grid gap-6 lg:grid-cols-6">
            {/* Content Card - Takes 3 columns */}
            <div className="lg:col-span-3">
              <Card className="h-full">
                <CardContent className="pt-6 h-full">
                  <div className="space-y-2 h-full flex flex-col">
                    <Label htmlFor="content">Nội dung văn bản</Label>
                    <div className="flex-1">
                      <RichTextEditor
                        content={formData.summary}
                        onChange={handleRichTextChange("summary")}
                        placeholder="Nhập nội dung văn bản"
                        minHeight="500px"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recipients Card - Takes 3 columns */}
            <Card className="h-full lg:col-span-3">
              <CardContent className="pt-6">
                {isLoadingDepartmentList || !isInitialDataLoaded ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Đang tải danh sách phòng ban...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        Danh sách phòng ban
                        <span className="text-amber-600 text-xs ml-2">
                          (Tùy chọn - có thể giữ nguyên người nhận hiện tại)
                        </span>
                      </Label>
                      <div className="border rounded-md overflow-hidden">
                        <div className="bg-primary/5 px-3 py-2 border-b">
                          <span className="text-sm font-medium">
                            Chọn người nhận
                          </span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                          <DepartmentTree
                            departments={departments}
                            expandedDepartments={new Set(expandedDepartments)}
                            toggleDepartment={toggleDepartment}
                            onSelectSecondaryDepartment={
                              handleSelectSecondaryDepartment
                            }
                            secondaryDepartments={secondaryDepartments as any}
                            departmentUsers={departmentUsers}
                            isLoadingUsers={isLoadingUsers}
                            onDepartmentExpand={fetchDepartmentUsers}
                            getLeadershipRole={showAllUsers}
                            getRoleDisplayName={getRoleDisplayName}
                            selectionMode="secondary"
                            maxHeight="300px"
                            secondaryButtonText="Chọn"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Selected Recipients Display */}
                    {secondaryDepartments.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-blue-600">
                          Đã chọn ({getUniqueRecipients().length})
                        </Label>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {getUniqueRecipients().map((recipientId: any) => {
                            const recipientInfo = getRecipientInfo(recipientId);
                            return (
                              <div
                                key={recipientId}
                                className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-md text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  {recipientInfo.type === "user" ? (
                                    <Users className="h-3 w-3 text-blue-600" />
                                  ) : (
                                    <Building className="h-3 w-3 text-blue-600" />
                                  )}
                                  <span className="text-blue-800">{recipientInfo.displayName}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
                                  onClick={() => handleSelectSecondaryDepartment(recipientId)}
                                  type="button"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm border border-blue-500 bg-white"></div>
                        <span>Người nhận</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        <span>Đơn vị lớn</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>Đơn vị nhỏ</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="note">Ghi chú</Label>
                <RichTextEditor
                  content={formData.notes}
                  onChange={handleRichTextChange("notes")}
                  placeholder="Nhập ghi chú (nếu có)"
                  minHeight="150px"
                />
              </div>
            </CardContent>
          </Card>

          {/* File Attachments Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="file">Tệp đính kèm</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  multiple
                />

                {/* File Upload Progress */}
                <FileUploadProgress
                  files={fileUpload.files}
                  uploadProgress={fileUpload.uploadProgress}
                  isUploading={fileUpload.isUploading}
                  error={fileUpload.error}
                  onRemoveFile={handleRemoveFile}
                  onCancelUpload={fileUpload.cancelUpload}
                  formatFileSize={fileUpload.formatFileSize}
                  getTotalSize={fileUpload.getTotalSize}
                  className="mt-3"
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
