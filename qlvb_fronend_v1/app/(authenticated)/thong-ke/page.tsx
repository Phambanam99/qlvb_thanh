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
  DashboardDTO,
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

interface DashboardStats {
  systemStats?: Record<string, any>;
  userStats?: DashboardDTO;
  quickMetrics?: Record<string, any>;
  statusBreakdown?: Record<string, any>;
  incomingStats?: Record<string, any>;
  outgoingStats?: Record<string, any>;
  internalStats?: Record<string, any>;
  recentDocuments?: any[];
  todaySchedule?: any[];
}

export default function DashboardPage() {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);

  // Determine user role category
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
    "ROLE_TRUONG_BAN",
    "ROLE_TRAM_TRUONG",
    "ROLE_PHO_TRAM_TRUONG",
    "ROLE_CUM_TRUONG",
    "ROLE_CUM_PHO"
  ]);

  const isStaff = hasRole(["ROLE_NHAN_VIEN", "ROLE_TRO_LY"]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const promises: Promise<any>[] = [];

      // Fetch user's dashboard stats
      promises.push(
        dashboardAPI.getCurrentUserDashboardStatistics().catch(() => null)
      );

      // Fetch quick metrics
      promises.push(dashboardAPI.getQuickMetrics().catch(() => null));

      // Admin and leadership get more comprehensive data
      if (isAdmin || isLeadership) {
        promises.push(
          dashboardAPI.getSystemDashboardStatistics().catch(() => null),
          dashboardAPI.getStatusBreakdown().catch(() => null),
          dashboardAPI.getIncomingDocumentStats().catch(() => null),
          dashboardAPI.getOutgoingDocumentStats().catch(() => null),
          dashboardAPI.getInternalDocumentStats().catch(() => null)
        );
      }

      // Everyone gets today's schedule and recent documents
      promises.push(
        dashboardAPI.getTodayScheduleEvents().catch(() => []),
        dashboardAPI.getRecentDocuments().catch(() => [])
      );

      const results_ = await Promise.all(promises);
      const results = results_.map((result) => result.data);

      const stats: DashboardStats = {
        userStats: results[0],
        quickMetrics: results[1],
      };

      if (isAdmin || isLeadership) {
        stats.systemStats = results[2];
        stats.statusBreakdown = results[3];
        stats.incomingStats = results[4];
        stats.outgoingStats = results[5];
        stats.internalStats = results[6];
        stats.todaySchedule = results[7];
        stats.recentDocuments = results[8];
      } else {
        stats.todaySchedule = results[2];
        stats.recentDocuments = results[3];
      }

      setDashboardStats(stats);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            {getGreeting()}, {user?.fullName}! 👋
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <User className="h-4 w-4" />
            {getUserRoleDisplay()} • {user?.departmentName}
            <Badge variant="outline" className="ml-2">
              {user?.roles?.[0]?.replace("ROLE_", "")}
            </Badge>
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-full md:w-auto"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickStatsCard
          title="Văn bản đến"
          value={
            dashboardStats.userStats?.incomingDocumentCount ||
            dashboardStats.quickMetrics?.incomingCount ||
            0
          }
          icon={FileText}
          trend="up"
          trendValue="+12% tuần này"
          color="blue"
        />
        <QuickStatsCard
          title="Văn bản đi"
          value={
            dashboardStats.userStats?.outgoingDocumentCount ||
            dashboardStats.quickMetrics?.outgoingCount ||
            0
          }
          icon={FileText}
          trend="up"
          trendValue="+8% tuần này"
          color="green"
        />
        <QuickStatsCard
          title="Cần xử lý"
          value={
            dashboardStats.userStats?.pendingDocumentCount ||
            dashboardStats.quickMetrics?.pendingCount ||
            0
          }
          icon={Clock}
          trend="down"
          trendValue="-5% tuần này"
          color="amber"
        />
        <QuickStatsCard
          title="Thông báo"
          value={
            dashboardStats.userStats?.unreadNotifications ||
            dashboardStats.quickMetrics?.notificationCount ||
            0
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
              documents={dashboardStats.userStats?.pendingDocuments || []}
            />
            <WorkPlansCard
              workPlans={dashboardStats.userStats?.activeWorkPlans || []}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TodayScheduleCard schedule={dashboardStats.todaySchedule || []} />

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
          <div className="grid gap-4 md:grid-cols-3">
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
                      {formatNumber(dashboardStats.incomingStats?.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Chưa đọc:
                    </span>
                    <span className="font-medium text-amber-600">
                      {formatNumber(dashboardStats.incomingStats?.unread || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Đã xử lý:
                    </span>
                    <span className="font-medium text-green-600">
                      {formatNumber(
                        dashboardStats.incomingStats?.processed || 0
                      )}
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
                      {formatNumber(dashboardStats.outgoingStats?.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Đã gửi:
                    </span>
                    <span className="font-medium text-blue-600">
                      {formatNumber(dashboardStats.outgoingStats?.sent || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Bản nháp:
                    </span>
                    <span className="font-medium text-gray-600">
                      {formatNumber(dashboardStats.outgoingStats?.draft || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Văn bản nội bộ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Tổng số:
                    </span>
                    <span className="font-medium">
                      {formatNumber(dashboardStats.internalStats?.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Đã đọc:
                    </span>
                    <span className="font-medium text-green-600">
                      {formatNumber(dashboardStats.internalStats?.read || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Chưa đọc:
                    </span>
                    <span className="font-medium text-amber-600">
                      {formatNumber(dashboardStats.internalStats?.unread || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document Trends Chart */}
          {(isAdmin || isLeadership) &&
            dashboardStats.systemStats?.documentsByMonth && (
              <Card>
                <CardHeader>
                  <CardTitle>Xu hướng văn bản theo tháng</CardTitle>
                  <CardDescription>
                    Thống kê số lượng văn bản đến và đi theo từng tháng
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={Object.entries(
                        dashboardStats.systemStats.documentsByMonth
                      ).map(([month, count]) => ({
                        month,
                        count,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
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
            <TodayScheduleCard schedule={dashboardStats.todaySchedule || []} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Sắp đến hạn
                </CardTitle>
                <CardDescription>
                  Văn bản và công việc sắp đến hạn xử lý
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardStats.userStats?.upcomingDeadlines
                  ?.slice(0, 5)
                  .map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.documentNumber} • {item.documentType}
                        </p>
                        <p className="text-xs text-red-600 flex items-center mt-1">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Hạn:{" "}
                          {item.deadline
                            ? new Date(item.deadline).toLocaleDateString(
                                "vi-VN"
                              )
                            : "Chưa có"}
                        </p>
                      </div>
                      <Badge variant="destructive">Khẩn</Badge>
                    </div>
                  ))}
                {(!dashboardStats.userStats?.upcomingDeadlines ||
                  dashboardStats.userStats.upcomingDeadlines.length === 0) && (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>Không có công việc nào sắp đến hạn.</p>
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
                  <CardTitle>Phân bố trạng thái</CardTitle>
                  <CardDescription>
                    Phân bố văn bản theo trạng thái xử lý
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={
                          dashboardStats.statusBreakdown
                            ? Object.entries(
                                dashboardStats.statusBreakdown
                              ).map(([status, count]) => ({
                                name: status,
                                value: count,
                              }))
                            : []
                        }
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
                        {dashboardStats.statusBreakdown &&
                          Object.entries(dashboardStats.statusBreakdown).map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
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
                    Chỉ số hiệu suất của hệ thống
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardStats.systemStats?.performanceMetrics &&
                    Object.entries(
                      dashboardStats.systemStats.performanceMetrics
                    ).map(([metric, value]) => (
                      <div
                        key={metric}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm font-medium">{metric}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min(Number(value) || 0, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {typeof value === "number"
                              ? value.toFixed(1)
                              : String(value)}
                            %
                          </span>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>

            {/* System Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Tổng quan hệ thống</CardTitle>
                <CardDescription>
                  Thống kê tổng thể về hoạt động của hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(
                        dashboardStats.systemStats?.totalDocuments || 0
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Tổng văn bản
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(
                        dashboardStats.systemStats?.incomingDocumentCount || 0
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Văn bản đến
                    </div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">
                      {formatNumber(
                        dashboardStats.systemStats?.outgoingDocumentCount || 0
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Văn bản đi
                    </div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {formatNumber(
                        dashboardStats.systemStats?.overdueDocumentCount || 0
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Quá hạn</div>
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
