"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { SchedulePagination } from "./schedule-pagination";
import { ScheduleDTO } from "@/lib/api";

interface ScheduleTableProps {
  schedules: ScheduleDTO[];
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (schedule: ScheduleDTO) => void;
  onDelete?: (schedule: ScheduleDTO) => void;
  onApprove?: (schedule: ScheduleDTO) => void;
  onReject?: (schedule: ScheduleDTO) => void;
}

export function ScheduleTable({
  schedules,
  isLoading,
  currentPage,
  pageSize,
  totalElements,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}: ScheduleTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "chua_dien_ra":
      case "draft":
      case "pending":
      case "submitted":
      case "rejected":
        return <Badge variant="secondary">Chưa diễn ra</Badge>;
      case "dang_thuc_hien":
      case "approved":
        return <Badge variant="default">Đang thực hiện</Badge>;
      case "da_thuc_hien":
      case "completed":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            Đã thực hiện
          </Badge>
        );
      default:
        return <Badge variant="outline">Không xác định</Badge>;
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "week":
        return "Tuần";
      case "month":
        return "Tháng";
      case "quarter":
        return "Quý";
      case "year":
        return "Năm";
      default:
        return period;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">STT</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Phòng ban</TableHead>
                <TableHead>Kỳ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người tạo</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">STT</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Phòng ban</TableHead>
                <TableHead>Kỳ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người tạo</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-muted-foreground">Không có dữ liệu</p>
                    <Button size="sm" asChild>
                      <Link href="/lich-cong-tac/tao-moi">
                        Tạo lịch công tác mới
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">STT</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead>Kỳ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Người tạo</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule, index) => (
              <TableRow key={schedule.id}>
                <TableCell className="font-medium">
                  {currentPage * pageSize + index + 1}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Link
                      href={`/lich-cong-tac/${schedule.id}`}
                      className="font-medium hover:underline"
                    >
                      {schedule.title}
                    </Link>
                    {schedule.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {schedule.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{schedule.departmentName}</TableCell>
                <TableCell>{getPeriodLabel(schedule.period)}</TableCell>
                <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                <TableCell>{schedule.createdByName}</TableCell>
                <TableCell>{formatDate(schedule.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Mở menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/lich-cong-tac/${schedule.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Xem chi tiết
                        </Link>
                      </DropdownMenuItem>
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(schedule)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                      )}
                      {schedule.status === "pending" && onApprove && (
                        <DropdownMenuItem onClick={() => onApprove(schedule)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Phê duyệt
                        </DropdownMenuItem>
                      )}
                      {schedule.status === "pending" && onReject && (
                        <DropdownMenuItem onClick={() => onReject(schedule)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Từ chối
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(schedule)}
                          className="text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Xóa
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SchedulePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
