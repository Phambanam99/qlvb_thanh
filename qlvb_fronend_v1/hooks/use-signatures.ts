import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { signatureApi } from "@/lib/api/signature";
import { SignatureDTO } from "@/lib/types/signature";
import { SIGNATURE_MESSAGES } from "@/lib/constants/signature";

interface UseSignaturesReturn {
  signatures: SignatureDTO[];
  isLoading: boolean;
  fetchSignatures: () => Promise<void>;
  createSignature: (file: File, password: string) => Promise<boolean>;
  deleteSignature: (id: number, password: string) => Promise<boolean>;
}

export const useSignatures = (): UseSignaturesReturn => {
  const { toast } = useToast();
  const [signatures, setSignatures] = useState<SignatureDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSignatures = useCallback(async () => {
    try {
      setIsLoading(true);
      const userSignatures = await signatureApi.getSignatures();
      setSignatures(userSignatures);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: SIGNATURE_MESSAGES.ERROR.FETCH_FAILED,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Auto-fetch signatures on mount
  useEffect(() => {
    fetchSignatures();
  }, [fetchSignatures]);

  const createSignature = useCallback(
    async (file: File, password: string): Promise<boolean> => {
      try {
        await signatureApi.createSignature(file, password);
        toast({
          title: "Thành công",
          description: SIGNATURE_MESSAGES.SUCCESS.CREATED,
        });
        await fetchSignatures();
        return true;
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error?.message || SIGNATURE_MESSAGES.ERROR.CREATE_FAILED,
          variant: "destructive",
        });
        return false;
      }
    },
    [toast, fetchSignatures]
  );

  const deleteSignature = useCallback(
    async (id: number, password: string): Promise<boolean> => {
      try {
        await signatureApi.deleteSignature(id, password);
        toast({
          title: "Thành công",
          description: SIGNATURE_MESSAGES.SUCCESS.DELETED,
        });
        await fetchSignatures();
        return true;
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error?.message || SIGNATURE_MESSAGES.ERROR.DELETE_FAILED,
          variant: "destructive",
        });
        return false;
      }
    },
    [toast, fetchSignatures]
  );

  return {
    signatures,
    isLoading,
    fetchSignatures,
    createSignature,
    deleteSignature,
  };
};
