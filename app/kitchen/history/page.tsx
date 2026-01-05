"use client"

import { useState, useMemo } from "react"
import { useOrders } from "@/hooks/use-orders"
import { History, Clock, Calendar, CheckCircle, ChefHat } from "lucide-react"
import { isWithinInterval, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, isSameDay } from "date-fns"

export default function KitchenHistoryPage() {
  const { orders } = useOrders()
  const [dateFilter, setDateFilter] = useState("today")

  const filteredCompletedOrders = useMemo(() => {
    const completed = orders.filter((o) => o.status === "delivered" || o.status === "cancelled")
    
    if (dateFilter === 'all') return completed

    const now = new Date()
    return completed.filter(order => {
        const orderDate = new Date(order.timestamp)
        
        if (dateFilter === 'today') {
            return isSameDay(orderDate, now)
        }
        if (dateFilter === 'yesterday') {
            return isSameDay(orderDate, subDays(now, 1))
        }
        if (dateFilter === 'week') {
            return isWithinInterval(orderDate, {
                start: subDays(now, 7),
                end: now
            })
        }
        if (dateFilter === 'month') {
            return isWithinInterval(orderDate, {
                start: startOfMonth(now),
                end: endOfMonth(now)
            })
        }
        return true
    })
  }, [orders, dateFilter])

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7A1E1E] to-[#5d1515] text-[#FFF8E7] p-8 shadow-lg">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <History size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <h1 className="text-4xl font-serif font-bold mb-2 flex items-center gap-3">
                    <History className="w-8 h-8 text-[#FFD700]" />
                    Order History
                </h1>
                <p className="text-[#FFF8E7]/80 font-light text-lg">
                    Archive of all completed and processed orders.
                </p>
            </div>
            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap bg-white/10 p-1.5 rounded-xl backdrop-blur-sm">
                {[
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: 'week', label: 'Last 7 Days' },
                    { id: 'month', label: 'This Month' },
                    { id: 'all', label: 'All Time' }
                ].map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setDateFilter(filter.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            dateFilter === filter.id
                                ? "bg-[#FFD700] text-[#7A1E1E] shadow-md font-bold"
                                : "text-[#FFF8E7] hover:bg-white/10"
                        }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Total Completed ({dateFilter === 'week' ? '7 Days' : dateFilter})</p>
              <p className="text-2xl font-serif font-bold text-[#1A1A1A]">{filteredCompletedOrders.length}</p>
           </div>
           <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
              <CheckCircle size={20} />
           </div>
        </div>
         {/* We could add more stats relative to history here later if needed, kept simple for now matching original scope */}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCompletedOrders.map((order) => {
          const placedTime = new Date(order.timestamp)
          const completedTime = new Date(order.completedAt || order.timestamp) // fallback
          // Mock duration calculation for display if original didn't have accurate completedAt
          const duration = Math.round((completedTime.getTime() - placedTime.getTime()) / 60000)
          const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)

          const isCancelled = order.status === 'cancelled'
          const accentColor = isCancelled ? 'bg-red-500' : 'bg-green-600'
          const badgeClass = isCancelled ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'

          return (
            <div key={order.id} className="group relative flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
               {/* Top Stripe */}
               <div className={`h-1.5 w-full ${accentColor}`} />

               <div className="p-6 flex flex-col h-full">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Table</span>
                        <h3 className="text-2xl font-serif font-bold text-[#1A1A1A] leading-none mt-1">
                            {order.table.replace(/^\D+/, "")}
                        </h3>
                         <p className="text-xs text-gray-400 mt-1">Order #{order.orderNumber || order.id.slice(-4)}</p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${badgeClass}`}>
                        {order.status}
                    </span>
                  </div>

                  {/* Timings */}
                  <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 rounded-xl p-3 border border-gray-100">
                     <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Placed</p>
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <Clock size={12} className="text-gray-400" />
                            {placedTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                     </div>
                     <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Duration</p>
                        <p className="text-sm font-bold text-[#1A1A1A]">
                            {duration > 0 ? `${duration} mins` : '< 1 min'}
                        </p>
                     </div>
                  </div>

                  {/* Items Summary */}
                  <div className="flex-1 space-y-2 mb-4">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Items Summary</p>
                     {order.items.slice(0, 3).map((item, i) => (
                       <div key={i} className="flex justify-between text-sm items-center py-1 border-b border-gray-50 last:border-0">
                         <span className="flex items-center gap-2 text-gray-700">
                            <span className="text-xs font-bold bg-gray-100 h-5 w-5 flex items-center justify-center rounded text-[#1A1A1A]">{item.quantity}</span>
                            {item.name}
                         </span>
                       </div>
                     ))}
                     {order.items.length > 3 && (
                        <p className="text-xs text-gray-400 font-medium pt-1">
                            + {order.items.length - 3} more items
                        </p>
                     )}
                  </div>
               </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
