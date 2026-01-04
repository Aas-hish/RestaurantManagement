"use client"

import type React from "react"

import { useState } from "react"
import { Save } from "lucide-react"

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    restaurantName: "Fine Dining Restaurant",
    phone: "+1 (555) 123-4567",
    email: "info@restaurant.com",
    address: "123 Main St, City, State 12345",
    openTime: "11:00",
    closeTime: "23:00",
  })

  const [saved, setSaved] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    })
  }

  const handleSave = () => {
    // In a real app, save to Firebase
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#1A1A1A]">Settings</h1>
        <p className="text-[#475569] mt-1">Configure restaurant information</p>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          Settings saved successfully!
        </div>
      )}

      {/* Settings Form */}
      <div className="glass-effect p-6 rounded-lg max-w-2xl">
        <div className="space-y-6">
          {/* Restaurant Name */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Restaurant Name</label>
            <input
              type="text"
              name="restaurantName"
              value={settings.restaurantName}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Phone</label>
              <input type="tel" name="phone" value={settings.phone} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Email</label>
              <input type="email" name="email" value={settings.email} onChange={handleChange} className="input-field" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Address</label>
            <textarea
              name="address"
              value={settings.address}
              onChange={handleChange}
              className="input-field min-h-20"
            />
          </div>

          {/* Operating Hours */}
          <div>
            <h3 className="font-semibold text-[#1A1A1A] mb-4">Operating Hours</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Opening Time</label>
                <input
                  type="time"
                  name="openTime"
                  value={settings.openTime}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Closing Time</label>
                <input
                  type="time"
                  name="closeTime"
                  value={settings.closeTime}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            <Save size={20} />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
