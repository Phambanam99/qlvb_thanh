/**
 * Internal Documents Table Component
 * Displays internal documents in a clean table format
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

interface InternalDocumentsTableProps {
  documents: any[];
  onDocumentClick: (doc: any) => void;
  formatDate: (date: string | Date | null | undefined) => string;
  // Read status props - like in văn bản đi
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
  return (
    <Card className="border-primary/10 shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-accent/50">
            <TableRow>
              <TableHead className="w-16">STT</TableHead>
              <TableHead>Số văn bản</TableHead>
              <TableHead>Ngày ký</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Người gửi</TableHead>
             
              <TableHead>Trạng thái đọc</TableHead>
              <TableHead>Thao tác</TableHead>
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
                      {doc.documentNumber}
                    </TableCell>
                    <TableCell>{formatDate(doc.signingDate)}</TableCell>
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
                    <TableCell>{doc.senderName}</TableCell>

                  <TableCell>
                    {universalReadStatus && getReadStatus ? (
                      // Use Button for read status toggle like văn bản đi
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`${
                          isRead
                            ? "text-green-600 hover:text-green-700"
                            : "text-blue-600 hover:text-blue-700"
                        }`}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (onReadStatusToggle) {
                            onReadStatusToggle(doc.id);
                          }
                        }}
                      >
                        {isRead ? "Đã đọc" : "Chưa đọc"}
                      </Button>
                    ) : (
                      // Fallback to Badge for backward compatibility
                      <Badge variant={isRead ? "default" : "outline"}>
                        {isRead ? "Đã đọc" : "Chưa đọc"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDocumentClick(doc)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Chưa có văn bản nội bộ nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
