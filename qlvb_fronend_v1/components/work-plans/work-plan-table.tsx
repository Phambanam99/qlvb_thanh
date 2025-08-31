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
  Play,
} from "lucide-react";
import Link from "next/link";
import { WorkPlanPaginationNew } from "./work-plan-pagination-new";
import type { WorkPlanDTO, WorkPlanTaskDTO } from "@/lib/api/workPlans";

interface WorkPlanTableProps {
  workPlans: WorkPlanDTO[];
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onStart?: (workPlan: WorkPlanDTO) => void;
  onComplete?: (workPlan: WorkPlanDTO) => void;
}

export function WorkPlanTable({
  workPlans,
  isLoading,
  currentPage,
  pageSize,
  totalElements,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onStart,
  onComplete,
}: WorkPlanTableProps) {
  // Helper function to calculate overall progress from tasks
  const calculateOverallProgress = (tasks: WorkPlanTaskDTO[] | undefined) => {
    if (!tasks || tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / tasks.length);
  };

  // Helper function to map status to simplified status based on both status and actual progress
  const getSimplifiedStatus = (workPlan: WorkPlanDTO) => {
    const progress = calculateOverallProgress(workPlan.tasks);
    
    // If progress is 100%, it should be "completed" regardless of backend status
    if (progress >= 100) {
      return "da_thuc_hien";
    }
    
    // If progress > 0, it should be "in progress" regardless of backend status (unless completed)
    if (progress > 0 && progress < 100) {
      return "dang_thuc_hien";
    }

    // Otherwise, use the backend status for classification
    const status = workPlan.status;
    if (["draft", "pending", "approved", "rejected", "chua_dien_ra"].includes(status)) {
      return "chua_dien_ra";
    } else if (["in_progress", "dang_thuc_hien"].includes(status)) {
      return "dang_thuc_hien";
    } else if (["completed", "da_thuc_hien"].includes(status)) {
      return "da_thuc_hien";
    }
    return "chua_dien_ra"; // default
  };

  const getStatusBadge = (workPlan: WorkPlanDTO) => {
    const progress = calculateOverallProgress(workPlan.tasks);
    const simplifiedStatus = getSimplifiedStatus(workPlan);

    switch (simplifiedStatus) {
      case "chua_dien_ra":
        return <Badge variant="secondary">Chưa diễn ra</Badge>;
      case "dang_thuc_hien":
        return <Badge variant="default">Đang thực hiện ({progress}%)</Badge>;
      case "da_thuc_hien":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            Đã thực hiện
          </Badge>
        );
      default:
        return <Badge variant="outline">Không xác định</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">STT</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Đơn vị</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Tiến độ</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-6 bg-muted animate-pulse rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-8 bg-muted animate-pulse rounded"></div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!workPlans || workPlans.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">STT</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Đơn vị</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Tiến độ</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-muted-foreground">Không có dữ liệu</p>
                  <Button size="sm" asChild>
                    <Link href="/ke-hoach/tao-moi">
                      Tạo kế hoạch mới
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
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
              <TableHead>Đơn vị</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Tiến độ</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workPlans.map((workPlan, index) => {
              const progress = calculateOverallProgress(workPlan.tasks);
              const simplifiedStatus = getSimplifiedStatus(workPlan);
              
              return (
                <TableRow key={workPlan.id}>
                  <TableCell className="font-medium">
                    {(currentPage - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/ke-hoach/${workPlan.id}`}
                      className="hover:text-primary"
                    >
                      {workPlan.title}
                    </Link>
                  </TableCell>
                  <TableCell>{workPlan.department}</TableCell>
                  <TableCell>
                    {new Date(workPlan.startDate).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    {new Date(workPlan.endDate).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>{getStatusBadge(workPlan)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground min-w-[3rem]">
                        {progress}%
                      </span>
                    </div>
                  </TableCell>
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
                        <DropdownMenuItem asChild>
                          <Link href={`/ke-hoach/${workPlan.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </Link>
                        </DropdownMenuItem>
                        {simplifiedStatus === "chua_dien_ra" && 
                         workPlan.status === "approved" && 
                         onStart && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onStart(workPlan)}>
                              <Play className="mr-2 h-4 w-4" />
                              Bắt đầu
                            </DropdownMenuItem>
                          </>
                        )}
                        {simplifiedStatus === "dang_thuc_hien" && 
                         onComplete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onComplete(workPlan)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Hoàn thành
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <WorkPlanPaginationNew
        currentPage={currentPage}
        pageSize={pageSize}
        totalElements={totalElements}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
