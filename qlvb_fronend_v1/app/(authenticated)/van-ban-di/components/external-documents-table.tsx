"use client";

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

// Interface for external documents (original format)
interface OutgoingDocument {
  id: number | string;
  number: string;
  title: string;
  sentDate: string;
  recipient: string;
  status: string;
  departmentId?: number;
  departmentName?: string;
}

interface ExternalDocumentsTableProps {
  documents: OutgoingDocument[];
  isLoading: boolean;
  hasFullAccess: boolean;
  universalReadStatus: any;
  onDocumentClick: (doc: OutgoingDocument) => void;
}

export function ExternalDocumentsTable({
  documents,
  isLoading,
  hasFullAccess,
  universalReadStatus,
  onDocumentClick,
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
                const isRead = universalReadStatus.getReadStatus(
                  Number(doc.id),
                  "OUTGOING_EXTERNAL"
                );
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
                    <TableCell className="font-medium">{doc.number || doc.documentNumber || "-"}</TableCell>
                    <TableCell>{doc.sentDate}</TableCell>
                    <TableCell>{doc.type || doc.documentType || "-"}</TableCell>
                    <TableCell>{doc.departmentName || doc.recipient || "-"}</TableCell>
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
                    ? "Chưa có công văn bên ngoài nào"
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
