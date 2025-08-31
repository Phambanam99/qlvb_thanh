/**
 * External Documents Table Component
 * Displays external documents with status tabs and read status
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DocumentStatusBadge } from "@/components/document-status-badge";

interface ExternalDocumentsTableProps {
  documents: any[];
  allDocuments?: any[]; // For calculating correct counts
  processingStatusTab: string;
  onProcessingStatusTabChange: (tab: string) => void;
  onDocumentClick: (doc: any) => void;
  onReadStatusToggle: (docId: number) => void;
  getReadStatus: (docId: number) => boolean;
  getDocumentCountByStatus: (statusKey: string) => number;
  formatDate: (date: string | Date | null | undefined) => string;
}

const SIMPLE_STATUS_TABS = {
  not_processed: { code: "not_processed", displayName: "Chưa xử lý" },
  pending: { code: "pending", displayName: "Đang xử lý" },
  completed: { code: "completed", displayName: "Đã hoàn thành" },
};

export function ExternalDocumentsTable({
  documents,
  allDocuments,
  processingStatusTab,
  onProcessingStatusTabChange,
  onDocumentClick,
  onReadStatusToggle,
  getReadStatus,
  getDocumentCountByStatus,
  formatDate,
}: ExternalDocumentsTableProps) {
  const mapSecurityLevel = (level: string | undefined | null): string => {
    if (!level) return "-";
    const v = String(level).toUpperCase();
    if (v === "NORMAL") return "Thường";
    if (v === "CONFIDENTIAL") return "Mật";
    if (v === "SECRET") return "Tối mật";
    if (v === "TOP_SECRET" || v === "TOP-SECRET") return "Tuyệt mật";
    return level;
  };
  // Calculate count from allDocuments (unfiltered) for accurate tab counts
  const getStatusCount = (statusKey: string): number => {
    const documentsToCount = allDocuments || documents;
    if (statusKey === "all") return documentsToCount.length;

    return documentsToCount.filter((doc: any) => {
      const status = doc.trackingStatus?.toUpperCase() || "";
      const docTabCode =
        status === "PROCESSED"
          ? "completed"
          : status === "NOT_PROCESSED" || status === ""
          ? "not_processed"
          : "pending";
      return docTabCode === statusKey;
    }).length;
  };

  return (
    <Card className="border-primary/10 shadow-sm">
      {/* Status Tabs */}
      <div className="px-4 py-2 border-b bg-gray-50/50">
        <div className="flex gap-2">
          {Object.entries(SIMPLE_STATUS_TABS).map(([key, status]) => {
            const count = getStatusCount(key);
            const isActive = processingStatusTab === key;
            return (
              <button
                key={key}
                onClick={() => onProcessingStatusTabChange(key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {status.displayName} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-accent/50">
            <TableRow>
              <TableHead className="w-16">Stt</TableHead>
              <TableHead>Số cv</TableHead>
              <TableHead>Ngày cv</TableHead>
              <TableHead>Loại cv</TableHead>
              <TableHead>Cơ quan ban hành</TableHead>
              <TableHead>Trích yếu</TableHead>
              <TableHead>Người gửi</TableHead>
              <TableHead>Độ mật</TableHead>
              <TableHead>Số trang</TableHead>
              <TableHead>Tệp đính kèm</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents && documents.length > 0 ? (
              documents.map((doc: any, index: number) => {
                const isRead = getReadStatus(doc.id!);
                const documentNumber = doc.documentNumber || doc.number || "-";
                const dateValue = doc.receivedDate || doc.signingDate || doc.sentDate || null;
                const documentType = doc.documentType || doc.type || "-";
                const issuingAuthority = doc.issuingAuthority || doc.sendingDepartmentName || doc.departmentName || "-";
                const securityLevel = mapSecurityLevel(doc.securityLevel);
                const pageCount = doc.numberOfPages || doc.pages || doc.pageCount || "-";
                const attachmentsCount = (doc.attachments?.length ?? doc.attachmentCount ?? 0) as number;
                return (
                  <TableRow
                    key={doc.id}
                    className={`hover:bg-accent/30 cursor-pointer ${
                      !isRead
                        ? "bg-blue-50/50 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                    onClick={() => onDocumentClick(doc)}
                  >
                    <TableCell className="text-center text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{documentNumber}</TableCell>
                    <TableCell>{formatDate(dateValue)}</TableCell>
                    <TableCell>{documentType}</TableCell>
                    <TableCell>{issuingAuthority}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      <div className="flex items-center gap-2">
                        {!isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                        <span className={!isRead ? "font-semibold" : ""}>
                          {doc.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{doc.senderName || "-"}</TableCell>
                    <TableCell>{securityLevel}</TableCell>
                    <TableCell>{pageCount}</TableCell>
                    <TableCell>{attachmentsCount}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  Không có công văn nào phù hợp với điều kiện tìm kiếm
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
