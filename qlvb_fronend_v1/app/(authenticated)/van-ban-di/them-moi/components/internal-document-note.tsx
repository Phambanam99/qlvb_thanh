"use client";

import { Card, CardContent } from "@/components/ui/card";

export function InternalDocumentNote() {
  return (
    <Card className="bg-green-50 border-green-200">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-green-800">
              Văn bản nội bộ
            </div>
            <div className="text-xs text-green-700 mt-1">
              Văn bản này sẽ được gửi trực tiếp trong nội bộ đơn vị mà
              không cần qua quy trình phê duyệt. Thích hợp cho các
              thông báo, hướng dẫn nội bộ.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 