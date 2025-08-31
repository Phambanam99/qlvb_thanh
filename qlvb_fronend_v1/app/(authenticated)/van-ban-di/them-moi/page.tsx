"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReplyDocumentInfo } from "./components/reply-document-info";
import { incomingDocumentsAPI } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function OutgoingDocumentTypePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const replyToId = searchParams.get("replyToId");
  const [incomingDocument, setIncomingDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!!replyToId);

  // Fetch incoming document if replyToId is provided
  useEffect(() => {
    const fetchIncomingDocument = async () => {
      if (!replyToId) return;

      try {
        setIsLoading(true);
        const doc_ = await incomingDocumentsAPI.getIncomingDocumentById(
          replyToId
        );
        const doc = doc_.data;
        setIncomingDocument(doc.data);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncomingDocument();
  }, [replyToId]);

  // Handle navigation to specific document creation page
  const navigateToCreatePage = (
    documentType: "noi-bo" | "ben-ngoai",
    isReply: boolean
  ) => {
    if (isReply && replyToId) {
      router.push(
        `/van-ban-di/them-moi/${documentType}/tra-loi?replyToId=${replyToId}`
      );
    } else if (!isReply) {
      router.push(`/van-ban-di/them-moi/${documentType}/tao-moi`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-5xl">
      <div className="flex items-center space-x-2 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/van-ban-di">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          {replyToId ? "Trả lời văn bản đến" : "Tạo văn bản đi mới"}
        </h1>
      </div>

      {/* Reply Document Info */}
      {replyToId && incomingDocument && (
        <div className="mb-8">
          <ReplyDocumentInfo incomingDocument={incomingDocument} />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {replyToId ? (
          // Reply to incoming document options
          <>
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigateToCreatePage("noi-bo", true)}
            >
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle>Trả lời văn bản đến - Nội bộ</CardTitle>
                <CardDescription>
                  Tạo văn bản trả lời và gửi đến phòng ban nội bộ
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Tạo văn bản trả lời để gửi đến các phòng ban hoặc cá nhân
                  trong cơ quan.
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" className="w-full">
                  Chọn
                </Button>
              </CardFooter>
            </Card>

            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigateToCreatePage("ben-ngoai", true)}
            >
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle>Trả lời văn bản đến - Bên ngoài</CardTitle>
                <CardDescription>
                  Tạo văn bản trả lời và gửi đến đơn vị bên ngoài
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Tạo văn bản trả lời để gửi đến cơ quan, tổ chức hoặc đơn vị
                  bên ngoài.
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" className="w-full">
                  Chọn
                </Button>
              </CardFooter>
            </Card>
          </>
        ) : (
          // New outgoing document options
          <>
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigateToCreatePage("noi-bo", false)}
            >
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle>Tạo văn bản đi - Nội bộ</CardTitle>
                <CardDescription>
                  Tạo văn bản mới và gửi đến phòng ban nội bộ
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Tạo văn bản mới để gửi đến các phòng ban hoặc cá nhân trong cơ
                  quan.
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" className="w-full">
                  Chọn
                </Button>
              </CardFooter>
            </Card>

            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigateToCreatePage("ben-ngoai", false)}
            >
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle>Tạo văn bản đi - Bên ngoài</CardTitle>
                <CardDescription>
                  Tạo văn bản mới và gửi đến đơn vị bên ngoài
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Tạo văn bản mới để gửi đến cơ quan, tổ chức hoặc đơn vị bên
                  ngoài.
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" className="w-full">
                  Chọn
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
