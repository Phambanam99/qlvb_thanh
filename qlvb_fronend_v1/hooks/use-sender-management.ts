"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { senderApi } from "@/lib/api";

export function useSenderManagement() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [newSender, setNewSender] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreatingSender, setIsCreatingSender] = useState(false);
  const [senderError, setSenderError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch departments/senders
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoadingDepartments(true);
        const senders_ = await senderApi.getAllSenders();
        const senders = senders_.data;
        setDepartments(senders || []);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách đơn vị gửi",
          variant: "destructive",
        });
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [toast]);

  // Create a new sender
  const createSender = async () => {
    if (!newSender.trim()) {
      setSenderError("Tên đơn vị gửi không được để trống");
      return;
    }

    if (
      departments.some(
        (dept) => dept.name.toLowerCase() === newSender.toLowerCase()
      )
    ) {
      setSenderError("Đơn vị gửi này đã tồn tại");
      return;
    }

    try {
      setIsCreatingSender(true);
      setSenderError(null);

      await senderApi.createSender({ name: newSender });

      // Refresh the list
      const updatedSenders_ = await senderApi.getAllSenders();
      const updatedSenders = updatedSenders_.data;
      setDepartments(updatedSenders || []);

      // Reset and close dialog
      setNewSender("");
      setDialogOpen(false);

      toast({
        title: "Thành công",
        description: "Đã thêm đơn vị gửi mới",
      });
    } catch (error) {
      setSenderError("Không thể tạo đơn vị gửi mới");
      toast({
        title: "Lỗi",
        description: "Không thể tạo đơn vị gửi mới",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSender(false);
    }
  };

  return {
    departments,
    isLoadingDepartments,
    newSender,
    setNewSender,
    dialogOpen,
    setDialogOpen,
    isCreatingSender,
    senderError,
    setSenderError,
    createSender,
  };
}
