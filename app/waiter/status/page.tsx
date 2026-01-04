"use client"

import { useMemo, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useOrders } from "@/hooks/use-orders"
import { Clock, CheckCircle, Calendar, Search, X, ChevronDown, Filter } from "lucide-react"
import { format } from "date-fns"

type DateFilter = "today" | "yesterday" | "week" | "month" | "all"

interface OrderItem {
  menuId: string
  name: string
  price: number
  quantity: number
}

interface Order {
  id: string
  orderNumber?: string
  status: string
  table: string
  timestamp: string
  totalAmount: number
  items: OrderItem[]
  waiterName: string
}

export default function OrderStatusPage() {
  const { userProfile, loading: authLoading } = useAuth()
  const { orders, updateOrderStatus } = useOrders({
    waiterId: userProfile?.id || "loading",
  })
  
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("today")

  const statusColors: Record<string, string> = {
    pending: "bg-orange-100 text-orange-800",
    cooking: "bg-yellow-100 text-yellow-800",
    ready: "bg-green-100 text-green-800",
    delivered: "bg-blue-100 text-blue-800",
  }

  const statusTabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'cooking', label: 'Cooking' },
    { id: 'ready', label: 'Ready' },
    { id: 'delivered', label: 'Delivered' },
  ]

  const dateFilters = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All Time' },
  ]

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, "delivered")
    } catch (error) {
      console.error("Error updating order:", error)
    }
  }

  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return []

    const now = new Date()
    let rangeStart: Date | null = null
    let rangeEnd: Date | null = null

    switch (dateFilter) {
      case 'today':
        rangeStart = new Date(now.setHours(0, 0, 0, 0))
        rangeEnd = new Date(now.setHours(23, 59, 59, 999))
        break
      case 'yesterday':
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        rangeStart = new Date(yesterday.setHours(0, 0, 0, 0))
        rangeEnd = new Date(yesterday.setHours(23, 59, 59, 999))
        break
      case 'week': {
        const firstDayOfWeek = new Date(now)
        firstDayOfWeek.setDate(now.getDate() - now.getDay())
        rangeStart = new Date(firstDayOfWeek.setHours(0, 0, 0, 0))
        rangeEnd = new Date(now.setHours(23, 59, 59, 999))
        break
      }
      case 'month':
        rangeStart = new Date(now.getFullYear(), now.getMonth(), 1)
        rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case 'all':
      default:
        rangeStart = null
        rangeEnd = null
    }

    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          order.table.toLowerCase().includes(query) ||
          order.items.some(item => item.name.toLowerCase().includes(query))
        
        if (!matchesSearch) return false
      }

      if (rangeStart && rangeEnd) {
        const orderDate = new Date(order.timestamp)
        if (orderDate < rangeStart || orderDate > rangeEnd) return false
      }

      return true
    })
  }, [orders, statusFilter, searchQuery, dateFilter])

  if (authLoading) {
    return (
      <div className="py-12 text-center text-[#475569]">
        Loading your orders...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#1A1A1A]">
          Order Status Tracking
        </h1>
        <p className="text-[#475569] mt-1">Track your orders in real-time</p>
      </div>

      {/* Search and Filters */}
      <div className="glass-effect rounded-2xl shadow-sm border border-[#F3F4F6] overflow-hidden bg-white/80 backdrop-blur-sm">
        <div className="p-6 border-b border-[#E5E7EB]/50">
          <h2 className="text-lg font-semibold text-[#1F2937] flex items-center">
            <Filter className="w-5 h-5 mr-2 text-[#7A1E1E]" />
            Filter Orders
          </h2>
        </div>
        
        <div className="p-6 pt-0">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-[#6B7280]" />
              </div>
              <input
                type="text"
                placeholder="Search by table number or menu item..."
                className="block w-full pl-10 pr-10 py-2.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1E1E]/50 focus:border-[#7A1E1E]/30 transition-all bg-white/80 backdrop-blur-sm text-[#1F2937] placeholder-[#9CA3AF]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B7280] hover:text-[#7A1E1E] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative w-full md:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none block w-full pl-10 pr-10 py-2.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1E1E]/50 focus:border-[#7A1E1E]/30 bg-white/80 backdrop-blur-sm cursor-pointer text-[#1F2937]"
              >
                <option value="all">All Status</option>
                {statusTabs.filter(t => t.id !== 'all').map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            {/* Date Filter */}
            <div className="relative w-full md:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="appearance-none block w-full pl-10 pr-10 py-2.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1E1E]/50 focus:border-[#7A1E1E]/30 bg-white/80 backdrop-blur-sm cursor-pointer text-[#1F2937]"
              >
                {dateFilters.map((filter) => (
                  <option key={filter.id} value={filter.id}>
                    {filter.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(statusFilter !== 'all' || searchQuery || dateFilter !== 'today') && (
            <div className="mt-4 pt-4 border-t border-[#E5E7EB]/50">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-[#6B7280] uppercase tracking-wider">Active Filters:</span>
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
                    {statusTabs.find(t => t.id === statusFilter)?.label}
                    <button 
                      onClick={() => setStatusFilter('all')}
                      className="ml-1.5 text-[#DC2626] hover:text-[#B91C1C] transition-colors"
                      aria-label="Remove status filter"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
                    Search: "{searchQuery}"
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="ml-1.5 text-[#0284C7] hover:text-[#0369A1] transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
                {dateFilter !== 'today' && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE]">
                    {dateFilters.find(f => f.id === dateFilter)?.label}
                    <button 
                      onClick={() => setDateFilter('today')}
                      className="ml-1.5 text-[#8B5CF6] hover:text-[#7C3AED] transition-colors"
                      aria-label="Reset date filter"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
                <button 
                  onClick={() => {
                    setStatusFilter('all')
                    setSearchQuery('')
                    setDateFilter('today')
                  }}
                  className="ml-auto text-xs font-medium text-gray-500 hover:text-[#7A1E1E] transition-colors flex items-center"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="group bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-[#7A1E1E]/20 flex flex-col h-full"
          >
            {/* Order header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#7A1E1E] transition-colors">
                    Table {order.table.replace(/^\D+/, '')}
                  </h3>
                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    statusColors[order.status] || 'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center mt-1.5">
                  <span className="text-sm text-gray-500">{format(new Date(order.timestamp), "h:mm a")}</span>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-sm text-gray-500">{order.items.length} items</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-[#7A1E1E]">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Order items preview */}
            <div className="flex-1 min-h-[180px] flex flex-col">
              <div className="space-y-2 flex-1">
                {order.items.slice(0, 3).map((item) => (
                  <div key={item.menuId} className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate">
                      <span className="font-medium text-gray-900">{item.quantity}x</span> {item.name}
                    </span>
                    <span className="font-medium text-gray-900 whitespace-nowrap ml-2">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="text-xs text-gray-500">+{order.items.length - 3} more items</div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 mt-3">
                {order.status === "ready" && (
                  <button
                    onClick={() => handleMarkDelivered(order.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#7A1E1E] text-white rounded-lg hover:bg-[#5d1515] transition-colors text-sm font-medium"
                  >
                    <CheckCircle size={16} />
                    Mark as Delivered
                  </button>
                )}
                {order.status === "pending" && (
                  <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 rounded-lg">
                    Waiting for kitchen to start
                  </div>
                )}
                {order.status === "cooking" && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500 bg-yellow-50 rounded-lg">
                    <Clock size={16} className="text-yellow-500" />
                    Preparing order...
                  </div>
                )}
                {order.status === "delivered" && (
                  <div className="text-center py-2 text-sm text-green-600 font-medium bg-green-50 rounded-lg">
                    Order Completed
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#475569]">No orders for this date range</p>
        </div>
      )}
    </div>
  )
}