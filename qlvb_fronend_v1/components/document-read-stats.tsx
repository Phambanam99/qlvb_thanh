"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Eye, 
  EyeOff, 
  Loader2,
  TrendingUp
} from "lucide-react";
import { 
  DocumentReadStatistics,
  DocumentType 
} from "@/lib/api/documentReadStatus";

interface DocumentReadStatsProps {
  documentId: number;
  documentType: DocumentType;
  onGetStatistics: (documentId: number) => Promise<DocumentReadStatistics>;
  className?: string;
  variant?: "default" | "compact" | "badge";
}

export function DocumentReadStats({
  documentId,
  documentType,
  onGetStatistics,
  className = "",
  variant = "default",
}: DocumentReadStatsProps) {
  const [statistics, setStatistics] = useState<DocumentReadStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await onGetStatistics(documentId);
      
      setStatistics(stats);
    } catch (err) {
      setError("Không thể tải thống kê");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [documentId]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Đang tải...</span>
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        {error || "Không có dữ liệu"}
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="outline" className="gap-1">
          <Eye className="h-3 w-3" />
          {statistics.readUsers}/{statistics.totalUsers}
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <TrendingUp className="h-3 w-3" />
          {statistics.readPercentage}%
        </Badge>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-3 text-sm ${className}`}>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{statistics.totalUsers}</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4 text-green-600" />
          <span className="text-green-600">{statistics.readUsers}</span>
        </div>
        <div className="flex items-center gap-1">
          <EyeOff className="h-4 w-4 text-orange-600" />
          <span className="text-orange-600">{statistics.unreadUsers}</span>
        </div>
        <Badge variant="outline">
          {statistics.readPercentage}%
        </Badge>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Thống kê đọc văn bản</span>
      </div>
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className="text-center">
          <div className="font-semibold">{statistics.totalUsers}</div>
          <div className="text-muted-foreground">Tổng số</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-green-600">{statistics.readUsers}</div>
          <div className="text-muted-foreground">Đã đọc</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-orange-600">{statistics.unreadUsers}</div>
          <div className="text-muted-foreground">Chưa đọc</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-blue-600">{statistics.readPercentage}%</div>
          <div className="text-muted-foreground">Tỷ lệ đọc</div>
        </div>
      </div>
    </div>
  );
}
