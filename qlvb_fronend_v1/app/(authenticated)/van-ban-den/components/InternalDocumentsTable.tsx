/**
 * Internal Documents Table Component
 * Displays internal documents in a clean table format
 */

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InternalDocumentsTableProps {
  documents: any[];
  onDocumentClick: (doc: any) => void;
  formatDate: (date: string | Date | null | undefined) => string;
  // Read status props - like in công văn đi
  universalReadStatus?: any;
  onReadStatusToggle?: (docId: number) => void;
  getReadStatus?: (docId: number) => boolean;
}

export function InternalDocumentsTable({
  documents,
  onDocumentClick,
  formatDate,
  universalReadStatus,
  onReadStatusToggle,
  getReadStatus,
}: InternalDocumentsTableProps) {
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
            {documents && documents.length > 0 ? (
              documents.map((doc: any, index: number) => {
                console.log("Document:", doc);
                // FIX: Use backend data as primary source, frontend state for real-time updates
                const frontendStatus = getReadStatus ? getReadStatus(doc.id) : undefined;
                const isRead = frontendStatus !== undefined ? frontendStatus : doc.isRead;
                  
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
                    <TableCell className="font-medium">
                      {doc.documentNumber || doc.number || "-"}
                    </TableCell>
                    <TableCell>{formatDate(doc.signingDate || doc.receivedDate || doc.sentDate)}</TableCell>
                    <TableCell>{doc.documentType || doc.type || "-"}</TableCell>
                    <TableCell>{doc.issuingAgency || doc.sendingDepartmentName || doc.departmentName || "-"}</TableCell>
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
                <TableCell colSpan={6} className="h-24 text-center">
                  Chưa có công văn nội bộ nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
