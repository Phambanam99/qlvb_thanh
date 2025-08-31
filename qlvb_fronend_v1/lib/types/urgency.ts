/**
 * Unified Urgency Level Types and Utilities
 * Hệ thống độ khẩn thống nhất cho toàn bộ ứng dụng
 */

// Định nghĩa các mức độ khẩn thống nhất
export const URGENCY_LEVELS = {
  KHAN: "KHAN",
  THUONG_KHAN: "THUONG_KHAN",
  HOA_TOC: "HOA_TOC",
  HOA_TOC_HEN_GIO: "HOA_TOC_HEN_GIO",
} as const;

export type UrgencyLevel = keyof typeof URGENCY_LEVELS;

// Thông tin hiển thị cho từng mức độ khẩn
export const URGENCY_CONFIG = {
  [URGENCY_LEVELS.KHAN]: {
    label: "Khẩn",
    description: "Văn bản khẩn cấp",
    badgeVariant: "secondary" as const,
    color: "#f59e0b", // amber-500
    priority: 2,
    icon: "⚡",
  },
  [URGENCY_LEVELS.THUONG_KHAN]: {
    label: "Thượng khẩn",
    description: "Văn bản thượng khẩn",
    badgeVariant: "destructive" as const,
    color: "#ef4444", // red-500
    priority: 3,
    icon: "🔥",
  },
  [URGENCY_LEVELS.HOA_TOC]: {
    label: "Hỏa tốc",
    description: "Văn bản hỏa tốc",
    badgeVariant: "destructive" as const,
    color: "#dc2626", // red-600
    priority: 4,
    icon: "⚡🔥",
  },
  [URGENCY_LEVELS.HOA_TOC_HEN_GIO]: {
    label: "Hỏa tốc hẹn giờ",
    description: "Văn bản hỏa tốc có thời hạn cụ thể",
    badgeVariant: "destructive" as const,
    color: "#b91c1c", // red-700
    priority: 5,
    icon: "⚡🔥⏰",
  },
} as const;

// Mức độ mặc định (không khẩn)
export const DEFAULT_URGENCY: UrgencyLevel = URGENCY_LEVELS.KHAN;

// Utility functions
export const getUrgencyConfig = (level: UrgencyLevel) => {
  return URGENCY_CONFIG[level];
};

export const getUrgencyLabel = (level: UrgencyLevel): string => {
  return URGENCY_CONFIG[level]?.label || "Không xác định";
};

export const getUrgencyDescription = (level: UrgencyLevel): string => {
  return URGENCY_CONFIG[level]?.description || "";
};

export const getUrgencyBadgeVariant = (level: UrgencyLevel) => {
  return URGENCY_CONFIG[level]?.badgeVariant || "outline";
};

export const getUrgencyColor = (level: UrgencyLevel): string => {
  return URGENCY_CONFIG[level]?.color || "#6b7280";
};

export const getUrgencyPriority = (level: UrgencyLevel): number => {
  return URGENCY_CONFIG[level]?.priority || 1;
};

export const getUrgencyIcon = (level: UrgencyLevel): string => {
  return URGENCY_CONFIG[level]?.icon || "";
};

// Sắp xếp theo độ ưu tiên (cao nhất trước)
export const sortByUrgency = <T extends { urgencyLevel: UrgencyLevel }>(
  items: T[]
): T[] => {
  return [...items].sort((a, b) => {
    const priorityA = getUrgencyPriority(a.urgencyLevel);
    const priorityB = getUrgencyPriority(b.urgencyLevel);
    return priorityB - priorityA; // Descending order
  });
};

// Kiểm tra có phải mức độ khẩn cao không
export const isHighUrgency = (level: UrgencyLevel): boolean => {
  return getUrgencyPriority(level) >= 4; // HOA_TOC trở lên
};

export const isCriticalUrgency = (level: UrgencyLevel): boolean => {
  return level === URGENCY_LEVELS.HOA_TOC_HEN_GIO;
};

// Migration helpers - để chuyển đổi từ hệ thống cũ
export const migrateFromOldUrgency = (oldLevel: string): UrgencyLevel => {
  const normalized = oldLevel.toUpperCase();

  switch (normalized) {
    case "URGENT":
      return URGENCY_LEVELS.KHAN;
    case "HIGH":
      return URGENCY_LEVELS.THUONG_KHAN;
    case "CRITICAL":
      return URGENCY_LEVELS.HOA_TOC;
    case "EMERGENCY":
      return URGENCY_LEVELS.HOA_TOC_HEN_GIO;
    default:
      return URGENCY_LEVELS.KHAN;
  }
};

// Tạo options cho Select components
export const getUrgencyOptions = () => {
  return Object.values(URGENCY_LEVELS).map((level) => ({
    value: level,
    label: getUrgencyLabel(level),
    description: getUrgencyDescription(level),
    icon: getUrgencyIcon(level),
    priority: getUrgencyPriority(level),
  }));
};

// Validate urgency level
export const isValidUrgencyLevel = (level: string): level is UrgencyLevel => {
  return Object.values(URGENCY_LEVELS).includes(level as UrgencyLevel);
};

// Default export for convenience
export default {
  URGENCY_LEVELS,
  URGENCY_CONFIG,
  DEFAULT_URGENCY,
  getUrgencyConfig,
  getUrgencyLabel,
  getUrgencyDescription,
  getUrgencyBadgeVariant,
  getUrgencyColor,
  getUrgencyPriority,
  getUrgencyIcon,
  sortByUrgency,
  isHighUrgency,
  isCriticalUrgency,
  migrateFromOldUrgency,
  getUrgencyOptions,
  isValidUrgencyLevel,
};
