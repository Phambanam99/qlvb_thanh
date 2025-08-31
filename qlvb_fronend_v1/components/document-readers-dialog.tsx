"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Eye, 
  EyeOff, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  Phone,
  Mail,
  Building
} from "lucide-react";
import { 
  DocumentReaderDTO, 
  DocumentReadStatistics,
  DocumentType 
} from "@/lib/api/documentReadStatus";

interface DocumentReadersDialogProps {
  documentId: number;
  documentType: DocumentType;
  documentTitle?: string;
  onGetReaders: (documentId: number) => Promise<DocumentReaderDTO[]>;
  onGetStatistics: (documentId: number) => Promise<DocumentReadStatistics>;
  trigger?: React.ReactNode;
}

export function DocumentReadersDialog({
  documentId,
  documentType,
  documentTitle,
  onGetReaders,
  onGetStatistics,
  trigger,
}: DocumentReadersDialogProps) {
  const [readers, setReaders] = useState<DocumentReaderDTO[]>([]);
  const [statistics, setStatistics] = useState<DocumentReadStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Auto-load data when dialog opens or documentId changes
  useEffect(() => {
    if (documentId) {
      loadData();
    }
  }, [documentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Debug logging
      // console.log("DocumentReadersDialog loadData called with:", {
      //   documentId,
      //   documentType,
      //   onGetReaders: typeof onGetReaders,
      //   onGetStatistics: typeof onGetStatistics
      // });
      
      // Validate required props
      if (typeof onGetReaders !== 'function') {
        throw new Error(`onGetReaders is not a function, got: ${typeof onGetReaders}`);
      }
      
      if (typeof onGetStatistics !== 'function') {
        throw new Error(`onGetStatistics is not a function, got: ${typeof onGetStatistics}`);
      }
      
      if (!documentId) {
        throw new Error(`documentId is required, got: ${documentId}`);
      }
      
      const [readersData, statsData] = await Promise.all([
        onGetReaders(documentId),
        onGetStatistics(documentId)
      ]);
          
          // console.log("Document readers data:", readersData);
          // console.log("Document stats data:", statsData);
      
      // Handle ResponseDTO format - extract data if wrapped
      const readers = Array.isArray(readersData) 
        ? readersData 
        : (readersData as any)?.data || readersData;
        
      const statistics = (statsData as any)?.data || statsData;
      
      // console.log("Processed readers:", readers);
      // console.log("Processed statistics:", statistics);
      
      setReaders(readers);
      setStatistics(statistics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Không thể tải danh sách người đọc: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("vi-VN");
    } catch {
      return dateString;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredReaders = readers.filter(reader => {
    if (activeTab === "read") return reader.isRead;
    if (activeTab === "unread") return !reader.isRead;
    return true; // "all"
  });

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <Users className="h-4 w-4" />
      Xem người đọc
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Danh sách người đọc công văn
          </DialogTitle>
          <DialogDescription>
            {documentTitle && (
              <span className="font-medium">"{documentTitle}"</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Đang tải...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40 text-destructive">
              <XCircle className="h-8 w-8 mr-2" />
              {error}
            </div>
          ) : (
            <div className="space-y-4 h-full overflow-hidden flex flex-col">
              {/* Statistics Cards */}
              {statistics && (
                <div className="grid grid-cols-4 gap-4 flex-shrink-0">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Tổng số</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statistics.totalUsers}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Đã đọc</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{statistics.readUsers}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Chưa đọc</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">{statistics.unreadUsers}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Tỷ lệ đọc</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{statistics.readPercentage}%</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Tabs and Table */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="all">Tất cả ({readers.length})</TabsTrigger>
                    <TabsTrigger value="read">
                      Đã đọc ({readers.filter(r => r.isRead).length})
                    </TabsTrigger>
                    <TabsTrigger value="unread">
                      Chưa đọc ({readers.filter(r => !r.isRead).length})
                    </TabsTrigger>
                  </TabsList>
                  {filteredReaders.length > 10 && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Hiển thị {filteredReaders.length} người - Có thể cuộn để xem thêm
                    </div>
                  )}
                </div>

                <TabsContent value={activeTab} className="flex-1 overflow-hidden min-h-0">
                  <div className="border rounded-md h-full flex flex-col">
                    <div 
                      className="overflow-y-auto flex-1" 
                      style={{ maxHeight: 'calc(80vh - 300px)' }}
                    >
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10 border-b shadow-sm">
                          <TableRow>
                            <TableHead className="min-w-[200px]">Người dùng</TableHead>
                            <TableHead className="min-w-[150px]">Phòng ban</TableHead>
                            <TableHead className="min-w-[120px]">Chức vụ</TableHead>
                            <TableHead className="min-w-[180px]">Liên hệ</TableHead>
                            <TableHead className="min-w-[100px]">Trạng thái</TableHead>
                            <TableHead className="min-w-[150px]">Thời gian đọc</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReaders.length > 0 ? (
                            filteredReaders.map((reader) => (
                              <TableRow key={reader.userId} className="hover:bg-muted/50">
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="text-xs">
                                        {getInitials(reader.userName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <div className="font-medium truncate">{reader.userName}</div>
                                      <div className="text-sm text-muted-foreground truncate">@{reader.username}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate">{reader.departmentName || "Chưa xác định"}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="truncate">{reader.roles || "Chưa xác định"}</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {reader.email && (
                                      <div className="flex items-center gap-1 text-sm">
                                        <Mail className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{reader.email}</span>
                                      </div>
                                    )}
                                    {reader.phoneNumber && (
                                      <div className="flex items-center gap-1 text-sm">
                                        <Phone className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{reader.phoneNumber}</span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={reader.isRead ? "default" : "secondary"}
                                    className={reader.isRead ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                                  >
                                    {reader.isRead ? (
                                      <>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Đã đọc
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="h-3 w-3 mr-1" />
                                        Chưa đọc
                                      </>
                                    )}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {formatDateTime(reader.readAt)}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                <div className="text-muted-foreground">
                                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  Không có dữ liệu
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t bg-background flex-shrink-0">
          <Button onClick={loadData} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tải...
              </>
            ) : (
              "Làm mới"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
