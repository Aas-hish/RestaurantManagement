"use client"

import React, { useMemo, useState } from "react"
import { Plus, Edit2, Trash2, Search, Filter, ChefHat, MoreHorizontal } from "lucide-react"
import { useMenu } from "@/hooks/use-menu"
import type { MenuItem } from "@/types"
import { AddMenuItemModal } from "@/components/admin/add-menu-item-modal"
import { useAlert } from "@/components/alert/alert-dialog"

type CategoryKey = "all" | "main course" | "appetizer" | "dessert" | "beverage" | "special"

const CATEGORY_TABS: { key: CategoryKey; label: string }[] = [
  { key: "all", label: "All Items" },
  { key: "main course", label: "Main Courses" },
  { key: "appetizer", label: "Appetizers" },
  { key: "dessert", label: "Desserts" },
  { key: "beverage", label: "Drinks" },
  { key: "special", label: "Specials" },
]

const PAGE_SIZE = 9

export default function MenuPage() {
  const { menuItems, loading, error, addMenuItem, updateMenuItem, deleteMenuItem } = useMenu()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey>("all")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const { showAlert } = useAlert()

  const handleAddOrUpdate = async (formData: Partial<MenuItem>) => {
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, formData)
      } else {
        await addMenuItem({
          ...formData,
          createdAt: new Date().toISOString(),
        } as MenuItem)
      }
      setIsModalOpen(false)
      setEditingItem(null)
    } catch (error) {
      console.error("Error:", error)
      alert((error as any)?.message || "Failed to save item")
    }
  }

  const handleDeleteConfirm = async (item: MenuItem) => {
    const confirmed = await showAlert({
      title: "Delete Menu Item",
      description: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      actionText: "Delete",
      cancelText: "Cancel"
    })

    if (confirmed) {
      try {
        await deleteMenuItem(item.id)
      } catch (error) {
        console.error("Error deleting item:", error)
        alert((error as any)?.message || "Failed to delete item")
      }
    }
  }

  const formatCategoryLabel = (value: string) =>
    value
      .split(/[_-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")

  const filteredMenuItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return menuItems.filter((item) => {
      const categoryLower = (item.category || "").toLowerCase()

      if (q) {
        const name = item.name.toLowerCase()
        const desc = (item.description || "").toLowerCase()
        const cat = categoryLower
        const matchesSearch = name.includes(q) || desc.includes(q) || cat.includes(q)
        if (!matchesSearch) return false
      }

      if (categoryFilter !== "all") {
        if (!categoryLower || categoryLower !== categoryFilter) return false
      }

      return true
    })
  }, [menuItems, searchQuery, categoryFilter])

  const visibleItems = filteredMenuItems.slice(0, visibleCount)
  const canLoadMore = visibleCount < filteredMenuItems.length

  return (
    <div className="space-y-8 pb-12">
      {/* Premium Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7A1E1E] to-[#5d1515] text-[#FFF8E7] p-8 shadow-lg">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white opacity-5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-[#FFD700] opacity-10 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-[#FFD700]">
              <ChefHat size={14} />
              <span>Menu Management</span>
            </div>
            <h1 className="text-3xl font-serif font-bold tracking-tight text-[#FFF8E7]">
              Restaurant Menu
            </h1>
            <p className="text-[#FFF8E7]/80 max-w-lg text-base">
              Curate and manage your restaurant's offerings with elegance and precision.
            </p>
          </div>
          
          <button
            onClick={() => {
              setEditingItem(null)
              setIsModalOpen(true)
            }}
            className="group relative inline-flex items-center gap-3 bg-[#FFD700] hover:bg-[#E6C200] text-[#1A1A1A] px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-xl hover:shadow-[#FFD700]/20"
          >
            <Plus size={20} className="transition-transform group-hover:rotate-90" />
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="sticky top-4 z-30 space-y-4">
        <div className="glass-effect p-2 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/20 shadow-lg flex flex-col md:flex-row items-center gap-2">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="block w-full pl-10 pr-4 py-3 bg-transparent border-none rounded-xl text-sm font-medium placeholder-gray-400 focus:ring-0 focus:bg-gray-50/50 transition-colors"
            />
          </div>

          <div className="h-8 w-[1px] bg-gray-200 hidden md:block"></div>

          {/* Filter Tabs */}
          <div className="w-full overflow-x-auto no-scrollbar pb-2 md:pb-0">
            <div className="flex items-center gap-1 px-2">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setCategoryFilter(tab.key)
                    setVisibleCount(PAGE_SIZE)
                  }}

                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    categoryFilter === tab.key
                      ? "text-[#7A1E1E] bg-[#7A1E1E]/5 shadow-sm ring-1 ring-[#7A1E1E]/20"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                  {categoryFilter === tab.key && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#7A1E1E]"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex items-center gap-3 text-red-800 animate-in slide-in-from-top-2">
          <div className="h-2 w-2 rounded-full bg-red-500"></div>
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      {/* Loading Grid */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-4">
              <div className="h-56 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="space-y-2 px-2">
                <div className="h-6 w-3/4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Grid */}
      {!loading && visibleItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Image Area */}
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-60" />
                
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                    <ChefHat className="text-white/20 h-16 w-16" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] shadow-sm">
                    {item.category || "General"}
                  </span>
                </div>

                <div className="absolute top-4 right-4 z-20">
                   <div className={`h-3 w-3 rounded-full shadow-lg ${item.available ? 'bg-green-500 ring-2 ring-green-200' : 'bg-red-500 ring-2 ring-red-200'}`} />
                </div>

                {/* Price Tag */}
                <div className="absolute bottom-4 left-4 z-20">
                  <div className="flex items-baseline gap-1 text-white">
                     <span className="text-sm font-light opacity-80">₹</span>
                     <span className="text-3xl font-serif font-bold tracking-tight">{item.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-serif text-xl font-bold text-[#1A1A1A] group-hover:text-[#7A1E1E] transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                </div>
                
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                  {item.description}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                  <button
                    onClick={() => {
                        setEditingItem(item)
                        setIsModalOpen(true)
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 text-gray-700 font-medium text-sm hover:bg-[#7A1E1E] hover:text-white transition-colors"
                  >
                    <Edit2 size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteConfirm(item)}
                    className="w-12 flex items-center justify-center py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {!loading && canLoadMore && (
        <div className="flex justify-center pt-8">
          <button
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="group flex flex-col items-center gap-2 text-gray-400 hover:text-[#7A1E1E] transition-colors"
          >
            <span className="text-sm font-bold uppercase tracking-widest">Load More</span>
            <div className="h-1 w-12 rounded-full bg-gray-200 group-hover:bg-[#7A1E1E] transition-colors" />
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredMenuItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-yellow-200 blur-2xl opacity-50 rounded-full"></div>
                <div className="relative bg-white p-6 rounded-2xl shadow-xl border border-yellow-100">
                    <Search className="h-12 w-12 text-[#FFD700]" />
                </div>
            </div>
            <h3 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-2">No dishes found</h3>
            <p className="text-gray-500 max-w-sm mb-8">
                We couldn't find any menu items matching your search. Try adjusting your filters or add a new item.
            </p>
            <button
                onClick={() => {
                    setEditingItem(null)
                    setIsModalOpen(true)
                }}
                className="btn-primary flex items-center gap-2"
            >
                <Plus size={18} />
                <span>Add Item</span>
            </button>
        </div>
      )}

      {/* Modals & Dialogs */}
      <AddMenuItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(null)
        }}
        onSubmit={handleAddOrUpdate}
        initialData={editingItem || undefined}
      />
    </div>
  )
}