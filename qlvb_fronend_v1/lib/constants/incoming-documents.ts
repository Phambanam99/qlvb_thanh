// Role có quyền xem toàn bộ văn bản
export const FULL_ACCESS_ROLES = [
  "ROLE_ADMIN",
  "ROLE_VAN_THU",
  "ROLE_CUC_TRUONG",
  "ROLE_CUC_PHO",
  "ROLE_CHINH_UY",
  "ROLE_PHO_CHINH_UY",
] as const;

// Items per page for pagination
export const ITEMS_PER_PAGE = 10;

// Define the simplified status groups with comprehensive status mapping
export const SIMPLIFIED_STATUS_GROUPS = {
  pending: {
    code: "pending",
    displayName: "Đang xử lý",
    statuses: [
      // Original status codes
      "distributed",
      "dept_assigned",
      "specialist_processing",
      "specialist_submitted",
      "leader_reviewing",
      "department_reviewing",
      // Additional common status codes
      "pending",
      "processing",
      "reviewing",
      "assigned",
      // Uppercase variants
      "DISTRIBUTED",
      "DEPT_ASSIGNED",
      "SPECIALIST_PROCESSING",
      "SPECIALIST_SUBMITTED",
      "LEADER_REVIEWING",
      "DEPARTMENT_REVIEWING",
      "PENDING",
      "PROCESSING",
      "REVIEWING",
      "ASSIGNED",
    ],
  },
  completed: {
    code: "completed",
    displayName: "Đã hoàn thành",
    statuses: [
      // Original status codes
      "completed",
      "approved",
      "finished",
      "done",
      "closed",
      // Additional common status codes
      "resolved",
      "finalized",
      // Uppercase variants
      "COMPLETED",
      "APPROVED",
      "FINISHED",
      "DONE",
      "CLOSED",
      "RESOLVED",
      "FINALIZED",
    ],
  },
  not_processed: {
    code: "not_processed",
    displayName: "Chưa xử lý",
    statuses: [
      // Original status codes
      "draft",
      "registered",
      "pending_approval",
      // Additional common status codes
      "new",
      "created",
      "received",
      "unprocessed",
      "waiting",
      // Uppercase variants
      "DRAFT",
      "REGISTERED",
      "PENDING_APPROVAL",
      "NEW",
      "CREATED",
      "RECEIVED",
      "UNPROCESSED",
      "WAITING",
    ],
  },
} as const;

// Simplified status tabs - compatible with SIMPLIFIED_STATUS_GROUPS
export const SIMPLE_STATUS_TABS = {
  not_processed: {
    code: "not_processed",
    displayName: "Chưa xử lý",
    description: "Văn bản chưa được xử lý",
  },
  pending: {
    code: "pending",
    displayName: "Đang xử lý",
    description: "Văn bản đang được xử lý",
  },
  completed: {
    code: "completed",
    displayName: "Đã hoàn thành",
    description: "Văn bản đã hoàn thành xử lý",
  },
} as const;

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 0;
