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
  return (
    <Card className="border-primary/10 shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-accent/50">
            <TableRow>
              <TableHead className="w-16">STT</TableHead>
              <TableHead>Số văn bản</TableHead>
              <TableHead className="hidden md:table-cell">Ngày gửi</TableHead>
              <TableHead>Trích yếu</TableHead>
              <TableHead className="hidden md:table-cell">Nơi nhận</TableHead>
              <TableHead>Trạng thái đọc</TableHead>
              {hasFullAccess && (
                <TableHead className="hidden md:table-cell">Đơn vị</TableHead>
              )}
              <TableHead className="text-right">Thao tác</TableHead>
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
                    <TableCell className="font-medium">{doc.number}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {doc.sentDate}
                    </TableCell>
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
                    <TableCell className="hidden md:table-cell">
                      {doc.recipient}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`${
                          isRead
                            ? "text-green-600 hover:text-green-700"
                            : "text-blue-600 hover:text-blue-700"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          universalReadStatus.toggleReadStatus(
                            Number(doc.id),
                            "OUTGOING_EXTERNAL"
                          );
                        }}
                      >
                        {isRead ? "Đã đọc" : "Chưa đọc"}
                      </Button>
                    </TableCell>
                    {hasFullAccess && (
                      <TableCell className="hidden md:table-cell">
                        {doc.departmentName}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-primary/10 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDocumentClick(doc);
                        }}
                      >
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={hasFullAccess ? 8 : 7}
                  className="h-24 text-center"
                >
                  {documents.length === 0 && !isLoading
                    ? "Chưa có văn bản bên ngoài nào"
                    : "Không có văn bản nào phù hợp với điều kiện tìm kiếm"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
