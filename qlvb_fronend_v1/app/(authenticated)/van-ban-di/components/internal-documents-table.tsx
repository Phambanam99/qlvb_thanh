"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InternalDocument } from "@/lib/api/internalDocumentApi";

interface InternalDocumentsTableProps {
  documents: InternalDocument[];
  isLoading: boolean;
  universalReadStatus: any;
  onDocumentClick: (doc: InternalDocument) => void;
}

export function InternalDocumentsTable({
  documents,
  isLoading,
  universalReadStatus,
  onDocumentClick,
}: InternalDocumentsTableProps) {
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Chưa xác định";

      const date = new Date(dateString);

      // Check if date is valid and not the epoch (1970-01-01)
      if (isNaN(date.getTime()) || date.getFullYear() === 1970) {
        return "Chưa xác định";
      }

      return date.toLocaleDateString("vi-VN");
    } catch {
      return "Chưa xác định";
    }
  };

  // touch the prop to avoid unused warnings if lint rules are strict
  const _hasUniversal = !!universalReadStatus;

  const mapSecurityLevel = (level: string | undefined | null): string => {
    if (!level) return "-";
    const v = String(level).toUpperCase();
    if (v === "NORMAL") return "Thường";
    if (v === "CONFIDENTIAL") return "Mật";
    if (v === "SECRET") return "Tối mật";
    if (v === "TOP_SECRET" || v === "TOP-SECRET") return "Tuyệt mật";
    return level;
  };

  return (
    <Card className="border-primary/10 shadow-sm">
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
            {documents.length > 0 ? (
              documents.map((doc, index) => {
                const isRead = _hasUniversal
                  ? universalReadStatus.getReadStatus(doc.id, "OUTGOING_INTERNAL")
                  : false;
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
                    <TableCell className="font-medium">{doc.documentNumber || doc.number || "-"}</TableCell>
                    <TableCell>{formatDate(doc.signingDate || doc.sentDate)}</TableCell>
                    <TableCell>{doc.documentType || doc.type || "-"}</TableCell>
                    <TableCell>{doc.issuingAuthority || doc.departmentName || "-"}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      <div className="flex items-center gap-2">
                        {!isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                        <span className={!isRead ? "font-semibold" : ""}>{doc.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{doc.senderName || doc.creatorName || doc.signerName || "-"}</TableCell>
                    <TableCell>{mapSecurityLevel(doc.securityLevel)}</TableCell>
                    <TableCell>{doc.numberOfPages || doc.pages || doc.pageCount || "-"}</TableCell>
                    <TableCell>{(doc.attachments && doc.attachments.length) || doc.attachmentCount || 0}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  {documents.length === 0 && !isLoading
                    ? "Chưa có công văn nội bộ nào"
                    : "Không có công văn nào phù hợp với điều kiện tìm kiếm"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
