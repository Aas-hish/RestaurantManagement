"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export default function Home() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (userProfile) {
        // Route based on role
        switch (userProfile.role) {
          case "admin":
            router.push("/admin/dashboard")
            break
          case "waiter":
            router.push("/waiter/dashboard")
            break
          case "kitchen":
            router.push("/kitchen/dashboard")
            break
          default:
            router.push("/login")
        }
      }
    }
  }, [user, userProfile, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FFF8E7]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#7A1E1E] border-t-[#FFD700] rounded-full animate-spin mb-4"></div>
          <p className="text-[#1A1A1A] font-serif text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return null
}
