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
  IndianRupee, // Changed from DollarSign to IndianRupee
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ChevronRight,
} from "lucide-react"
import {
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  calculateRevenueFromOrders,
  getWeeklyRevenueData,
  getMonthlyRevenueData,
} from "@/utils/revenue-utils"
import type { Order } from "@/types"
import Link from "next/link"

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

  useEffect(() => {
    if (allOrders.length > 0 || restaurantId) {
      setLoading(false)
    }
  }, [allOrders, restaurantId])

  const currentRevenue = useMemo(() => {
    switch (timeRange) {
      case "today": return todayRevenue
      case "yesterday": return yesterdayRevenue
      case "week": return weekRevenue
      case "month": return monthRevenue
      default: return todayRevenue
    }
  }, [timeRange, todayRevenue, yesterdayRevenue, weekRevenue, monthRevenue])

  const currentOrders = useMemo(() => {
    switch (timeRange) {
      case "today": return todayOrders
      case "yesterday": return yesterdayOrders
      case "week": return weekOrders
      case "month": return monthOrders
      default: return todayOrders
    }
  }, [timeRange, todayOrders, yesterdayOrders, weekOrders, monthOrders])

  const currentChange = useMemo(() => {
    switch (timeRange) {
      case "today": return yesterdayVsTodayChange
      case "yesterday": return 0
      case "week": return weekChange
      case "month": return monthChange
      default: return 0
    }
  }, [timeRange, yesterdayVsTodayChange, weekChange, monthChange])

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "today": return "Today"
      case "yesterday": return "Yesterday"
      case "week": return "This Week"
      case "month": return "This Month"
      default: return "Today"
    }
  }

  // Consistent status colors with Orders Page
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'cooking': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ready': return 'bg-green-100 text-green-800 border-green-200'
      case 'delivered': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Premium Header user-select-none to prevent text selection while interacting with charts */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7A1E1E] to-[#5d1515] text-[#FFF8E7] p-8 shadow-lg select-none">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <TrendingUp size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <h1 className="text-4xl font-serif font-bold mb-2 flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-[#FFD700]" />
                    Dashboard
                </h1>
                <p className="text-[#FFF8E7]/80 max-w-xl text-lg font-light">
                    Real-time analytics and revenue insights at a glance.
                </p>
            </div>
             <div className="flex gap-2 flex-wrap bg-white/10 p-1.5 rounded-xl backdrop-blur-sm">
              {(["today", "yesterday", "week", "month"] as const).map((r) => (
                <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  timeRange === r
                    ? "bg-[#FFD700] text-[#7A1E1E] shadow-md"
                    : "text-[#FFF8E7] hover:bg-white/10"
                }`}
              >
                {r}
              </button>
              ))}
            </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Revenue Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-[#E2E8F0] relative overflow-hidden group hover:border-[#FFD700]/50 transition-all">
           <div className="absolute right-[-20px] top-[-20px] bg-[#FFD700]/10 w-40 h-40 rounded-full group-hover:scale-110 transition-transform" />
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-[#FFD700]/20 rounded-xl flex items-center justify-center text-[#998100]">
                    <IndianRupee size={24} />
                  </div>
                   {timeRange !== "yesterday" && currentChange !== 0 && (
                    <div
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        currentChange >= 0
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                    >
                        {currentChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(currentChange).toFixed(1)}%
                    </div>
                   )}
              </div>
              <div>
                <p className="text-[#64748B] font-medium text-sm uppercase tracking-wider">{getTimeRangeLabel()} Revenue</p>
                <p className="text-4xl font-serif font-bold text-[#1A1A1A] mt-1 flex items-center">
                    <IndianRupee size={28} className="mt-1 mr-1" />
                    {currentRevenue.toFixed(2)}
                </p>
                 <p className="text-sm text-[#94A3B8] mt-2">Gross earnings from delivered orders</p>
              </div>
           </div>
        </div>

        {/* Total Orders Card */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-[#E2E8F0] relative overflow-hidden group hover:border-[#7A1E1E]/50 transition-all">
           <div className="absolute right-[-20px] top-[-20px] bg-[#7A1E1E]/5 w-40 h-40 rounded-full group-hover:scale-110 transition-transform" />
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                 <div className="w-12 h-12 bg-[#7A1E1E]/10 rounded-xl flex items-center justify-center text-[#7A1E1E]">
                    <ShoppingBag size={24} />
                 </div>
              </div>
              <div>
                 <p className="text-[#64748B] font-medium text-sm uppercase tracking-wider">{getTimeRangeLabel()} Orders</p>
                 <p className="text-4xl font-serif font-bold text-[#1A1A1A] mt-1">{currentOrders}</p>
              </div>
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
              <p className="text-2xl font-bold text-[#7A1E1E] flex items-center justify-end">
                <IndianRupee size={20} />
                {weekRevenue.toFixed(2)}
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
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFF8E7",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`₹${value.toFixed(2)}`, "Revenue"]}
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
              <p className="text-2xl font-bold text-[#FFD700] flex items-center justify-end">
                <IndianRupee size={20} />
                {monthRevenue.toFixed(2)}
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
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFF8E7",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`₹${value.toFixed(2)}`, "Revenue"]}
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

      {/* Week vs Month Comparison */}
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
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFF8E7",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
              }}
              formatter={(value: number, name: string) => [name === "Daily Revenue" ? `₹${value.toFixed(2)}` : value, name]}
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

      {/* Recent Orders - Consistent Styling */}
      <div className="glass-effect p-6 rounded-xl border border-[#E2E8F0]/70 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">
              Recent Orders
            </h3>
            <p className="text-sm text-[#64748B] mt-1">
              Latest activity overview
            </p>
          </div>
          <Link href="/admin/orders" className="text-[#7A1E1E] text-sm font-bold hover:underline flex items-center gap-1">
            View All Orders <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allOrders.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400">No orders yet</div>
          ) : (
            allOrders
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 9)
              .map((order) => (
              <div key={order.id} className="group relative flex flex-col rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition-all hover:border-[#7A1E1E] hover:shadow-md">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-[#1A1A1A]">
                       Table {order.table.replace(/^\D+/, '')}
                    </h4>
                    <p className="text-xs text-[#94A3B8] font-mono mt-0.5">#{order.orderNumber || order.id.slice(-6)}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                
                <div className="space-y-2 mt-2 text-sm flex-1">
                   {order.items.slice(0, 2).map((item, idx) => (
                     <div key={idx} className="flex justify-between">
                        <span className="text-[#475569]">{item.name}</span>
                        <span className="text-[#1A1A1A] font-medium">x{item.quantity}</span>
                     </div>
                   ))}
                   {order.items.length > 2 && (
                     <p className="text-xs text-[#94A3B8] italic pt-1">+{order.items.length - 2} more items</p>
                   )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex justify-between items-center text-sm">
                   <div className="flex items-center gap-1.5 text-[#64748B]">
                      <Clock size={14} />
                      {new Date(order.timestamp).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}
                   </div>
                   <div className="font-bold text-[#7A1E1E] flex items-center">
                      <IndianRupee size={14} />
                      {order.totalAmount.toFixed(2)}
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}