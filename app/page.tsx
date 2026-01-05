"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

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
      <LoadingSpinner fullScreen />
    )
  }

  return null
}
