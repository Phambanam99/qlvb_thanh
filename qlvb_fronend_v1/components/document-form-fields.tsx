"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

interface DocumentType {
  id: number;
  name: string;
}

interface DocumentFormFieldsProps {
  documentNumber: string;
  setDocumentNumber: (value: string) => void;
  documentCode: string;
  setDocumentCode: (value: string) => void;
  documentDate: Date | undefined;
  setDocumentDate: (date: Date | undefined) => void;
  selectedDocumentType: number | null;
  setSelectedDocumentType: (id: number | null) => void;
  receivedDate: Date | undefined;
  setReceivedDate: (date: Date | undefined) => void;
  documentSummary: string;
  setDocumentSummary: (value: string) => void;
  documentTypes: DocumentType[];
  isLoadingDocumentTypes: boolean;
}

export function DocumentFormFields({
  documentNumber,
  setDocumentNumber,
  documentCode,
  setDocumentCode,
  documentDate,
  setDocumentDate,
  selectedDocumentType,
  setSelectedDocumentType,
  receivedDate,
  setReceivedDate,
  documentSummary,
  setDocumentSummary,
  documentTypes,
  isLoadingDocumentTypes,
}: DocumentFormFieldsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Document Number */}
      <div className="space-y-2">
        <Label htmlFor="documentNumber">Số văn bản</Label>
        <Input
          id="documentNumber"
          placeholder="Nhập số văn bản"
          value={documentNumber}
          onChange={(e) => setDocumentNumber(e.target.value)}
        />
      </div>

      {/* Document Code */}
      <div className="space-y-2">
        <Label htmlFor="documentCode">Ký hiệu</Label>
        <Input
          id="documentCode"
          placeholder="Nhập ký hiệu văn bản"
          value={documentCode}
          onChange={(e) => setDocumentCode(e.target.value)}
        />
      </div>

      {/* Document Date */}
      <div className="space-y-2">
        <Label>Ngày văn bản</Label>
        <DatePicker
          date={documentDate}
          setDate={setDocumentDate}
          className="w-full"
        />
      </div>

      {/* Document Type */}
      <div className="space-y-2">
        <Label htmlFor="documentType">Loại văn bản</Label>
        <Select
          value={selectedDocumentType?.toString() || ""}
          onValueChange={(value) =>
            setSelectedDocumentType(value ? parseInt(value) : null)
          }
        >
          <SelectTrigger id="documentType" disabled={isLoadingDocumentTypes}>
            <SelectValue placeholder="Chọn loại văn bản" />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map((type) => (
              <SelectItem key={type.id} value={type.id.toString()}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Received Date */}
      <div className="space-y-2">
        <Label>Ngày nhận</Label>
        <DatePicker
          date={receivedDate}
          setDate={setReceivedDate}
          className="w-full"
        />
      </div>

      {/* Document Summary */}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="documentSummary">Trích yếu</Label>
        <Textarea
          id="documentSummary"
          placeholder="Nhập trích yếu văn bản"
          value={documentSummary}
          onChange={(e) => setDocumentSummary(e.target.value)}
          className="min-h-20"
        />
      </div>
    </div>
  );
}
