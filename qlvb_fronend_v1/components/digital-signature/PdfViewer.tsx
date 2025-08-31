"use client";

import React, { useState } from "react";
import { Document, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { PageDropTarget } from "./PageDropTarget"; // Import the new component

// Sử dụng worker file từ public thay vì CDN để tránh phụ thuộc internet
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

interface PlacedSignature {
  id: number;
  instanceId: number;
  src: string;
  x: number;
  y: number;
  page: number;
  width: number;
  height: number;
}

interface PdfViewerProps {
  file: File | null;
  placedSignatures: PlacedSignature[];
  onDropSignature: (
    item: { id: number; src: string },
    x: number,
    y: number,
    page: number
  ) => void;
  onMoveSignature: (instanceId: number, newX: number, newY: number) => void;
  onResizeSignature: (
    instanceId: number,
    newWidth: number,
    newHeight: number
  ) => void;
  numPages: number | null;
  setNumPages: (num: number | null) => void;
  // Props for selection
  selectedSignatureId: number | null;
  onSelectSignature: (instanceId: number | null) => void;
  onDeleteSignature: (instanceId: number) => void;
}

export const PdfViewer = ({
  file,
  placedSignatures,
  onDropSignature,
  onMoveSignature,
  onResizeSignature,
  numPages,
  setNumPages,
  selectedSignatureId,
  onSelectSignature,
  onDeleteSignature,
}: PdfViewerProps) => {
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleBackgroundClick = () => {
    onSelectSignature(null); // Deselect when clicking the background
  };

  return (
    <div
      className="relative w-full h-[70vh] bg-gray-200 border-dashed border-2 border-gray-400 overflow-auto"
      onClick={handleBackgroundClick}
    >
      {file ? (
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center"
        >
          {Array.from(new Array(numPages), (el, index) => (
            <PageDropTarget
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              placedSignatures={placedSignatures}
              onDropSignature={onDropSignature}
              onMoveSignature={onMoveSignature}
              onResizeSignature={onResizeSignature}
              selectedSignatureId={selectedSignatureId}
              onSelectSignature={onSelectSignature}
              onDeleteSignature={onDeleteSignature}
            />
          ))}
        </Document>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Tải lên file PDF để bắt đầu</p>
        </div>
      )}
    </div>
  );
};
