"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Wrench, ArrowRight, PenSquare } from "lucide-react";

const utilities = [
  {
    title: "Ghép File PDF",
    description: "Ghép nhiều file PDF thành một file duy nhất",
    href: "/tien-ich/ghep-pdf",
    icon: FileText,
    color: "bg-red-100 text-red-600",
  },
  {
    title: "Chữ ký số",
    description: "Quản lý và sử dụng chữ ký số để ký tài liệu PDF",
    href: "/tien-ich/chu-ky-so",
    icon: PenSquare,
    color: "bg-green-100 text-green-600",
  },
  // Có thể thêm các tiện ích khác trong tương lai
  // {
  //   title: "Tách File PDF",
  //   description: "Tách một file PDF thành nhiều file nhỏ",
  //   href: "/tien-ich/tach-pdf",
  //   icon: FileText,
  //   color: "bg-blue-100 text-blue-600",
  // },
];

export default function UtilitiesPage() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Wrench className="h-8 w-8" />
          Tiện ích
        </h1>
        <p className="text-muted-foreground">
          Các công cụ hỗ trợ xử lý tài liệu và văn bản
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {utilities.map((utility) => (
          <Card
            key={utility.href}
            className="hover:shadow-lg transition-shadow flex flex-col"
          >
            <CardHeader className="flex-grow">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${utility.color}`}>
                  <utility.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{utility.title}</CardTitle>
                </div>
              </div>
              <CardDescription className="mt-2">
                {utility.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={utility.href}>
                <Button className="w-full flex items-center justify-center gap-2">
                  Sử dụng
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {utilities.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Chưa có tiện ích nào</h3>
          <p className="text-muted-foreground">
            Các tiện ích sẽ được thêm vào trong tương lai
          </p>
        </div>
      )}

    </div>
  );
}
