"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  documentsLength: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  documentsLength,
  isLoading,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  if (documentsLength === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-4 border-t">
      <div className="text-sm text-muted-foreground">
        Hiển thị {documentsLength} / {totalItems || 0} văn bản
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Số văn bản mỗi trang</p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              onPageSizeChange(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Trang {currentPage + 1} / {Math.max(totalPages, 1)}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newPage = Math.max(0, currentPage - 1);
              onPageChange(newPage);
            }}
            disabled={currentPage <= 0 || isLoading}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newPage = currentPage + 1;
              onPageChange(newPage);
            }}
            disabled={documentsLength < pageSize || isLoading}
          >
            Tiếp
          </Button>
        </div>
      </div>
    </div>
  );
}
