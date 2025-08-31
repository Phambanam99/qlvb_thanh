/**
 * Print Button Component for Internal Documents
 * Provides a user-friendly print button with loading states and error handling
 */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Printer, FileText, Download, Loader2 } from "lucide-react";
import { usePrintInternalDocuments } from "@/hooks/use-print-internal-documents";
import { InternalDocument } from "@/lib/api/internalDocumentApi";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";

interface PrintInternalDocumentsButtonProps {
  documents: InternalDocument[];
  documentType: "sent" | "received";
  organizationName?: string;
  departmentName?: string;
  additionalFilters?: {
    yearFilter?: number;
    monthFilter?: number;
    searchQuery?: string;
  };
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showDropdown?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PrintInternalDocumentsButton({
  documents,
  documentType,
  organizationName = "Cục Hải quan Hà Nội",
  departmentName,
  additionalFilters,
  variant = "outline",
  size = "sm",
  showDropdown = true,
  disabled = false,
  className = "",
}: PrintInternalDocumentsButtonProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    handlePrint,
    isPrinting,
    printError,
    clearPrintError,
    canPrint,
  } = usePrintInternalDocuments({
    documents,
    documentType,
    organizationName,
    departmentName: departmentName || user?.departmentName,
    additionalFilters,
  });

  // Show error toast when print error occurs
  React.useEffect(() => {
    if (printError) {
      toast({
        title: "Lỗi in văn bản",
        description: printError,
        variant: "destructive",
      });
      clearPrintError();
    }
  }, [printError, toast, clearPrintError]);

  const handleQuickPrint = async () => {
    await handlePrint({
      includeFilters: true,
    });
  };

  const handlePrintWithFilters = async () => {
    await handlePrint({
      includeFilters: true,
    });
  };

  const handlePrintWithoutFilters = async () => {
    await handlePrint({
      includeFilters: false,
    });
  };

  const isDisabled = disabled || !canPrint || isPrinting;

  if (!showDropdown) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={handleQuickPrint}
              disabled={isDisabled}
              className={className}
            >
              {isPrinting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              {size !== "icon" && (
                <span className="ml-2">
                  {isPrinting ? "Đang in..." : "In danh sách"}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {!canPrint
                ? "Không có văn bản nào để in"
                : isPrinting
                ? "Đang chuẩn bị in..."
                : `In danh sách ${documents.length} văn bản`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={variant}
                size={size}
                disabled={isDisabled}
                className={className}
              >
                {isPrinting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                {size !== "icon" && (
                  <span className="ml-2">
                    {isPrinting ? "Đang in..." : "In danh sách"}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handlePrintWithFilters}>
                <FileText className="mr-2 h-4 w-4" />
                In với bộ lọc hiện tại
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrintWithoutFilters}>
                <Printer className="mr-2 h-4 w-4" />
                In không có bộ lọc
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                <Download className="mr-2 h-4 w-4" />
                Xuất Excel (Sắp có)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {!canPrint
              ? "Không có văn bản nào để in"
              : isPrinting
              ? "Đang chuẩn bị in..."
              : `In danh sách ${documents.length} văn bản`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Simplified print button for specific use cases
export function SimplePrintButton({
  documents,
  documentType,
  className = "",
}: {
  documents: InternalDocument[];
  documentType: "sent" | "received";
  className?: string;
}) {
  return (
    <PrintInternalDocumentsButton
      documents={documents}
      documentType={documentType}
      variant="ghost"
      size="sm"
      showDropdown={false}
      className={className}
    />
  );
}
