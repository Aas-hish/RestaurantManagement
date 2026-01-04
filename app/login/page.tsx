"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { signIn } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Perform sign-in via AuthContext (handles Firebase or demo mode)
      await signIn(email, password)

      // Determine role and redirect path
      let role: "admin" | "waiter" | "kitchen" | undefined

      try {
        // Try Firebase-first: if Firebase app is initialized and a user is present, fetch role from Firestore
        const { getApps } = await import("firebase/app")
        if (getApps().length) {
          const { getAuth } = await import("firebase/auth")
          const { getFirestore, doc, getDoc } = await import("firebase/firestore")
          const app = getApps()[0]
          const auth = getAuth(app)
          const fbUser = auth.currentUser
          if (fbUser) {
            const db = getFirestore(app)
            const snap = await getDoc(doc(db, "users", fbUser.uid))
            if (snap.exists()) {
              const data = snap.data() as any
              role = (data.role as any) || "admin"
            }
          }
        }
      } catch {}

      // Fallback: read from localStorage (demo mode handled by context)
      if (!role) {
        try {
          const raw = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null
          if (raw) {
            const parsed = JSON.parse(raw) as { role?: "admin" | "waiter" | "kitchen" }
            role = parsed.role
          }
        } catch {}
      }

      // Final fallback default
      if (!role) role = "waiter"

      // Redirect based on role
      if (role === "admin") {
        router.push("/admin/dashboard")
      } else if (role === "kitchen") {
        router.push("/kitchen/dashboard")
      } else {
        router.push("/waiter/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "Failed to login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#FFF8E7] to-[#F5F1E8]">
      <div className="w-full max-w-md mx-4">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-serif font-bold gradient-text mb-2">Restaurant Manager</h1>
          <p className="text-[#475569] text-sm">Premium Restaurant Management System</p>
        </div>

        {/* Glass Card */}
        <div className="glass-effect p-8 mb-6">
          <h2 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-6">Welcome Back</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

        </div>

        
      </div>
    </div>
  )
}
