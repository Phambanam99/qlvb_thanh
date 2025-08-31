export const SIGNATURE_MESSAGES = {
  SUCCESS: {
    CREATED: "Chữ ký đã được tạo thành công",
    DELETED: "Chữ ký đã được xóa thành công",
    SIGNED: "Tài liệu đã được ký và tải xuống thành công",
  },
  ERROR: {
    FETCH_FAILED: "Không thể lấy danh sách chữ ký",
    FETCH_SIGNATURES_FAILED: "Không thể tải danh sách chữ ký",
    CREATE_FAILED: "Tạo chữ ký thất bại",
    DELETE_FAILED: "Xóa chữ ký thất bại",
    MISSING_INFO: "Vui lòng chọn file ảnh và nhập mật khẩu",
    MISSING_PASSWORD: "Vui lòng nhập mật khẩu để xóa",
    MISSING_PDF_OR_SIGNATURE: "Vui lòng tải file PDF và đặt chữ ký",
    SIGNING_FAILED: "Không thể ký tài liệu",
    INVALID_PASSWORD: "Mật khẩu không đúng cho chữ ký",
    SIGNING_CANCELLED: "Quá trình ký bị hủy do thiếu mật khẩu",
  },
  VALIDATION: {
    FILE_TYPES: "Chỉ chấp nhận file .png hoặc .jpg",
  },
  CONFIRMATION: {
    DELETE_TITLE: "Xác nhận xóa chữ ký?",
    DELETE_DESCRIPTION:
      "Để xóa chữ ký này, vui lòng nhập mật khẩu của nó. Hành động này không thể được hoàn tác.",
  },
  PLACEHOLDERS: {
    PASSWORD: "••••••••",
    SET_PASSWORD: "Đặt mật khẩu cho chữ ký",
  },
} as const;

export const SIGNATURE_CONFIG = {
  ACCEPTED_IMAGE_TYPES: "image/png,image/jpeg",
  ACCEPTED_PDF_TYPE: "application/pdf",
  DEFAULT_SIGNATURE_SIZE: {
    width: 150,
    height: 75,
  },
  API_ENDPOINTS: {
    UPLOADS_PATH: "/api/uploads/signatures",
  },
} as const;

export const UI_TEXT = {
  TITLES: {
    DIGITAL_SIGNATURE: "Chữ ký số",
    SIGNATURE_MANAGEMENT: "Quản lý chữ ký số",
    DOCUMENT_SIGNING: "Ký tài liệu PDF",
  },
  DESCRIPTIONS: {
    MAIN: "Quản lý và sử dụng chữ ký số để ký các tài liệu PDF",
    MANAGEMENT: "Thêm, xem, hoặc xóa chữ ký số của bạn.",
    SIGNING:
      "Tải lên tài liệu PDF, kéo và thả chữ ký của bạn vào vị trí mong muốn, sau đó ký.",
  },
  SECTIONS: {
    YOUR_SIGNATURES: "Chữ ký của bạn",
    CREATE_NEW: "Tạo chữ ký mới",
    UPLOAD_PDF: "1. Tải lên PDF",
    DRAG_SIGNATURES: "2. Kéo chữ ký của bạn",
    SIGN_DOWNLOAD: "3. Ký và tải xuống",
  },
  EMPTY_STATES: {
    NO_SIGNATURES: "Bạn chưa có chữ ký nào.",
    NO_SIGNATURES_SHORT: "Không có chữ ký nào",
  },
  BUTTONS: {
    CREATE_SIGNATURE: "Tạo chữ ký",
    SIGN_DOCUMENT: "Ký tài liệu",
    DELETE: "Xóa",
    CANCEL: "Hủy",
  },
  LABELS: {
    SIGNATURE_IMAGE: "Ảnh chữ ký",
    PROTECT_PASSWORD: "Mật khẩu bảo vệ",
    SIGNATURE_PASSWORD: "Mật khẩu chữ ký",
    PAGE_COUNT: "Số trang",
  },
  TABS: {
    MANAGEMENT: "Quản lý chữ ký",
    SIGNING: "Ký tài liệu",
  },
} as const;
