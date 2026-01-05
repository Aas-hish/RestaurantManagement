"use client"

import React, { useState, useMemo } from "react"
import { useAuth } from "@/context/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useOrders } from "@/hooks/use-orders"
import {
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Utensils,
  IndianRupee,
  ShoppingBag,
  Bell
} from "lucide-react"

export default function WaiterDashboard() {
  const { userProfile } = useAuth()
  const { orders, loading } = useOrders({ waiterId: userProfile?.id })

  // Orders only for *today*
  const todayOrders = useMemo(() => {
    const now = new Date()
    const start = new Date(now.setHours(0, 0, 0, 0))
    const end = new Date(now.setHours(23, 59, 59, 999))

    return orders.filter((o) => {
      const t = new Date(o.timestamp)
      if (isNaN(t.getTime())) return false
      return t >= start && t <= end
    })
  }, [orders])

  const pendingOrders = orders.filter((o) => o.status === "pending").length
  const cookingOrders = orders.filter((o) => o.status === "cooking").length
  const readyOrders = orders.filter((o) => o.status === "ready").length

  const completedToday = todayOrders.filter((o) => o.status === "delivered").length
  const totalToday = todayOrders.length
  const activeToday = todayOrders.filter((o) => ["pending", "cooking", "ready"].includes(o.status)).length
  const revenueToday = todayOrders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  // Pagination
  const pageSize = 9
  const [page, setPage] = useState(1)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize))
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize
    return orders.slice(start, start + pageSize)
  }, [orders, page])

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((current) => (current === orderId ? null : orderId))
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7A1E1E] to-[#5d1515] text-[#FFF8E7] p-8 shadow-lg select-none">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <TrendingUp size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h1 className="text-3xl font-serif font-bold mb-2 flex items-center gap-3">
                    <Utensils className="w-8 h-8 text-[#FFD700]" />
                    Welcome back, {userProfile?.name?.split(' ')[0] || 'Concierge'}
                </h1>
                <p className="text-[#FFF8E7]/80 max-w-xl text-lg font-light flex items-center gap-2">
                    <Clock size={16} className="text-[#FFD700]" />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-[#FFD700]/20 shadow-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm font-bold text-[#FFD700] tracking-wide">System Online</span>
            </div>
        </div>
      </div>

      {/* Stats Grid - Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Today's Orders", value: totalToday, icon: <ShoppingBag size={20} />, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Now", value: activeToday, icon: <Bell size={20} />, color: "text-[#7A1E1E]", bg: "bg-red-50" },
          { label: "Completed", value: completedToday, icon: <CheckCircle size={20} />, color: "text-green-600", bg: "bg-green-50" },
          { label: "My Revenue", value: `₹${revenueToday.toLocaleString()}`, icon: <IndianRupee size={20} />, color: "text-[#FFD700]", bg: "bg-[#1A1A1A]" },
        ].map((stat, idx) => (
          <div key={idx} className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                <h3 className={`text-3xl font-serif font-bold ${idx === 3 ? 'text-[#1A1A1A]' : 'text-gray-900'}`}>{stat.value}</h3>
              </div>
              <div className={`p-3.5 rounded-xl shadow-inner ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            {idx === 3 && (
                <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-[#FFD700] rounded-full" />
                </div>
            )}
          </div>
        ))}
      </div>

      {/* Kitchen Status Pulse - Redesigned */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ready to Serve - Hero Card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border border-green-100 shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                        <CheckCircle size={20} />
                    </div>
                    <h3 className="font-bold text-gray-800 uppercase tracking-wide text-sm">Ready to Serve</h3>
                </div>
                <div className="flex items-end gap-3">
                    <p className="text-5xl font-serif font-bold text-green-700">{readyOrders}</p>
                    <p className="text-sm font-medium text-green-600 mb-2">Orders ready</p>
                </div>
                {readyOrders > 0 && (
                    <div className="mt-4 px-3 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-full inline-block animate-pulse">
                        Action Required
                    </div>
                )}
            </div>
            {/* Background decoration */}
            <CheckCircle className="absolute -right-6 -bottom-6 text-green-100 w-32 h-32 transform rotate-12 group-hover:scale-110 transition-transform" />
        </div>

        {/* Small Status Adjustments */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm flex items-center justify-between group">
                <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending</p>
                     <p className="text-3xl font-serif font-bold text-orange-600 mt-1">{pendingOrders}</p>
                     <p className="text-xs text-gray-500 mt-1">Waiting acceptance</p>
                </div>
                <div className="p-3 bg-orange-50 text-orange-500 rounded-full group-hover:bg-orange-100 transition-colors">
                    <AlertCircle size={24} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-yellow-100 shadow-sm flex items-center justify-between group">
                <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cooking</p>
                     <p className="text-3xl font-serif font-bold text-yellow-600 mt-1">{cookingOrders}</p>
                     <p className="text-xs text-gray-500 mt-1">In Preparation</p>
                </div>
                <div className="p-3 bg-yellow-50 text-yellow-500 rounded-full group-hover:bg-yellow-100 transition-colors">
                    <LoadingSpinner variant="tiny" size={24} />
                </div>
            </div>
        </div>
      </div>

      {/* Recent Activity List - Premium Table Styling */}
      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-[#7A1E1E] rounded-full" />
            <h2 className="text-xl font-bold font-serif text-[#1A1A1A]">Recent Activity</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-[#7A1E1E] hover:border-[#7A1E1E] rounded-lg disabled:opacity-30 transition-all font-bold shadow-sm"
            >
              <ChevronRight className="rotate-180 w-4 h-4" />
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
               className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 text-gray-500 hover:text-[#7A1E1E] hover:border-[#7A1E1E] rounded-lg disabled:opacity-30 transition-all font-bold shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-gray-50/30">
          {paginatedOrders.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-400 flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                    <ShoppingBag size={24} />
                  </div>
                  <p>No orders recorded for today.</p>
              </div>
          ) : (
             paginatedOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id
                return (
                  <div 
                    key={order.id}
                    className={`group bg-white rounded-xl border transition-all duration-300 overflow-hidden ${
                      isExpanded ? 'border-[#7A1E1E] shadow-xl ring-1 ring-[#7A1E1E]/10 translate-y-[-4px]' : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
                    }`}
                  >
                    <div 
                      className="p-5 cursor-pointer"
                      onClick={() => toggleExpand(order.id)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] text-[#FFF8E7] flex items-center justify-center font-serif font-bold text-lg shadow-sm">
                                {order.table.replace(/^\D+/, "")}
                           </div>
                           <div>
                             <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Table</p>
                             <p className="text-xs text-gray-500 font-mono">#{order.orderNumber || order.id.slice(-4)}</p>
                           </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                          {
                            pending: "bg-orange-50 text-orange-600 border-orange-100",
                            cooking: "bg-yellow-50 text-yellow-600 border-yellow-100",
                            ready: "bg-green-50 text-green-600 border-green-100",
                            delivered: "bg-blue-50 text-blue-600 border-blue-100",
                            cancelled: "bg-red-50 text-red-600 border-red-100"
                          }[order.status]
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-end border-t border-gray-50 pt-4 mt-2">
                        <p className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-gray-300" />
                            {order.items.length} items
                        </p>
                        <p className="text-lg font-serif font-bold text-[#1A1A1A]">₹{order.totalAmount.toFixed(0)}</p>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-[#FAFAFA] text-sm p-5 border-t border-gray-100 animate-in slide-in-from-top-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Order Details</p>
                        <ul className="space-y-3">
                          {order.items.map((item, i) => (
                            <li key={i} className="flex justify-between items-center group/item hover:bg-white p-1 rounded transition-colors">
                              <span className="text-gray-700 flex items-center gap-2">
                                <span className="font-bold text-[#7A1E1E] bg-[#7A1E1E]/10 w-5 h-5 flex items-center justify-center rounded text-xs">{item.quantity}</span> 
                                <span className="font-medium">{item.name}</span>
                              </span>
                              <span className="text-gray-500 font-mono text-xs">₹{(item.price * item.quantity).toFixed(0)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="text-[10px] text-center text-gray-400 mt-4 pt-3 border-t border-gray-100 flex items-center justify-center gap-2">
                          <Clock size={10} />
                          {new Date(order.timestamp).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                )
             })
          )}
        </div>
      </div>
    </div>
  )
}