"use client"

import { useEffect, useState, useMemo } from "react"
import { useOrders } from "@/hooks/use-orders"
import { AlertCircle, ChefHat, CheckCircle, Clock, Utensils } from "lucide-react"
import type { Order } from "@/types"

export default function KitchenDashboard() {
  const { orders, updateOrderStatus } = useOrders()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    const timer2 = setTimeout(() => setIsLoading(false), 500)
    return () => {
      clearInterval(timer)
      clearTimeout(timer2)
    }
  }, [])

  // Filter orders for today only
  const todayOrders = useMemo(() => {
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const endOfDay = new Date(today.setHours(23, 59, 59, 999))
    
    return orders.filter(order => {
      const orderDate = new Date(order.timestamp)
      return orderDate >= startOfDay && orderDate <= endOfDay
    })
  }, [orders])

  // Filter today's orders by status
  const pendingOrders = useMemo(() => 
    todayOrders.filter((o) => o.status === "pending"), 
    [todayOrders]
  )
  const cookingOrders = useMemo(() => 
    todayOrders.filter((o) => o.status === "cooking"), 
    [todayOrders]
  )
  const readyOrders = useMemo(() => 
    todayOrders.filter((o) => o.status === "ready"), 
    [todayOrders]
  )

  // Also get delivered orders for completeness
  const deliveredOrders = useMemo(() => 
    todayOrders.filter((o) => o.status === "delivered"), 
    [todayOrders]
  )

  const todayTotalOrders = todayOrders.length

  const handleStartCooking = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, "cooking")
    } catch (error) {
      console.error("Error starting cooking:", error)
    }
  }

  const handleMarkReady = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, "ready")
    } catch (error) {
      console.error("Error marking ready:", error)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 relative pb-10">
      <div className="space-y-8">
        {/* Header */}
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7A1E1E] to-[#5d1515] text-[#FFF8E7] p-8 shadow-lg">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <ChefHat size={120} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-4xl font-serif font-bold mb-2 flex items-center gap-3">
                <ChefHat className="w-8 h-8 text-[#FFD700]" />
                Kitchen Feed
              </h1>
              <p className="text-[#FFF8E7]/80 font-light text-lg">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 shadow-sm">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </div>
              <span className="text-xs font-bold text-[#FFD700] uppercase tracking-wide">Live Updates</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-gray-200 transition-colors">
            <div className="flex justify-between items-start z-10 relative">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Today</p>
                <h3 className="text-3xl font-serif font-bold text-[#1A1A1A]">{todayTotalOrders}</h3>
              </div> 
              <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-colors">
                <Utensils className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10">
               <AlertCircle size={80} className="text-orange-500 transform rotate-12" />
            </div>
            <div className="flex justify-between items-start z-10 relative">
              <div>
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Pending</p>
                <h3 className="text-3xl font-serif font-bold text-[#1A1A1A]">{pendingOrders.length}</h3>
              </div>
              <div className="p-2.5 bg-orange-50 rounded-xl">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="mt-3 w-full bg-orange-50 rounded-full h-1">
                <div 
                    className="bg-orange-500 h-1 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (pendingOrders.length / Math.max(1, todayTotalOrders)) * 100)}%` }}
                />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-yellow-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-10">
               <ChefHat size={80} className="text-yellow-500 transform -rotate-12" />
            </div>
            <div className="flex justify-between items-start z-10 relative">
              <div>
                <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-2">Cooking</p>
                <h3 className="text-3xl font-serif font-bold text-[#1A1A1A]">{cookingOrders.length}</h3>
              </div>
              <div className="p-2.5 bg-yellow-50 rounded-xl">
                <ChefHat className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="mt-3 w-full bg-yellow-50 rounded-full h-1">
                <div 
                    className="bg-yellow-500 h-1 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (cookingOrders.length / Math.max(1, todayTotalOrders)) * 100)}%` }}
                />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-green-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
             <div className="absolute top-0 right-0 p-3 opacity-10">
               <CheckCircle size={80} className="text-green-500 transform rotate-45" />
            </div>
            <div className="flex justify-between items-start z-10 relative">
              <div>
                <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">Ready</p>
                <h3 className="text-3xl font-serif font-bold text-[#1A1A1A]">{readyOrders.length}</h3>
              </div>
              <div className="p-2.5 bg-green-50 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-3 w-full bg-green-50 rounded-full h-1">
                <div 
                    className="bg-green-500 h-1 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (readyOrders.length / Math.max(1, todayTotalOrders)) * 100)}%` }}
                />
            </div>
          </div>
        </div>

        {todayTotalOrders === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <ChefHat className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Kitchen is Clear</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm text-center">
              No orders have been placed yet today. Orders will appear here automatically.
            </p>
            <div className="mt-8 px-4 py-2 bg-gray-100 rounded-full text-xs font-mono text-gray-500">
              {formatTime(currentTime)} • Waiting for orders
            </div>
          </div>
        ) : (
          <>
            {pendingOrders.length === 0 && cookingOrders.length === 0 && readyOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">All Caught Up!</h3>
                    <p className="mt-2 text-sm text-gray-500 max-w-sm text-center">
                        Great job! There are no active orders in the kitchen right now.
                    </p>
                </div>
            )}

            {/* Pending Section */}
            {pendingOrders.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                   <div className="w-2 h-8 bg-orange-500 rounded-full" />
                   <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">Pending Orders</h2>
                   <span className="ml-auto text-xs font-bold bg-orange-100 text-orange-700 px-3 py-1 rounded-full uppercase tracking-wide">
                     Priority
                   </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {pendingOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      status="pending"
                      onAction={() => handleStartCooking(order.id)}
                      actionText="Start Cooking"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Cooking Section */}
            {cookingOrders.length > 0 && (
              <div className="space-y-6 mt-12">
                 <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                   <div className="w-2 h-8 bg-yellow-500 rounded-full" />
                   <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">In Progress</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {cookingOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      status="cooking"
                      onAction={() => handleMarkReady(order.id)}
                      actionText="Mark Ready"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Ready Section */}
            {readyOrders.length > 0 && (
              <div className="space-y-6 mt-12">
                 <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                   <div className="w-2 h-8 bg-green-500 rounded-full" />
                   <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">Ready for Pickup</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {readyOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      status="ready"
                      actionText="Served"
                      disabled={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface OrderCardProps {
  order: Order
  status: 'pending' | 'cooking' | 'ready'
  onAction?: () => void
  actionText?: string
  disabled?: boolean
}

function OrderCard({ order, status, onAction, actionText, disabled = false }: OrderCardProps) {
  const styles = {
    pending: { 
        border: 'border-orange-100', 
        bg: 'bg-white',
        accent: 'bg-orange-500', 
        text: 'text-orange-700',
        badge: 'bg-orange-50'
    },
    cooking: { 
        border: 'border-yellow-100',
        bg: 'bg-white', 
        accent: 'bg-yellow-500', 
        text: 'text-yellow-700',
        badge: 'bg-yellow-50'
    },
    ready: { 
        border: 'border-green-100', 
        bg: 'bg-white',
        accent: 'bg-green-500', 
        text: 'text-green-700',
        badge: 'bg-green-50'
    }
  }[status]

  const timeAgo = (timestamp: string | number | Date) => {
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
    if (diff === 0) return "Just now"
    return `${diff}m ago`
  }

  return (
    <div className={`relative group flex flex-col h-full bg-white rounded-2xl border ${styles.border} shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden`}>
      {/* Top Stripe */}
      <div className={`h-1 w-full ${styles.accent}`} />
      
      <div className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Table</span>
            <h3 className="text-2xl font-serif font-bold text-[#1A1A1A] leading-none mt-1">{order.table}</h3>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${styles.badge} ${styles.text}`}>
            {status}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-gray-400 bg-gray-50 p-2 rounded-lg">
           <Clock size={14} />
           <span>Ordered {timeAgo(order.timestamp)}</span>
           <span className="mx-1">•</span>
           <span>#{order.orderNumber || order.id?.slice(-4)}</span>
        </div>

        {/* Items List */}
        <div className="flex-1 space-y-3 mb-5">
           {order.items.slice(0, 4).map((item: any, i: number) => (
             <div key={i} className="flex items-start gap-3 text-sm">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 text-[#1A1A1A] font-bold text-xs">
                    {item.quantity}
                </span>
                <span className="text-gray-700 font-medium leading-snug pt-0.5">
                    {item.name || 'Unnamed Item'}
                </span>
             </div>
           ))}
           {order.items.length > 4 && (
             <p className="text-xs text-center text-gray-400 font-medium italic pt-2">
                +{order.items.length - 4} more items
             </p>
           )}
        </div>

        {onAction && (
          <button
            onClick={(e) => {
                e.stopPropagation()
                onAction()
            }}
            disabled={disabled}
            className={`mt-auto w-full py-3 px-4 rounded-xl text-sm font-bold tracking-wide shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
              disabled 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                : `${styles.accent} text-white hover:brightness-110`
            }`}
          >
            {status === 'pending' && <Utensils size={16} />}
            {status === 'cooking' && <CheckCircle size={16} />}
            {actionText}
          </button>
        )}
      </div>
    </div>
  )
}