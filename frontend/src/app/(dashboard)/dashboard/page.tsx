"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Cylinder,
  TrendingUp,
  Scale,
  IndianRupee,
  Receipt,
  Users,
  Truck,
  Timer,
  Target,
  BarChart3,
  RefreshCw,
  Calendar,
  FileSpreadsheet,
  ClipboardList,
  Package,
  AlertTriangle,
  ArrowRight,
  Settings,
} from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { formatDate as formatDateNew } from "@/lib/formatters";
import apiClient from "@/lib/api-client";
import { useAuth, PermissionGuard, Permissions } from "@/lib/auth-context";

interface BeamSummary {
  total: number;
  available: number;
  inUse: number;
  maintenance: number;
}

interface PendingApproval {
  type: string;
  count: number;
  urgent: number;
}

interface RecentSizingSet {
  setNo: string;
  date: string;
  party: string;
  count: string;
  meters: number;
  status: string;
}

interface LowStockItem {
  count: string;
  lotNo: string | null;
  balance: number;
  minStock: number;
}

interface ExecutiveDashboardStats {
  // Primary KPIs
  activeSets: number;
  todayProduction: number;
  totalYarnStock: number;
  pendingInvoices: number;

  // Secondary KPIs
  todayReceipts: number;
  activeParties: number;
  pendingDeliveries: number;
  avgSetTime: number;
  todayInvoiceValue: number;
  mtdInvoiceValue: number;
  monthlyProduction: number;
  efficiency: number;

  // Summaries
  beamSummary: BeamSummary;
  pendingApprovals: PendingApproval[];
  recentSizingSets: RecentSizingSet[];
  lowStockItems: LowStockItem[];
}

const getStatusVariant = (status: string): "default" | "outline" | "grey" | "active" | "draft" | "approved" | "locked" | "cancelled" | null => {
  switch (status) {
    case "Authorized":
    case "Completed":
      return "approved";
    case "GM Approved":
    case "Running":
      return "active";
    case "Checked":
      return "outline";
    case "Prepared":
      return "grey";
    case "Draft":
      return "draft";
    case "Locked":
      return "locked";
    case "Cancelled":
      return "cancelled";
    default:
      return "default";
  }
};

const defaultStats: ExecutiveDashboardStats = {
  activeSets: 0,
  todayProduction: 0,
  totalYarnStock: 0,
  pendingInvoices: 0,
  todayReceipts: 0,
  activeParties: 0,
  pendingDeliveries: 0,
  avgSetTime: 0,
  todayInvoiceValue: 0,
  mtdInvoiceValue: 0,
  monthlyProduction: 0,
  efficiency: 0,
  beamSummary: { total: 0, available: 0, inUse: 0, maintenance: 0 },
  pendingApprovals: [],
  recentSizingSets: [],
  lowStockItems: [],
};

interface RecentYarnReceipt {
  id: number;
  receiptNo: string;
  receiptDate: string;
  partyName: string;
  lotNo: string | null;
  yarnCount: string | null;
  totalBags: number;
  totalNetWeight: number;
  status: string;
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("today");
  const [systemHealth, setSystemHealth] = useState<"healthy" | "grey" | "critical">("healthy");

  const { data: recentReceipts = [], refetch: refetchReceipts } = useQuery<RecentYarnReceipt[]>({
    queryKey: ["dashboard-recent-yarn-receipts"],
    queryFn: async () => {
      const response = await apiClient.get<any>("/api/yarnreceipts?pageSize=5&pageNumber=1");
      const d = response.data;
      const items = Array.isArray(d) ? d : (d?.items ?? []);
      return items.map((r: any) => ({
        id: r.id,
        receiptNo: r.receiptNo ?? r.receiptNumber ?? "",
        receiptDate: r.receiptDate ?? "",
        partyName: r.partyName ?? "",
        lotNo: r.lotNo ?? null,
        yarnCount: r.yarnCount ?? r.countCode ?? null,
        totalBags: r.totalBags ?? 0,
        totalNetWeight: r.totalNetWeight ?? 0,
        status: r.status ?? "Draft",
      }));
    },
    staleTime: 1000 * 30,
  });

  const { data: stats = defaultStats, isLoading, refetch, isFetching } = useQuery<ExecutiveDashboardStats>({
    queryKey: ["executive-dashboard"],
    queryFn: async () => {
      const response = await apiClient.get<any>("/api/dashboard/executive");
      const apiData = response.data?.data || response.data || {};

      // Map API response (PascalCase) to frontend (camelCase)
      return {
        activeSets: apiData.ActiveSets ?? apiData.activeSets ?? 0,
        todayProduction: apiData.TodayProduction ?? apiData.todayProduction ?? 0,
        totalYarnStock: apiData.TotalYarnStock ?? apiData.totalYarnStock ?? 0,
        pendingInvoices: apiData.PendingInvoices ?? apiData.pendingInvoices ?? 0,
        todayReceipts: apiData.TodayReceipts ?? apiData.todayReceipts ?? 0,
        activeParties: apiData.ActiveParties ?? apiData.activeParties ?? 0,
        pendingDeliveries: apiData.PendingDeliveries ?? apiData.pendingDeliveries ?? 0,
        avgSetTime: apiData.AvgSetTime ?? apiData.avgSetTime ?? 0,
        todayInvoiceValue: apiData.TodayInvoiceValue ?? apiData.todayInvoiceValue ?? 0,
        mtdInvoiceValue: apiData.MTDInvoiceValue ?? apiData.mtdInvoiceValue ?? 0,
        monthlyProduction: apiData.MonthlyProduction ?? apiData.monthlyProduction ?? 0,
        efficiency: apiData.Efficiency ?? apiData.efficiency ?? 0,
        beamSummary: {
          total: apiData.BeamSummary?.Total ?? apiData.beamSummary?.total ?? 0,
          available: apiData.BeamSummary?.Available ?? apiData.beamSummary?.available ?? 0,
          inUse: apiData.BeamSummary?.InUse ?? apiData.beamSummary?.inUse ?? 0,
          maintenance: apiData.BeamSummary?.Maintenance ?? apiData.beamSummary?.maintenance ?? 0,
        },
        pendingApprovals: (apiData.PendingApprovals ?? apiData.pendingApprovals ?? []).map((item: any) => ({
          type: item.Type ?? item.type ?? "",
          count: item.Count ?? item.count ?? 0,
          urgent: item.Urgent ?? item.urgent ?? 0,
        })),
        recentSizingSets: (apiData.RecentSizingSets ?? apiData.recentSizingSets ?? []).map((item: any) => ({
          setNo: item.SetNo ?? item.setNo ?? "",
          date: item.Date ?? item.date ?? new Date().toISOString(),
          party: item.Party ?? item.party ?? "",
          count: item.Count ?? item.count ?? "",
          meters: item.Meters ?? item.meters ?? 0,
          status: item.Status ?? item.status ?? "",
        })),
        lowStockItems: (apiData.LowStockItems ?? apiData.lowStockItems ?? []).map((item: any) => ({
          count: item.Count ?? item.count ?? "",
          lotNo: item.LotNo ?? item.lotNo ?? null,
          balance: item.Balance ?? item.balance ?? 0,
          minStock: item.MinStock ?? item.minStock ?? 0,
        })),
      };
    },
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (stats.pendingApprovals.some((item) => item.urgent > 0)) {
      setSystemHealth("critical");
    } else if (stats.lowStockItems.length > 5) {
      setSystemHealth("grey");
    } else {
      setSystemHealth("healthy");
    }
  }, [stats.pendingApprovals, stats.lowStockItems]);


  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";
  const userFirstName = user?.fullName?.split(' ')[0] || 'User';
  const currentDate = new Date();

  const primaryKPIs = [
    { title: "Active Sets", value: stats.activeSets, icon: Cylinder, color: "blue" },
    { title: "Today's Production", value: stats.todayProduction, icon: TrendingUp, unit: "m", color: "emerald" },
    { title: "Total Yarn Stock", value: stats.totalYarnStock, icon: Scale, unit: "kg", color: "amber" },
    { title: "Pending Invoices", value: stats.pendingInvoices, icon: IndianRupee, color: "rose" },
  ];

  const secondaryKPIs = [
    { label: "Today's Receipts", value: stats.todayReceipts, suffix: "", icon: Receipt },
    { label: "Active Parties", value: stats.activeParties, suffix: "", icon: Users },
    { label: "Pending Deliveries", value: stats.pendingDeliveries, suffix: "", icon: Truck },
    { label: "Avg Set Time", value: stats.avgSetTime, suffix: "hrs", icon: Timer },
    { label: "Efficiency", value: stats.efficiency, suffix: "%", icon: Target },
    { label: "MTD Revenue", value: stats.mtdInvoiceValue / 100000, suffix: "L", icon: BarChart3 },
  ];

  const quickActions = [
    { label: "Yarn Receipt", href: "/sizing/yarn-receipt/new", icon: Receipt, color: "bg-blue-500" },
    { label: "Warping", href: "/sizing/warping-job-card/new", icon: FileSpreadsheet, color: "bg-emerald-500" },
    { label: "Sizing Set", href: "/sizing/sizing-job-card/new", icon: ClipboardList, color: "bg-violet-500" },
    { label: "Yarn Return", href: "/sizing/yarn-return/new", icon: Package, color: "bg-amber-500" },
    { label: "Invoice", href: "/sizing/invoices/new", icon: IndianRupee, color: "bg-rose-500" },
    { label: "Reports", href: "/reports/yarn-stock", icon: BarChart3, color: "bg-cyan-500" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1400px] space-y-5">

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{greeting}, {userFirstName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {currentDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 text-xs px-2.5 py-1 border-gray-200 bg-white">
              <span className={`h-2 w-2 rounded-full ${systemHealth === "healthy" ? "bg-emerald-500" : systemHealth === "grey" ? "bg-orange-500" : "bg-red-500"}`} />
              System {systemHealth === "healthy" ? "Healthy" : systemHealth === "grey" ? "Warning" : "Critical"}
            </Badge>
            <Button variant="outline" size="sm" className="gap-1.5 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 h-8" onClick={() => { refetch(); refetchReceipts(); }} disabled={isFetching}>
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 h-8"
              onClick={() => setSelectedPeriod((prev) => (prev === "today" ? "week" : prev === "week" ? "month" : "today"))}
            >
              <Calendar className="h-3.5 w-3.5" />
              {selectedPeriod === "today" ? "Today" : selectedPeriod === "week" ? "This Week" : "This Month"}
            </Button>
          </div>
        </div>

        {/* Primary KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {primaryKPIs.map((kpi) => {
            const Icon = kpi.icon;
            const iconBg = kpi.color === "blue" ? "bg-blue-100" : 
                          kpi.color === "emerald" ? "bg-emerald-100" :
                          kpi.color === "amber" ? "bg-amber-100" : "bg-rose-100";
            const iconText = kpi.color === "blue" ? "text-blue-600" : 
                            kpi.color === "emerald" ? "text-emerald-600" :
                            kpi.color === "amber" ? "text-amber-600" : "text-rose-600";
            return (
              <Card key={kpi.title} className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{kpi.title}</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl md:text-3xl font-bold text-gray-900 tabular-nums">
                          {formatNumber(kpi.value, kpi.unit === "kg" ? 1 : 0)}
                        </span>
                        {kpi.unit && <span className="text-sm font-medium text-gray-400">{kpi.unit}</span>}
                      </div>
                    </div>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
                      <Icon className={`h-5 w-5 ${iconText}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {secondaryKPIs.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="bg-white border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{kpi.label}</p>
                  </div>
                  <p className="text-xl font-bold text-gray-900 tabular-nums">
                    {formatNumber(kpi.value, ["%", "L", "hrs"].includes(kpi.suffix) ? 1 : 0)}
                    <span className="text-xs text-gray-400 ml-0.5 font-medium">{kpi.suffix}</span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Beam Availability */}
        {stats.beamSummary.total > 0 && (
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center gap-2">
                <Cylinder className="h-4 w-4 text-orange-500" />
                <CardTitle className="text-base font-bold text-orange-600">Beam Availability</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 tabular-nums">{stats.beamSummary.total}</p>
                  <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wide">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-500 tabular-nums">{stats.beamSummary.available}</p>
                  <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wide">Available</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-500 tabular-nums">{stats.beamSummary.inUse}</p>
                  <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wide">In Use</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-500 tabular-nums">{stats.beamSummary.maintenance}</p>
                  <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wide">Maintenance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Low Stock Warning */}
        {stats.lowStockItems.length > 0 && (
          <Card className="border border-amber-200 bg-amber-50/80 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-sm font-bold text-amber-800">Low Stock Alert</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {stats.lowStockItems.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-amber-200/60">
                    <p className="font-semibold text-sm text-gray-900">{item.count}</p>
                    {item.lotNo && <p className="text-xs text-gray-500">Lot: {item.lotNo}</p>}
                    <p className="text-base font-bold text-amber-600 mt-1">{formatNumber(item.balance, 1)} kg</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-gray-900">Quick Actions</CardTitle>
              <Link href="/settings/system" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                <Settings className="h-3 w-3" />
                Manage Shortcuts
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href} className="group">
                    <div className="flex flex-col items-center gap-2.5 py-2">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${action.color} shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 text-center transition-colors">{action.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tables - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Recent Yarn Receipts */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-gray-900">Recent Yarn Receipts</CardTitle>
              <Link href="/sizing/yarn-receipt">
                <Button variant="ghost" size="sm" className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 text-xs">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-5 pb-5 overflow-x-auto">
              {recentReceipts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100">
                      <TableHead className="text-xs font-semibold text-gray-400">Receipt No.</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-400">Date</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-400">Party</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-400 text-right">Net Wt</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-400 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentReceipts.map((r) => (
                      <TableRow key={r.id} className="hover:bg-gray-50/50 border-gray-100">
                        <TableCell className="font-medium text-blue-600 text-sm py-2.5">
                          <Link href={`/sizing/yarn-receipt/${r.id}`}>{r.receiptNo}</Link>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 py-2.5">{formatDateNew(r.receiptDate)}</TableCell>
                        <TableCell className="text-sm text-gray-600 py-2.5 max-w-[120px] truncate">{r.partyName}</TableCell>
                        <TableCell className="text-right text-sm text-gray-900 font-medium py-2.5 tabular-nums">{formatNumber(r.totalNetWeight, 1)}</TableCell>
                        <TableCell className="text-right py-2.5">
                          <Badge variant={r.status === "Approved" ? "approved" : r.status === "Draft" ? "grey" : "outline"} className="text-[10px]">
                            {r.status === "Draft" ? "Pending" : r.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No yarn receipts found. <Link href="/sizing/yarn-receipt/new" className="text-blue-600 hover:underline">Add one now</Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sizing Sets */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-gray-900">Recent Sizing Sets</CardTitle>
              <Link href="/sizing/sizing-job-card">
                <Button variant="ghost" size="sm" className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 text-xs">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="px-5 pb-5 overflow-x-auto">
              {stats.recentSizingSets.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100">
                      <TableHead className="text-xs font-semibold text-gray-400">Set No.</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-400">Date</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-400">Party</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-400 text-right">Meters</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-400 text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentSizingSets.map((set) => (
                      <TableRow key={set.setNo} className="hover:bg-gray-50/50 border-gray-100">
                        <TableCell className="font-medium text-sm text-gray-900 py-2.5">{set.setNo}</TableCell>
                        <TableCell className="text-sm text-gray-500 py-2.5">{formatDateNew(set.date)}</TableCell>
                        <TableCell className="text-sm text-gray-600 py-2.5 max-w-[120px] truncate">{set.party}</TableCell>
                        <TableCell className="text-right text-sm text-gray-900 font-medium py-2.5 tabular-nums">{formatNumber(set.meters)}</TableCell>
                        <TableCell className="text-right py-2.5">
                          <Badge variant={getStatusVariant(set.status)} className="gap-1 text-[10px]">
                            {set.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No recent sizing sets found
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

