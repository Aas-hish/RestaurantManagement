"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { WaiterSidebar } from "@/components/waiter/waiter-sidebar"
import { WaiterHeader } from "@/components/waiter/waiter-header"
import { WaiterNotification } from "@/components/waiter/waiter-notification"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

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
    return <LoadingSpinner fullScreen />
  }

  if (userProfile?.role !== "waiter") {
    return null
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7]">
      <WaiterSidebar />
      <WaiterHeader />
      <main className="lg:ml-64 mt-16 px-6 pt-1 pb-6 max-w-7xl mx-auto">{children}</main>
      <WaiterNotification />
    </div>
  )
}
