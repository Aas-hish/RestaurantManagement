"use client"

import React, { useMemo, useState } from "react"
import { format, isAfter, isBefore, parseISO, startOfDay, endOfDay } from "date-fns"
import { useOrders } from "@/hooks/use-orders"
import { Utensils, Calendar, Clock, CheckCircle } from "lucide-react"

type DatePreset = "all" | "today" | "yesterday" | "last7" | "last30" | "custom"

const STATUS_OPTIONS: Array<"pending" | "cooking" | "ready" | "delivered" | "cancelled"> = [
  "pending",
  "cooking",
  "ready",
  "delivered",
  "cancelled",
]

export default function KitchenOrdersPage() {
  const { orders, updateOrderStatus } = useOrders()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Search & filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "cooking" | "ready" | "delivered" | "cancelled"
  >("all")
  const [datePreset, setDatePreset] = useState<DatePreset>("today")
  const [customDate, setCustomDate] = useState("")

  const handleStatusChange = async (
    orderId: string,
    status: "pending" | "cooking" | "ready" | "delivered" | "cancelled",
  ) => {
    try {
      setUpdatingId(orderId)
      await updateOrderStatus(orderId, status)
    } catch (error) {
      console.error("Error updating order:", error)
    } finally {
      setUpdatingId(null)
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setDatePreset("today")
    setCustomDate("")
  }

  // Status counts for pills (filtered by date)
  const statusCounts = useMemo(() => {
    // First apply date filter
    const dateFilteredOrders = orders.filter(order => {
      if (datePreset === "all") return true
      
      const orderDate = new Date(order.timestamp)
      
      if (datePreset === "today") {
          const start = startOfDay(new Date())
          const end = endOfDay(new Date())
          if (isBefore(orderDate, start) || isAfter(orderDate, end)) return false
      } else if (datePreset === "yesterday") {
          const today = new Date()
          const y = new Date(today)
          y.setDate(today.getDate() - 1)
          const start = startOfDay(y)
          const end = endOfDay(y)
          if (isBefore(orderDate, start) || isAfter(orderDate, end)) return false
      } else if (datePreset === "last7") {
          const end = endOfDay(new Date())
          const start = startOfDay(new Date())
          start.setDate(start.getDate() - 6)
          if (isBefore(orderDate, start) || isAfter(orderDate, end)) return false
      } else if (datePreset === "last30") {
          const end = endOfDay(new Date())
          const start = startOfDay(new Date())
          start.setDate(start.getDate() - 29)
          if (isBefore(orderDate, start) || isAfter(orderDate, end)) return false
      } else if (datePreset === "custom" && customDate) {
          const start = startOfDay(parseISO(customDate))
          const end = endOfDay(parseISO(customDate))
          if (isBefore(orderDate, start) || isAfter(orderDate, end)) return false
      }
      return true
    })

    const counts: Record<string, number> = {
      all: dateFilteredOrders.length,
      pending: 0,
      cooking: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0,
    }
    
    for (const o of dateFilteredOrders) {
      if (counts[o.status] != null) counts[o.status]++
    }
    return counts
  }, [orders, datePreset, customDate])

  // Combined filtering locally
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return orders.filter((order) => {
      // Global search
      if (q) {
        const orderNo = (order.orderNumber ?? order.id).toString().toLowerCase()
        const tableNum = order.table.replace(/^\D+/, "").toLowerCase()
        const waiterName = (order.waiterName || "").toLowerCase()
        const customerName = ((order as any).customerName || "").toLowerCase()
        const itemsText = order.items.map((i) => i.name).join(" ").toLowerCase()

        const matchesSearch =
          orderNo.includes(q) ||
          tableNum.includes(q) ||
          waiterName.includes(q) ||
          customerName.includes(q) ||
          itemsText.includes(q)

        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== "all" && order.status !== statusFilter) return false

      // Date preset
      if (datePreset !== "all") {
        const orderDate = new Date(order.timestamp)

        if (datePreset === "today") {
          const start = startOfDay(new Date())
          const end = endOfDay(new Date())
          if (isBefore(orderDate, start) || isAfter(orderDate, end)) return false
        } else if (datePreset === "yesterday") {
          const today = new Date()
          const y = new Date(today)
          y.setDate(today.getDate() - 1)
          const start = startOfDay(y)
          const end = endOfDay(y)
          if (isBefore(orderDate, start) || isAfter(orderDate, end)) return false
        } else if (datePreset === "last7") {
          const end = endOfDay(new Date())
          const start = startOfDay(new Date())
          start.setDate(start.getDate() - 6)
          if (isBefore(orderDate, start) || isAfter(orderDate, end)) return false
        } else if (datePreset === "last30") {
          const end = endOfDay(new Date())
          const start = startOfDay(new Date())
          start.setDate(start.getDate() - 29)
          if (isBefore(orderDate, start) || isAfter(orderDate, end)) return false
        } else if (datePreset === "custom" && customDate) {
          const start = startOfDay(parseISO(customDate))
          const end = endOfDay(parseISO(customDate))
          if (isBefore(orderDate, start) || isAfter(orderDate, end)) return false
        }
      }

      return true
    })
  }, [orders, searchQuery, statusFilter, datePreset, customDate])

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7A1E1E] to-[#5d1515] text-[#FFF8E7] p-8 shadow-lg">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <Utensils size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <h1 className="text-4xl font-serif font-bold mb-2 flex items-center gap-3">
                    <Utensils className="w-8 h-8 text-[#FFD700]" />
                    Kitchen Orders
                </h1>
                <p className="text-[#FFF8E7]/80 font-light text-lg max-w-xl">
                    Manage live tickets, status updates, and order details.
                </p>
            </div>
            
            {/* Date Filter integrated in header */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 shadow-sm">
                <Calendar className="text-[#FFD700] w-4 h-4" />
                <span className="text-xs font-bold text-[#FFF8E7] uppercase tracking-wide">View:</span>
                <select
                    value={datePreset}
                    onChange={(e) => setDatePreset(e.target.value as DatePreset)}
                    className="bg-transparent text-sm font-medium text-[#FFD700] outline-none cursor-pointer [&>option]:text-gray-900 border-none focus:ring-0 p-0"
                >
                    <option value="all">All History</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="last7">Last 7 Days</option>
                    <option value="last30">Last 30 Days</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Search */}
        <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, table, waiter..."
              className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A1E1E]/10 focus:border-[#7A1E1E] transition-all shadow-sm"
            />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
            {[ 
                { id: 'all', label: 'All', count: statusCounts.all }, 
                { id: 'pending', label: 'Pending', count: statusCounts.pending },
                { id: 'cooking', label: 'Cooking', count: statusCounts.cooking },
                { id: 'ready', label: 'Ready', count: statusCounts.ready },
                { id: 'delivered', label: 'Served', count: statusCounts.delivered },
                { id: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled }
            ].map((status) => (
                <button
                    key={status.id}
                    onClick={() => setStatusFilter(status.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        statusFilter === status.id 
                            ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md" 
                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                >
                    {status.label} <span className="ml-1 opacity-60">({status.count})</span>
                </button>
            ))}
            
             <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors ml-auto xl:ml-2"
            >
                Clear
            </button>
        </div>
      </div>

      {/* Custom Date Input */}
      {datePreset === "custom" && (
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 w-fit">
            <span className="text-xs font-bold text-gray-500 uppercase">Select Date:</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-[#7A1E1E]"
            />
        </div>
      )}

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map((order) => {
          const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
          const time = format(new Date(order.timestamp), "h:mm a")
          const elapsed = Math.floor((Date.now() - new Date(order.timestamp).getTime()) / 60000)
          
          const styles = {
            pending: { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-800', btn: 'bg-orange-500 hover:bg-orange-600' },
            cooking: { border: 'border-yellow-200', bg: 'bg-yellow-50', text: 'text-yellow-800', btn: 'bg-yellow-500 hover:bg-yellow-600' },
            ready: { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-800', btn: 'bg-green-500 hover:bg-green-600' },
            delivered: { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-800', btn: 'bg-blue-500 hover:bg-blue-600' },
            cancelled: { border: 'border-gray-200', bg: 'bg-gray-100', text: 'text-gray-600', btn: 'bg-gray-500 hover:bg-gray-600' }
          }[order.status] || { border: 'border-gray-200', bg: 'bg-gray-100', text: 'text-gray-600', btn: 'bg-gray-500' }

          return (
            <div
              key={order.id}
              className={`relative flex flex-col bg-white rounded-xl border ${styles.border} shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden`}
            >
                {/* Header Section */}
                <div className={`px-5 py-4 border-b ${styles.border} bg-white flex justify-between items-start`}>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide ${styles.bg} ${styles.text}`}>
                                {order.status}
                            </span>
                            <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                <Clock size={12} /> {elapsed}m ago
                            </span>
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-[#1A1A1A]">
                            Table {order.table.replace(/^\D+/, "")}
                        </h3>
                    </div>
                    
                    <div className="flex flex-col items-end">
                       <span className="text-xs font-mono text-gray-400">#{order.orderNumber || order.id.slice(-4)}</span>
                        {/* Cancel Action (Only for active orders) */}
                        {order.status !== "delivered" && order.status !== "cancelled" && (
                            <button
                                disabled={updatingId === order.id}
                                onClick={() => handleStatusChange(order.id, "cancelled")}
                                className="mt-2 text-gray-300 hover:text-red-500 transition-colors p-1"
                                title="Cancel Order"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Items Section */}
                <div className="p-5 flex-1 bg-gray-50/30">
                    <div className="space-y-3">
                        {order.items.map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-[#1A1A1A] text-sm shadow-sm">
                                    {item.quantity}
                                </div>
                                <div className="flex-1 pt-0.5">
                                    <p className="text-sm font-semibold text-gray-800 leading-tight">{item.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">${item.price}</p>
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                    ${(item.price * item.quantity).toFixed(0)}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Notes placeholder or extras could go here */}
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-white border-t border-gray-100">
                     <div className="flex justify-between items-center mb-4 px-1">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</span>
                        <span className="text-lg font-serif font-bold text-[#1A1A1A]">${order.totalAmount.toFixed(2)}</span>
                     </div>

                    {(order.status === 'pending' || order.status === 'cooking') && (
                        <button
                            disabled={updatingId === order.id}
                            onClick={() => handleStatusChange(order.id, order.status === "pending" ? "cooking" : "ready")}
                            className={`w-full py-3 rounded-xl text-sm font-bold text-white shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${styles.btn}`}
                        >
                            {updatingId === order.id ? (
                                <span className="animate-pulse">Updating...</span>
                            ) : order.status === 'pending' ? (
                                <>
                                  <Utensils size={16} /> Start Cooking
                                </>
                            ) : (
                                <>
                                  <CheckCircle size={16} /> Mark Ready
                                </>
                            )}
                        </button>
                    )}

                    {order.status === "ready" && (
                        <button
                            disabled={updatingId === order.id}
                            onClick={() => handleStatusChange(order.id, "delivered")}
                            className="w-full py-3 rounded-xl text-sm font-bold text-white shadow-md bg-sky-500 hover:bg-sky-600 active:scale-[0.98] transition-all"
                        >
                            Mark Served
                        </button>
                    )}
                    
                    {(order.status === "delivered" || order.status === "cancelled") && (
                         <div className="w-full py-3 rounded-xl text-sm font-bold text-gray-400 bg-gray-100 flex items-center justify-center gap-2 cursor-default">
                            {order.status === "delivered" ? "Served" : "Cancelled"}
                        </div>
                    )}
                </div>
            </div>
          )
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
          <p className="text-gray-900 font-serif font-bold text-lg">No orders found</p>
          <p className="text-gray-500 text-sm mt-1">Adjust your filters to see more results.</p>
        </div>
      )}
    </div>
  )
}