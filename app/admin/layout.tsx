"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && userProfile?.role !== "admin") {
      router.push("/login")
    }
  }, [userProfile, loading, router])

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (userProfile?.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-[#FFF8E7]">
      <AdminSidebar />
      <AdminHeader />
      <main className="lg:ml-64 mt-16 px-6 pt-1 pb-6 max-w-7xl mx-auto">{children}</main>
    </div>
  )
}
