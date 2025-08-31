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
import { PlusCircle, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { signatureApi } from "@/lib/api/signature";
import { SignatureDTO } from "@/lib/types/signature";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SIGNATURE_MESSAGES,
  SIGNATURE_CONFIG,
  UI_TEXT,
} from "@/lib/constants/signature";
import { resetFileInput } from "@/lib/utils/signature";
import { useSignatures } from "@/hooks/use-signatures";

interface SignatureManagementProps {
  onSignaturesChange?: (signatures: SignatureDTO[]) => void;
}

export const SignatureManagement = ({
  onSignaturesChange,
}: SignatureManagementProps) => {
  const { toast } = useToast();
  const { signatures, isLoading, createSignature, deleteSignature } =
    useSignatures();
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [signatureToDelete, setSignatureToDelete] =
    useState<SignatureDTO | null>(null);

  // Notify parent when signatures change
  useEffect(() => {
    onSignaturesChange?.(signatures);
  }, [signatures, onSignaturesChange]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const resetCreateForm = () => {
    setPassword("");
    setSelectedFile(null);
    resetFileInput("signature-file");
  };

  const handleCreateSignature = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !password.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: SIGNATURE_MESSAGES.ERROR.MISSING_INFO,
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const success = await createSignature(selectedFile, password);
      if (success) {
        resetCreateForm();
      }
    } catch (error: any) {
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSignature = async () => {
    if (!signatureToDelete || !deletePassword.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: SIGNATURE_MESSAGES.ERROR.MISSING_PASSWORD,
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      const success = await deleteSignature(
        signatureToDelete.id,
        deletePassword
      );
      if (success) {
        setSignatureToDelete(null);
        setDeletePassword("");
      }
    } catch (error: any) {
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (signature: SignatureDTO) => {
    setSignatureToDelete(signature);
    setDeletePassword("");
  };

  const closeDeleteDialog = () => {
    setSignatureToDelete(null);
    setDeletePassword("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{UI_TEXT.TITLES.SIGNATURE_MANAGEMENT}</CardTitle>
        <CardDescription>{UI_TEXT.DESCRIPTIONS.MANAGEMENT}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Signatures List */}
        <div>
          <h3 className="font-medium mb-4">
            {UI_TEXT.SECTIONS.YOUR_SIGNATURES}
          </h3>
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : signatures.length > 0 ? (
            <ul className="space-y-3">
              {signatures.map((signature) => (
                <li
                  key={signature.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <span className="font-mono text-sm truncate">
                    {signature.fileName}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog(signature)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {UI_TEXT.EMPTY_STATES.NO_SIGNATURES}
            </p>
          )}
        </div>

        {/* Create Signature Form */}
        <form
          onSubmit={handleCreateSignature}
          className="space-y-4 border-t pt-6"
        >
          <h3 className="font-medium">{UI_TEXT.SECTIONS.CREATE_NEW}</h3>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="signature-file">
              {UI_TEXT.LABELS.SIGNATURE_IMAGE}
            </Label>
            <Input
              id="signature-file"
              type="file"
              accept={SIGNATURE_CONFIG.ACCEPTED_IMAGE_TYPES}
              onChange={handleFileChange}
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              {SIGNATURE_MESSAGES.VALIDATION.FILE_TYPES}
            </p>
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="password">{UI_TEXT.LABELS.PROTECT_PASSWORD}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={SIGNATURE_MESSAGES.PLACEHOLDERS.SET_PASSWORD}
              disabled={isCreating}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isCreating || !selectedFile || !password.trim()}
          >
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="mr-2 h-4 w-4" />
            )}
            {UI_TEXT.BUTTONS.CREATE_SIGNATURE}
          </Button>
        </form>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!signatureToDelete}
          onOpenChange={closeDeleteDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {SIGNATURE_MESSAGES.CONFIRMATION.DELETE_TITLE}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {SIGNATURE_MESSAGES.CONFIRMATION.DELETE_DESCRIPTION}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="delete-password">
                {UI_TEXT.LABELS.SIGNATURE_PASSWORD}
              </Label>
              <Input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder={SIGNATURE_MESSAGES.PLACEHOLDERS.PASSWORD}
                disabled={isDeleting}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={closeDeleteDialog}
                disabled={isDeleting}
              >
                {UI_TEXT.BUTTONS.CANCEL}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSignature}
                disabled={isDeleting || !deletePassword.trim()}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {UI_TEXT.BUTTONS.DELETE}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
