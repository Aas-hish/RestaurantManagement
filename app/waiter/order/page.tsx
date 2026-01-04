"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useMenu } from "@/hooks/use-menu"
import { useOrders } from "@/hooks/use-orders"
import { Plus, Trash2, AlertCircle } from "lucide-react"
import type { OrderItem } from "@/types"

function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#7A1E1E] text-white rounded-lg hover:bg-[#5d1515] transition-colors text-sm font-medium"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewOrderPage() {
  const { userProfile } = useAuth()
  const { menuItems } = useMenu()
  const { createOrder } = useOrders()

  const [tableNumber, setTableNumber] = useState("")
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [alert, setAlert] = useState({
    isOpen: false,
    title: "",
    message: "",
  })

  const categories = ["All", "Appetizer", "Main Course", "Dessert", "Beverage", "Special"]
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [query, setQuery] = useState("")

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    const q = query.trim().toLowerCase()
    const matchesQuery = !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
    return matchesCategory && matchesQuery
  })

  const addItemToOrder = (menuId: string, menuItem: any) => {
    const existingItem = selectedItems.find((item) => item.menuId === menuId)

    if (existingItem) {
      setSelectedItems(
        selectedItems.map((item) => (item.menuId === menuId ? { ...item, quantity: item.quantity + 1 } : item)),
      )
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          menuId,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
        },
      ])
    }
  }

  const removeItemFromOrder = (menuId: string) => {
    setSelectedItems(selectedItems.filter((item) => item.menuId !== menuId))
  }

  const updateQuantity = (menuId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromOrder(menuId)
    } else {
      setSelectedItems(selectedItems.map((item) => (item.menuId === menuId ? { ...item, quantity } : item)))
    }
  }

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const handleSubmitOrder = async () => {
    if (!tableNumber) {
      setAlert({
        isOpen: true,
        title: "Table Number Required",
        message: "Please enter a table number before placing the order.",
      })
      return
    }

    if (selectedItems.length === 0) {
      setAlert({
        isOpen: true,
        title: "No Items Selected",
        message: "Please add at least one item to the order.",
      })
      return
    }

    setLoading(true)
    try {
      await createOrder({
        table: `Table ${tableNumber}`,
        items: selectedItems,
        status: "pending",
        waiterId: userProfile?.id || "",
        waiterName: userProfile?.name || "",
        restaurantId: (userProfile as any)?.ownerId || userProfile?.id || "",
        totalAmount: calculateTotal(),
        timestamp: new Date().toISOString(),
      })
      setSuccess(true)
      setTableNumber("")
      setSelectedItems([])

      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error("Error creating order:", error)
      setAlert({
        isOpen: true,
        title: "Order Failed",
        message: "There was an error creating your order. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }))
  }

  return (
    <>
      <AlertDialog
        isOpen={alert.isOpen}
        onClose={closeAlert}
        title={alert.title}
        message={alert.message}
      />

    <div className="space-y-6 max-w-6xl mx-auto px-4 lg:px-0">      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl lg:text-4xl font-serif font-bold text-[#0F172A]">
          New Order
        </h1>
        <p className="text-sm text-[#64748B]">
          Search dishes, pick a table and send the order straight to the kitchen.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          Order created successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="glass-effect p-3 rounded-xl flex items-center gap-3 border border-[#E2E8F0]/70 shadow-sm">            <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search menu items..."
            className="input-field"
          />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors ${selectedCategory === c
                    ? "bg-[#7A1E1E] text-white border-[#7A1E1E]"
                    : "bg-white text-[#1A1A1A] border-[#E2E8F0] hover:bg-[#F8FAFC]"
                  }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Empty states */}
          {menuItems.length === 0 && (
            <div className="glass-effect p-6 rounded-lg text-center text-[#475569]">
              No menu available yet. Please ask the admin to add items.
            </div>
          )}
          {menuItems.length > 0 && filteredItems.length === 0 && (
            <div className="glass-effect p-6 rounded-lg text-center text-[#475569]">
              No items match your filters.
            </div>
          )}

          {/* Items grid */}
          {filteredItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="glass-effect rounded-lg hover:shadow-lg transition-all overflow-hidden">
                  {/* Image */}
                  <div className="h-28 bg-[#E2E8F0]">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#7A1E1E] to-[#FFD700]">
                        <span className="text-[#FFF8E7] text-xs">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-serif font-bold text-[#1A1A1A]">{item.name}</h4>
                        <p className="text-xs text-[#475569] mt-1 line-clamp-2">{item.description}</p>
                      </div>
                      <span className="font-bold text-[#7A1E1E] ml-2">${item.price.toFixed(2)}</span>
                    </div>

                    <button
                      onClick={() => addItemToOrder(item.id, item)}
                      disabled={!item.available}
                      className={`w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 mt-1 ${item.available ? "btn-primary" : "bg-[#E2E8F0] text-[#475569] cursor-not-allowed"
                        }`}
                    >
                      <Plus size={16} />
                      {item.available ? "Add" : "Unavailable"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="glass-effect p-6 rounded-2xl h-fit sticky top-24 border border-[#E2E8F0]/70 shadow-md">          <h3 className="text-lg font-serif font-bold text-[#1A1A1A] mb-4">Order Summary</h3>

          {/* Table Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Table Number</label>
            <input
              type="number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="1"
              className="input-field"
              min="1"
            />
          </div>

          {/* Order Items */}
          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {selectedItems.length === 0 ? (
              <p className="text-[#475569] text-sm">No items added</p>
            ) : (
              selectedItems.map((item) => (
                <div
                  key={item.menuId}
                  className="flex items-center justify-between rounded-xl border border-[#E2E8F0]/80 bg-[#F8FAFC] px-3 py-2"
                >                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1A1A1A]">{item.name}</p>
                    <p className="text-xs text-[#475569]">
                      ${item.price.toFixed(2)} x {item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.menuId, item.quantity - 1)}
                      className="px-2 py-1 bg-[#E2E8F0] hover:bg-[#D0D8E0] rounded text-xs"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menuId, item.quantity + 1)}
                      className="px-2 py-1 bg-[#E2E8F0] hover:bg-[#D0D8E0] rounded text-xs"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItemFromOrder(item.menuId)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total */}
          <div className="border-t border-[#E2E8F0] pt-4 space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#475569]">Subtotal:</span>
              <span className="font-medium text-[#1A1A1A]">${calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-serif font-bold">
              <span>Total:</span>
              <span className="text-[#7A1E1E]">${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitOrder}
            disabled={loading || selectedItems.length === 0}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Order..." : "Submit Order"}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
