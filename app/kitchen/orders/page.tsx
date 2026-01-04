"use client"

import React, { useMemo, useState } from "react"
import { format, isAfter, isBefore, parseISO, startOfDay, endOfDay } from "date-fns"
import { useOrders } from "@/hooks/use-orders"

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

  // Status counts for pills
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: orders.length,
      pending: 0,
      cooking: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0,
    }
    for (const o of orders) {
      if (counts[o.status] != null) counts[o.status]++
    }
    return counts
  }, [orders])

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
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-0">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-[#0F172A]">
          Kitchen Orders
        </h1>
        <p className="text-[#64748B] text-sm">
          Live tickets from waiters. Search, filter and manage orders in real
          time.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="glass-effect rounded-2xl border border-[#E2E8F0]/80 bg-white/80 backdrop-blur-sm p-4 space-y-8 shadow-sm">
        {/* Top row: search + date preset + clear */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, table, waiter, customer, or item..."
              className="w-full rounded-full border border-[#E2E8F0] bg-white/70 px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#7A1E1E]/40 focus:border-[#7A1E1E]/60 transition-shadow"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wide text-[#94A3B8]">Date</span>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DatePreset)}
              className="rounded-full border border-[#E2E8F0] bg-white/80 px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#7A1E1E]/40"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="custom">Custom date</option>
            </select>
          </div>

          <button
            onClick={clearFilters}
            className="inline-flex items-center justify-center rounded-full border border-[#E2E8F0] px-4 py-2 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
          >
            Clear filters
          </button>
        </div>

        {/* Custom date (single day) */}
        {datePreset === "custom" && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] uppercase tracking-wide text-[#94A3B8]">Select date</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="rounded-full border border-[#E2E8F0] bg-white/80 px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#7A1E1E]/40"
            />
          </div>
        )}

        {/* Status pills with counts */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === "all"
                ? "bg-[#0F172A] text-white border-[#0F172A]"
                : "bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]"
              }`}
          >
            All Orders ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === "pending"
                ? "bg-[#7A1E1E] text-white border-[#7A1E1E]"
                : "bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]"
              }`}
          >
            New ({statusCounts.pending})
          </button>
          <button
            onClick={() => setStatusFilter("cooking")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === "cooking"
                ? "bg-[#7A1E1E] text-white border-[#7A1E1E]"
                : "bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]"
              }`}
          >
            Preparing ({statusCounts.cooking})
          </button>
          <button
            onClick={() => setStatusFilter("ready")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === "ready"
                ? "bg-[#7A1E1E] text-white border-[#7A1E1E]"
                : "bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]"
              }`}
          >
            Ready ({statusCounts.ready})
          </button>
          <button
            onClick={() => setStatusFilter("delivered")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === "delivered"
                ? "bg-[#7A1E1E] text-white border-[#7A1E1E]"
                : "bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]"
              }`}
          >
            Completed ({statusCounts.delivered})
          </button>
          <button
            onClick={() => setStatusFilter("cancelled")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === "cancelled"
                ? "bg-[#7A1E1E] text-white border-[#7A1E1E]"
                : "bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]"
              }`}
          >
            Cancelled ({statusCounts.cancelled})
          </button>
        </div>
      </div>

      {/* Orders Grid (1 card per row) */}
      <div className="grid grid-cols-1 gap-5">
        {filteredOrders.map((order) => {
          const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)
          const time = format(new Date(order.timestamp), "HH:mm")
          const date = format(new Date(order.timestamp), "dd MMM")

          const statusSteps: Array<"pending" | "cooking" | "ready" | "delivered"> = [
            "pending",
            "cooking",
            "ready",
            "delivered",
          ]

          const glowClass =
            order.status === "pending"
              ? "ring-2 ring-orange-200/80"
              : order.status === "cooking"
                ? "ring-2 ring-yellow-200/80"
                : order.status === "ready"
                  ? "ring-2 ring-green-200/80"
                  : order.status === "delivered"
                    ? "ring-2 ring-sky-200/80"
                    : ""

          return (
            <div
              key={order.id}
              className={`relative flex flex-col rounded-2xl border border:white/40 bg-gradient-to-br from-white/80 via-white/90 to-[#F9FAFB] shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-md transition-transform hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(15,23,42,0.18)] ${glowClass}`}
            >
              {/* Top: order + table + status */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between px-4 pt-4 pb-3 border-b border-[#E2E8F0]/70">
                <div className="space-y-1 text-left">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#94A3B8]">
                    Order #{order.orderNumber ?? order.id.slice(-6)}
                  </p>
                  <p className="text-lg font-semibold text-[#0F172A]">
                    Table {order.table.replace(/^\D+/, "")}
                  </p>
                  <p className="text-xs text-[#64748B]">
                    {totalItems} item{totalItems !== 1 && "s"} · by{" "}
                    <span className="font-medium text-[#0F172A]">{order.waiterName}</span>
                  </p>
                </div>

                <div className="mt-3 sm:mt-0 flex flex-col items-end gap-2 text-right">
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold ${order.status === "pending"
                        ? "bg-orange-100 text-orange-800"
                        : order.status === "cooking"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "ready"
                            ? "bg-green-100 text-green-800"
                            : order.status === "delivered"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-red-100 text-red-700"
                      }`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <div className="text-[11px] text-[#94A3B8]">
                    <span className="font-medium text-[#0F172A]">{time}</span>
                    <span className="mx-1">·</span>
                    {date}
                  </div>
                </div>
              </div>

              {/* Status timeline */}
              <div className="px-10 pt-5 pb-3">
                <div className="flex items-center justify-center gap-2 w-full max-w-lg mx-auto">                  
                  {statusSteps.map((step, index) => {
                  const active =
                    step === order.status ||
                    (order.status === "cooking" && step === "pending") ||
                    (order.status === "ready" &&
                      (step === "pending" || step === "cooking")) ||
                    (order.status === "delivered" &&
                      (step === "pending" || step === "cooking" || step === "ready"))

                  const completed =
                    (order.status === "cooking" && step === "pending") ||
                    (order.status === "ready" &&
                      (step === "pending" || step === "cooking")) ||
                    (order.status === "delivered" &&
                      (step === "pending" || step === "cooking" || step === "ready"))

                  const color =
                    step === "pending"
                      ? "bg-orange-500"
                      : step === "cooking"
                        ? "bg-yellow-500"
                        : step === "ready"
                          ? "bg-green-500"
                          : "bg-sky-500"

                  return (
                    <div key={step} className="flex flex-1 items-center">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-sm ${active || completed ? color : "bg-[#CBD5F5]"
                            }`}
                        >
                          {index + 1}
                        </div>
                        <span
                          className={`text-[11px] font-medium ${active ? "text-[#0F172A]" : "text-[#94A3B8]"
                            }`}
                        >
                          {step.charAt(0).toUpperCase() + step.slice(1)}
                        </span>
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div className="mx-3 h-[2px] flex-[2] rounded-full bg-gradient-to-r from-orange-200 via-yellow-200 to-green-200" />
                      )}
                    </div>
                  )
                })}
                </div>
              </div>

              {/* Items list */}
              <div className="px-4 pt-2 pb-3 space-y-1 max-h-40 overflow-y-auto">
                {order.items.map((item) => (
                  <div
                    key={item.menuId}
                    className="flex items-center justify-between rounded-xl border border-[#E2E8F0]/80 bg-white/80 px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[#0F172A]">{item.name}</span>
                      <span className="text-[11px] text-[#94A3B8]">
                        ${item.price.toFixed(2)} each
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#0F172A]">
                      <span className="inline-flex items-center justify-center rounded-full bg-[#0F172A] text-white px-2 py-0.5 text-[11px]">
                        x{item.quantity}
                      </span>
                      <span className="font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer: total + actions */}
              <div className="mt-auto flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0]/70 bg-white/80 rounded-b-2xl">
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#94A3B8]">Total amount</span>
                  <span className="text-lg font-semibold text-[#0F172A]">
                    ${order.totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-2">
                  {/* Primary status progression button */}
                  {order.status !== "ready" &&
                    order.status !== "delivered" &&
                    order.status !== "cancelled" && (
                      <button
                        disabled={updatingId === order.id}
                        onClick={() =>
                          handleStatusChange(
                            order.id,
                            order.status === "pending" ? "cooking" : "ready",
                          )
                        }
                        className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{
                          background:
                            order.status === "pending"
                              ? "linear-gradient(135deg,#fb923c,#f97316)"
                              : "linear-gradient(135deg,#eab308,#facc15)",
                        }}
                      >
                        {updatingId === order.id
                          ? "Updating..."
                          : order.status === "pending"
                            ? "Start Preparing"
                            : "Mark as Ready"}
                      </button>
                    )}

                  {/* Delivered button when ready */}
                  {order.status === "ready" && (
                    <button
                      disabled={updatingId === order.id}
                      onClick={() => handleStatusChange(order.id, "delivered")}
                      className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-[#0369A1] border border-[#BAE6FD] bg-[#E0F2FE] shadow-sm hover:bg-[#BFDBFE] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {updatingId === order.id ? "Updating..." : "Mark as Delivered"}
                    </button>
                  )}

                  {/* Cancel button for active orders */}
                  {order.status !== "delivered" && order.status !== "cancelled" && (
                    <button
                      disabled={updatingId === order.id}
                      onClick={() => handleStatusChange(order.id, "cancelled")}
                      className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold text-red-700 border border-red-200 bg-red-50 shadow-sm hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {updatingId === order.id ? "Updating..." : "Cancel Order"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 glass-effect p-8 rounded-2xl border border-dashed border-[#E2E8F0]">
          <p className="text-[#94A3B8] text-sm">No orders match your current filters</p>
          <p className="text-[#64748B] text-xs mt-1">
            Try changing the search or clearing filters to see more tickets.
          </p>
        </div>
      )}
    </div>
  )
}