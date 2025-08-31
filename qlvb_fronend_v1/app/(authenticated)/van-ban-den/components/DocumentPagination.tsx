/**
 * Pagination Component
 * Reusable pagination controls for documents
 */

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentPaginationProps {
  currentDocumentsLength: number;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  onPageSizeChange: (pageSize: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function DocumentPagination({
  currentDocumentsLength,
  totalItems,
  currentPage,
  pageSize,
  totalPages,
  isLoading,
  onPageSizeChange,
  onPreviousPage,
  onNextPage,
}: DocumentPaginationProps) {
  if (currentDocumentsLength === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-4 py-4 border-t">
      <div className="text-sm text-muted-foreground">
        Hiển thị {currentDocumentsLength} / {totalItems || 0} văn bản
      </div>

      <div className="flex items-center space-x-6 lg:space-x-8">
        {/* Page Size Selector */}
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Số văn bản mỗi trang</p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page Info */}
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Trang {currentPage + 1} / {Math.max(totalPages, 1)}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={currentPage <= 0 || isLoading}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={currentDocumentsLength < pageSize || isLoading}
          >
            Tiếp
          </Button>
        </div>
      </div>
    </div>
  );
}
