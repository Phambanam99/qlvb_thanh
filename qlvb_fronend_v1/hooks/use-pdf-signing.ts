import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { signatureApi } from "@/lib/api/signature";
import { PDFDocument } from "pdf-lib";
import { SIGNATURE_MESSAGES } from "@/lib/constants/signature";
import {
  downloadBlob,
  formatSignedFileName,
  generateSignatureInstanceId,
} from "@/lib/utils/signature";
import { PlacedSignature } from "@/lib/types/digital-signature";

// Check if we're in browser environment
const isBrowser = typeof window !== "undefined";

interface UsePdfSigningReturn {
  placedSignatures: PlacedSignature[];
  selectedSignatureId: number | null;
  isSigning: boolean;
  isClientReady: boolean;
  handleDropSignature: (
    item: { id: number; src: string },
    x: number,
    y: number,
    page: number
  ) => void;
  handleMoveSignature: (instanceId: number, newX: number, newY: number) => void;
  handleResizeSignature: (
    instanceId: number,
    newWidth: number,
    newHeight: number
  ) => void;
  handleDeleteSignature: (instanceId: number) => void;
  handleSelectSignature: (instanceId: number | null) => void;
  signPdf: (pdfFile: File) => Promise<void>;
  resetSigningState: () => void;
}

export const usePdfSigning = (): UsePdfSigningReturn => {
  const { toast } = useToast();
  const [placedSignatures, setPlacedSignatures] = useState<PlacedSignature[]>(
    []
  );
  const [selectedSignatureId, setSelectedSignatureId] = useState<number | null>(
    null
  );
  const [isSigning, setIsSigning] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);

  // Ensure we're on client side before initializing
  useEffect(() => {
    if (isBrowser) {
      setIsClientReady(true);
    }
  }, []);

  const resetSigningState = useCallback(() => {
    setPlacedSignatures([]);
    setSelectedSignatureId(null);
  }, []);

  const handleDropSignature = useCallback(
    (item: { id: number; src: string }, x: number, y: number, page: number) => {
      const newSignature: PlacedSignature = {
        ...item,
        instanceId: generateSignatureInstanceId(),
        x,
        y,
        page,
        width: 150,
        height: 75,
      };
      setPlacedSignatures((prev) => [...prev, newSignature]);
      setSelectedSignatureId(newSignature.instanceId);
    },
    []
  );

  const handleMoveSignature = useCallback(
    (instanceId: number, newX: number, newY: number) => {
      setPlacedSignatures((prev) =>
        prev.map((sig) =>
          sig.instanceId === instanceId ? { ...sig, x: newX, y: newY } : sig
        )
      );
    },
    []
  );

  const handleResizeSignature = useCallback(
    (instanceId: number, newWidth: number, newHeight: number) => {
      setPlacedSignatures((prev) =>
        prev.map((sig) =>
          sig.instanceId === instanceId
            ? { ...sig, width: newWidth, height: newHeight }
            : sig
        )
      );
    },
    []
  );

  const handleDeleteSignature = useCallback((instanceId: number) => {
    setPlacedSignatures((prev) =>
      prev.filter((sig) => sig.instanceId !== instanceId)
    );
    setSelectedSignatureId(null);
  }, []);

  const handleSelectSignature = useCallback((instanceId: number | null) => {
    setSelectedSignatureId(instanceId);
  }, []);

  const collectPasswordsAndImages = async (): Promise<{
    passwords: Map<number, string>;
    signatureImages: Map<number, Uint8Array>;
  } | null> => {
    const passwords = new Map<number, string>();
    const signatureImages = new Map<number, Uint8Array>();

    for (const sig of placedSignatures) {
      if (signatureImages.has(sig.id)) continue;

      let password = passwords.get(sig.id);
      if (!password) {
        password =
          prompt(`Vui lòng nhập mật khẩu cho chữ ký ID: ${sig.id}`) || "";
        if (!password) {
          toast({
            title: "Hủy bỏ",
            description: SIGNATURE_MESSAGES.ERROR.SIGNING_CANCELLED,
            variant: "default",
          });
          return null;
        }
        passwords.set(sig.id, password);
      }

      try {
        const imageBlob = await signatureApi.getSignatureImage(
          sig.id,
          password
        );
        signatureImages.set(
          sig.id,
          new Uint8Array(await imageBlob.arrayBuffer())
        );
      } catch (error) {
        toast({
          title: "Lỗi mật khẩu",
          description: `${SIGNATURE_MESSAGES.ERROR.INVALID_PASSWORD} ID: ${sig.id}`,
          variant: "destructive",
        });
        return null;
      }
    }

    return { passwords, signatureImages };
  };

  const embedSignaturesInPdf = async (
    pdfDoc: PDFDocument,
    signatureImages: Map<number, Uint8Array>
  ): Promise<void> => {
    for (const sig of placedSignatures) {
      const imageBytes = signatureImages.get(sig.id);
      if (!imageBytes) continue;

      try {
        // Detect image format by checking magic bytes
        let embeddedImage;

        // Check if it's PNG (starts with PNG signature: 89 50 4E 47)
        if (
          imageBytes[0] === 0x89 &&
          imageBytes[1] === 0x50 &&
          imageBytes[2] === 0x4e &&
          imageBytes[3] === 0x47
        ) {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        }
        // Check if it's JPEG (starts with FF D8)
        else if (imageBytes[0] === 0xff && imageBytes[1] === 0xd8) {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }
        // Try PNG first as fallback, then JPEG
        else {
          try {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
          } catch (pngError) {
          
            try {
              embeddedImage = await pdfDoc.embedJpg(imageBytes);
            } catch (jpgError) {
             
              throw new Error(
                `Unsupported image format for signature ${sig.id}`
              );
            }
          }
        }

        const page = pdfDoc.getPages()[sig.page - 1];
        page.drawImage(embeddedImage, {
          x: sig.x,
          y: page.getHeight() - sig.y - sig.height, // Invert Y-axis
          width: sig.width,
          height: sig.height,
        });
      } catch (error) {
        throw error;
      }
    }
  };

  const signPdf = async (pdfFile: File): Promise<void> => {
    if (!pdfFile || placedSignatures.length === 0) {
      toast({
        title: "Thiếu thông tin",
        description: SIGNATURE_MESSAGES.ERROR.MISSING_PDF_OR_SIGNATURE,
        variant: "destructive",
      });
      return;
    }

    setIsSigning(true);
    try {
      const pdfDoc = await PDFDocument.load(await pdfFile.arrayBuffer());
      const result = await collectPasswordsAndImages();

      if (!result) {
        return;
      }

      const { signatureImages } = result;
      await embedSignaturesInPdf(pdfDoc, signatureImages);

      const signedPdfBytes = await pdfDoc.save();
      const signedPdfBlob = new Blob([signedPdfBytes], {
        type: "application/pdf",
      });
      downloadBlob(signedPdfBlob, formatSignedFileName(pdfFile.name));

      toast({
        title: "Thành công",
        description: SIGNATURE_MESSAGES.SUCCESS.SIGNED,
      });

      resetSigningState();
    } catch (error: any) {
      toast({
        title: "Lỗi ký",
        description: error?.message || SIGNATURE_MESSAGES.ERROR.SIGNING_FAILED,
        variant: "destructive",
      });
    } finally {
      setIsSigning(false);
    }
  };

  return {
    placedSignatures,
    selectedSignatureId,
    isSigning,
    isClientReady,
    handleDropSignature,
    handleMoveSignature,
    handleResizeSignature,
    handleDeleteSignature,
    handleSelectSignature,
    signPdf,
    resetSigningState,
  };
};
