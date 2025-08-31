/**
 * Demo page for the unified urgency system
 * Trang demo cho hệ thống độ khẩn thống nhất
 */

"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DocumentListExample,
  DocumentFormExample,
  DocumentTableExample,
  MigrationExample,
  UrgencyFilterExample,
  UrgencyStatsExample,
} from "@/lib/types/urgency-examples";
import {
  URGENCY_LEVELS,
  URGENCY_CONFIG,
  getUrgencyOptions,
} from "@/lib/types/urgency";
import { UrgencyBadge } from "@/components/urgency-badge";

export default function UrgencyDemoPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Hệ thống độ khẩn thống nhất</h1>
        <p className="text-muted-foreground">
          Demo các component và utilities cho việc quản lý độ khẩn trong toàn bộ
          ứng dụng
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Tổng quan hệ thống</CardTitle>
          <CardDescription>
            4 mức độ khẩn đã được chuẩn hóa và thống nhất
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {getUrgencyOptions().map((option) => (
              <Card key={option.value} className="text-center">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="text-2xl">{option.icon}</div>
                    <UrgencyBadge level={option.value} />
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      Priority: {option.priority}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết kỹ thuật</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Type Definitions</h4>
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-x-auto">
                {`export const URGENCY_LEVELS = {
  KHAN: "KHAN",
  THUONG_KHAN: "THUONG_KHAN", 
  HOA_TOC: "HOA_TOC",
  HOA_TOC_HEN_GIO: "HOA_TOC_HEN_GIO",
} as const;

export type UrgencyLevel = keyof typeof URGENCY_LEVELS;`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Key Features</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  ✅ <span>Type-safe với TypeScript</span>
                </li>
                <li className="flex items-center gap-2">
                  ✅ <span>Utility functions đầy đủ</span>
                </li>
                <li className="flex items-center gap-2">
                  ✅ <span>Components tái sử dụng</span>
                </li>
                <li className="flex items-center gap-2">
                  ✅ <span>Migration helpers từ hệ thống cũ</span>
                </li>
                <li className="flex items-center gap-2">
                  ✅ <span>Sorting và filtering support</span>
                </li>
                <li className="flex items-center gap-2">
                  ✅ <span>Visual indicators với icons và colors</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Examples */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="list">Danh sách</TabsTrigger>
          <TabsTrigger value="form">Form</TabsTrigger>
          <TabsTrigger value="table">Bảng</TabsTrigger>
          <TabsTrigger value="filter">Lọc</TabsTrigger>
          <TabsTrigger value="stats">Thống kê</TabsTrigger>
          <TabsTrigger value="migration">Migration</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hiển thị trong danh sách</CardTitle>
              <CardDescription>
                Sử dụng UrgencyBadge và UrgencyIndicator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentListExample />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sử dụng trong form</CardTitle>
              <CardDescription>
                UrgencySelect component với validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentFormExample />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hiển thị trong bảng</CardTitle>
              <CardDescription>
                Kết hợp badges và indicators trong table
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentTableExample />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lọc theo độ khẩn</CardTitle>
              <CardDescription>
                CompactUrgencySelect cho filtering
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UrgencyFilterExample />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê và dashboard</CardTitle>
              <CardDescription>
                Hiển thị thống kê văn bản theo mức độ khẩn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UrgencyStatsExample />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Migration từ hệ thống cũ</CardTitle>
              <CardDescription>
                Chuyển đổi từ URGENT/HIGH/NORMAL sang hệ thống mới
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MigrationExample />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn sử dụng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <h4>1. Import types và utilities</h4>
            <pre className="text-sm bg-gray-100 p-3 rounded">
              {`import { 
  UrgencyLevel, 
  URGENCY_LEVELS, 
  getUrgencyLabel 
} from "@/lib/types/urgency";`}
            </pre>

            <h4>2. Sử dụng components</h4>
            <pre className="text-sm bg-gray-100 p-3 rounded">
              {`import { UrgencyBadge } from "@/components/urgency-badge";
import { UrgencySelect } from "@/components/urgency-select";

// Hiển thị badge
<UrgencyBadge level={URGENCY_LEVELS.HOA_TOC} />

// Form select
<UrgencySelect 
  value={urgencyLevel}
  onValueChange={setUrgencyLevel}
  label="Độ khẩn"
/>`}
            </pre>

            <h4>3. Migration từ hệ thống cũ</h4>
            <pre className="text-sm bg-gray-100 p-3 rounded">
              {`import { migrateFromOldUrgency } from "@/lib/types/urgency";

const newUrgency = migrateFromOldUrgency(oldPriority);`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Hệ thống này đảm bảo tính nhất quán trong việc hiển thị và xử lý độ
          khẩn trên toàn bộ ứng dụng quản lý văn bản.
        </p>
      </div>
    </div>
  );
}
