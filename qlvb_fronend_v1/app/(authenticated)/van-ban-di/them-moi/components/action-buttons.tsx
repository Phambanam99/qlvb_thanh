"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Send } from "lucide-react";
import Link from "next/link";

interface ActionButtonsProps {
  documentScope: "INTERNAL" | "EXTERNAL";
  isSubmitting: boolean;
  isFormValid: boolean;
  onSaveDraft: () => void;
}

export function ActionButtons({
  documentScope,
  isSubmitting,
  isFormValid,
  onSaveDraft,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6">
      <div className="flex gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href="/van-ban-di">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Hủy
          </Link>
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onSaveDraft}
          disabled={isSubmitting}
        >
          <Save className="mr-2 h-4 w-4" />
          Lưu nháp
        </Button>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !isFormValid}
        className="bg-primary hover:bg-primary/90"
      >
        {isSubmitting ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            Đang xử lý...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            {documentScope === "INTERNAL" ? "Gửi văn bản" : "Gửi phê duyệt"}
          </>
        )}
      </Button>
    </div>
  );
}
