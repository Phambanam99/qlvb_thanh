"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSignature, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { signatureApi } from "@/lib/api/signature";
import { SignatureDTO } from "@/lib/types/signature";
import { DraggableSignature } from "@/components/digital-signature/DraggableSignature";
import { PdfViewer } from "@/components/digital-signature/PdfViewer";
import {
  SIGNATURE_MESSAGES,
  SIGNATURE_CONFIG,
  UI_TEXT,
} from "@/lib/constants/signature";
import { getSignatureImageUrl } from "@/lib/utils/signature";
import { usePdfSigning } from "@/hooks/use-pdf-signing";

interface DocumentSigningProps {
  signatures?: SignatureDTO[];
}

export const DocumentSigning = ({
  signatures: externalSignatures,
}: DocumentSigningProps) => {
  const { toast } = useToast();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);

  const {
    placedSignatures,
    selectedSignatureId,
    isSigning,
    handleDropSignature,
    handleMoveSignature,
    handleResizeSignature,
    handleDeleteSignature,
    handleSelectSignature,
    signPdf,
    resetSigningState,
  } = usePdfSigning();

  // Use signatures from props (always prefer external signatures)
  const signatures = externalSignatures || [];

  const handlePdfFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPdfFile(file);
      resetSigningState();
    }
  };

  const handleSignPdf = async () => {
    if (pdfFile) {
      await signPdf(pdfFile);
    }
  };

  // Construct the public URL for the signature image using utility function
  const getSignatureImageUrlForFile = (fileName: string): string => {
    return getSignatureImageUrl(fileName);
  };

  const canSign = pdfFile && placedSignatures.length > 0 && !isSigning;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{UI_TEXT.TITLES.DOCUMENT_SIGNING}</CardTitle>
        <CardDescription>{UI_TEXT.DESCRIPTIONS.SIGNING}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <PdfViewer
            file={pdfFile}
            placedSignatures={placedSignatures}
            onDropSignature={handleDropSignature}
            onMoveSignature={handleMoveSignature}
            onResizeSignature={handleResizeSignature}
            numPages={numPages}
            setNumPages={setNumPages}
            selectedSignatureId={selectedSignatureId}
            onSelectSignature={handleSelectSignature}
            onDeleteSignature={handleDeleteSignature}
          />
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="pdf-upload">{UI_TEXT.SECTIONS.UPLOAD_PDF}</Label>
            <Input
              id="pdf-upload"
              type="file"
              accept={SIGNATURE_CONFIG.ACCEPTED_PDF_TYPE}
              onChange={handlePdfFileChange}
              disabled={isSigning}
            />
          </div>
          <div>
            <h3 className="font-medium mb-2">
              {UI_TEXT.SECTIONS.DRAG_SIGNATURES}
            </h3>
            <div className="p-4 bg-gray-100 rounded-lg h-48 overflow-y-auto space-y-2">
              {signatures.length > 0 ? (
                signatures.map((sig) => (
                  <DraggableSignature
                    key={sig.id}
                    id={sig.id}
                    fileName={sig.fileName}
                    src={getSignatureImageUrlForFile(sig.fileName)}
                  />
                ))
              ) : (
                <p className="text-xs text-center text-gray-500">
                  {UI_TEXT.EMPTY_STATES.NO_SIGNATURES_SHORT}
                </p>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">
              {UI_TEXT.SECTIONS.SIGN_DOWNLOAD}
            </h3>
            <Button
              className="w-full"
              onClick={handleSignPdf}
              disabled={!canSign}
            >
              {isSigning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSignature className="mr-2 h-4 w-4" />
              )}
              {UI_TEXT.BUTTONS.SIGN_DOCUMENT}
            </Button>
          </div>
          {numPages && (
            <p className="text-sm text-center text-muted-foreground">
              {UI_TEXT.LABELS.PAGE_COUNT}: {numPages}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
