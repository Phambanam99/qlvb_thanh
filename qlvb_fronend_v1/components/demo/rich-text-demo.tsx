"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function RichTextDemo() {
  const [content, setContent] = useState(`
    <h2>🎉 Chào mừng đến với Rich Text Editor!</h2>
    <p>Đây là một trình soạn thảo văn bản phong phú được xây dựng với <strong>Tiptap</strong> và <em>React</em>.</p>
    
    <h3>✨ Tính năng chính:</h3>
    <ul>
      <li><strong>Định dạng văn bản:</strong> In đậm, in nghiêng, gạch chân</li>
      <li><mark>Tô sáng văn bản</mark> với nhiều màu sắc</li>
      <li><span style="color: #ff0000">Thay đổi màu chữ</span> linh hoạt</li>
      <li>Danh sách có dấu đầu dòng và số thứ tự</li>
      <li>Hoàn tác / Làm lại (Undo/Redo)</li>
    </ul>

    <h3>🚀 Cách sử dụng:</h3>
    <ol>
      <li>Chọn văn bản cần định dạng</li>
      <li>Sử dụng các nút trên thanh công cụ</li>
      <li>Hoặc sử dụng phím tắt: <strong>Ctrl+B</strong> (đậm), <strong>Ctrl+I</strong> (nghiêng), <strong>Ctrl+U</strong> (gạch chân)</li>
    </ol>

    <p><mark>Hãy thử nghiệm các tính năng bên dưới!</mark></p>
  `);

  const [simpleContent, setSimpleContent] = useState("");

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Rich Text Editor Demo</h1>
        <p className="text-muted-foreground">
          Trình soạn thảo văn bản với tính năng định dạng phong phú
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Demo với nội dung có sẵn */}
        <Card>
          <CardHeader>
            <CardTitle>📝 Editor với nội dung mẫu</CardTitle>
            <CardDescription>
              Editor đã có sẵn nội dung để bạn thử nghiệm các tính năng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Nhập nội dung ở đây..."
              minHeight="300px"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setContent("")}
              >
                Xóa tất cả
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log("HTML Output:", content)}
              >
                Xem HTML (Console)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Demo editor trống */}
        <Card>
          <CardHeader>
            <CardTitle>✨ Editor trống</CardTitle>
            <CardDescription>
              Bắt đầu viết từ đầu và khám phá các tính năng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RichTextEditor
              content={simpleContent}
              onChange={setSimpleContent}
              placeholder="Bắt đầu viết nội dung của bạn..."
              minHeight="300px"
            />
            <div className="text-sm text-muted-foreground">
              Số ký tự: {simpleContent.replace(/<[^>]*>/g, "").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hướng dẫn sử dụng */}
      <Card>
        <CardHeader>
          <CardTitle>📖 Hướng dẫn sử dụng</CardTitle>
          <CardDescription>
            Cách tích hợp RichTextEditor vào ứng dụng của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Import component:</h4>
            <pre className="text-sm">
              {`import { RichTextEditor } from '@/components/ui/rich-text-editor';`}
            </pre>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Sử dụng cơ bản:</h4>
            <pre className="text-sm">
              {`const [content, setContent] = useState('');

<RichTextEditor
  content={content}
  onChange={setContent}
  placeholder="Nhập nội dung..."
  minHeight="200px"
/>`}
            </pre>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">🎨 Tính năng định dạng:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>
                  • <strong>Bold</strong> - In đậm (Ctrl+B)
                </li>
                <li>
                  • <em>Italic</em> - In nghiêng (Ctrl+I)
                </li>
                <li>
                  • <u>Underline</u> - Gạch chân (Ctrl+U)
                </li>
                <li>
                  • <mark>Highlight</mark> - Tô sáng
                </li>
                <li>• Màu chữ tuỳ chỉnh</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">📋 Tính năng khác:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Danh sách có dấu đầu dòng</li>
                <li>• Danh sách có số thứ tự</li>
                <li>• Undo/Redo (Ctrl+Z/Ctrl+Y)</li>
                <li>• Xóa định dạng</li>
                <li>• Placeholder linh hoạt</li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Lưu ý:</h4>
            <p className="text-sm text-blue-700">
              RichTextEditor trả về HTML content. Để lưu vào database, bạn có
              thể sử dụng trực tiếp HTML hoặc chuyển đổi về text thuần túy bằng
              cách sử dụng ref và gọi <code>getText()</code> method.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
