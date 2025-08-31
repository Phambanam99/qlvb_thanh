"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  dashboardAPI,
  ComprehensiveDashboardStats,
  DocumentSummaryDTO,
  WorkPlanSummaryDTO,
} from "@/lib/api/dashboard";
import {
  FileText,
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Building,
  User,
  Settings,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  RefreshCw,
} from "lucide-react";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ff7300",
];

export default function DashboardPage() {
  const { toast } = useToast();
  const { user, hasRole, setDataLoaded } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<ComprehensiveDashboardStats | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  // Determine user role category for better UX
  const isAdmin = hasRole([
    "ROLE_ADMIN",
    "ROLE_VAN_THU",
    "ROLE_CUC_TRUONG",
    "ROLE_CUC_PHO",
    "ROLE_CHINH_UY",
    "ROLE_PHO_CHINH_UY",
  ]);

  const isLeadership = hasRole([
    "ROLE_TRUONG_PHONG",
    "ROLE_PHO_PHONG",
    "ROLE_TRUONG_BAN",
    "ROLE_PHO_BAN",
    "ROLE_TRAM_TRUONG",
    "ROLE_PHO_TRAM_TRUONG",
    "ROLE_CUM_TRUONG",
    "ROLE_PHO_CUM_TRUONG",
    "ROLE_CHINH_TRI_VIEN_TRAM",
  ]);

  const isStaff = hasRole(["ROLE_NHAN_VIEN", "ROLE_TRO_LY"]);

  useEffect(() => {
    if (user) {
      // Không block UI, fetch data trong background
      fetchDashboardData().finally(() => {
        // Đảm bảo setDataLoaded được gọi sau khi fetch xong
        if (typeof setDataLoaded === 'function') {
          setDataLoaded();
        }
      });
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Use the main comprehensive dashboard API - single call instead of multiple
      const stats = await dashboardAPI.getDashboardStats();
      setDashboardStats(stats);

      // Fetch schedule data separately since it might not be included in main stats
      try {
        const schedule = await dashboardAPI.getTodayScheduleEvents();
        setTodaySchedule(schedule);
      } catch (scheduleError) {
        setTodaySchedule([]);
      }

    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast({
      title: "Thành công",
      description: "Dữ liệu đã được cập nhật.",
    });
  };

  const formatNumber = (num: number | undefined) => {
    if (!num) return "0";
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const getUserRoleDisplay = () => {
    if (isAdmin) return "Quản trị viên";
    if (isLeadership) return "Lãnh đạo";
    if (isStaff) return "Nhân viên";
    return "Người dùng";
  };

  const getRoleAccessMessage = () => {
    if (isAdmin) return "Dữ liệu toàn hệ thống";
    if (isLeadership) return "Dữ liệu phòng ban";
    return "Dữ liệu cá nhân";
  };

  const QuickStatsCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color = "blue",
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: "up" | "down";
    trendValue?: string;
    color?: string;
  }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 text-${color}-500`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatNumber(Number(value))}</div>
        {trend && trendValue && (
          <p
            className={`text-xs flex items-center mt-1 ${
              trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {trendValue}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const PendingDocumentsCard = ({
    documents,
  }: {
    documents: DocumentSummaryDTO[];
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Văn bản cần xử lý khẩn
        </CardTitle>
        <CardDescription>
          {documents?.length || 0} văn bản đang chờ xử lý
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents?.slice(0, 5).map((doc, index) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 bg-amber-50 rounded-lg"
          >
            <div className="flex-1">
              <p className="font-medium text-sm">{doc.title}</p>
              <p className="text-xs text-muted-foreground">
                Số: {doc.documentNumber} • Loại: {doc.documentType}
              </p>
              {doc.deadline && (
                <p className="text-xs text-amber-600 flex items-center mt-1">
                  <Clock className="h-3 w-3 mr-1" />
                  Hạn: {new Date(doc.deadline).toLocaleDateString("vi-VN")}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="ml-2">
              {doc.status}
            </Badge>
          </div>
        ))}
        {documents?.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>Tuyệt vời! Không có văn bản nào cần xử lý khẩn.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const WorkPlansCard = ({
    workPlans,
  }: {
    workPlans: WorkPlanSummaryDTO[];
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Kế hoạch công việc
        </CardTitle>
        <CardDescription>
          {workPlans?.length || 0} kế hoạch đang thực hiện
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {workPlans?.slice(0, 3).map((plan, index) => (
          <div key={plan.id} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-sm">{plan.title}</p>
              <Badge
                variant={plan.status === "ACTIVE" ? "default" : "secondary"}
              >
                {plan.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {plan.department} • {plan.period}
            </p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Tiến độ: {plan.completedTasks}/{plan.totalTasks} công việc
              </div>
              <div className="text-xs font-medium text-blue-600">
                {plan.progress}
              </div>
            </div>
          </div>
        ))}
        {workPlans?.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2" />
            <p>Chưa có kế hoạch công việc nào.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const TodayScheduleCard = ({ schedule }: { schedule: any[] }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-500" />
          Lịch hôm nay
        </CardTitle>
        <CardDescription>
          {schedule?.length || 0} sự kiện trong ngày
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {schedule?.slice(0, 5).map((event, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
          >
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="font-medium text-sm">{event.title}</p>
              <p className="text-xs text-muted-foreground">
                {event.startTime} - {event.endTime}
              </p>
              {event.location && (
                <p className="text-xs text-green-600">{event.location}</p>
              )}
            </div>
          </div>
        ))}
        {schedule?.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2" />
            <p>Không có sự kiện nào trong ngày hôm nay.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-24 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardStats) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
              <h3 className="text-lg font-medium">Không thể tải dữ liệu</h3>
              <p className="text-muted-foreground mb-4">
                Đã xảy ra lỗi khi tải thông tin dashboard
              </p>
              <Button onClick={fetchDashboardData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats - Improved with better data mapping */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickStatsCard
          title="Văn bản đến"
          value={dashboardStats.incomingDocuments?.total || 0}
          icon={FileText}
          trend={
            dashboardStats.periodStats?.weekGrowthPercent &&
            dashboardStats.periodStats.weekGrowthPercent >= 0
              ? "up"
              : "down"
          }
          trendValue={
            dashboardStats.periodStats?.weekGrowthPercent !== undefined
              ? `${Math.abs(dashboardStats.periodStats.weekGrowthPercent).toFixed(1)}% tuần này`
              : undefined
          }
          color="blue"
        />
        <QuickStatsCard
          title="Văn bản đi"
          value={dashboardStats.outgoingDocuments?.total || 0}
          icon={FileText}
          trend={
            dashboardStats.periodStats?.monthGrowthPercent &&
            dashboardStats.periodStats.monthGrowthPercent >= 0
              ? "up"
              : "down"
          }
          trendValue={
            dashboardStats.periodStats?.monthGrowthPercent !== undefined
              ? `${Math.abs(dashboardStats.periodStats.monthGrowthPercent).toFixed(1)}% tháng này`
              : undefined
          }
          color="green"
        />
        <QuickStatsCard
          title="Cần xử lý"
          value={
            (dashboardStats.incomingDocuments?.inProcess || 0) +
            (dashboardStats.outgoingDocuments?.pending || 0)
          }
          icon={Clock}
          trend={
            ((dashboardStats.incomingDocuments?.inProcess || 0) + 
             (dashboardStats.outgoingDocuments?.pending || 0)) <= 
            ((dashboardStats.incomingDocuments?.total || 0) * 0.3)
              ? "up"
              : "down"
          }
          trendValue={
            dashboardStats.incomingDocuments?.total
              ? `${(
                  (((dashboardStats.incomingDocuments.inProcess || 0) + 
                    (dashboardStats.outgoingDocuments?.pending || 0)) /
                   Math.max(dashboardStats.incomingDocuments.total, 1)) *
                  100
                ).toFixed(1)}% tổng số`
              : undefined
          }
          color="amber"
        />
        <QuickStatsCard
          title="Chưa đọc"
          value={
            (dashboardStats.overallStats?.totalUnread || 0) +
            (dashboardStats.internalDocuments?.unread || 0)
          }
          icon={Activity}
          color="red"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Văn bản
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Lịch trình
          </TabsTrigger>
          {(isAdmin || isLeadership) && (
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Phân tích
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <PendingDocumentsCard
              documents={[]} // This would need to be populated from backend
            />
            <WorkPlansCard
              workPlans={[]} // This would need to be populated from backend  
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TodayScheduleCard schedule={todaySchedule} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Văn bản gần đây
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardStats.recentDocuments
                  ?.slice(0, 5)
                  .map((doc: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {doc.title || doc.documentNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.documentType} •{" "}
                          {new Date(
                            doc.createdDate || doc.receivedDate
                          ).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <Badge variant="outline">{doc.status}</Badge>
                    </div>
                  ))}
                {(!dashboardStats.recentDocuments ||
                  dashboardStats.recentDocuments.length === 0) && (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2" />
                    <p>Chưa có văn bản gần đây.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Văn bản đến</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Tổng số:
                    </span>
                    <span className="font-medium">
                      {formatNumber(dashboardStats.incomingDocuments?.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Bên ngoài:
                    </span>
                    <span className="font-medium text-blue-600">
                      {formatNumber(dashboardStats.incomingDocuments?.external || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Nội bộ:
                    </span>
                    <span className="font-medium text-green-600">
                      {formatNumber(dashboardStats.incomingDocuments?.internal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Chưa xử lý:
                    </span>
                    <span className="font-medium text-amber-600">
                      {formatNumber(dashboardStats.incomingDocuments?.notProcessed || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Đã xử lý:
                    </span>
                    <span className="font-medium text-green-600">
                      {formatNumber(dashboardStats.incomingDocuments?.processed || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Văn bản đi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Tổng số:
                    </span>
                    <span className="font-medium">
                      {formatNumber(dashboardStats.outgoingDocuments?.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Bên ngoài:
                    </span>
                    <span className="font-medium text-blue-600">
                      {formatNumber(dashboardStats.outgoingDocuments?.external || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Nội bộ:
                    </span>
                    <span className="font-medium text-green-600">
                      {formatNumber(dashboardStats.outgoingDocuments?.internal || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Đã gửi:
                    </span>
                    <span className="font-medium text-green-600">
                      {formatNumber(dashboardStats.outgoingDocuments?.published || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Bản nháp:
                    </span>
                    <span className="font-medium text-gray-600">
                      {formatNumber(dashboardStats.outgoingDocuments?.draft || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Văn bản nội bộ đến</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Tổng số:
                    </span>
                    <span className="font-medium">
                      {formatNumber(
                        dashboardStats.internalDocuments?.receivedTotal || 
                        dashboardStats.internalDocuments?.received || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Đã đọc:
                    </span>
                    <span className="font-medium text-green-600">
                      {formatNumber(
                        dashboardStats.internalDocuments?.receivedRead || 
                        ((dashboardStats.internalDocuments?.received || 0) - 
                         (dashboardStats.internalDocuments?.unread || 0))
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Chưa đọc:
                    </span>
                    <span className="font-medium text-amber-600">
                      {formatNumber(
                        dashboardStats.internalDocuments?.receivedUnread || 
                        dashboardStats.internalDocuments?.unread || 0
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Văn bản nội bộ đi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Tổng số:
                    </span>
                    <span className="font-medium">
                      {formatNumber(
                        dashboardStats.internalDocuments?.sentTotal || 
                        dashboardStats.internalDocuments?.sent || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Đã gửi:
                    </span>
                    <span className="font-medium text-blue-600">
                      {formatNumber(
                        dashboardStats.internalDocuments?.sentSent || 
                        dashboardStats.internalDocuments?.sent || 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Bản nháp:
                    </span>
                    <span className="font-medium text-gray-600">
                      {formatNumber(
                        dashboardStats.internalDocuments?.sentDraft || 0
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document Trends Chart for Admin/Leadership */}
          {(isAdmin || isLeadership) && (
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng văn bản theo thời gian</CardTitle>
                <CardDescription>
                  Thống kê số lượng văn bản theo từng khoảng thời gian
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={[
                      {
                        period: "Hôm qua",
                        count: dashboardStats.periodStats?.yesterdayCount || 0,
                      },
                      {
                        period: "Hôm nay",
                        count: dashboardStats.periodStats?.todayCount || 0,
                      },
                      {
                        period: "Tuần trước",
                        count: dashboardStats.periodStats?.lastWeekCount || 0,
                      },
                      {
                        period: "Tuần này",
                        count: dashboardStats.periodStats?.thisWeekCount || 0,
                      },
                      {
                        period: "Tháng trước",
                        count: dashboardStats.periodStats?.lastMonthCount || 0,
                      },
                      {
                        period: "Tháng này",
                        count: dashboardStats.periodStats?.thisMonthCount || 0,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <TodayScheduleCard schedule={todaySchedule} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Thông tin khẩn cấp
                </CardTitle>
                <CardDescription>
                  Văn bản và công việc cần chú ý
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardStats.overallStats?.totalUrgent && dashboardStats.overallStats.totalUrgent > 0 ? (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium text-sm text-red-800">
                          {dashboardStats.overallStats.totalUrgent} văn bản khẩn cấp
                        </p>
                        <p className="text-xs text-red-600">
                          Cần xử lý ngay lập tức
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>Không có văn bản khẩn cấp nào.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {(isAdmin || isLeadership) && (
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Status Breakdown Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Phân bố trạng thái văn bản đến</CardTitle>
                  <CardDescription>
                    Phân bố văn bản đến theo trạng thái xử lý
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Chưa xử lý",
                            value: dashboardStats.incomingDocuments?.notProcessed || 0,
                          },
                          {
                            name: "Đang xử lý",
                            value: dashboardStats.incomingDocuments?.inProcess || 0,
                          },
                          {
                            name: "Đã xử lý",
                            value: dashboardStats.incomingDocuments?.processed || 0,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: "Chưa xử lý", value: dashboardStats.incomingDocuments?.notProcessed || 0 },
                          { name: "Đang xử lý", value: dashboardStats.incomingDocuments?.inProcess || 0 },
                          { name: "Đã xử lý", value: dashboardStats.incomingDocuments?.processed || 0 },
                        ].map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Hiệu suất xử lý</CardTitle>
                  <CardDescription>
                    Chỉ số hiệu suất dựa trên dữ liệu thực tế
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tỷ lệ xử lý hoàn tất</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              ((dashboardStats.incomingDocuments?.processed || 0) /
                                Math.max(dashboardStats.incomingDocuments?.total || 1, 1)) *
                                100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {(
                          ((dashboardStats.incomingDocuments?.processed || 0) /
                            Math.max(dashboardStats.incomingDocuments?.total || 1, 1)) *
                          100
                        ).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tăng trưởng tuần</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              Math.abs(dashboardStats.periodStats?.weekGrowthPercent || 0),
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {(dashboardStats.periodStats?.weekGrowthPercent || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tăng trưởng tháng</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              Math.abs(dashboardStats.periodStats?.monthGrowthPercent || 0),
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {(dashboardStats.periodStats?.monthGrowthPercent || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Tổng quan hệ thống</CardTitle>
                <CardDescription>
                  Thống kê tổng thể về hoạt động của hệ thống dựa trên quyền truy cập
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(dashboardStats.overallStats?.totalDocuments || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Tổng văn bản
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(dashboardStats.incomingDocuments?.total || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Văn bản đến
                    </div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">
                      {formatNumber(dashboardStats.outgoingDocuments?.total || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Văn bản đi
                    </div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {formatNumber(dashboardStats.overallStats?.totalUrgent || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Khẩn cấp</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
