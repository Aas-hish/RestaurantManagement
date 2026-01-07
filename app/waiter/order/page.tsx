"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useMenu } from "@/hooks/use-menu"
import { useOrders } from "@/hooks/use-orders"
import { Plus, Trash2, AlertCircle, Search, Utensils, Minus, ChefHat, Info, X } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
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
    <div className="fixed inset-0 bg-[#1A1A1A]/60 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in zoom-in-95">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">{title}</h3>
        </div>
        <p className="text-gray-500 mb-6 leading-relaxed text-sm">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#7A1E1E] text-white rounded-xl hover:bg-[#5d1515] transition-all shadow-lg shadow-red-200 text-sm font-bold tracking-wide"
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

  const [showCart, setShowCart] = useState(false)
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
        title: "Table Required",
        message: "Please enter a table number before placing the order.",
      })
      return
    }

    if (selectedItems.length === 0) {
      setAlert({
        isOpen: true,
        title: "Empty Order",
        message: "Please select items from the menu first.",
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
        totalAmount: calculateTotal(),
        timestamp: new Date().toISOString(),
      })
      setSuccess(true)
      setTableNumber("")
      setSelectedItems([])

      setTimeout(() => {
        setSuccess(false)
        setShowCart(false)
      }, 3000)
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

    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">      
      {/* Premium Header */}
       <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7A1E1E] to-[#5d1515] text-[#FFF8E7] p-8 shadow-lg">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <Utensils size={120} />
        </div>
        <div className="relative z-10">
            <h1 className="text-3xl font-serif font-bold mb-2 flex items-center gap-3">
                <Plus className="w-8 h-8 text-[#FFD700]" />
                New Order
            </h1>
            <p className="text-[#FFF8E7]/80 font-light text-lg">
                Create a new ticket for the kitchen.
            </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
          <div className="p-2 bg-green-100 rounded-full text-green-600">
            <ChefHat size={20} />
          </div>
          <div>
            <p className="font-bold">Order Placed Successfully!</p>
            <p className="text-xs text-green-600">Sent to kitchen for preparation.</p>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 gap-8 ${selectedItems.length > 0 ? 'md:grid-cols-3' : ''}`}>
        {/* Left Column: Menu */}
        <div className={`space-y-6 ${selectedItems.length > 0 ? 'md:col-span-2' : ''}`}>
          
          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm sticky top-20 z-30">
             <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search menu items..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-gray-800 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-[#7A1E1E]/20 transition-all"
                />
             </div>

             <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map((c) => (
                <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === c
                        ? "bg-[#7A1E1E] text-[#FFD700] shadow-md shadow-[#7A1E1E]/20"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                >
                    {c}
                </button>
                ))}
             </div>
          </div>

          {/* Menu Grid */}
          <div className="space-y-6">
             {menuItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-3xl border border-gray-100">
                    <Info size={40} className="text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No menu available yet.</p>
                </div>
             ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-3xl border border-gray-100">
                    <Search size={40} className="text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">No items match your search.</p>
                </div>
             ) : (
                <div className={`grid grid-cols-2 gap-5 ${selectedItems.length > 0 ? 'lg:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'}`}>
                {filteredItems.map((item) => (
                    <div key={item.id} className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full">
                    
                    {/* Image Section */}
                    <div className="aspect-[4/3] w-full bg-gray-100 relative overflow-hidden">
                        {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-300">
                            <Utensils size={32} strokeWidth={1.5} />
                        </div>
                        )}
                        
                        {/* Price Tag Overlay - Enhanced Visibility */}
                        <div className="absolute top-0 right-0 bg-[#7A1E1E] px-4 py-2 rounded-bl-2xl shadow-lg z-10">
                             <span className="font-serif font-bold text-[#FFD700] text-lg tracking-wide">₹{item.price.toFixed(0)}</span>
                        </div>

                        {/* Sold Out Overlay */}
                        {!item.available && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                                <span className="bg-[#7A1E1E] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg transform -rotate-3 border border-white/20">
                                    Sold Out
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="p-5 flex-1 flex flex-col">
                        <div className="flex-1">
                            <h4 className="font-serif font-bold text-[#1A1A1A] text-lg leading-snug group-hover:text-[#7A1E1E] transition-colors line-clamp-1 mb-1.5">
                                {item.name}
                            </h4>
                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4">
                                {item.description || "No description available."}
                            </p>
                        </div>
                        
                        <button
                        disabled={!item.available}
                        onClick={() => item.available && addItemToOrder(item.id, item)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 ${
                             item.available 
                             ? "bg-[#1A1A1A] text-white hover:bg-[#7A1E1E] shadow-md hover:shadow-lg hover:shadow-red-900/20 cursor-pointer" 
                             : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            {item.available ? (
                                <>
                                    <Plus size={14} strokeWidth={3} />
                                    Add Item
                                </>
                            ) : (
                                "Unavailable"
                            )}
                        </button>
                    </div>
                    </div>
                ))}
                </div>
             )}
          </div>
        </div>

        {/* Mobile Bottom Cart Bar */}
        {selectedItems.length > 0 && (
            <div className="fixed bottom-6 left-6 right-6 z-40 md:hidden animate-in slide-in-from-bottom-6 fade-in duration-300">
                <button 
                  onClick={() => setShowCart(true)}
                  className="w-full bg-[#1A1A1A] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between group active:scale-95 transition-all border border-gray-800"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-[#7A1E1E] w-10 h-10 rounded-full flex items-center justify-center font-bold text-[#FFD700] border border-white/10 shadow-inner">
                            {selectedItems.reduce((a, b) => a + b.quantity, 0)}
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total</p>
                            <p className="font-serif font-bold text-lg leading-none">₹{calculateTotal().toFixed(0)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pr-2">
                        <span className="text-sm font-bold text-gray-200 group-hover:text-white">View Ticket</span>
                        <ChefHat size={18} className="text-[#FFD700]" />
                    </div>
                </button>
            </div>
        )}

        {/* Right Column: Order Summary (Responsive Modal) */}
        <div className={`md:col-span-1 ${showCart ? 'fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4' : 'hidden'} ${selectedItems.length > 0 ? 'md:block' : ''}`}>
            
            {/* Mobile Backdrop Click to Close */}
            <div className="absolute inset-0 md:hidden" onClick={() => setShowCart(false)}></div>

            <div className={`bg-white md:rounded-2xl rounded-t-3xl sm:rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 md:sticky md:top-24 overflow-hidden flex flex-col w-full md:w-auto h-[85vh] md:h-auto md:max-h-[calc(100vh-8rem)] transition-all duration-300 ${showCart ? 'animate-in slide-in-from-bottom' : ''}`}>
                {/* Header */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
                        <ChefHat className="text-[#7A1E1E]" size={20} />
                        Current Ticket
                    </h3>
                    {/* Mobile Close Button */}
                    <button 
                       onClick={() => setShowCart(false)}
                       className="md:hidden p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"
                    >
                        <X size={16} />
                    </button>
                </div>

                {success ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in zoom-in-95 duration-300">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 shadow-xl shadow-green-100 mb-6 animate-bounce">
                            <ChefHat size={48} />
                        </div>
                        <h4 className="text-3xl font-serif font-bold text-[#1A1A1A] mb-2 text-center">Order Placed!</h4>
                        <p className="text-gray-500 text-center px-4 text-lg mb-8">
                            Ticket #{selectedItems.length > 0 ? "..." : "Sent"} has been sent to the kitchen.
                        </p>
                        <button 
                            onClick={() => setShowCart(false)}
                            className="bg-[#1A1A1A] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#7A1E1E] transition-colors shadow-lg"
                        >
                            Start New Order
                        </button>
                    </div>
                ) : (
                    <>
                {/* Table Input */}
                <div className="p-5 border-b border-gray-100">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Table Number</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">#</span>
                        <input
                        type="number"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="00"
                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-serif font-bold text-lg text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#7A1E1E] transition-all"
                        min="1"
                        autoFocus={!showCart} // Don't autofocus on mobile open to avoid keyboard pop
                        />
                    </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-[200px]">
                    {selectedItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10 opacity-50 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 m-1">
                            <Utensils size={32} className="mb-2" />
                            <p className="text-sm font-medium">Ticket is empty</p>
                        </div>
                    ) : (
                    selectedItems.map((item) => (
                        <div key={item.menuId} className="group flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white hover:border-[#7A1E1E]/20 hover:shadow-md transition-all">
                            <div className="flex-1 min-w-0 pr-3">
                                <p className="text-sm font-bold text-[#1A1A1A] truncate">{item.name}</p>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">₹{item.price.toFixed(0)} / unit</p>
                            </div>

                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                <button
                                onClick={() => updateQuantity(item.menuId, item.quantity - 1)}
                                className="w-6 h-6 flex items-center justify-center bg-white text-gray-600 rounded shadow-sm hover:text-red-500 transition-colors"
                                >
                                {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                                </button>
                                <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                <button
                                onClick={() => updateQuantity(item.menuId, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center bg-[#1A1A1A] text-white rounded shadow-sm hover:bg-[#7A1E1E] transition-colors"
                                >
                                <Plus size={12} />
                                </button>
                            </div>
                        </div>
                    ))
                    )}
                </div>

                {/* Footer Totals */}
                <div className="p-5 bg-gray-50 border-t border-gray-100 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span className="font-mono">₹{calculateTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Taxes</span>
                            <span className="font-mono">₹0.00</span>
                        </div>
                        <div className="flex justify-between text-lg font-serif font-bold text-[#1A1A1A] pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span className="text-[#7A1E1E]">₹{calculateTotal().toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmitOrder}
                        disabled={loading || selectedItems.length === 0}
                        className="w-full py-4 rounded-xl font-bold text-white shadow-lg bg-[#1A1A1A] hover:bg-[#7A1E1E] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                             <>
                                <LoadingSpinner variant="tiny" size={20} className="text-white" />
                                Processing...
                             </>
                        ) : (
                             <>
                                <ChefHat size={20} />
                                Place Order
                             </>
                        )}
                    </button>
                    {selectedItems.length > 0 && <p className="text-[10px] text-center text-gray-400">Review items before submitting</p>}
                </div>
                </>
                )}
            </div>
        </div>
      </div>
    </div>
    </>
  )
}
