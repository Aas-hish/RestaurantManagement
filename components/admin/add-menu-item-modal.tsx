"use client"

import { useState, useEffect } from "react"
import type { MenuItem } from "@/types"
import { X } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<MenuItem>) => void
  initialData?: MenuItem
}

function getCloudinaryEnv() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.VITE_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Missing Cloudinary env. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET (or VITE_ equivalents).",
    )
  }
  return { cloudName, uploadPreset }
}

async function uploadToCloudinary(file: File): Promise<string> {
  const { cloudName, uploadPreset } = getCloudinaryEnv()
  const form = new FormData()
  form.append("file", file)
  form.append("upload_preset", String(uploadPreset))
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Upload failed (${res.status}): ${txt}`)
  }
  const data = (await res.json()) as { secure_url?: string }
  if (!data.secure_url) throw new Error("Cloudinary response missing secure_url")
  return data.secure_url
}

export function AddMenuItemModal({ isOpen, onClose, onSubmit, initialData }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Main Course" as MenuItem["category"],
    price: 0 as number | "",
    imageUrl: "",
    available: true,
  })
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        category: initialData.category,
        price: (initialData.price ?? 0) as number | "",
        imageUrl: initialData.imageUrl,
        available: initialData.available,
      })
      setFile(null)
      setSubmitError(null)
    } else {
      setFormData({
        name: "",
        description: "",
        category: "Main Course",
        price: 0 as number | "",
        imageUrl: "",
        available: true,
      })
      setFile(null)
      setSubmitError(null)
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[#E2E8F0] bg-white">
          <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">
            {initialData ? "Edit Menu Item" : "Add Menu Item"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[#E2E8F0] rounded-lg transition-colors" disabled={submitting}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setSubmitting(true)
            setSubmitError(null)
            try {
              // Validate file size < 1MB
              if (file) {
                if (file.size > 1024 * 1024) {
                  setSubmitting(false)
                  setFileError("Image must be less than 1MB")
                  return
                }
              }

              let imageUrl = formData.imageUrl
              if (file) {
                imageUrl = await uploadToCloudinary(file)
              }
              const price = typeof formData.price === "number" ? formData.price : 0
              await onSubmit({ ...formData, price, imageUrl })
              setSubmitting(false)
            } catch (err: any) {
              setSubmitting(false)
              setSubmitError(err?.message || "Failed to submit")
            }
          }}
          className="p-6 space-y-6"
        >
          {submitError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{submitError}</div>
          )}
          {fileError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{fileError}</div>
          )}

          {/* Two-column layout */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Details column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field min-h-28"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as MenuItem["category"],
                      })
                    }
                    className="input-field"
                    disabled={submitting}
                  >
                    <option value="Appetizer">Appetizer</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Special">Special</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price === "" ? "" : formData.price}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === "") {
                        setFormData({ ...formData, price: "" })
                      } else {
                        const num = Number.parseFloat(v)
                        setFormData({ ...formData, price: Number.isNaN(num) ? "" : num })
                      }
                    }}
                    className="input-field"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            {/* Media + status column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Item Image</label>

                {/* Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragActive(true)
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragActive(false)
                    const f = e.dataTransfer.files?.[0]
                    if (f) {
                      setFileError(null)
                      if (f.size > 1024 * 1024) {
                        setFile(null)
                        setFileError("Image must be less than 1MB")
                      } else {
                        setFile(f)
                      }
                    }
                  }}
                  className={`relative rounded-xl border-2 border-dashed transition-colors ${dragActive ? "border-[#7A1E1E] bg-[#FFF8E7]" : "border-[#E2E8F0] bg-white"}`}
                >
                  <div className="p-4 md:p-6 text-center">
                    <div className="flex items-center justify-center gap-2 text-[#475569] text-sm">
                      <span className="hidden md:inline">Drag & drop an image here, or</span>
                      <label className="inline-flex items-center gap-2 text-[#7A1E1E] font-medium hover:underline cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={submitting}
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null
                            setFileError(null)
                            if (f && f.size > 1024 * 1024) {
                              setFile(null)
                              setFileError("Image must be less than 1MB")
                            } else {
                              setFile(f)
                            }
                          }}
                        />
                        <span>Browse</span>
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-[#94A3B8]">PNG, JPG up to 1MB. Recommended 1200x800 for best appearance.</p>
                  </div>

                  {/* Preview overlay when image selected */}
                  {(file || formData.imageUrl) && (
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={file ? URL.createObjectURL(file) : formData.imageUrl || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null)
                          setFileError(null)
                          // Keep URL if user typed it; otherwise clear
                          if (!formData.imageUrl) {
                            setFormData({ ...formData, imageUrl: "" })
                          }
                        }}
                        className="absolute top-3 right-3 bg-white/90 text-[#1A1A1A] px-3 py-1 rounded-lg text-xs shadow hover:bg-white"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Or Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="input-field"
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="rounded"
                  disabled={submitting}
                />
                <label htmlFor="available" className="text-sm text-[#1A1A1A]">
                  Available
                </label>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full mt-4" disabled={submitting}>
            {submitting ? (initialData ? "Updating..." : "Adding...") : initialData ? "Update Item" : "Add Item"}
          </button>
        </form>
      </div>
    </div>
  )
}
