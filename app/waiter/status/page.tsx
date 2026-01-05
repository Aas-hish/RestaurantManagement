"use client"

import { useMemo, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useOrders } from "@/hooks/use-orders"
import { 
  Filter, 
  Search, 
  X, 
  CheckCircle, 
  Clock, 
  ChevronDown,
  AlertCircle,
  Truck,
  ListFilter,
  Utensils
} from "lucide-react"
import { format, isSameDay, subDays, isWithinInterval, startOfMonth, endOfMonth } from "date-fns"

type DateFilter = "today" | "yesterday" | "week" | "month" | "all"

export default function OrderStatusPage() {
  const { userProfile, loading: authLoading } = useAuth()
  const { orders, updateOrderStatus } = useOrders({
    waiterId: userProfile?.id || "loading",
  })
  
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("today")

  const statusStyles: Record<string, { bg: string, text: string, icon: React.ReactNode, border: string }> = {
    pending: { bg: "bg-orange-50", text: "text-orange-700", icon: <AlertCircle size={14} />, border: "border-orange-100" },
    cooking: { bg: "bg-yellow-50", text: "text-yellow-700", icon: <Clock size={14} />, border: "border-yellow-100" },
    ready: { bg: "bg-green-50", text: "text-green-700", icon: <CheckCircle size={14} />, border: "border-green-100" },
    delivered: { bg: "bg-blue-50", text: "text-blue-700", icon: <Truck size={14} />, border: "border-blue-100" },
    cancelled: { bg: "bg-red-50", text: "text-red-700", icon: <X size={14} />, border: "border-red-100" },
  }

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, "delivered")
    } catch (error) {
      console.error("Error updating order:", error)
    }
  }

  const filteredOrders = useMemo(() => {
    if (!orders) return []

    const now = new Date()

    return orders.filter((order) => {
      // Status
      if (statusFilter !== 'all' && order.status !== statusFilter) return false
      
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const match = order.table.toLowerCase().includes(q) || 
                      order.items.some(i => i.name.toLowerCase().includes(q)) ||
                      (order.orderNumber || "").toLowerCase().includes(q)
        if (!match) return false
      }

      // Date Logic
      const orderDate = new Date(order.timestamp)
      if (dateFilter === 'today') {
           return isSameDay(orderDate, now)
      }
      if (dateFilter === 'yesterday') {
           return isSameDay(orderDate, subDays(now, 1))
      }
      if (dateFilter === 'week') {
           return isWithinInterval(orderDate, { start: subDays(now, 7), end: now })
      }
      if (dateFilter === 'month') {
           return isWithinInterval(orderDate, { start: startOfMonth(now), end: endOfMonth(now) })
      }

      return true
    })
  }, [orders, statusFilter, searchQuery, dateFilter])

  return (
    <div className="space-y-8 pb-10">
      
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7A1E1E] to-[#5d1515] text-[#FFF8E7] p-8 shadow-lg">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <ListFilter size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <h1 className="text-3xl font-serif font-bold mb-2 flex items-center gap-3">
                    <ListFilter className="w-8 h-8 text-[#FFD700]" />
                    Order Status
                </h1>
                <p className="text-[#FFF8E7]/80 font-light text-lg">
                    Real-time tracking of your active tables.
                </p>
            </div>
            {/* Date Filter Pills */}
            <div className="flex gap-2 flex-wrap bg-white/10 p-1.5 rounded-xl backdrop-blur-sm border border-white/10">
                {[
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                ].map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setDateFilter(filter.id as DateFilter)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            dateFilter === filter.id
                                ? "bg-[#FFD700] text-[#7A1E1E] shadow-md font-bold"
                                : "text-[#FFF8E7] hover:bg-white/10"
                        }`}
                    >
                        {filter.label}
                    </button>
                ))}
                 <button
                        onClick={() => setDateFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            dateFilter === 'all'
                                ? "bg-[#FFD700] text-[#7A1E1E] shadow-md font-bold"
                                : "text-[#FFF8E7] hover:bg-white/10"
                        }`}
                    >
                        All History
                    </button>
            </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative bg-white rounded-2xl shadow-sm border border-gray-100">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
           <input
            type="text"
            placeholder="Search by table, item, or order #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7A1E1E]/20 text-gray-800 placeholder:text-gray-400 font-medium transition-all"
           />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
           {["all", "pending", "cooking", "ready", "delivered", "cancelled"].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-5 py-3 rounded-2xl whitespace-nowrap text-sm font-bold border transition-all ${
                statusFilter === status 
                  ? "bg-[#1A1A1A] text-[#FFD700] border-[#1A1A1A] shadow-lg shadow-gray-200" 
                  : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-gray-100 border-dashed">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <Search size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No orders found matching your filters.</p>
          </div>
        ) : (
          filteredOrders.map(order => {
             const style = statusStyles[order.status] || statusStyles.pending
             
             return (
               <div key={order.id} className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-xl ${
                   order.status === 'ready' ? 'border-green-200 ring-1 ring-green-100 shadow-md' : 'border-gray-100 shadow-sm'
               }`}>
                 
                 {/* Card Header */}
                 <div className="p-5 flex justify-between items-start border-b border-gray-50 bg-gray-50/30">
                   <div className="flex gap-3">
                     <div className="w-12 h-12 bg-[#1A1A1A] text-[#FFF8E7] rounded-xl flex items-center justify-center font-serif font-bold text-xl shadow-md">
                        {order.table.replace(/^\D+/, "")}
                     </div>
                     <div>
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Table</p>
                       <div className="flex items-center gap-1.5 mt-0.5 text-gray-500 text-xs font-medium">
                          <Clock size={12} />
                          {format(new Date(order.timestamp), "h:mm a")}
                       </div>
                     </div>
                   </div>
                   
                   <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 border ${style.bg} ${style.text} ${style.border}`}>
                     {style.icon}
                     {order.status}
                   </span>
                 </div>
                 
                 {/* Items */}
                 <div className="p-5 flex-1 bg-white">
                   <div className="space-y-3">
                     {order.items.slice(0, 4).map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center text-sm group/item">
                         <span className="text-gray-700 flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center bg-gray-100 text-gray-600 rounded text-xs font-bold">{item.quantity}</span>
                            <span className="font-medium group-hover/item:text-[#7A1E1E] transition-colors">{item.name}</span>
                         </span>
                         <span className="text-gray-400 text-xs font-mono">₹{(item.price * item.quantity).toFixed(0)}</span>
                       </div>
                     ))}
                     {order.items.length > 4 && (
                       <div className="pt-2 text-center">
                            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full">+{order.items.length - 4} more items</span>
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Footer Actions */}
                 <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                   <div className="flex justify-between items-end mb-4">
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Amount</span>
                     <span className="text-xl font-serif font-bold text-[#1A1A1A]">₹{order.totalAmount.toFixed(0)}</span>
                   </div>
                   
                   {order.status === 'ready' ? (
                     <button
                       onClick={() => handleMarkDelivered(order.id)}
                       className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                     >
                       <CheckCircle size={18} />
                       Mark Delivered
                     </button>
                   ) : order.status === 'delivered' ? (
                     <div className="w-full py-3 text-center text-sm font-bold text-green-700 bg-green-50 rounded-xl border border-green-100 flex items-center justify-center gap-2">
                        <CheckCircle size={16} />
                        Completed
                     </div>
                   ) : (
                     <div className={`w-full py-3 text-center text-sm font-bold rounded-xl border flex items-center justify-center gap-2 ${
                         order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-100 text-gray-500 border-gray-200'
                     }`}>
                       {order.status === 'cooking' && <Clock size={16} className="animate-pulse" />}
                       {order.status === 'cancelled' ? 'Order Cancelled' : 'In Progress'}
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