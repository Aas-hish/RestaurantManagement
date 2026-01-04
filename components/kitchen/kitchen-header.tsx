"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { User, X, Shield, LogOut } from "lucide-react"

// Local helper, same as in waiter-header
function getFirebaseConfig() {
  return {
    apiKey:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.VITE_FIREBASE_API_KEY,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
      process.env.VITE_FIREBASE_APP_ID,
  }
}

export function KitchenHeader() {
  const { userProfile, signOut } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  const [restaurantName, setRestaurantName] = useState<string | null>(null)
  const [restaurantAddress, setRestaurantAddress] = useState<string | null>(
    null,
  )

  // Load restaurant info (name + address)
  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        if (!userProfile) return
        const cfg = getFirebaseConfig()
        if (!cfg.apiKey || !cfg.projectId) return

        const { initializeApp, getApps } = await import("firebase/app")
        const { getFirestore, doc, getDoc } = await import("firebase/firestore")

        const apps = getApps()
        const app = apps.length ? apps[0] : initializeApp(cfg)
        const db = getFirestore(app)

        const restaurantId = (userProfile as any).ownerId || userProfile.id
        const ref = doc(db, "restaurants", restaurantId)
        const snap = await getDoc(ref)

        if (snap.exists()) {
          const data = snap.data() as any
          setRestaurantName(
            data.restaurantName || data.ownerName || "Restaurant",
          )
          setRestaurantAddress(data.address || null)
        }
      } catch (e) {
        console.error("Failed to load restaurant info (kitchen)", e)
      }
    }

    loadRestaurant()
  }, [userProfile?.id])

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] flex items-center justify-between px-4 sm:px-6 h-16 lg:ml-64">
        <div className="min-w-0 ml-12 sm:ml-0">
          <h2 className="text-lg sm:text-xl font-serif font-bold text-[#1A1A1A] truncate">
            Kitchen Dashboard
          </h2>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 relative">
          <button
            className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-[#E2E8F0]"
            onClick={() => setProfileOpen(true)}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#7A1E1E] flex items-center justify-center text-white">
              <User size={18} className="sm:hidden" />
              <User size={20} className="hidden sm:block" />
            </div>
            <div className="hidden sm:block min-w-0 text-left">
              <p className="text-sm font-medium text-[#1A1A1A] truncate">
                {userProfile?.name}
              </p>
              <p className="text-xs text-[#475569] truncate">
                {userProfile?.role}
              </p>
            </div>
          </button>
        </div>
      </header>

      {profileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setProfileOpen(false)}
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 h-full w-[85%] sm:w-full max-w-sm bg-[#1A1A1A] text-[#FFF8E7] shadow-2xl border-l border-[#7A1E1E]/60 flex flex-col transform transition-transform duration-300 ease-out rounded-l-2xl sm:rounded-none ${
          profileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#7A1E1E]/60 bg-[#111827]">
          <p className="text-sm font-semibold tracking-wide uppercase text-[#FFD700]">
            Profile
          </p>
          <button
            className="p-1 rounded-full hover:bg-[#1F2937]"
            onClick={() => setProfileOpen(false)}
          >
            <X size={18} className="text-[#FFF8E7]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#7A1E1E] flex items-center justify-center text-[#FFF8E7] text-lg font-semibold shadow-md">
              {userProfile?.name?.charAt(0) || "K"}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold truncate">
                {userProfile?.name || "Kitchen Staff"}
              </p>
              <p className="text-xs text-[#E5E7EB]/80 truncate">
                {userProfile?.role || "kitchen"}
              </p>
            </div>
          </div>

          {userProfile?.email && (
            <div className="bg-[#111827] rounded-xl p-3 border border-[#4B5563] text-xs">
              <p className="text-[#E5E7EB]/60">Email</p>
              <p className="text-sm text-[#FFF8E7] break-all">
                {userProfile.email}
              </p>
            </div>
          )}

          {/* Restaurant info box */}
          {(restaurantName || restaurantAddress) && (
            <div className="space-y-2 text-xs bg-[#111827] rounded-xl p-3 border border-[#7A1E1E]/50">
              <div>
                <p className="text-[#E5E7EB]/60">Restaurant</p>
                <p className="text-sm text-[#FFF8E7] font-medium">
                  {restaurantName || "Restaurant"}
                </p>
              </div>
              {restaurantAddress && (
                <div>
                  <p className="text-[#E5E7EB]/60">Location</p>
                  <p className="text-sm text-[#FFF8E7]">
                    {restaurantAddress}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 border-t border-[#4B5563] space-y-3">
            <button
              className="w-full flex items-center justify-between text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-[#FFD700]/70 text-[#FFD700] bg-[#111827] hover:bg-[#1F2937] transition-colors"
              onClick={() => {
                alert("Change password flow not implemented yet.")
              }}
            >
              <span className="flex items-center gap-2">
                <Shield size={16} />
                Change password
              </span>
              <span className="text-[10px] uppercase tracking-wide text-[#FBBF24]">
                Security
              </span>
            </button>

            <button
              className="w-full flex items-center justify-between text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-red-500/70 text-red-100 bg-red-500/10 hover:bg-red-500/20 transition-colors"
              onClick={async () => {
                await signOut()
              }}
            >
              <span className="flex items-center gap-2">
                <LogOut size={16} />
                Sign out
              </span>
              <span className="text-[10px] uppercase tracking-wide text-red-200/80">
                Exit
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}