// Common types used across API services

export interface Pageable {
    page: number
    size: number
    sort?: string[]
  }
  
  export interface PageResponse<T> {
    content: T[]
    totalElements: number
    totalPages: number
    size: number
    number: number
    first: boolean
    last: boolean
    empty: boolean
    numberOfElements: number
  }
  
  export interface DocumentAttachmentDTO {
    id: number
    name: string
    size: number
    type: string
    uploadDate: string
    uploadedBy: string
  }
  
  export interface DocumentCommentDTO {
    id: number
    documentId: number
    documentTitle: string
    userId: number
    userName: string
    userAvatar?: string
    content: string
    created: string
    type: string
  }
  
  export interface DocumentHistoryDTO {
    id: number
    documentId: number
    documentTitle: string
    action: string
    comments: string
    timestamp: string
    previousStatus: string
    previousStatusDisplayName: string
    newStatus: string
    newStatusDisplayName: string
    actorId: number
    actorName: string
    assignedToId?: number
    assignedToName?: string
  }
  
  export interface DocumentWorkflowDTO {
    documentId: number
    status: string
    statusDisplayName: string
    assignedToId?: number
    assignedToName?: string
    comments?: string
  }
  
  export interface ActivityLogDTO {
    id: number
    actionType: string
    actionDescription: string
    timestamp: string
    userId: number
    username: string
    documentId?: number
    documentTitle?: string
    workCaseId?: number
    workCaseTitle?: string
  }
  
  export interface PermissionDTO {
    id: number
    name: string
    description: string
    category: string
    systemPermission: boolean
  }
  
  export interface ApiError {
    status: number
    message: string
    errors?: Record<string, string[]>
    timestamp: string
    path: string
  }
  
  export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: ApiError
    message?: string
  }
  