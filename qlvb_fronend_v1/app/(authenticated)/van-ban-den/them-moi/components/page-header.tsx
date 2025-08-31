import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
  isSubmitting: boolean;
  isFormDisabled: boolean;
  onReset: () => void;
}

export function PageHeader({
  isSubmitting,
  isFormDisabled,
  onReset,
}: PageHeaderProps) {
  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              href="/"
              className="text-gray-700 hover:text-primary inline-flex items-center"
            >
              Trang chủ
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <Link
                href="/van-ban-den"
                className="text-gray-700 hover:text-primary"
              >
                Văn bản đến
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-500">Thêm mới</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/van-ban-den">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Thêm văn bản đến mới
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button type="button" variant="outline" onClick={onReset}>
            Đặt lại
          </Button>
          <Button
            type="submit"
            form="document-form"
            disabled={isSubmitting || isFormDisabled}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lưu văn bản
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
