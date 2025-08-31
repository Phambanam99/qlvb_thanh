import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScheduleWeekView from "@/components/schedule-week-view";
import ScheduleMonthView from "@/components/schedule-month-view";
import ScheduleList from "@/components/schedule-list";
import { ScheduleSkeleton } from "./schedule-skeleton";
import { EmptyState } from "./empty-state";
import { SchedulePagination } from "./schedule-pagination";
import { ScheduleTable } from "./schedule-table";

type ViewMode = "week" | "month" | "list" | "table";

interface ScheduleTabsProps {
  schedules: any[];
  isLoading: boolean;
  viewMode: ViewMode;
  departmentFilter: string;
  getSchedulesByStatus: (status: string) => any[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function ScheduleTabs({
  schedules,
  isLoading,
  viewMode,
  departmentFilter,
  getSchedulesByStatus,
  currentPage,
  pageSize,
  totalElements,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: ScheduleTabsProps) {
  const renderScheduleView = (scheduleList: any[]) => {
    if (isLoading) {
      return <ScheduleSkeleton viewMode={viewMode} />;
    }

    if (scheduleList.length === 0) {
      return <EmptyState />;
    }

    // For table view, render the table directly with pagination
    if (viewMode === "table") {
      return (
        <ScheduleTable
          schedules={scheduleList}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      );
    }

    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-0">
            {viewMode === "week" && (
              <ScheduleWeekView
                date={new Date()}
                department={departmentFilter}
                type="all"
                schedules={scheduleList}
              />
            )}
            {viewMode === "month" && (
              <ScheduleMonthView
                date={new Date()}
                department={departmentFilter}
                type="all"
                schedules={scheduleList}
              />
            )}
            {viewMode === "list" && (
              <ScheduleList
                date={new Date()}
                department={departmentFilter}
                type="all"
                schedules={scheduleList}
              />
            )}
          </CardContent>
        </Card>

        {/* Show pagination only for list view and when there are results */}
        {viewMode === "list" && scheduleList.length > 0 && (
          <SchedulePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        )}
      </div>
    );
  };

  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">Tất cả ({schedules.length})</TabsTrigger>
        <TabsTrigger value="chua_dien_ra">
          Chưa diễn ra ({getSchedulesByStatus("chua_dien_ra").length})
        </TabsTrigger>
        <TabsTrigger value="dang_thuc_hien">
          Đang thực hiện ({getSchedulesByStatus("dang_thuc_hien").length})
        </TabsTrigger>
        <TabsTrigger value="da_thuc_hien">
          Đã thực hiện ({getSchedulesByStatus("da_thuc_hien").length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-4">
        {renderScheduleView(schedules)}
      </TabsContent>

      <TabsContent value="chua_dien_ra" className="mt-4">
        {renderScheduleView(getSchedulesByStatus("chua_dien_ra"))}
      </TabsContent>

      <TabsContent value="dang_thuc_hien" className="mt-4">
        {renderScheduleView(getSchedulesByStatus("dang_thuc_hien"))}
      </TabsContent>

      <TabsContent value="da_thuc_hien" className="mt-4">
        {renderScheduleView(getSchedulesByStatus("da_thuc_hien"))}
      </TabsContent>
    </Tabs>
  );
}
