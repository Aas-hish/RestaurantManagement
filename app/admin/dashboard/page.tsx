"use client"

import { useEffect, useState, useMemo } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { useOrders } from "@/hooks/use-orders"
import { useAuth } from "@/context/auth-context"
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react"
import {
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  calculateRevenueFromOrders,
  getOrdersCount,
  getWeeklyRevenueData,
  getMonthlyRevenueData,
} from "@/utils/revenue-utils"
import type { Order } from "@/types"

export default function AdminDashboard() {
  const { userProfile } = useAuth()
  const { orders: allOrders } = useOrders()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"today" | "yesterday" | "week" | "month">("today")

  const restaurantId = (userProfile as any)?.ownerId || userProfile?.id

  // Filter delivered orders only for revenue calculations
  const deliveredOrders = useMemo(
    () => allOrders.filter((o) => o.status === "delivered"),
    [allOrders],
  )

  // Get dates for different time periods
  const todayStart = getStartOfDay()
  const todayEnd = getEndOfDay()
  
  // Yesterday's dates
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const yesterdayEnd = new Date(todayEnd)
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1)
  
  const weekStart = getStartOfWeek()
  const weekEnd = getEndOfWeek()
  const monthStart = getStartOfMonth()
  const monthEnd = getEndOfMonth()

  // Calculate stats for each time period
  const todayRevenue = useMemo(
    () => calculateRevenueFromOrders(deliveredOrders, todayStart, todayEnd),
    [deliveredOrders, todayStart, todayEnd],
  )
  const todayOrders = useMemo(
    () => deliveredOrders.filter(o => {
      const orderDate = new Date(o.timestamp)
      return orderDate >= todayStart && orderDate <= todayEnd
    }).length,
    [deliveredOrders, todayStart, todayEnd],
  )

  const yesterdayRevenue = useMemo(
    () => calculateRevenueFromOrders(deliveredOrders, yesterdayStart, yesterdayEnd),
    [deliveredOrders, yesterdayStart, yesterdayEnd],
  )
  const yesterdayOrders = useMemo(
    () => deliveredOrders.filter(o => {
      const orderDate = new Date(o.timestamp)
      return orderDate >= yesterdayStart && orderDate <= yesterdayEnd
    }).length,
    [deliveredOrders, yesterdayStart, yesterdayEnd],
  )

  const weekRevenue = useMemo(
    () => calculateRevenueFromOrders(deliveredOrders, weekStart, weekEnd),
    [deliveredOrders, weekStart, weekEnd],
  )
  const weekOrders = useMemo(
    () => deliveredOrders.filter(o => {
      const orderDate = new Date(o.timestamp)
      return orderDate >= weekStart && orderDate <= weekEnd
    }).length,
    [deliveredOrders, weekStart, weekEnd],
  )

  const monthRevenue = useMemo(
    () => calculateRevenueFromOrders(deliveredOrders, monthStart, monthEnd),
    [deliveredOrders, monthStart, monthEnd],
  )
  const monthOrders = useMemo(
    () => deliveredOrders.filter(o => {
      const orderDate = new Date(o.timestamp)
      return orderDate >= monthStart && orderDate <= monthEnd
    }).length,
    [deliveredOrders, monthStart, monthEnd],
  )

  // Calculate percentage changes
  const yesterdayVsTodayChange = yesterdayRevenue > 0 
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
    : todayRevenue > 0 ? 100 : 0
  
  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(weekStart)
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)
  lastWeekEnd.setHours(23, 59, 59, 999)

  const lastWeekRevenue = useMemo(
    () => calculateRevenueFromOrders(deliveredOrders, lastWeekStart, lastWeekEnd),
    [deliveredOrders, lastWeekStart, lastWeekEnd],
  )
  const weekChange = lastWeekRevenue > 0
    ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
    : weekRevenue > 0 ? 100 : 0
    
  const lastMonthStart = new Date(monthStart)
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
  const lastMonthEnd = new Date(monthStart)
  lastMonthEnd.setDate(lastMonthEnd.getDate() - 1)
  lastMonthEnd.setHours(23, 59, 59, 999)

  const lastMonthRevenue = useMemo(
    () => calculateRevenueFromOrders(deliveredOrders, lastMonthStart, lastMonthEnd),
    [deliveredOrders, lastMonthStart, lastMonthEnd],
  )
  const monthChange = lastMonthRevenue > 0
    ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : monthRevenue > 0 ? 100 : 0

  // Chart data (delivered orders only)
  const weeklyData = useMemo(
    () => getWeeklyRevenueData(deliveredOrders),
    [deliveredOrders],
  )
  const monthlyData = useMemo(
    () => getMonthlyRevenueData(deliveredOrders),
    [deliveredOrders],
  )

  // Pending orders count (all orders)
  const pendingOrders = useMemo(
    () => allOrders.filter((o) => o.status === "pending").length,
    [allOrders],
  )

  useEffect(() => {
    if (allOrders.length > 0 || restaurantId) {
      setLoading(false)
    }
  }, [allOrders, restaurantId])

  const currentRevenue = useMemo(() => {
    switch (timeRange) {
      case "today":
        return todayRevenue
      case "yesterday":
        return yesterdayRevenue
      case "week":
        return weekRevenue
      case "month":
        return monthRevenue
      default:
        return todayRevenue
    }
  }, [timeRange, todayRevenue, yesterdayRevenue, weekRevenue, monthRevenue])

  const currentOrders = useMemo(() => {
    switch (timeRange) {
      case "today":
        return todayOrders
      case "yesterday":
        return yesterdayOrders
      case "week":
        return weekOrders
      case "month":
        return monthOrders
      default:
        return todayOrders
    }
  }, [timeRange, todayOrders, yesterdayOrders, weekOrders, monthOrders])

  const currentChange = useMemo(() => {
    switch (timeRange) {
      case "today":
        return yesterdayVsTodayChange
      case "yesterday":
        return 0 // No comparison for yesterday
      case "week":
        return weekChange
      case "month":
        return monthChange
      default:
        return 0
    }
  }, [timeRange, yesterdayVsTodayChange, weekChange, monthChange])

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "today":
        return "Today"
      case "yesterday":
        return "Yesterday"
      case "week":
        return "This Week"
      case "month":
        return "This Month"
      default:
        return "Today"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1A1A1A]">
            Dashboard
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Real-time analytics and revenue insights (Delivered orders only)
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTimeRange("today")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === "today"
                ? "bg-[#7A1E1E] text-white"
                : "bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC]"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange("yesterday")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === "yesterday"
                ? "bg-[#7A1E1E] text-white"
                : "bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC]"
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setTimeRange("week")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === "week"
                ? "bg-[#7A1E1E] text-white"
                : "bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC]"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeRange("month")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === "month"
                ? "bg-[#7A1E1E] text-white"
                : "bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC]"
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Main Stats Cards - Only 2 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Revenue Card */}
        <div className="glass-effect p-6 rounded-xl border border-[#E2E8F0]/70 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/10">
              <DollarSign className="text-[#FFD700]" size={24} />
            </div>
            {timeRange !== "yesterday" && currentChange !== 0 ? (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                  currentChange >= 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {currentChange >= 0 ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <ArrowDownRight size={14} />
                )}
                {Math.abs(currentChange).toFixed(1)}%
                {timeRange === "today" && " vs yesterday"}
                {timeRange === "week" && " vs last week"}
                {timeRange === "month" && " vs last month"}
              </div>
            ) : null}
          </div>
          <div>
            <p className="text-sm text-[#64748B] mb-1">
              {getTimeRangeLabel()} Revenue
            </p>
            <p className="text-3xl font-serif font-bold text-[#1A1A1A] mb-1">
              ${currentRevenue.toFixed(2)}
            </p>
           
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="glass-effect p-6 rounded-xl border border-[#E2E8F0]/70 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#7A1E1E]/20 to-[#7A1E1E]/10">
              <ShoppingBag className="text-[#7A1E1E]" size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-[#64748B] mb-1">
              {getTimeRangeLabel()} Completed Orders
            </p>
            <p className="text-3xl font-serif font-bold text-[#1A1A1A] mb-1">
              {currentOrders}
            </p>
          
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Revenue Chart */}
        <div className="glass-effect p-6 rounded-xl border border-[#E2E8F0]/70 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">
                Weekly Revenue
              </h3>
              <p className="text-sm text-[#64748B] mt-1">Last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#7A1E1E]">
                ${weekRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-[#94A3B8]">Total this week</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7A1E1E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7A1E1E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="name"
                stroke="#64748B"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#64748B"
                style={{ fontSize: "12px" }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFF8E7",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#7A1E1E"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="glass-effect p-6 rounded-xl border border-[#E2E8F0]/70 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">
                Monthly Revenue
              </h3>
              <p className="text-sm text-[#64748B] mt-1">Last 12 months</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#FFD700]">
                ${monthRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-[#94A3B8]">Total this month</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="name"
                stroke="#64748B"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="#64748B"
                style={{ fontSize: "12px" }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFF8E7",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
              />
              <Bar
                dataKey="revenue"
                fill="#FFD700"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="glass-effect p-6 rounded-xl border border-[#E2E8F0]/70 shadow-lg">
        <div className="mb-6">
          <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">
            Week vs Month Comparison
          </h3>
          <p className="text-sm text-[#64748B] mt-1">
            Revenue trends comparison
          </p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="name"
              stroke="#64748B"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="#64748B"
              style={{ fontSize: "12px" }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFF8E7",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#7A1E1E"
              strokeWidth={3}
              dot={{ fill: "#7A1E1E", r: 5 }}
              name="Daily Revenue"
            />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#FFD700"
              strokeWidth={2}
              dot={{ fill: "#FFD700", r: 4 }}
              name="Orders Count"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders - Card Layout */}
      <div className="glass-effect p-6 rounded-xl border border-[#E2E8F0]/70 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">
              Recent Orders
            </h3>
            <p className="text-sm text-[#64748B] mt-1">
              Latest 9 orders across all statuses
            </p>
          </div>
          <button className="text-[#7A1E1E] text-sm font-medium hover:underline">
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allOrders
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 9)
            .map((order) => (
            <div key={order.id} className="border border-[#E2E8F0] rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div>
                    <h4 className="font-medium text-[#1A1A1A]">
                      {order.orderNumber ? `Order #${order.orderNumber}` : `Order #${order.id.substring(0, 6)}`}
                    </h4>
                     <p className="text-sm font-medium text-[#575656] mt-1">
                    {order.waiterName || 'Walk-in Customer'}
                  </p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      {new Date(order.timestamp).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                 
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'ready'
                      ? 'bg-blue-100 text-blue-800'
                      : order.status === 'cooking'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              
              <div className="mt-3 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B]">Items:</span>
                  <span className="font-medium">{order.items?.length || 0}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B]">Amount:</span>
                  <span className="font-medium">${order.totalAmount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B]">Time:</span>
                  <span>
                    {new Date(order.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              
              {order.items?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                  <p className="text-xs font-medium text-[#64748B] mb-1">Items:</p>
                  <div className="space-y-1">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="truncate">{item.name}</span>
                        <span className="ml-2 whitespace-nowrap">x{item.quantity}</span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-xs text-[#94A3B8] text-right">
                        +{order.items.length - 2} more items
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}