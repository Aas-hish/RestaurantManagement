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
    <div className="space-y-6 relative">

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kitchen Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-100 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Live Updates</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Today's Completed Orders</p>
                <h3 className="text-2xl font-bold text-gray-900">{todayTotalOrders}</h3>
                
              </div> 
              <div className="p-2 bg-blue-50 rounded-lg">
                <Utensils className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Pending</p>
                <h3 className="text-2xl font-bold text-orange-600">{pendingOrders.length}</h3>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-orange-500 h-1.5 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (pendingOrders.length / Math.max(1, todayTotalOrders)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div className="p-2 bg-orange-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Cooking</p>
                <h3 className="text-2xl font-bold text-yellow-600">{cookingOrders.length}</h3>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-yellow-500 h-1.5 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (cookingOrders.length / Math.max(1, todayTotalOrders)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <ChefHat className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Ready</p>
                <h3 className="text-2xl font-bold text-green-600">{readyOrders.length}</h3>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (readyOrders.length / Math.max(1, todayTotalOrders)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {todayTotalOrders === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <ChefHat className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No orders today</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
              Today's orders will appear here when they come in. The kitchen is all caught up!
            </p>
            <div className="mt-4 text-xs text-gray-400">
              Current time: {formatTime(currentTime)}
            </div>
          </div>
        ) : (
          <>
            {pendingOrders.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Pending Orders</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {pendingOrders.length} waiting
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

            {cookingOrders.length > 0 && (
              <div className="space-y-4 mt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">In Progress</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {cookingOrders.length} in progress
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cookingOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      status="cooking"
                      onAction={() => handleMarkReady(order.id)}
                      actionText="Mark as Ready"
                    />
                  ))}
                </div>
              </div>
            )}

            {readyOrders.length > 0 && (
              <div className="space-y-4 mt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Ready to Serve</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {readyOrders.length} ready
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
  const statusColors = {
    pending: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    cooking: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    ready: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' }
  } as const

  const timeAgo = (timestamp: string | number | Date) => {
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
    if (diff === 0) return "Just now"
    return `${diff} min ago`
  }

  return (
    <div className={`bg-white rounded-lg border ${statusColors[status].border} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Table {order.table}</h3>
            <p className="text-sm text-gray-500">Order #{order.orderNumber || order.id?.slice(-6).toUpperCase() || 'N/A'}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status].bg} ${statusColors[status].text}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
            <span>{timeAgo(order.timestamp)}</span>
          </div>
          <div className="text-sm text-gray-500">
            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
          </div>
        </div>

        {order.items.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-2">ITEMS</div>
            <ul className="space-y-1">
              {order.items.slice(0, 3).map((item: any, i: number) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.quantity}x {item.name || 'Unnamed Item'}</span>
                </li>
              ))}
              {order.items.length > 3 && (
                <li className="text-xs text-gray-400">+{order.items.length - 3} more items</li>
              )}
            </ul>
          </div>
        )}

        {onAction && (
          <button
            onClick={onAction}
            disabled={disabled}
            className={`mt-4 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              disabled 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500'
            }`}
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  )
}