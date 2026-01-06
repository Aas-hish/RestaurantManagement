"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { ChefHat, Loader2, ArrowRight, Mail, Lock } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  const { signIn, userProfile } = useAuth()
  const router = useRouter()

  // Redirect if already logged in or upon successful login
  useEffect(() => {
    if (userProfile) {
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
          router.push("/")
      }
    }
  }, [userProfile, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await signIn(email, password)
      // Redirection handled by useEffect
    } catch (err: any) {
      setError(err.message || "Invalid email or password")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#FFF8E7] via-[#F5F1E8] to-[#E2E8F0] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-[#FFD700]/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-[#7A1E1E]/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md mx-4 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-full bg-white shadow-xl shadow-[#7A1E1E]/5 mb-4 border border-[#FFD700]/10">
            <img src="/icon.png" alt="Icon" className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-[#1A1A1A] tracking-tight mb-2">
            Restaurant<span className="text-[#7A1E1E]">Manager</span>
          </h1>
          <p className="text-[#64748B] text-sm tracking-widest uppercase font-medium">
            Premium Management Suite
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-3xl border border-white/60 p-8 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-[#1A1A1A] font-serif">Welcome Back</h2>
            <p className="text-[#64748B] text-sm mt-1">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#475569] uppercase ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#7A1E1E] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@restaurant.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A1E1E]/10 focus:border-[#7A1E1E] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#475569] uppercase ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#7A1E1E] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7A1E1E]/10 focus:border-[#7A1E1E] transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-center gap-3 animate-in slide-in-from-top-2">
                <div className="p-1 bg-red-100 rounded-full">
                  <AlertCircle size={16} className="text-red-600" />
                </div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#7A1E1E] to-[#601010] hover:from-[#8B2222] hover:to-[#701515] text-white font-bold rounded-xl shadow-lg shadow-[#7A1E1E]/20 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <LoadingSpinner variant="tiny" size={20} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-4">
             <p className="text-xs text-[#94A3B8]">
               Protected by secure enterprise authentication
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
import { AlertCircle } from "lucide-react" // Ensure AlertCircle is imported
