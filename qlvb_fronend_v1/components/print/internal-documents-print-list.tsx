/**
 * Internal Documents Print List Component
 * Provides print functionality for internal document lists (both sent and received)
 */

"use client";

import React from "react";
import { InternalDocument } from "@/lib/api/internalDocumentApi";
import { UrgencyBadge } from "@/components/urgency-badge";
import { UrgencyLevel, migrateFromOldUrgency } from "@/lib/types/urgency";

interface InternalDocumentsPrintListProps {
  documents: InternalDocument[];
  documentType: "sent" | "received";
  organizationName?: string;
  departmentName?: string;
  printDate?: Date;
  additionalFilters?: {
    yearFilter?: number;
    monthFilter?: number;
    searchQuery?: string;
  };
}

export function InternalDocumentsPrintList({
  documents,
  documentType,
  organizationName = "Cục Hải quan Hà Nội",
  departmentName,
  printDate = new Date(),
  additionalFilters,
}: InternalDocumentsPrintListProps) {
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Chưa xác định";
      const date = new Date(dateString);
      if (isNaN(date.getTime()) || date.getFullYear() === 1970) {
        return "Chưa xác định";
      }
      return date.toLocaleDateString("vi-VN");
    } catch {
      return "Chưa xác định";
    }
  };

  const getUrgencyText = (urgencyLevel: UrgencyLevel | string | undefined) => {
    if (!urgencyLevel) return "Khẩn";

    let level: UrgencyLevel;
    if (
      typeof urgencyLevel === "string" &&
      ["NORMAL", "HIGH", "URGENT"].includes(urgencyLevel)
    ) {
      level = migrateFromOldUrgency(urgencyLevel);
    } else {
      level = urgencyLevel as UrgencyLevel;
    }

    switch (level) {
      case "KHAN":
        return "Khẩn";
      case "THUONG_KHAN":
        return "Thượng khẩn";
      case "HOA_TOC":
        return "Hỏa tốc";
      case "HOA_TOC_HEN_GIO":
        return "Hỏa tốc hẹn giờ";
      default:
        return "Khẩn";
    }
  };

  const getRecipientSummary = (recipients: InternalDocument["recipients"]) => {
    if (!recipients || recipients.length === 0) return "Chưa có người nhận";

    if (recipients.length === 1) {
      return recipients[0].userName || recipients[0].departmentName;
    }

    const names = recipients
      .slice(0, 3)
      .map((r) => r.departmentName)
      .join(", ");
    if (recipients.length > 3) {
      return `${names} và ${recipients.length - 3} khác`;
    }
    return names;
  };

  const getFilterText = () => {
    const filters = [];
    if (additionalFilters?.yearFilter) {
      filters.push(`Năm: ${additionalFilters.yearFilter}`);
    }
    if (additionalFilters?.monthFilter) {
      filters.push(`Tháng: ${additionalFilters.monthFilter}`);
    }
    if (additionalFilters?.searchQuery) {
      filters.push(`Từ khóa: "${additionalFilters.searchQuery}"`);
    }
    return filters.length > 0 ? ` (${filters.join(", ")})` : "";
  };

  return (
    <div className="print-container bg-white text-black">
      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          .print-container {
            font-family: "Times New Roman", serif;
            font-size: 12pt;
            line-height: 1.4;
            color: black !important;
            background: white !important;
          }

          .print-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }

          .print-title {
            font-size: 16pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 10px 0;
          }

          .print-subtitle {
            font-size: 14pt;
            margin: 5px 0;
          }

          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            vertical-align: top;
          }

          .print-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }

          .print-table .text-center {
            text-align: center;
          }

          .print-table .text-right {
            text-align: right;
          }

          .print-footer {
            margin-top: 30px;
            text-align: right;
            font-style: italic;
          }

          .print-summary {
            margin: 20px 0;
            font-weight: bold;
          }

          .urgency-khan {
            color: #f59e0b;
          }

          .urgency-thuong-khan {
            color: #ef4444;
          }

          .urgency-hoa-toc {
            color: #dc2626;
          }

          .urgency-hoa-toc-hen-gio {
            color: #b91c1c;
            font-weight: bold;
          }

          /* Hide screen-only elements when printing */
          .no-print {
            display: none !important;
          }

          /* Force page breaks */
          .page-break {
            page-break-before: always;
          }

          /* Prevent breaking inside rows */
          .print-table tr {
            page-break-inside: avoid;
          }
        }

        /* Screen styles for preview */
        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            background: white;
            min-height: 297mm;
          }
        }
      `}</style>

      {/* Header */}
      <div className="print-header">
        <div className="text-sm font-medium">{organizationName}</div>
        {departmentName && (
          <div className="text-sm">{departmentName}</div>
        )}
        <div className="print-title">
          Danh sách văn bản nội bộ {documentType === "sent" ? "đi" : "đến"}
          {getFilterText()}
        </div>
        <div className="print-subtitle">
          Ngày in: {formatDate(printDate.toISOString())}
        </div>
      </div>

      {/* Summary */}
      <div className="print-summary">
        Tổng số văn bản: {documents.length}
      </div>

      {/* Documents Table */}
      {documents.length > 0 ? (
        <table className="print-table">
          <thead>
            <tr>
              <th className="text-center" style={{ width: "40px" }}>
                STT
              </th>
              <th style={{ width: "120px" }}>Số văn bản</th>
              <th style={{ width: "80px" }}>Ngày ký</th>
              <th>Tiêu đề</th>
              <th style={{ width: "100px" }}>Loại văn bản</th>
              <th style={{ width: "150px" }}>
                {documentType === "sent" ? "Người nhận" : "Người gửi"}
              </th>
              <th style={{ width: "80px" }} className="text-center">
                Độ khẩn
              </th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, index) => (
              <tr key={doc.id}>
                <td className="text-center">{index + 1}</td>
                <td>{doc.documentNumber || "Chưa có số"}</td>
                <td>{formatDate(doc.signingDate)}</td>
                <td>
                  <div className="font-medium">{doc.title}</div>
                  {doc.summary && (
                    <div className="text-xs text-gray-600 mt-1">
                      {doc.summary}
                    </div>
                  )}
                </td>
                <td>{doc.documentType || "Chưa xác định"}</td>
                <td>
                  {documentType === "sent"
                    ? getRecipientSummary(doc.recipients)
                    : (doc as any).senderName || "Chưa xác định"}
                </td>
                <td className="text-center">
                  <span
                    className={`
                      ${doc.priority === "KHAN" ? "urgency-khan" : ""}
                      ${doc.priority === "THUONG_KHAN" ? "urgency-thuong-khan" : ""}
                      ${doc.priority === "HOA_TOC" ? "urgency-hoa-toc" : ""}
                      ${
                        doc.priority === "HOA_TOC_HEN_GIO"
                          ? "urgency-hoa-toc-hen-gio"
                          : ""
                      }
                    `}
                  >
                    {getUrgencyText(doc.priority)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Không có văn bản nào để hiển thị
        </div>
      )}

      {/* Footer */}
      <div className="print-footer">
        <div>Người in: {/* User name will be passed as prop */}</div>
        <div>Thời gian: {new Date().toLocaleString("vi-VN")}</div>
      </div>
    </div>
  );
}
