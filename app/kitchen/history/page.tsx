"use client"

import { useOrders } from "@/hooks/use-orders"

export default function KitchenHistoryPage() {
  const { orders } = useOrders()
  const completedOrders = orders.filter((o) => o.status === "delivered")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
        <p className="text-gray-500 mt-1">{completedOrders.length} orders completed today</p>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {completedOrders.map((order) => {
          const placedTime = new Date(order.timestamp)
          const completedTime = new Date(order.completedAt || order.timestamp)
          const duration = Math.round((completedTime.getTime() - placedTime.getTime()) / 60000)
          const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)

          return (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Table {order.table}</h3>
                  <p className="text-sm text-gray-500">{totalItems} {totalItems === 1 ? 'item' : 'items'}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Completed
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Placed at:</span>
                  <span className="font-medium">{placedTime.toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Completed at:</span>
                  <span className="font-medium">{completedTime.toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-medium text-amber-700">{duration} min</span>
                </div>
              </div>

              {order.items.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Items:</h4>
                  <ul className="space-y-1">
                    {order.items.slice(0, 3).map((item, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.quantity}x {item.name}</span>
                      </li>
                    ))}
                    {order.items.length > 3 && (
                      <li className="text-xs text-gray-400">+{order.items.length - 3} more items</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {completedOrders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100 p-8">
          <p className="text-gray-500">No completed orders yet</p>
        </div>
      )}
    </div>
  )
}
