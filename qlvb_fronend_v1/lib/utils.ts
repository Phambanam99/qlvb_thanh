import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Lấy thông tin variant và text cho Badge tương ứng với trạng thái công văn
 * @param status Mã trạng thái công văn
 * @param displayName Tên hiển thị của trạng thái (tùy chọn)
 * @returns Object chứa variant và text tương ứng cho Badge
 */
export function getStatusBadgeInfo(
  status: string,
  displayName?: string
): {
  variant: "destructive" | "default" | "success" | "secondary" | "outline";
  text: string;
} {
  // Biến đổi từ snake_case sang camelCase nếu cần
  const normalizedStatus = status.replace(/_([a-z])/g, (_, char) =>
    char.toUpperCase()
  );

  // Bảng ánh xạ từ trạng thái đến variant và hiển thị
  const statusMap: Record<
    string,
    {
      variant: "destructive" | "default" | "success" | "secondary" | "outline";
      display: string;
    }
  > = {
    // công văn đến
    draft: { variant: "outline", display: "Dự thảo" },
    registered: { variant: "outline", display: "Đã đăng ký" },
    distributed: { variant: "secondary", display: "Đã phân phối" },
    deptAssigned: { variant: "secondary", display: "Phòng đã phân công" },
    pendingApproval: { variant: "outline", display: "Chờ phê duyệt" },
    specialistProcessing: {
      variant: "secondary",
      display: "Trợ lý đang xử lý",
    },
    specialistSubmitted: {
      variant: "secondary",
      display: "Trợ lý đã trình",
    },
    leaderReviewing: {
      variant: "secondary",
      display: "Thủ trưởng đang xem xét",
    },
    leaderApproved: { variant: "success", display: "Thủ trưởng đã phê duyệt" },
    leaderCommented: {
      variant: "secondary",
      display: "Thủ trưởng đã cho ý kiến",
    },
    published: { variant: "success", display: "Đã ban hành" },
    completed: { variant: "success", display: "Hoàn thành" },
    rejected: { variant: "destructive", display: "Từ chối" },
    archived: { variant: "outline", display: "Lưu trữ" },

    // công văn đi - lowercase versions
    sent: { variant: "success", display: "Đã gửi" },
    approved: { variant: "success", display: "Đã phê duyệt" },

    // công văn đi nội bộ - uppercase versions (từ API)
    DRAFT: { variant: "outline", display: "Bản nháp" },
    SENT: { variant: "success", display: "Đã gửi" },
    APPROVED: { variant: "success", display: "Đã phê duyệt" },

    // công văn phản hồi
    pendingLeaderReview: { variant: "outline", display: "Chờ ý kiến chỉ huy" },
    departmentReviewing: {
      variant: "outline",
      display: "Chỉ huy đang xem xét",
    },
    departmentApproved: { variant: "success", display: "Chỉ huy đã phê duyệt" },
    departmentCommented: {
      variant: "secondary",
      display: "Chỉ huy đã cho ý kiến",
    },
    formatCorrection: {
      variant: "secondary",
      display: "Cần chỉnh sửa thể thức",
    },
    formatCorrected: {
      variant: "secondary",
      display: "Đã chỉnh sửa thể thức",
    },
  };

  // Lấy thông tin từ bảng ánh xạ, hoặc dùng giá trị mặc định
  const statusInfo = statusMap[normalizedStatus] || {
    variant: "outline",
    display: "Không xác định",
  };

  // Sử dụng displayName nếu được cung cấp, ngược lại dùng display từ bảng ánh xạ
  return {
    variant: statusInfo.variant,
    text: displayName || statusInfo.display,
  };
}

// Hàm kiểm tra và giải mã JWT token
export function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Hàm kiểm tra token hết hạn
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;

  try {
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return true;

    // Kiểm tra thời gian hết hạn (exp) với thời gian hiện tại
    // exp trong JWT được tính bằng giây, Date.now() là milli giây
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}
