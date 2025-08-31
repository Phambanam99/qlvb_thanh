/**
 * Custom hook for handling print functionality
 * Provides print utilities for internal documents
 */

"use client";

import { useCallback, useState } from "react";
import { InternalDocument } from "@/lib/api/internalDocumentApi";

interface UsePrintInternalDocumentsProps {
  documents: InternalDocument[];
  documentType: "sent" | "received";
  organizationName?: string;
  departmentName?: string;
  additionalFilters?: {
    yearFilter?: number;
    monthFilter?: number;
    searchQuery?: string;
  };
}

interface PrintOptions {
  includeFilters?: boolean;
  customTitle?: string;
  maxDocumentsPerPage?: number;
}

export function usePrintInternalDocuments({
  documents,
  documentType,
  organizationName,
  departmentName,
  additionalFilters,
}: UsePrintInternalDocumentsProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  // Function to trigger print
  const handlePrint = useCallback(
    async (options?: PrintOptions) => {
      try {
        setIsPrinting(true);
        setPrintError(null);

        // Check if there are documents to print
        if (!documents || documents.length === 0) {
          setPrintError("Không có văn bản nào để in");
          return;
        }

        // Create a new window for printing
        const printWindow = window.open("", "_blank", "width=800,height=600");
        
        if (!printWindow) {
          setPrintError("Không thể mở cửa sổ in. Vui lòng kiểm tra trình chặn popup.");
          return;
        }

        // Generate print content
        const printContent = generatePrintContent({
          documents,
          documentType,
          organizationName,
          departmentName,
          additionalFilters: options?.includeFilters ? additionalFilters : undefined,
          customTitle: options?.customTitle,
        });

        // Write content to print window
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 500);
        };

      } catch (error) {
        setPrintError(
          error instanceof Error
            ? error.message
            : "Có lỗi xảy ra khi in văn bản"
        );
      } finally {
        setIsPrinting(false);
      }
    },
    [documents, documentType, organizationName, departmentName, additionalFilters]
  );

  // Function to generate print-ready HTML content
  const generatePrintContent = useCallback(
    ({
      documents,
      documentType,
      organizationName = "Cục Hải quan Hà Nội",
      departmentName,
      additionalFilters,
      customTitle,
    }: {
      documents: InternalDocument[];
      documentType: "sent" | "received";
      organizationName?: string;
      departmentName?: string;
      additionalFilters?: {
        yearFilter?: number;
        monthFilter?: number;
        searchQuery?: string;
      };
      customTitle?: string;
    }) => {
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

      const getUrgencyText = (priority: string | undefined) => {
        switch (priority) {
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

      const title = customTitle || `Danh sách văn bản nội bộ ${documentType === "sent" ? "đi" : "đến"}${getFilterText()}`;

      return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @page {
            size: A4;
            margin: 2cm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: "Times New Roman", serif;
            font-size: 12pt;
            line-height: 1.4;
            color: black;
            background: white;
        }
        
        .print-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
        }
        
        .organization {
            font-size: 14pt;
            font-weight: bold;
        }
        
        .department {
            font-size: 12pt;
            margin: 5px 0;
        }
        
        .print-title {
            font-size: 16pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 15px 0 10px 0;
        }
        
        .print-date {
            font-size: 12pt;
            font-style: italic;
        }
        
        .print-summary {
            margin: 20px 0;
            font-weight: bold;
            font-size: 14pt;
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
            font-size: 11pt;
        }
        
        .print-table td {
            font-size: 10pt;
        }
        
        .text-center {
            text-align: center;
        }
        
        .text-right {
            text-align: right;
        }
        
        .print-footer {
            margin-top: 40px;
            text-align: right;
            font-style: italic;
            font-size: 11pt;
        }
        
        .urgency-khan {
            color: #f59e0b;
            font-weight: bold;
        }
        
        .urgency-thuong-khan {
            color: #ef4444;
            font-weight: bold;
        }
        
        .urgency-hoa-toc {
            color: #dc2626;
            font-weight: bold;
        }
        
        .urgency-hoa-toc-hen-gio {
            color: #b91c1c;
            font-weight: bold;
        }
        
        .document-summary {
            font-size: 9pt;
            color: #666;
            margin-top: 2px;
        }
        
        .no-documents {
            text-align: center;
            padding: 40px;
            font-style: italic;
            color: #666;
        }
        
        /* Prevent breaking inside rows */
        tr {
            page-break-inside: avoid;
        }
        
        /* Ensure table headers repeat on new pages */
        thead {
            display: table-header-group;
        }
    </style>
</head>
<body>
    <div class="print-header">
        <div class="organization">${organizationName}</div>
        ${departmentName ? `<div class="department">${departmentName}</div>` : ""}
        <div class="print-title">${title}</div>
        <div class="print-date">Ngày in: ${formatDate(new Date().toISOString())}</div>
    </div>
    
    <div class="print-summary">
        Tổng số văn bản: ${documents.length}
    </div>
    
    ${documents.length > 0 ? `
    <table class="print-table">
        <thead>
            <tr>
                <th style="width: 40px;">STT</th>
                <th style="width: 120px;">Số văn bản</th>
                <th style="width: 80px;">Ngày ký</th>
                <th>Tiêu đề</th>
                <th style="width: 100px;">Loại văn bản</th>
                <th style="width: 150px;">${documentType === "sent" ? "Người nhận" : "Người gửi"}</th>
                <th style="width: 80px;" class="text-center">Độ khẩn</th>
            </tr>
        </thead>
        <tbody>
            ${documents.map((doc, index) => `
                <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>${doc.documentNumber || "Chưa có số"}</td>
                    <td>${formatDate(doc.signingDate)}</td>
                    <td>
                        <div style="font-weight: bold;">${doc.title}</div>
                        ${doc.summary ? `<div class="document-summary">${doc.summary}</div>` : ""}
                    </td>
                    <td>${doc.documentType || "Chưa xác định"}</td>
                    <td>
                        ${documentType === "sent"
                          ? getRecipientSummary(doc.recipients)
                          : (doc as any).senderName || "Chưa xác định"}
                    </td>
                    <td class="text-center">
                        <span class="urgency-${doc.priority?.toLowerCase() || "khan"}">
                            ${getUrgencyText(doc.priority)}
                        </span>
                    </td>
                </tr>
            `).join("")}
        </tbody>
    </table>
    ` : `
    <div class="no-documents">
        Không có văn bản nào để hiển thị
    </div>
    `}
    
    <div class="print-footer">
        <div>Thời gian in: ${new Date().toLocaleString("vi-VN")}</div>
    </div>
</body>
</html>
      `;
    },
    []
  );

  // Function to print preview (show in current window)
  const handlePrintPreview = useCallback(() => {
    if (!documents || documents.length === 0) {
      setPrintError("Không có văn bản nào để xem trước");
      return;
    }

    // Implement print preview logic if needed
    // This could open a modal or navigate to a print preview page
  }, [documents]);

  return {
    handlePrint,
    handlePrintPreview,
    isPrinting,
    printError,
    clearPrintError: () => setPrintError(null),
    canPrint: documents && documents.length > 0,
  };
}
