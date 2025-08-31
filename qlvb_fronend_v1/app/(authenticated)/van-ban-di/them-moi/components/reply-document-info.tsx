"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReplyDocumentInfoProps {
  incomingDocument: {
    documentNumber: string;
    title: string;
    issuingAuthority: string;
  };
}

export function ReplyDocumentInfo({
  incomingDocument,
}: ReplyDocumentInfoProps) {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-blue-700">
          Đang trả lời văn bản:
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-blue-700 space-y-1">
          <p>
            <span className="font-medium">Số:</span>{" "}
            {incomingDocument.documentNumber}
          </p>
          <p>
            <span className="font-medium">Trích yếu:</span>{" "}
            {incomingDocument.title}
          </p>
          <p>
            <span className="font-medium">Đơn vị gửi:</span>{" "}
            {incomingDocument.issuingAuthority}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
