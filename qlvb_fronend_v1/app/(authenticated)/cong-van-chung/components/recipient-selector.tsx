"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { senderApi, SenderDTO } from "@/lib/api";
import { useNotifications } from "@/lib/notifications-context";

interface RecipientSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function RecipientSelector({
  value,
  onValueChange,
}: RecipientSelectorProps) {
  const [recipients, setRecipients] = useState<SenderDTO[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [isRecipientDialogOpen, setIsRecipientDialogOpen] = useState(false);
  const [isCreatingRecipient, setIsCreatingRecipient] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  // Fetch recipients on component mount
  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        setIsLoadingRecipients(true);
        const senders_ = await senderApi.getAllSenders();
        const senders = senders_.data;
        setRecipients(senders);
      } catch (error) {
        addNotification({
          title: "Lỗi",
          message: "Không thể tải danh sách nơi nhận",
          type: "error",
        });
      } finally {
        setIsLoadingRecipients(false);
      }
    };

    fetchRecipients();
  }, [addNotification]);

  const handleCreateRecipient = async () => {
    if (!newRecipient.trim()) {
      addNotification({
        title: "Cảnh báo",
        message: "Tên người nhận không được để trống",
        type: "warning",
      });
      return;
    }

    // Check if recipient already exists
    const recipientExists = recipients.some(
      (recipient) =>
        recipient.name.toLowerCase() === newRecipient.trim().toLowerCase()
    );

    if (recipientExists) {
      setRecipientError("Người nhận này đã tồn tại trong hệ thống");
      return;
    }

    try {
      setIsCreatingRecipient(true);
      setRecipientError(null);

      const senderData = {
        name: newRecipient.trim(),
      };

      const createdRecipient_ = await senderApi.createSender(senderData);
      const createdRecipient = createdRecipient_.data;
      setRecipients((prevRecipients) => [...prevRecipients, createdRecipient]);

      // Set the new recipient as selected
      onValueChange(createdRecipient.name);

      // Reset and close dialog
      setNewRecipient("");
      setIsRecipientDialogOpen(false);

      addNotification({
        title: "Thành công",
        message: "Đã thêm người nhận mới",
        type: "success",
      });
    } catch (error: any) {
      let errorMessage = "Có lỗi xảy ra khi thêm người nhận";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setRecipientError(errorMessage);
    } finally {
      setIsCreatingRecipient(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="recipient">
        Nơi nhận <span className="text-red-500">*</span>
      </Label>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger id="recipient" className="flex-1">
            <SelectValue placeholder="Chọn nơi nhận" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingRecipients ? (
              <SelectItem value="loading" disabled>
                Đang tải danh sách nơi nhận...
              </SelectItem>
            ) : recipients.length === 0 ? (
              <SelectItem value="empty" disabled>
                Chưa có người nhận nào
              </SelectItem>
            ) : (
              recipients.map((recipient) => (
                <SelectItem key={recipient.id} value={String(recipient.name)}>
                  {recipient.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Dialog
          open={isRecipientDialogOpen}
          onOpenChange={setIsRecipientDialogOpen}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm người nhận mới</DialogTitle>
              <DialogDescription>
                Nhập tên người nhận chưa có trong hệ thống
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newRecipient">Tên người nhận</Label>
                <Input
                  id="newRecipient"
                  value={newRecipient}
                  onChange={(e) => {
                    setNewRecipient(e.target.value);
                    setRecipientError(null);
                  }}
                  placeholder="Nhập tên người nhận mới"
                  className={recipientError ? "border-red-500" : ""}
                />
                {recipientError && (
                  <p className="text-sm font-medium text-red-500 mt-1">
                    {recipientError}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRecipientDialogOpen(false);
                  setRecipientError(null);
                  setNewRecipient("");
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreateRecipient}
                disabled={isCreatingRecipient || !newRecipient.trim()}
              >
                {isCreatingRecipient ? "Đang thêm..." : "Thêm người nhận"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
