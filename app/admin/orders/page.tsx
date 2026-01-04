"use client"

import { useOrders } from "@/hooks/use-orders"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import React, { useState, useMemo } from "react"
import { Search, X, ChevronDown, Calendar, Filter, Clock, Utensils, CheckCircle, PackageCheck } from "lucide-react"

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

export default function AdminOrdersPage() {
  const { orders } = useOrders()
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("today")

  const statusColors: Record<string, string> = {
    pending: "bg-orange-100 text-orange-800",
    cooking: "bg-yellow-100 text-yellow-800",
    ready: "bg-green-100 text-green-800",
    delivered: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
  }

  const statusTabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'cooking', label: 'Cooking' },
    { id: 'ready', label: 'Ready' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ]

  const dateFilters = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All Time' },
  ]

  const toggleExpanded = (id: string) => {
    setExpandedOrderId(id === expandedOrderId ? null : id)
  }

  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return []

    const now = new Date()
    let rangeStart: Date | null = null
    let rangeEnd: Date | null = null

    switch (dateFilter) {
      case 'today':
        rangeStart = startOfDay(now)
        rangeEnd = endOfDay(now)
        break
      case 'yesterday':
        const yesterday = subDays(now, 1)
        rangeStart = startOfDay(yesterday)
        rangeEnd = endOfDay(yesterday)
        break
      case 'week': {
        const firstDayOfWeek = subDays(now, now.getDay() === 0 ? 6 : now.getDay() - 1)
        rangeStart = startOfDay(firstDayOfWeek)
        rangeEnd = endOfDay(now)
        break
      }
      case 'month':
        rangeStart = new Date(now.getFullYear(), now.getMonth(), 1)
        rangeEnd = endOfDay(now)
        break
      case 'all':
      default:
        rangeStart = null
        rangeEnd = null
    }

    return orders.filter((order: Order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          order.orderNumber?.toLowerCase().includes(query) ||
          order.table.toLowerCase().includes(query) ||
          order.waiterName.toLowerCase().includes(query) ||
          order.items.some((item: OrderItem) => item.name.toLowerCase().includes(query))
        
        if (!matchesSearch) return false
      }

      if (rangeStart && rangeEnd) {
        const orderDate = new Date(order.timestamp)
        if (orderDate < rangeStart || orderDate > rangeEnd) return false
      }

      return true
    })
  }, [orders, statusFilter, searchQuery, dateFilter])

  return (
    <div className="min-h-screen  p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-serif">Order Management</h1>
          <p className="text-gray-600 mt-2">View and manage all restaurant orders</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {['pending', 'cooking', 'ready', 'delivered'].map((status) => (
            <div 
              key={status} 
              className={`p-5 rounded-2xl shadow-sm border ${
                statusColors[status].includes('bg-') 
                  ? statusColors[status].split(' ')[0] 
                  : 'bg-white'
              }/20 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 capitalize">{status}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {orders?.filter((o: Order) => o.status === status).length || 0}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${
                  statusColors[status].includes('bg-') 
                    ? statusColors[status].split(' ')[0].replace('bg-', 'bg-').replace('100', '500') + '/10' 
                    : 'bg-gray-100'
                }`}>
                  <div className={`w-6 h-6 ${
                    statusColors[status].includes('text-') 
                      ? statusColors[status].split(' ')[1] 
                      : 'text-gray-500'
                  }`}>
                    {status === 'pending' && <Clock className="w-5 h-5" />}
                    {status === 'cooking' && <Utensils className="w-5 h-5" />}
                    {status === 'ready' && <CheckCircle className="w-5 h-5" />}
                    {status === 'delivered' && <PackageCheck className="w-5 h-5" />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-gray-400" />
              Filter Orders
            </h2>
          </div>
          
          <div className="p-6 pt-0">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search orders by order #, table, waiter, or item..."
                  className="block w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1E1E]/50 focus:border-[#7A1E1E]/30 transition-all bg-white/50 backdrop-blur-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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
                  className="appearance-none block w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1E1E]/50 focus:border-[#7A1E1E]/30 bg-white/50 backdrop-blur-sm cursor-pointer"
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
                  className="appearance-none block w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1E1E]/50 focus:border-[#7A1E1E]/30 bg-white/50 backdrop-blur-sm cursor-pointer"
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
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Filters:</span>
                  {statusFilter !== 'all' && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {statusTabs.find(t => t.id === statusFilter)?.label}
                      <button 
                        onClick={() => setStatusFilter('all')}
                        className="ml-1.5 text-blue-500 hover:text-blue-700 transition-colors"
                        aria-label="Remove status filter"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                      Search: "{searchQuery}"
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="ml-1.5 text-green-500 hover:text-green-700 transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  )}
                  {dateFilter !== 'today' && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                      {dateFilters.find(f => f.id === dateFilter)?.label}
                      <button 
                        onClick={() => setDateFilter('today')}
                        className="ml-1.5 text-purple-500 hover:text-purple-700 transition-colors"
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
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-blue-50 flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setSearchQuery('')
                  setDateFilter('today')
                }}
                className="px-4 py-2 bg-[#7A1E1E] text-white rounded-lg hover:bg-[#5d1515] transition-colors text-sm font-medium"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrders.map((order: Order) => (
              <div
                key={order.id}
                className="group bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-[#7A1E1E]/20 flex flex-col h-full"
              >
                {/* Order header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#7A1E1E] transition-colors">
                        #{order.orderNumber?.slice(-6) || order.id.slice(-6)}
                      </h3>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[order.status] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center mt-1.5">
                      <span className="text-sm text-gray-500">Table {order.table.replace(/^\D+/, "")}</span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-sm text-gray-500">{format(new Date(order.timestamp), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleExpanded(order.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={expandedOrderId === order.id ? 'Collapse details' : 'Expand details'}
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                      expandedOrderId === order.id ? 'rotate-180' : ''
                    }`} />
                  </button>
                </div>

                {/* Order items preview */}
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    {order.items.slice(0, 3).map((item: OrderItem) => (
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

                  <div className="pt-3 mt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Total</span>
                        <p className="text-lg font-bold text-[#7A1E1E]">
                          ${order.totalAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {order.items.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0)} items
                        </p>
                        <p className="text-sm text-gray-500">
                          Waiter: <span className="font-medium text-gray-700">{order.waiterName}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Order Details */}
                {expandedOrderId === order.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {order.items.map((item: OrderItem) => (
                        <div key={item.menuId} className="flex justify-between text-sm">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {item.quantity}x {item.name}
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="font-medium text-gray-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              ${item.price.toFixed(2)} each
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                      Ordered on {format(new Date(order.timestamp), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}