"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Building,
  X,
  Send,
  FileText,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { departmentsAPI, incomingDocumentsAPI, workflowAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth-context";
import { hasRoleInGroup } from "@/lib/role-utils";

export default function AssignDocumentPage() {
  const params = useParams();
  const documentId = Number(params.id);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [_document, setDocument] = useState<any>(null);
  const [departmentList, setDepartmentList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingDepartmentList, setIsLoadingDepartmentList] = useState(true);
  const [primaryDepartment, setPrimaryDepartment] = useState<number | null>(
    null
  );
  const [secondaryDepartments, setSecondaryDepartments] = useState<number[]>(
    []
  );
  const [notes, setNotes] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isParentDepartmentHead, setIsParentDepartmentHead] = useState(false);

  // Fetch document details
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setIsLoading(true);
        const response_ = await incomingDocumentsAPI.getIncomingDocumentById(
          documentId
        );
        const response = response_.data;
        setDocument(response.data);
      } catch (error) {
        setError("Không thể tải thông tin văn bản");
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin văn bản",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, toast]);

  // Check if user is department head and fetch child departments
  useEffect(() => {
    const checkUserDepartment = async () => {
      if (!user?.id || !user?.departmentId) return;

      // Check if user has a department head role
      const isDepartmentHead = hasRoleInGroup(user.roles || [], [
        "ROLE_TRUONG_PHONG",
        "ROLE_PHO_PHONG",
        "ROLE_TRUONG_BAN",
        "ROLE_CUM_TRUONG",
        "ROLE_CUC_TRUONG",
        "ROLE_CUC_PHO",
        "ROLE_PHO_CHINH_UY",
        "ROLE_PHO_CHINH_UY",
        "ROLE_PHO_CUM_TRUONG",
        "ROLE_CHINH_TRI_VIEN_CUM",
      ]);

      if (isDepartmentHead) {
        try {
          // Get child departments
          const childDepts_ = await workflowAPI.getChildDepartments(
            user.departmentId
          );
          const childDepts = childDepts_.data;
          if (Array.isArray(childDepts) && childDepts.length > 0) {
            setIsParentDepartmentHead(true);
            setDepartmentList(childDepts);
          } else {
            // No child departments, fetch all departments
            const response_ = await departmentsAPI.getAllDepartments();
            const response = response_.data;
            setDepartmentList(response.content || []);
          }
        } catch (error) {
          // Fallback to all departments
          const response_ = await departmentsAPI.getAllDepartments();
          const response = response_.data;
          setDepartmentList(response.content || []);
        }
      } else {
        // User is not a department head, show all departments
        const response_ = await departmentsAPI.getAllDepartments();
        const response = response_.data;
        setDepartmentList(response.content || []);
      }

      setIsLoadingDepartmentList(false);
    };

    checkUserDepartment();
  }, [user, toast]);

  const handleSelectPrimaryDepartment = (deptId: number) => {
    setPrimaryDepartment((prevId) => (prevId === deptId ? null : deptId));

    if (secondaryDepartments.includes(deptId)) {
      setSecondaryDepartments((prev) => prev.filter((id) => id !== deptId));
    }
  };

  const handleSelectSecondaryDepartment = (deptId: number) => {
    if (deptId === primaryDepartment) return;

    setSecondaryDepartments((prev) => {
      if (prev.includes(deptId)) {
        return prev.filter((id) => id !== deptId);
      } else {
        return [...prev, deptId];
      }
    });
  };

  const handleRemovePrimaryDepartment = () => {
    setPrimaryDepartment(null);
  };

  const handleRemoveSecondaryDepartment = (deptId: number) => {
    setSecondaryDepartments((prev) => prev.filter((id) => id !== deptId));
  };

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return "Không xác định";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  // Get urgency level badge
  const getUrgencyBadge = (level: string) => {
    switch (level?.toLowerCase()) {
      case "urgent":
      case "very_urgent":
      case "express":
        return <Badge variant="destructive">Khẩn</Badge>;
      case "high":
        return <Badge variant="destructive">Cao</Badge>;
      case "normal":
        return <Badge variant="outline">Thường</Badge>;
      case "low":
        return <Badge variant="secondary">Thấp</Badge>;
      default:
        return <Badge variant="outline">Thường</Badge>;
    }
  };

  // Get document type display name
  const getDocumentTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      OFFICIAL_LETTER: "Công văn",
      DECISION: "Quyết định",
      DECREE: "Nghị định",
      DIRECTIVE: "Chỉ thị",
      PLAN: "Kế hoạch",
      REPORT: "Báo cáo",
      ANNOUNCEMENT: "Thông báo",
      PROPOSAL: "Tờ trình",
      INTERNAL_DOCUMENT: "Văn bản nội bộ",
      CONTRACT: "Hợp đồng",
      MEETING_MINUTES: "Biên bản họp",
      OTHER: "Khác",
    };
    return typeMap[type] || type;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!primaryDepartment) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn phòng ban xử lý chính",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare deadline date
      let deadlineDate = null;
      if (deadline) {
        deadlineDate = new Date(deadline).toISOString();
      }

      // Call API to assign document
      await workflowAPI.distributeDocument(documentId, {
        primaryDepartmentId: primaryDepartment,
        collaboratingDepartmentIds: secondaryDepartments,
        comments: notes,
        closureDeadline: deadlineDate,
      });

      toast({
        title: "Thành công",
        description: "Văn bản đã được chuyển xử lý thành công",
      });

      router.push(`/van-ban-den/${documentId}`);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể chuyển xử lý văn bản",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/van-ban-den/${documentId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Chuyển xử lý văn bản
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-7">
          <Card className="md:col-span-4">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle>
                <Skeleton className="h-6 w-48" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-4">
                {Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !document) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/van-ban-den/${documentId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Chuyển xử lý văn bản
          </h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>
            {error || "Không thể tải thông tin văn bản. Vui lòng thử lại sau."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/van-ban-den/${documentId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Chuyển xử lý văn bản
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="submit"
            form="assign-form"
            disabled={isSubmitting || !primaryDepartment}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              "Đang xử lý..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Chuyển xử lý
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
          <Card>
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle>Thông tin văn bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Số văn bản
                  </p>
                  <p className="font-medium">
                    {_document.documentNumber || "Chưa có số"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Số tham chiếu
                  </p>
                  <p className="font-medium">
                    {_document.referenceNumber || "Không có"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Ngày ban hành
                  </p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p>{formatDate(_document.signingDate)}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Ngày nhận
                  </p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p>{formatDate(_document.receivedDate)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Trích yếu
                </p>
                <p className="font-medium">{_document.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Đơn vị gửi
                  </p>
                  <p>{_document.issuingAuthority}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Loại văn bản
                  </p>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p>{getDocumentTypeName(_document.documentType)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Độ khẩn
                  </p>
                  <div>{getUrgencyBadge(_document.urgencyLevel)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Độ mật
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      _document.securityLevel !== "NORMAL"
                        ? "bg-red-50 text-red-700"
                        : ""
                    }
                  >
                    {_document.securityLevel === "NORMAL"
                      ? "Thường"
                      : _document.securityLevel === "CONFIDENTIAL"
                      ? "Mật"
                      : _document.securityLevel === "SECRET"
                      ? "Tối mật"
                      : _document.securityLevel === "TOP_SECRET"
                      ? "Tuyệt mật"
                      : _document.securityLevel}
                  </Badge>
                </div>
              </div>

              {_document.summary && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Tóm tắt nội dung
                  </p>
                  <p className="text-sm bg-accent/30 p-3 rounded-md">
                    {_document.summary}
                  </p>
                </div>
              )}

              {_document.attachmentFilename && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Tệp đính kèm
                  </p>
                  <div className="flex items-center space-x-2 rounded-md border border-primary/10 p-2 bg-accent/30">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      {_document.attachmentFilename.split("/").pop()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <form id="assign-form" onSubmit={handleSubmit}>
            <Card className="bg-card">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle>Chuyển xử lý</CardTitle>
                <CardDescription>
                  {isParentDepartmentHead
                    ? "Chọn đơn vị con để xử lý văn bản"
                    : "Chọn phòng ban xử lý văn bản"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                  {/* Primary department selection section */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-red-500 font-medium">
                        {isParentDepartmentHead
                          ? "Đơn vị con xử lý chính"
                          : "Phòng ban xử lý chính"}
                      </Label>
                      {primaryDepartment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-red-500"
                          onClick={handleRemovePrimaryDepartment}
                        >
                          Bỏ chọn
                        </Button>
                      )}
                    </div>
                    {/* Hiển thị phòng ban chính */}
                    <div className="min-h-[60px] p-2 border rounded-md bg-accent/50 mt-2">
                      {!primaryDepartment ? (
                        <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                          {isParentDepartmentHead
                            ? "Chưa chọn đơn vị con xử lý chính"
                            : "Chưa chọn phòng ban xử lý chính"}
                        </div>
                      ) : (
                        (() => {
                          const dept = departmentList.find(
                            (d) => d.id === primaryDepartment
                          );
                          if (!dept)
                            return (
                              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                                Không tìm thấy thông tin phòng ban
                              </div>
                            );

                          return (
                            <Badge
                              key={dept.id}
                              variant="outline"
                              className="pl-2 pr-1 py-1.5 flex items-center gap-1 border-red-500 bg-red-50 text-red-700"
                            >
                              <span>{dept.name}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 rounded-full text-red-700 hover:bg-red-100"
                                onClick={handleRemovePrimaryDepartment}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          );
                        })()
                      )}
                    </div>
                  </div>

                  {/* Secondary department selection section */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-blue-600 font-medium">
                        {isParentDepartmentHead
                          ? `Đơn vị con phối hợp (${secondaryDepartments.length})`
                          : `Phòng ban phối hợp (${secondaryDepartments.length})`}
                      </Label>
                      {secondaryDepartments.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-blue-600"
                          onClick={() => setSecondaryDepartments([])}
                        >
                          Bỏ chọn tất cả
                        </Button>
                      )}
                    </div>

                    {/* Hiển thị phòng ban phối hợp */}
                    <div className="flex flex-wrap gap-2 min-h-[60px] p-2 border rounded-md bg-accent/50 mt-2">
                      {secondaryDepartments.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                          {isParentDepartmentHead
                            ? "Chưa chọn đơn vị con phối hợp"
                            : "Chưa chọn phòng ban phối hợp"}
                        </div>
                      ) : (
                        secondaryDepartments.map((deptId) => {
                          const dept = departmentList.find(
                            (d) => d.id === deptId
                          );
                          if (!dept) return null;

                          return (
                            <Badge
                              key={deptId}
                              variant="outline"
                              className="pl-2 pr-1 py-1.5 flex items-center gap-1 border-blue-500 bg-blue-50 text-blue-700"
                            >
                              <span>{dept.name}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 rounded-full text-blue-700 hover:bg-blue-100"
                                onClick={() =>
                                  handleRemoveSecondaryDepartment(deptId)
                                }
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      {isParentDepartmentHead
                        ? "Danh sách đơn vị con"
                        : "Danh sách phòng ban"}
                    </Label>
                    <div className="border rounded-md overflow-hidden">
                      <div className="bg-primary/5 px-4 py-2 border-b flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {isParentDepartmentHead
                            ? "Chọn đơn vị con xử lý văn bản"
                            : "Chọn phòng ban xử lý văn bản"}
                        </span>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {isLoadingDepartmentList ? (
                          <div
                            key="loading"
                            className="flex items-center justify-center p-4"
                          >
                            <p>Đang tải danh sách phòng ban...</p>
                          </div>
                        ) : departmentList.length === 0 ? (
                          <div
                            key="empty"
                            className="flex items-center justify-center p-4"
                          >
                            <p>
                              {isParentDepartmentHead
                                ? "Không có đơn vị con nào"
                                : "Không có phòng ban nào"}
                            </p>
                          </div>
                        ) : (
                          departmentList.map((dept) => {
                            const deptId = dept.id;
                            const isPrimary = primaryDepartment === deptId;
                            const isSecondary =
                              secondaryDepartments.includes(deptId);

                            return (
                              <div
                                key={dept.id || `dept-${dept.name}`}
                                className={`flex items-center justify-between px-4 py-3 border-b last:border-b-0 hover:bg-accent/50 ${
                                  isPrimary
                                    ? "bg-red-50"
                                    : isSecondary
                                    ? "bg-blue-50"
                                    : ""
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5">
                                    <Checkbox
                                      id={`primary-${dept.id}`}
                                      checked={isPrimary}
                                      onCheckedChange={() =>
                                        handleSelectPrimaryDepartment(deptId)
                                      }
                                      className="border-red-500 text-red-500 focus-visible:ring-red-300"
                                    />
                                    <Checkbox
                                      id={`secondary-${dept.id}`}
                                      checked={isSecondary}
                                      onCheckedChange={() =>
                                        handleSelectSecondaryDepartment(deptId)
                                      }
                                      className="border-blue-500 text-blue-500 focus-visible:ring-blue-300"
                                      disabled={isPrimary}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                                      <Building className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {dept.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {dept.group || "Phòng ban"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-accent"
                                  >
                                    {dept.userCount || 0} thành viên
                                  </Badge>
                                  <div className="flex gap-1">
                                    {isPrimary && (
                                      <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-sm">
                                        Chính
                                      </span>
                                    )}
                                    {isSecondary && (
                                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-sm">
                                        Phối hợp
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm border border-red-500 bg-white"></div>
                        <span>Xử lý chính</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm border border-blue-500 bg-white"></div>
                        <span>Phối hợp</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Ghi chú</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Nhập ghi chú cho phòng ban xử lý (nếu có)"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline">Thời hạn xử lý</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="deadline"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                      />
                      {deadline && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(deadline).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>


                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
