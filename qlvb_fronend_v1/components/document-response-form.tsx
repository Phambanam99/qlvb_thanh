"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Paperclip, Send } from "lucide-react"

interface DocumentResponseFormProps {
  documentId: number
}

export default function DocumentResponseForm({ documentId }: DocumentResponseFormProps) {
  const [content, setContent] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Giả lập gửi dữ liệu
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Reset form
    setContent("")
    setFiles([])
    setIsSubmitting(false)

    // Thông báo thành công (trong thực tế sẽ sử dụng toast hoặc notification)
    alert("Đã gửi văn bản trả lời thành công!")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Soạn văn bản trả lời</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Nội dung</Label>
            <Textarea
              id="content"
              placeholder="Nhập nội dung văn bản trả lời..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachments">Tệp đính kèm</Label>
            <div className="flex items-center gap-2">
              <Input id="attachments" type="file" multiple onChange={handleFileChange} className="hidden" />
              <Button type="button" variant="outline" onClick={() => document.getElementById("attachments")?.click()}>
                <Paperclip className="mr-2 h-4 w-4" />
                Chọn tệp
              </Button>
              <span className="text-sm text-muted-foreground">
                {files.length > 0 ? `Đã chọn ${files.length} tệp` : "Chưa có tệp nào được chọn"}
              </span>
            </div>
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((file, index) => (
                  <div key={index} className="text-sm">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline">
            Lưu nháp
          </Button>
          <Button type="submit" disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? (
              "Đang gửi..."
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Gửi văn bản
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
