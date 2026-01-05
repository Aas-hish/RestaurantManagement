"use client"

import { useState, useMemo } from "react"
import { useOrders } from "@/hooks/use-orders"
import { startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, isWithinInterval } from "date-fns"
import {
  Search,
  ShoppingBag,
  Clock,
  CheckCircle,
  X,
  ChefHat,
  AlertCircle,
  Truck,
  ChevronDown,
  Calendar
} from "lucide-react"

type DateFilter = "today" | "yesterday" | "week" | "month" | "all"

export default function AdminOrdersPage() {
  const { orders } = useOrders()
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("today")

  // Status Badge Colors - Premium Styling
  const statusStyles: Record<string, { bg: string, text: string, icon: React.ReactNode, border: string }> = {
    pending: { 
      bg: "bg-orange-50", 
      text: "text-orange-700", 
      icon: <AlertCircle size={14} />,
      border: "border-orange-200"
    },
    cooking: { 
      bg: "bg-yellow-50", 
      text: "text-yellow-700", 
      icon: <ChefHat size={14} />,
      border: "border-yellow-200"
    },
    ready: { 
      bg: "bg-green-50", 
      text: "text-green-700", 
      icon: <CheckCircle size={14} />,
      border: "border-green-200"
    },
    delivered: { 
      bg: "bg-blue-50", 
      text: "text-blue-700", 
      icon: <Truck size={14} />,
      border: "border-blue-200"
    },
    cancelled: { 
      bg: "bg-red-50", 
      text: "text-red-700", 
      icon: <X size={14} />,
      border: "border-red-200"
    },
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      const matchesStatus = statusFilter === "all" || order.status === statusFilter
      
      // 2. Search Filter
      const searchLower = searchQuery.toLowerCase()
      const orderIdMatch = order.id.toLowerCase().includes(searchLower)
      const tableMatch = order.table.toLowerCase().includes(searchLower)
      const itemsMatch = order.items && order.items.some((item) => item.name.toLowerCase().includes(searchLower))
      const matchesSearch = !searchQuery || orderIdMatch || tableMatch || itemsMatch

      // 3. Date Filter
      let matchesDate = true
      if (dateFilter !== "all") {
        const orderDate = new Date(order.timestamp)
        const now = new Date()
        
        if (dateFilter === "today") {
          matchesDate = isWithinInterval(orderDate, { start: startOfDay(now), end: endOfDay(now) })
        } else if (dateFilter === "yesterday") {
          const yesterday = subDays(now, 1)
          matchesDate = isWithinInterval(orderDate, { start: startOfDay(yesterday), end: endOfDay(yesterday) })
        } else if (dateFilter === "week") {
          matchesDate = isWithinInterval(orderDate, { start: startOfWeek(now), end: endOfDay(now) })
        } else if (dateFilter === "month") {
           matchesDate = isWithinInterval(orderDate, { start: startOfMonth(now), end: endOfDay(now) })
        }
      }

      return matchesStatus && matchesSearch && matchesDate
    })
  }, [orders, statusFilter, searchQuery, dateFilter])

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }).format(date);
    } catch (e) {
      return dateString;
    }
  }



  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-[#7A1E1E] to-[#992626] p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-[#FFD700]/10 blur-2xl"></div>
        
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
            <ShoppingBag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-wide">Order Management</h1>
            <p className="text-[#E2E8F0] opacity-90">
              Track and manage all restaurant orders
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-effect rounded-xl border border-[#E2E8F0]/80 p-4 shadow-sm bg-white/60 backdrop-blur-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search by ID, table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full pl-10"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
             {/* Date Filter */}
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                  className="input-field pl-10 pr-8 appearance-none cursor-pointer hover:bg-gray-50 bg-white"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B] pointer-events-none" />
             </div>

             {/* Status Filters */}
             <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
               {["all", "pending", "cooking", "ready", "delivered", "cancelled"].map((status) => (
                 <button
                   key={status}
                   onClick={() => setStatusFilter(status)}
                   className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                     statusFilter === status
                       ? "bg-[#7A1E1E] text-white border-[#7A1E1E] shadow-md"
                       : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                   }`}
                 >
                   {status.charAt(0).toUpperCase() + status.slice(1)}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-[#E2E8F0] bg-white/50">
            <div className="mb-4 rounded-full bg-[#F1F5F9] p-4">
              <ShoppingBag className="h-8 w-8 text-[#94A3B8]" />
            </div>
            <h3 className="text-lg font-medium text-[#1E293B]">No orders found</h3>
            <p className="text-[#64748B]">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusStyle = statusStyles[order.status] || statusStyles.pending
            const isExpanded = expandedOrderId === order.id

            return (
              <div
                key={order.id}
                className={`group relative flex flex-col rounded-xl border bg-white shadow-sm transition-all duration-300 hover:shadow-md ${
                  isExpanded ? "border-[#7A1E1E] ring-1 ring-[#7A1E1E]/10" : "border-[#E2E8F0]"
                }`}
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-lg font-bold text-[#1E293B]">
                          Table {order.table.replace(/^\D+/, '')}
                        </span>
                        <span className="text-xs text-[#94A3B8]">#{order.orderNumber}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-[#64748B]">
                        <Clock size={12} />
                        {formatDate(order.timestamp)}
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                      {statusStyle.icon}
                      <span className="capitalize">{order.status}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#F1F5F9] pt-4">
                    <div className="text-sm font-medium text-[#64748B]">
                      {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                    </div>
                    <div className="font-serif text-lg font-bold text-[#7A1E1E]">
                      ₹{order.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Expanded Details / Actions */}
                <div className="mt-auto bg-[#F8FAFC] p-4 rounded-b-xl border-t border-[#E2E8F0]">
                  <button
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    className="flex w-full items-center justify-between text-xs font-medium text-[#64748B] hover:text-[#7A1E1E]"
                  >
                    <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {isExpanded && (
                    <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-[#334155] flex-1">
                              <span className="font-semibold text-[#7A1E1E] mr-1">{item.quantity}x</span> 
                              {item.name}
                            </span>
                            <span className="text-[#64748B]">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-[#E2E8F0] pt-3 flex justify-between items-center bg-gray-50/50 p-2 rounded-lg">
                        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Current Status</span>
                         <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            {order.status}
                         </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}