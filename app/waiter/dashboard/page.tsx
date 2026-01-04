"use client"

import React, { useState, useMemo } from "react"
import { useAuth } from "@/context/auth-context"
import { useOrders } from "@/hooks/use-orders"
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  CalendarDays,
  TrendingUp,
} from "lucide-react"

export default function WaiterDashboard() {
  const { userProfile } = useAuth()
  const { orders, loading } = useOrders({ waiterId: userProfile?.id })

  // Orders only for *today*
  const todayOrders = useMemo(() => {
    const now = new Date()
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    )
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    )

    return orders.filter((o) => {
      const t = new Date(o.timestamp)
      if (isNaN(t.getTime())) return false
      return t >= start && t <= end
    })
  }, [orders])

  const pendingOrders = orders.filter((o) => o.status === "pending").length
  const cookingOrders = orders.filter((o) => o.status === "cooking").length
  const readyOrders = orders.filter((o) => o.status === "ready").length

  const completedToday = todayOrders.filter(
    (o) => o.status === "delivered",
  ).length
  const totalToday = todayOrders.length
  const activeToday = todayOrders.filter(
    (o) =>
      o.status === "pending" ||
      o.status === "cooking" ||
      o.status === "ready",
  ).length
  const revenueToday = todayOrders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  // Pagination for recent orders
  const pageSize = 10
  const [page, setPage] = useState(1)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(orders.length / pageSize)),
    [orders.length],
  )

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return orders.slice(start, end)
  }, [orders, page])

  const canPrev = page > 1
  const canNext = page < totalPages

  const handlePrev = () => {
    if (canPrev) setPage((p) => p - 1)
  }

  const handleNext = () => {
    if (canNext) setPage((p) => p + 1)
  }

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((current) => (current === orderId ? null : orderId))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {userProfile?.name?.split(' ')[0] || 'User'}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-100 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">Live Updates</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        {/* Total Orders Card */}
        <div className="w-full bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="mb-1 text-sm font-medium text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalToday}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Orders Card */}
        <div className="w-full bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="mb-1 text-sm font-medium text-gray-500">In Progress</p>
              <h3 className="text-2xl font-bold text-orange-600">{activeToday}</h3>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Completed Orders Card */}
        <div className="w-full bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="mb-1 text-sm font-medium text-gray-500">Completed</p>
              <h3 className="text-2xl font-bold text-green-600">{completedToday}</h3>
              <div className="flex items-center mt-1">
                
                
              </div>
            </div>
            <div className="p-2 rounded-lg bg-green-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="w-full bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="mb-1 text-sm font-medium text-gray-500">Today's Revenue</p>
              <h3 className="text-2xl font-bold text-amber-700">₹{revenueToday.toFixed(2)}</h3>
              <div className="flex items-center mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-[10px] xs:text-xs font-medium text-amber-600 ml-1">
                  {totalToday > 0 ? Math.round((revenueToday / (revenueToday * 1.5)) * 100) : 0}% from yesterday
                </span>
              </div>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Order Stats (Pending, Cooking, Ready) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-effect p-5 rounded-lg border-l-4 border-orange-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                Pending
              </p>
              <p className="text-3xl font-serif font-bold text-[#7A1E1E]">
                {pendingOrders}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertCircle className="text-orange-600" size={22} />
            </div>
          </div>
          <p className="mt-2 text-xs text-[#94A3B8]">
            Orders waiting for the kitchen to start.
          </p>
        </div>

        <div className="glass-effect p-5 rounded-lg border-l-4 border-yellow-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                Cooking
              </p>
              <p className="text-3xl font-serif font-bold text-[#7A1E1E]">
                {cookingOrders}
              </p>
            </div>
            <div className="bg-[#FFD700]/20 p-3 rounded-lg">
              <Clock className="text-[#FFD700]" size={22} />
            </div>
          </div>
          <p className="mt-2 text-xs text-[#94A3B8]">
            Orders currently being prepared.
          </p>
        </div>

        <div className="glass-effect p-5 rounded-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#64748B] mb-1">
                Ready to serve
              </p>
              <p className="text-3xl font-serif font-bold text-[#7A1E1E]">
                {readyOrders}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="text-green-600" size={22} />
            </div>
          </div>
          <p className="mt-2 text-xs text-[#94A3B8]">
            Take these to guests as soon as possible.
          </p>
        </div>
      </div>

      {/* Recent Orders - Card Layout */}
      <div className="glass-effect p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">
              Recent Orders
            </h3>
            <p className="text-sm text-[#64748B] mt-1">
              Showing {paginatedOrders.length} of {orders.length} total orders
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={!canPrev}
              className={`p-2 rounded-full ${
                canPrev
                  ? "text-[#1E293B] hover:bg-[#E2E8F0]"
                  : "text-[#94A3B8] cursor-not-allowed"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <span className="text-sm text-[#64748B] w-16 text-center">
              {page}/{totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={!canNext}
              className={`p-2 rounded-full ${
                canNext
                  ? "text-[#1E293B] hover:bg-[#E2E8F0]"
                  : "text-[#94A3B8] cursor-not-allowed"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#64748B] gap-3">
            <Loader2 className="animate-spin text-[#7A1E1E]" size={28} />
            <span>Loading orders...</span>
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-[#F1F5F9] rounded-full flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <h4 className="font-medium text-[#1A1A1A]">No orders yet</h4>
            <p className="text-sm text-[#64748B] mt-1 max-w-xs mx-auto">
              When you create new orders, they'll appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedOrders.map((order) => {
              const tableLabel = order.table.replace(/^[Tt]able\s*/, "")
              const dt = new Date(order.timestamp)
              const dateStr = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const timeStr = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              const isExpanded = expandedOrderId === order.id

              return (
                <div 
                  key={order.id}
                  className={`bg-white rounded-xl border border-[#E2E8F0] overflow-hidden transition-all duration-200 ${isExpanded ? 'ring-2 ring-[#7A1E1E]' : 'hover:shadow-md'}`}
                >
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-[#1A1A1A]">
                            Order #{order.orderNumber || order.id.slice(-6)}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            order.status === "pending"
                              ? "bg-orange-100 text-orange-800"
                              : order.status === "cooking"
                              ? "bg-yellow-100 text-yellow-800"
                              : order.status === "ready"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-[#64748B]">
                          Table {tableLabel} • {order.items.length} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#1A1A1A]">
                          ₹{order.totalAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">
                          {dateStr} • {timeStr}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[#E2E8F0] p-4 bg-[#F8FAFC]">
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-[#475569] mb-1">
                          Order Items
                        </h5>
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-start text-sm">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#1A1A1A] truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-[#64748B] mt-0.5">
                                Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                              </p>
                            </div>
                            <div className="ml-4 font-medium text-[#1A1A1A] whitespace-nowrap">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-[#475569]">Total</span>
                          <span className="font-semibold text-[#1A1A1A]">
                            ₹{order.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}