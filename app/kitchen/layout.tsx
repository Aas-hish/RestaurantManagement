"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { KitchenSidebar } from "@/components/kitchen/kitchen-sidebar"
import { KitchenHeader } from "@/components/kitchen/kitchen-header"
import { KitchenNotification } from "@/components/kitchen/kitchen-notification"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && userProfile?.role !== "kitchen") {
      router.push("/login")
    }
  }, [userProfile, loading, router])

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (userProfile?.role !== "kitchen") {
    return null
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7]">
      <KitchenSidebar />
      <KitchenHeader />
      <main className="lg:ml-64 mt-16 px-6 pt-1 pb-6 max-w-7xl mx-auto">{children}</main>
      <KitchenNotification />
    </div>
  )
}
