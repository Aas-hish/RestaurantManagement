"use client"

import React, { useMemo, useState } from "react"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { useMenu } from "@/hooks/use-menu"
import type { MenuItem } from "@/types"
import { AddMenuItemModal } from "@/components/admin/add-menu-item-modal"
import { useAlert } from "@/components/alert/alert-dialog"

type CategoryKey = "all" | "main course" | "appetizer" | "dessert" | "beverage" | "special"

const CATEGORY_TABS: { key: CategoryKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "main course", label: "Main Course" },
  { key: "appetizer", label: "Appetizer" },
  { key: "dessert", label: "Dessert" },
  { key: "beverage", label: "Beverage" },
  { key: "special", label: "Special" },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1A1A1A]">Menu Management</h1>
          <p className="text-[#64748B] mt-1 text-sm">
            Curate your restaurant’s dishes with professional controls and filters.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null)
            setIsModalOpen(true)
          }}
          className="inline-flex items-center gap-2 bg-[#7A1E1E] hover:bg-[#641717] text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm transition-colors"
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-effect rounded-2xl border border-[#E2E8F0]/80 bg-white/80 backdrop-blur-md p-4 space-y-7 shadow-sm">
        {/* Full-width search */}
        <div className="relative">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu by name, description, or category..."
            className="w-full rounded-full border border-[#E2E8F0] bg-white/70 px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#7A1E1E]/40 focus:border-[#7A1E1E]/60"
          />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 pt-1">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setCategoryFilter(tab.key)
                setVisibleCount(PAGE_SIZE)
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                categoryFilter === tab.key
                  ? "bg-[#7A1E1E] text-white border-[#7A1E1E]"
                  : "bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error message */}
      {error && !loading && (
        <div className="glass-effect p-4 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="glass-effect rounded-2xl border border-white/40 bg-white/60 backdrop-blur-md shadow-sm"
            >
              <div className="h-40 w-full rounded-t-2xl bg-[#E2E8F0] animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-2/3 bg-[#E2E8F0] rounded animate-pulse" />
                <div className="h-3 w-1/3 bg-[#E2E8F0] rounded animate-pulse" />
                <div className="h-3 w-full bg-[#E2E8F0] rounded animate-pulse" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 w-20 bg-[#E2E8F0] rounded-full animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-[#E2E8F0] rounded-lg animate-pulse" />
                    <div className="h-8 w-8 bg-[#E2E8F0] rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredMenuItems.length === 0 && (
        <div className="glass-effect p-10 rounded-2xl text-center border border-dashed border-[#E2E8F0] bg-white/70">
          <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-linear-to-br from-[#7A1E1E] via-[#C2410C] to-[#FACC15] flex items-center justify-center shadow-[0_18px_35px_rgba(15,23,42,0.25)]">
            <span className="text-3xl font-serif text-[#FFF8E7]">🍽️</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1A1A1A] mb-2">
            No menu items found
          </div>
          <p className="text-[#64748B] mb-6 text-sm max-w-md mx-auto">
            Try changing your search or category, or create a new dish to delight your guests.
          </p>
          <button
            onClick={() => {
              setEditingItem(null)
              setIsModalOpen(true)
            }}
            className="inline-flex items-center gap-2 bg-[#7A1E1E] hover:bg-[#641717] text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm transition-colors"
          >
            <Plus size={18} />
            Add Menu Item
          </button>
        </div>
      )}

      {/* Menu Grid */}
      {!loading && visibleItems.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="relative flex flex-col rounded-2xl border border-white/40 bg-linear-to-br from-white/80 via-white/90 to-[#F9FAFB] shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-md transition-transform hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(15,23,42,0.18)] overflow-hidden"
              >
                {/* Image */}
                <div className="h-40 bg-[#E2E8F0] overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#7A1E1E] to-[#FFD700]">
                      <span className="text-[#FFF8E7] text-sm">No Image</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-[#1A1A1A]">{item.name}</h3>
                      <p className="text-xs text-[#64748B] mt-1">
                        {item.category
                          ? formatCategoryLabel(item.category.toLowerCase())
                          : "Uncategorized"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-serif font-bold text-[#7A1E1E]">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-[#475569] line-clamp-3">{item.description}</p>

                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                        item.available
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.available ? "Available" : "Unavailable"}
                    </span>

                    <div className="flex gap-2">
                      <button
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-[#7A1E1E] hover:bg-[#7A1E1E]/10 transition-colors"
                        onClick={() => {
                          setEditingItem(item)
                          setIsModalOpen(true)
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-100 transition-colors"
                        onClick={() => handleDeleteConfirm(item)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {canLoadMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="rounded-full border border-[#E2E8F0] text-xs text-[#64748B] px-4 py-2 hover:bg-[#F8FAFC] transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
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