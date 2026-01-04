"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { WaiterSidebar } from "@/components/waiter/waiter-sidebar"
import { WaiterHeader } from "@/components/waiter/waiter-header"
import { WaiterNotification } from "@/components/waiter/waiter-notification"

export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && userProfile?.role !== "waiter") {
      router.push("/login")
    }
  }, [userProfile, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FFF8E7]">
        <div className="inline-block w-12 h-12 border-4 border-[#7A1E1E] border-t-[#FFD700] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (userProfile?.role !== "waiter") {
    return null
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7]">
      <WaiterSidebar />
      <WaiterHeader />
      <main className="lg:ml-64 mt-16 p-6 max-w-7xl mx-auto">{children}</main>
      <WaiterNotification />
    </div>
  )
}
