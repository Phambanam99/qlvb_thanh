/**
 * Ví dụ sử dụng hệ thống độ khẩn thống nhất
 * Usage examples for the unified urgency system
 */

import React from "react";
import { UrgencyBadge, UrgencyIndicator } from "@/components/urgency-badge";
import {
  UrgencySelect,
  CompactUrgencySelect,
  useUrgencySelect,
} from "@/components/urgency-select";
import {
  UrgencyLevel,
  URGENCY_LEVELS,
  getUrgencyLabel,
  getUrgencyPriority,
  sortByUrgency,
  isHighUrgency,
  migrateFromOldUrgency,
} from "@/lib/types/urgency";

// ============ VÍ DỤ 1: SỬ DỤNG TRONG COMPONENT ============

export function DocumentListExample() {
  const documents = [
    { id: 1, title: "Văn bản A", urgencyLevel: URGENCY_LEVELS.KHAN },
    { id: 2, title: "Văn bản B", urgencyLevel: URGENCY_LEVELS.HOA_TOC_HEN_GIO },
    { id: 3, title: "Văn bản C", urgencyLevel: URGENCY_LEVELS.THUONG_KHAN },
  ];

  // Sắp xếp theo độ ưu tiên
  const sortedDocuments = sortByUrgency(documents);

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">
        Danh sách văn bản (đã sắp xếp theo độ khẩn)
      </h3>
      {sortedDocuments.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 p-3 border rounded"
        >
          <span className="flex-1">{doc.title}</span>
          <UrgencyBadge level={doc.urgencyLevel} size="sm" />
          <UrgencyIndicator level={doc.urgencyLevel} />
        </div>
      ))}
    </div>
  );
}

// ============ VÍ DỤ 2: SỬ DỤNG TRONG FORM ============

export function DocumentFormExample() {
  const { urgencyLevel, setUrgencyLevel, isHighPriority } = useUrgencySelect();

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Form tạo văn bản</h3>

      <UrgencySelect
        value={urgencyLevel}
        onValueChange={setUrgencyLevel}
        label="Độ khẩn"
        description="Chọn mức độ khẩn cấp của văn bản"
        required
      />

      {isHighPriority && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-800 text-sm">
            ⚠️ Văn bản có độ khẩn cao! Vui lòng xem xét thời hạn xử lý.
          </p>
        </div>
      )}

      <div className="text-sm text-gray-600">
        Độ khẩn đã chọn: <UrgencyBadge level={urgencyLevel} size="sm" />
      </div>
    </div>
  );
}

// ============ VÍ DỤ 3: SỬ DỤNG TRONG BẢNG ============

export function DocumentTableExample() {
  const documents = [
    {
      id: 1,
      number: "CV-001",
      title: "Thông báo họp khẩn",
      urgencyLevel: URGENCY_LEVELS.KHAN,
    },
    {
      id: 2,
      number: "CV-002",
      title: "Báo cáo tình hình",
      urgencyLevel: URGENCY_LEVELS.HOA_TOC,
    },
    {
      id: 3,
      number: "CV-003",
      title: "Chỉ thị nóng",
      urgencyLevel: URGENCY_LEVELS.HOA_TOC_HEN_GIO,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Bảng văn bản với độ khẩn</h3>
      <table className="w-full border border-gray-200 rounded">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left">Số văn bản</th>
            <th className="p-3 text-left">Tiêu đề</th>
            <th className="p-3 text-left">Độ khẩn</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-t">
              <td className="p-3 font-mono">{doc.number}</td>
              <td className="p-3">
                {doc.title}
                <UrgencyIndicator level={doc.urgencyLevel} />
              </td>
              <td className="p-3">
                <UrgencyBadge level={doc.urgencyLevel} size="sm" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============ VÍ DỤ 4: MIGRATION TỪ HỆ THỐNG CŨ ============

export function MigrationExample() {
  // Dữ liệu cũ từ API/database
  const oldDocuments = [
    { id: 1, title: "Doc 1", priority: "URGENT" },
    { id: 2, title: "Doc 2", priority: "HIGH" },
    { id: 3, title: "Doc 3", priority: "NORMAL" },
  ];

  // Chuyển đổi sang hệ thống mới
  const migratedDocuments = oldDocuments.map((doc) => ({
    ...doc,
    urgencyLevel: migrateFromOldUrgency(doc.priority),
  }));

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Migration từ hệ thống cũ</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Hệ thống cũ:</h4>
          {oldDocuments.map((doc) => (
            <div key={doc.id} className="p-2 border rounded mb-2">
              <span>
                {doc.title} - Priority: {doc.priority}
              </span>
            </div>
          ))}
        </div>

        <div>
          <h4 className="font-medium mb-2">Hệ thống mới:</h4>
          {migratedDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-2 p-2 border rounded mb-2"
            >
              <span>{doc.title}</span>
              <UrgencyBadge level={doc.urgencyLevel} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ VÍ DỤ 5: SỬ DỤNG TRONG FILTER ============

export function UrgencyFilterExample() {
  const [selectedUrgency, setSelectedUrgency] = React.useState<
    UrgencyLevel | undefined
  >();

  const allDocuments = [
    { id: 1, title: "Văn bản 1", urgencyLevel: URGENCY_LEVELS.KHAN },
    { id: 2, title: "Văn bản 2", urgencyLevel: URGENCY_LEVELS.THUONG_KHAN },
    { id: 3, title: "Văn bản 3", urgencyLevel: URGENCY_LEVELS.HOA_TOC },
    { id: 4, title: "Văn bản 4", urgencyLevel: URGENCY_LEVELS.HOA_TOC_HEN_GIO },
  ];

  const filteredDocuments = selectedUrgency
    ? allDocuments.filter((doc) => doc.urgencyLevel === selectedUrgency)
    : allDocuments;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Lọc theo độ khẩn</h3>

      <div className="flex gap-4 items-end">
        <CompactUrgencySelect
          value={selectedUrgency}
          onValueChange={setSelectedUrgency}
        />
        <button
          onClick={() => setSelectedUrgency(undefined)}
          className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
        >
          Xóa bộ lọc
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Hiển thị {filteredDocuments.length} / {allDocuments.length} văn bản
        </p>
        {filteredDocuments.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 border rounded"
          >
            <span>{doc.title}</span>
            <UrgencyBadge level={doc.urgencyLevel} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ VÍ DỤ 6: THỐNG KÊ THEO ĐỘ KHẨN ============

export function UrgencyStatsExample() {
  const documents = [
    { urgencyLevel: URGENCY_LEVELS.KHAN },
    { urgencyLevel: URGENCY_LEVELS.KHAN },
    { urgencyLevel: URGENCY_LEVELS.THUONG_KHAN },
    { urgencyLevel: URGENCY_LEVELS.HOA_TOC },
    { urgencyLevel: URGENCY_LEVELS.HOA_TOC_HEN_GIO },
    { urgencyLevel: URGENCY_LEVELS.HOA_TOC_HEN_GIO },
    { urgencyLevel: URGENCY_LEVELS.HOA_TOC_HEN_GIO },
  ];

  const stats = Object.values(URGENCY_LEVELS)
    .map((level) => {
      const count = documents.filter(
        (doc) => doc.urgencyLevel === level
      ).length;
      return {
        level,
        label: getUrgencyLabel(level),
        count,
        priority: getUrgencyPriority(level),
        isHigh: isHighUrgency(level),
      };
    })
    .sort((a, b) => b.priority - a.priority);

  const totalHigh = stats
    .filter((s) => s.isHigh)
    .reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Thống kê văn bản theo độ khẩn</h3>

      <div className="bg-red-50 border border-red-200 rounded-md p-3">
        <p className="text-red-800 font-medium">
          🚨 Có {totalHigh} văn bản độ khẩn cao cần xử lý ưu tiên
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.level}
            className={`p-3 border rounded ${
              stat.isHigh ? "bg-red-50 border-red-200" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <UrgencyBadge level={stat.level} size="sm" />
              <span className="text-lg font-bold">{stat.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Export tất cả examples
export const UrgencySystemExamples = {
  DocumentListExample,
  DocumentFormExample,
  DocumentTableExample,
  MigrationExample,
  UrgencyFilterExample,
  UrgencyStatsExample,
};
