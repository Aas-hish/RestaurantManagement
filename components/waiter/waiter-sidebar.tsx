"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Menu, X, Home, Plus, BarChart3, Receipt, LogOut } from "lucide-react"

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
  }
}

export function WaiterSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [restaurantName, setRestaurantName] = useState("Restaurant")
  const pathname = usePathname()
  const { signOut, userProfile } = useAuth()

  useEffect(() => {
    const loadRestaurantName = async () => {
      try {
        if (!userProfile) return
        const cfg = getFirebaseConfig()
        if (!cfg.apiKey || !cfg.projectId) return

        const { initializeApp, getApps } = await import("firebase/app")
        const { getFirestore, doc, getDoc } = await import("firebase/firestore")

        const app = getApps().length ? getApps()[0] : initializeApp(cfg)
        const db = getFirestore(app)

        const restaurantId = (userProfile as any).ownerId || userProfile.id
        const ref = doc(db, "restaurants", restaurantId)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          const data = snap.data() as any
          setRestaurantName(data.restaurantName || data.ownerName || "Restaurant")
        }
      } catch (e) {
        console.error("Failed to load restaurant name", e)
      }
    }

    loadRestaurantName()
  }, [userProfile?.id])

  const menuItems = [
    { href: "/waiter/dashboard", label: "Dashboard", icon: Home },
    { href: "/waiter/order", label: "New Order", icon: Plus },
    { href: "/waiter/status", label: "Order Status", icon: BarChart3 },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-[#7A1E1E] text-[#FFF8E7] rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-[#1A1A1A] text-[#FFF8E7] transform transition-transform duration-300 z-40 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full pt-20 lg:pt-8">
          <div className="px-6 pb-8 border-b border-[#7A1E1E]">
            <h1 className="text-2xl font-serif font-bold text-[#FFD700]">{restaurantName}</h1>
            <p className="text-xs text-[#FFD700]/70 mt-1">Waiter Panel</p>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active ? "bg-[#7A1E1E] text-[#FFD700]" : "text-[#FFF8E7] hover:bg-[#2A2A2A]"
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="px-4 pb-8 border-t border-[#7A1E1E]">
            <button
              onClick={async () => {
                await signOut()
                setIsOpen(false)
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsOpen(false)} />}
    </>
  )
}
