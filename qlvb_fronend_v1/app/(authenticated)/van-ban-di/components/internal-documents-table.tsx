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
import { UrgencyBadge } from "@/components/urgency-badge";
import { UrgencyLevel, migrateFromOldUrgency } from "@/lib/types/urgency";
import { InternalDocument } from "@/lib/api/internalDocumentApi";
import { Edit, Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  const getUrgencyBadge = (urgencyLevel: UrgencyLevel | string) => {
    // For migration compatibility, handle old priority values
    let level: UrgencyLevel;
    if (
      typeof urgencyLevel === "string" &&
      ["NORMAL", "HIGH", "URGENT"].includes(urgencyLevel)
    ) {
      level = migrateFromOldUrgency(urgencyLevel);
    } else {
      level = urgencyLevel as UrgencyLevel;
    }

    return <UrgencyBadge level={level} size="sm" />;
  };

  const getRecipientSummary = (recipients: InternalDocument["recipients"]) => {
    if (!recipients || recipients.length === 0) return "Chưa có người nhận";

    if (recipients.length === 1) {
      return recipients[0].userName || recipients[0].departmentName;
    }

    return `${recipients[0].departmentName} và ${recipients.length - 1} khác`;
  };

  return (
    <Card className="border-primary/10 shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-accent/50">
            <TableRow>
              <TableHead className="w-16">STT</TableHead>
              <TableHead>Số văn bản</TableHead>
              <TableHead className="hidden md:table-cell">Ngày ký</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead className="hidden lg:table-cell">Loại</TableHead>
              <TableHead className="hidden md:table-cell">Người nhận</TableHead>
              <TableHead>Độ khẩn</TableHead>
              <TableHead>Trạng thái đọc</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length > 0 ? (
              documents.map((doc, index) => {
                const isRead = universalReadStatus.getReadStatus(
                  doc.id,
                  "OUTGOING_INTERNAL"
                );
                return (
                  <TableRow
                    key={doc.id}
                    className={`hover:bg-accent/30 cursor-pointer ${
                      !isRead
                        ? "bg-blue-50/50 border-l-4 border-l-blue-500 text-red-600"
                        : "text-black"
                    }`}
                    onClick={() => onDocumentClick(doc)}
                  >
                    <TableCell className="text-center text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {doc.documentNumber}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(doc.signingDate)}
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
                    <TableCell className="hidden lg:table-cell">
                      {doc.documentType}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getRecipientSummary(doc.recipients)}
                    </TableCell>
                    <TableCell>{getUrgencyBadge(doc.priority || "NORMAL")}</TableCell>
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
                            doc.id,
                            "OUTGOING_INTERNAL"
                          );
                        }}
                      >
                        {isRead ? "Đã đọc" : "Chưa đọc"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-blue-50 hover:text-blue-600 h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Navigate to edit page with document number
                                  window.location.href = `/van-ban-di/cap-nhat/noi-bo/${doc.id}`;
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Chỉnh sửa</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-primary/10 hover:text-primary h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDocumentClick(doc);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Chi tiết</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  {documents.length === 0 && !isLoading
                    ? "Chưa có văn bản nội bộ nào"
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
