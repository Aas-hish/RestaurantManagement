"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Save, Loader2, Store, Phone, Mail, MapPin, Clock, ChefHat } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/context/auth-context"
import { getAuth } from "firebase/auth"

export default function AdminSettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    restaurantName: "",
    phone: "",
    email: "",
    address: "",
    openTime: "",
    closeTime: "",
  })

  // Load initial settings
  useEffect(() => {
    async function loadSettings() {
      if (authLoading) return
      if (!user) {
         setLoading(false)
         return
      }

      try {
        const auth = getAuth()
        const token = await auth.currentUser?.getIdToken()
        if (!token) {
           // Fallback or demo mode - just stop loading
           setLoading(false)
           return
        }

        const res = await fetch("/api/admin/settings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (res.ok) {
          const data = await res.json()
          if (data && Object.keys(data).length > 0) {
            setSettings({
                restaurantName: data.restaurantName || "",
                phone: data.phone || "",
                email: data.email || "",
                address: data.address || "",
                openTime: data.openTime || "",
                closeTime: data.closeTime || "",
            })
          }
        }
      } catch (error) {
        console.error("Failed to load settings", error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [user, authLoading])


  const [saved, setSaved] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
        const auth = getAuth()
        const token = await auth.currentUser?.getIdToken()
        
        if (!token) {
            throw new Error("Not authenticated")
        }

        const res = await fetch("/api/admin/settings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(settings),
        })

        if (!res.ok) throw new Error("Failed to save")

        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    } catch (error) {
        console.error("Error saving settings:", error)
        alert("Failed to save settings")
    } finally {
        setSaving(false)
    }
  }

  if (authLoading || loading) {
      return (
        <div className="flex h-[60vh] items-center justify-center">
            <LoadingSpinner />
        </div>
      )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7A1E1E] to-[#5d1515] text-[#FFF8E7] p-8 shadow-lg">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <ChefHat size={120} />
        </div>
        <div className="relative z-10">
            <h1 className="text-4xl font-serif font-bold mb-2 flex items-center gap-3">
                <Store className="w-8 h-8 text-[#FFD700]" />
                Restaurant Profile
            </h1>
            <p className="text-[#FFF8E7]/80 max-w-xl text-lg font-light">
                Manage your restaurant's identity, contact information, and operating hours visible to your customers and staff.
            </p>
        </div>
      </div>

      {/* Success Notification */}
      {saved && (
        <div className="animate-in fade-in slide-in-from-top-4 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl shadow-sm flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="font-medium">Settings saved successfully!</span>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0]/50 overflow-hidden">
        
        {/* Section: General Info */}
        <div className="p-8 border-b border-[#E2E8F0] space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#7A1E1E]/10 rounded-lg text-[#7A1E1E]">
                    <Store size={24} />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">General Information</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-[#475569] uppercase tracking-wider">Restaurant Name</label>
                    <input
                        type="text"
                        name="restaurantName"
                        value={settings.restaurantName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#1A1A1A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#7A1E1E]/20 focus:border-[#7A1E1E] transition-all"
                        placeholder="e.g. The Golden Spoon"
                    />
                </div>
                 <div className="space-y-4">
                    <label className="block text-sm font-medium text-[#475569] uppercase tracking-wider">Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-4 top-3.5 text-[#94A3B8]" size={20} />
                        <input
                            type="text"
                            name="address"
                            value={settings.address}
                            onChange={handleChange}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#1A1A1A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#7A1E1E]/20 focus:border-[#7A1E1E] transition-all"
                             placeholder="123 Culinary Ave"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Section: Contact */}
        <div className="p-8 border-b border-[#E2E8F0] space-y-6 bg-[#FAFAFA]/50">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#FFD700]/20 rounded-lg text-[#b39200]">
                    <Phone size={24} />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">Contact Details</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                     <label className="block text-sm font-medium text-[#475569]">Phone Number</label>
                     <div className="relative">
                        <Phone className="absolute left-4 top-3.5 text-[#94A3B8]" size={18} />
                        <input 
                            type="tel" 
                            name="phone" 
                            value={settings.phone} 
                            onChange={handleChange} 
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#E2E8F0] focus:ring-2 focus:ring-[#FFD700]/50 focus:border-[#FFD700] outline-none transition-all"
                            placeholder="+1 (555) 000-0000" 
                        />
                     </div>
                </div>
                <div className="space-y-2">
                     <label className="block text-sm font-medium text-[#475569]">Email Address</label>
                     <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-[#94A3B8]" size={18} />
                        <input 
                            type="email" 
                            name="email" 
                            value={settings.email} 
                            onChange={handleChange} 
                             className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#E2E8F0] focus:ring-2 focus:ring-[#FFD700]/50 focus:border-[#FFD700] outline-none transition-all"
                            placeholder="contact@restaurant.com" 
                        />
                     </div>
                </div>
            </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end">
            <button 
                onClick={handleSave} 
                disabled={saving} 
                className="btn-primary flex items-center gap-3 px-8 py-3 text-lg shadow-lg shadow-[#7A1E1E]/20 hover:shadow-xl hover:shadow-[#7A1E1E]/30 transform hover:-translate-y-0.5 transition-all"
            >
                {saving ? <LoadingSpinner variant="tiny" size={24} /> : <Save size={24} />}
                {saving ? "Saving Changes..." : "Save Configuration"}
            </button>
        </div>

      </div>
    </div>
  )
}
