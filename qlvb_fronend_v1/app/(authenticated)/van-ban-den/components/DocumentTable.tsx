/**
 * Document table component for displaying văn bản đến
 * Reusable table with consistent styling and behavior
 */

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, Eye } from "lucide-react";
import { UrgencyBadge } from "@/components/urgency-badge";
import { DocumentStatusBadge } from "@/components/document-status-badge";
import { InternalDocument } from "@/lib/api/internalDocumentApi";
import { IncomingDocumentDTO } from "@/lib/api";
import { DocumentTab, UserPermissions } from "../types";
import { getSimplifiedStatusGroup } from "../utils/status-utils";

// Helper functions
const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return "N/A";
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
};

const truncateText = (text: string | null | undefined, maxLength: number): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

const safeGet = (obj: any, path: string, fallback: any = null): any => {
  try {
    return path.split('.').reduce((current, prop) => current?.[prop], obj) ?? fallback;
  } catch {
    return fallback;
  }
};

interface DocumentTableProps {
  documents: (InternalDocument | IncomingDocumentDTO)[];
  activeTab: DocumentTab;
  userPermissions: UserPermissions;
  isLoading: boolean;
  onDocumentClick: (document: InternalDocument | IncomingDocumentDTO) => void;
  onMarkAsRead?: (documentId: number) => void;
  readStatusMap?: Map<number, boolean>;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  activeTab,
  userPermissions,
  isLoading,
  onDocumentClick,
  onMarkAsRead,
  readStatusMap = new Map(),
}) => {
  const isInternal = activeTab === "internal";

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Đang tải dữ liệu...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Không có văn bản nào
            </h3>
            <p className="text-sm text-muted-foreground">
              {isInternal 
                ? "Chưa có văn bản nội bộ nào được gửi đến bạn"
                : "Chưa có văn bản đến nào trong hệ thống"
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper function to determine if document is unread
  const isDocumentUnread = (doc: InternalDocument | IncomingDocumentDTO): boolean => {
    if (isInternal) {
      const internalDoc = doc as InternalDocument;
      return !internalDoc.isRead && !readStatusMap.get(internalDoc.id);
    }
    return false; // External documents don't have read status yet
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">STT</TableHead>
              <TableHead>Số văn bản</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Cơ quan gửi</TableHead>
              <TableHead>Ngày nhận</TableHead>
              <TableHead>Mức độ</TableHead>
              <TableHead>Trạng thái</TableHead>
              {userPermissions.hasFullAccess && <TableHead>Phòng ban</TableHead>}
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc, index) => {
              const isUnread = isDocumentUnread(doc);
            const statusGroup = getSimplifiedStatusGroup(
              safeGet(doc, 'status', 'pending')
            );              return (
                <TableRow
                  key={doc.id}
                  className={`
                    cursor-pointer transition-colors hover:bg-muted/50
                    ${isUnread ? "bg-blue-50 border-l-4 border-l-blue-500" : ""}
                  `}
                  onClick={() => onDocumentClick(doc)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{index + 1}</span>
                      {isUnread && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">
                      {safeGet(doc, 'documentNumber', 'N/A')}
                    </div>
                    {isInternal && safeGet(doc, 'documentCode') && (
                      <div className="text-xs text-muted-foreground">
                        {safeGet(doc, 'documentCode')}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="max-w-[300px]">
                    <div className="font-medium">
                      {truncateText(safeGet(doc, 'title', 'Không có tiêu đề'), 50)}
                    </div>
                    {safeGet(doc, 'summary') && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {truncateText(safeGet(doc, 'summary'), 80)}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {isInternal 
                        ? safeGet(doc, 'senderDepartment', 'Nội bộ')
                        : safeGet(doc, 'sendingDepartmentName', 'N/A')
                      }
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {formatDate(
                        safeGet(doc, 'receivedDate') || 
                        safeGet(doc, 'createdAt') || 
                        safeGet(doc, 'createdDate')
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <UrgencyBadge 
                      level={safeGet(doc, 'urgencyLevel', 'normal') as any}
                    />
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">
                      {statusGroup.displayName}
                    </Badge>
                  </TableCell>

                  {userPermissions.hasFullAccess && (
                    <TableCell>
                      <div className="text-sm">
                        {safeGet(doc, 'departmentName') || 
                         safeGet(doc, 'assignedDepartmentName') || 
                         'N/A'}
                      </div>
                    </TableCell>
                  )}

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isInternal && isUnread && onMarkAsRead && doc.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(doc.id!);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
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
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
