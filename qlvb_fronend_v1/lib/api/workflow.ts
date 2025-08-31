import api from "./config";
import type { DocumentWorkflowDTO, DocumentHistoryDTO, ResponseDTO } from "./types";

export const workflowAPI = {
  /**
   * Get document status
   * @param documentId Document ID
   * @returns Document workflow status
   */
  getDocumentStatus: async (
    documentId: number | string
  ): Promise<DocumentWorkflowDTO> => {
    const response = await api.get(`/workflow/${documentId}/status`);
    // console.log("response getDocumentStatus", response.data);
    return response.data;
  },
  /**
   * Get document workflow details
   * @param documentId Document ID
   * @returns Document workflow details
   */
  leaderStartReviewing: async (
    documentId: number | string,
    comment: string
  ) => {
    const response = await api.put(
      `/workflow/${documentId}/start-reviewing`,
      comment
    );
    return response.data;
  },
  registerIncomingDocument: async (
    documentId: number | string,
    workflowData: DocumentWorkflowDTO
  ) => {
    const response = await api.put(
      `/workflow/${documentId}/register`,
      workflowData
    );
    return response.status;
  },
  /**
   * Change document status
   * @param documentId Document ID
   * @param workflowData Workflow data
   * @returns Updated workflow status
   */
  changeDocumentStatus: async (
    documentId: number | string,
    workflowData: DocumentWorkflowDTO
  ) => {
    const response = await api.put(
      `/workflow/${documentId}/status`,
      workflowData
    );
    return response.data;
  },

  /**
   * Assign document to specialist
   * @param documentId Document ID
   * @param workflowData Workflow data with assignedToId
   * @returns Updated workflow status
   */
  assignToSpecialist: async (
    documentId: number | string,
    workflowData: DocumentWorkflowDTO & { departmentId?: number | string }
  ) => {
    // First check if the current department has any child departments
    try {
      if (workflowData.departmentId) {
        const childDepartments = await workflowAPI.getChildDepartments(
          workflowData.departmentId
        );

        // If there are child departments, we should distribute to them instead
        if (Array.isArray(childDepartments) && childDepartments.length > 0) {
          throw new Error(
            "Đơn vị này có đơn vị con. Vui lòng phân phối văn bản cho đơn vị con trước."
          );
        }
      }

      // If no child departments, proceed with the assignment
      const response = await api.post(
        `/workflow/${documentId}/assign-specialist`,
        workflowData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Start processing document
   * @param documentId Document ID
   * @param workflowData Workflow data
   * @returns Updated workflow status
   */
  startProcessingDocument: async (
    documentId: number | string,
    workflowData: DocumentWorkflowDTO
  ) => {
    const response = await api.put(
      `/workflow/${documentId}/start-processing`,
      workflowData
    );
    return response.data;
  },

  /**
   * Submit document to leadership
   * @param documentId Document ID
   * @param workflowData Workflow data
   * @returns Updated workflow status
   */
  submitToLeadership: async (
    documentId: number | string,
    workflowData: DocumentWorkflowDTO
  ) => {
    const response = await api.put(
      `/workflow/${documentId}/submit`,
      workflowData
    );
    return response.data;
  },

  /**
   * Forward document to leadership
   * @param documentId Document ID
   * @param workflowData Workflow data
   * @returns Updated workflow status
   */
  forwardToLeadership: async (
    documentId: number | string,
    workflowData: DocumentWorkflowDTO
  ) => {
    const response = await api.put(
      `/workflow/${documentId}/forward-to-leadership`,
      workflowData
    );
    return response.data;
  },

  /**
   * Approve document
   * @param documentId Document ID
   * @param workflowData Workflow data
   * @returns Updated workflow status
   */
  approveDocument: async (
    documentId: number | string,
    workflowData: DocumentWorkflowDTO
  ) => {
    // Sử dụng FormData thay vì gửi JSON trực tiếp
    const formData = new FormData();

    // Thêm dữ liệu workflow vào FormData
    formData.append(
      "data",
      new Blob([JSON.stringify(workflowData)], { type: "application/json" })
    );

    const response = await api.put(
      `/workflow/${documentId}/approve`,
      formData,
      {
        headers: {
          "Content-Type": undefined, // Để browser tự động xác định boundary cho multipart/form-data
        },
      }
    );
    return response.data;
  },

  /**
   * Provide feedback on document
   * @param documentId Document ID
   * @param workflowData Workflow data with comments
   * @returns Updated workflow status
   */
  provideDocumentFeedback: async (
    documentId: number | string,
    workflowData: DocumentWorkflowDTO
  ) => {
    const response = await api.put(
      `/workflow/${documentId}/provide-feedback`,
      workflowData
    );
    return response.data;
  },

  /**
   * Get document history
   * @param documentId Document ID
   * @returns Document history entries
   */
  getDocumentHistory: async (
    documentId: number | string
  ): Promise<ResponseDTO<DocumentHistoryDTO[]>> => {
    const response = await api.get(`/workflow/${documentId}/history`);
    return response.data;
  },

  /**
   * Distribute document to departments
   * @param documentId Document ID
   * @param distributionData Distribution details
   * @returns Success message
   */
  distributeDocument: async (
    documentId: number | string,
    distributionData: any
  ) => {
    const response = await api.put(
      `/workflow/${documentId}/distribute`,
      distributionData
    );
    return response.data;
  },
  createFullDocument: async (data: any, files: File[]) => {
    const formData = new FormData();

    // Append each file individually
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append("attachments", file);
      });
    }

    formData.append(
      "data",
      new Blob([JSON.stringify(data)], { type: "application/json" })
    );

    const response = await api.post(
      "/workflow/full-multi-attachments",
      formData,
      {
        headers: {
          "Content-Type": undefined, // Để Axios tự động xử lý với FormData
        },
      }
    );
    return response.data;
  },
  createOugoingAlone: async (data: any, files: File[] | null) => {
    const formData = new FormData();
   
      // Append each file individually
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append("attachments", file);
        });
      }
    formData.append(
      "data",
      new Blob([JSON.stringify(data)], { type: "application/json" })
    );

    const response = await api.post("/workflow/standalone-outgoing", formData, {
      headers: {
        "Content-Type": undefined, // Để Axios tự động xử lý với FormData
      },
    });
    return response.data;
  },
  /**
   * Tạo văn bản đi trả lời cho văn bản đến
   * @param incomingDocId ID của văn bản đến cần trả lời
   * @param documentData Dữ liệu văn bản và workflow
   * @param attachment Tệp đính kèm (nếu có)
   * @returns Kết quả tạo văn bản đi và thông tin liên quan
   */
  createResponseDocument: async (
    documentData: any,
    incomingDocId: number | string,
    attachment?: File | null
  ) => {
    const formData = new FormData();

    // Thêm dữ liệu văn bản đi và workflow
    formData.append(
      "data",
      new Blob([JSON.stringify(documentData)], { type: "application/json" })
    );

    // Thêm tệp đính kèm nếu có
    if (attachment) {
      formData.append("attachments", attachment);
    }

    const response = await api.post(
      `/workflow/incoming/${incomingDocId}/reply`,
      formData,
      {
        headers: {
          "Content-Type": undefined,
        },
      }
    );

    return response.data;
  },
  updateOutgoingDocumentWorkflow: async (
    documentId: number | string,
    documentData: any,
    attachment?: File | null
  ) => {
    const formData = new FormData();
    formData.append(
      "data",
      new Blob([JSON.stringify(documentData)], { type: "application/json" })
    );
    // Thêm tệp đính kèm nếu có
    if (attachment) {
      formData.append("attachments", attachment);
    }
    const response = await api.put(
      `/workflow/${documentId}/update-outgoing`,
      formData,
      {
        headers: {
          "Content-Type": undefined,
        },
      }
    );
    return response.data;
  },
  /**
   * Lấy danh sách văn bản liên quan
   * @param documentId ID văn bản cần lấy danh sách liên quan
   * @returns Danh sách văn bản liên quan
   */
  getDocumentResponses: async (documentId: string) => {
    const response = await api.get(`/documents/outgoing/related`, {
      params: { relatedDocuments: documentId },
    });
    // console.log("response getDocumentResponses", response.data);
    return response.data;
  },

  /**
   * Chấp nhận văn bản phản hồi
   * @param responseId ID văn bản phản hồi cần chấp nhận
   * @param data Dữ liệu bổ sung (nếu có)
   * @returns Kết quả xử lý
   */
  approveDocumentResponse: async (
    responseId: number,
    data: { comment?: string }
  ) => {
    const response = await api.put(`/workflow/${responseId}/approve`, {
      responseId,
      status: "leader_approved",
      ...data,
    });
    return response.data;
  },

  /**
   * Từ chối văn bản phản hồi
   * @param responseId ID văn bản phản hồi cần từ chối
   * @param data Dữ liệu bổ sung (lý do từ chối)
   * @returns Kết quả xử lý
   */
  // rejectDocumentResponse: async (responseId: number, comment: string ) => {
  //   const response = await api.put(`/workflow/${responseId}/provide-feedback`, {
  //     comments:comment
  //   });
  //   return response.data;
  // },
  headerDeparmentApprove: async (responseId: number, comment: string) => {
    const response = await api.put(
      `/workflow/${responseId}/header-department-approve`,
      {
        comments: comment,
      }
    );
    return response.data;
  },
  headerDepartmentComment: async (
    responseId: number,
    comments: string,
    file?: File | null
  ) => {
    const formData = new FormData();
    formData.append(
      "comments",
      new Blob([JSON.stringify(comments)], { type: "application/json" })
    );
    // Thêm tệp đính kèm nếu có
    if (file) {
      formData.append("file", file);
    }
    // console.log("formData", formData);

    const response = await api.put(
      `/workflow/${responseId}/header-feedback-with-attachment`,
      formData,
      {
        headers: {
          "Content-Type": undefined,
        },
      }
    );
    return response.data;
  },
  rejectDocumentResponse: async (
    responseId: number,
    comments: string,
    file?: File | null
  ) => {
    // console.log("comments", comments);
    const formData = new FormData();
    formData.append(
      "comments",
      new Blob([JSON.stringify(comments)], { type: "application/json" })
    );
    // Thêm tệp đính kèm nếu có
    if (file) {
      formData.append("file", file);
    }
    // console.log("formData", formData);

    const response = await api.put(
      `/workflow/${responseId}/provide-feedback-with-attachment`,
      formData,
      {
        headers: {
          "Content-Type": undefined,
        },
      }
    );
    return response.data;
  },

  /**
   * Văn thư trả lại văn bản cho trợ lý để chỉnh sửa theo thể thức yêu cầu của thủ trưởng
   * @param responseId ID văn bản phản hồi cần trả lại
   * @param comments Lý do, yêu cầu chỉnh sửa
   * @param file File đính kèm (nếu có)
   * @returns Kết quả xử lý
   */
  returnDocumentToSpecialist: async (
    responseId: number,
    documentWorkFlow: DocumentWorkflowDTO
  ) => {
    const response = await api.put(
      `/workflow/${responseId}/format-correction`,
      documentWorkFlow
    );
    return response.data;
  },
  getChildDepartments: async (departmentId: number | string) => {
    const response = await api.get(
      `/workflow/departments/${departmentId}/children`
    );
    return response.data;
  },

  /**
   * Get the parent department of a department
   * @param departmentId Department ID to get parent for
   * @returns Parent department data or null if no parent exists
   */
  getParentDepartment: async (departmentId: number | string) => {
    try {
      const response = await api.get(`/departments/${departmentId}/parent`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Forward document to parent department for approval
   * @param documentId Document ID
   * @param responseId Response ID (if reviewing a response)
   * @param parentDepartmentId Parent department ID to forward to
   * @param workflowData Workflow data with comments and status
   * @returns Updated workflow status
   */
  forwardToParentDepartment: async (
    documentId: number | string,
    responseId: number | null,
    parentDepartmentId: number | string,
    workflowData: DocumentWorkflowDTO & { targetDepartmentId?: number | string }
  ) => {
    // If it's a response document, we use a different endpoint
    if (responseId) {
      const response = await api.put(
        `/workflow/${responseId}/forward-to-parent-department`,
        {
          ...workflowData,
          targetDepartmentId: parentDepartmentId,
        }
      );
      return response.data;
    } else {
      const response = await api.put(
        `/workflow/${documentId}/forward-to-parent-department`,
        {
          ...workflowData,
          targetDepartmentId: parentDepartmentId,
        }
      );
      return response.data;
    }
  },

  /**
   * Tạo văn bản đi nội bộ mới
   * @param documentData Dữ liệu văn bản và danh sách người nhận
   * @param attachment Tệp đính kèm (nếu có)
   * @returns Kết quả tạo văn bản đi nội bộ
   */
  createInternalOutgoingDocument: async (
    documentData: any,
    attachment?: File | null
  ) => {
    const formData = new FormData();

    // Thêm dữ liệu văn bản
    formData.append(
      "data",
      new Blob([JSON.stringify(documentData)], { type: "application/json" })
    );

    // Thêm tệp đính kèm nếu có
    if (attachment) {
      formData.append("attachments", attachment);
    }

    const response = await api.post("/workflow/internal-outgoing", formData, {
      headers: {
        "Content-Type": undefined,
      },
    });

    return response.data;
  },

  /**
   * Tạo văn bản trả lời nội bộ cho văn bản đến
   * @param documentData Dữ liệu văn bản và danh sách người nhận
   * @param attachment Tệp đính kèm (nếu có)
   * @returns Kết quả tạo văn bản trả lời nội bộ
   */
  createInternalResponseDocument: async (
    documentData: any,
    attachment?: File | null
  ) => {
    const formData = new FormData();

    // Thêm dữ liệu văn bản
    formData.append(
      "data",
      new Blob([JSON.stringify(documentData)], { type: "application/json" })
    );

    // Thêm tệp đính kèm nếu có
    if (attachment) {
      formData.append("attachments", attachment);
    }

    const response = await api.post("/workflow/internal-reply", formData, {
      headers: {
        "Content-Type": undefined,
      },
    });

    return response.data;
  },
};
