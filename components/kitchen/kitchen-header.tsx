"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { User, X, Shield, LogOut, ChevronRight, Lock } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function KitchenHeader() {
  const { userProfile, signOut } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  
  // Password Change State
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
        setLoading(false)
        return
    }

    try {
        const { getAuth, updatePassword } = await import("firebase/auth")
        const auth = getAuth()
        const user = auth.currentUser

        if (user) {
            await updatePassword(user, newPassword)
            setMessage({ type: 'success', text: 'Password updated successfully' })
            setNewPassword("")
            setTimeout(() => {
                setPasswordModalOpen(false)
                setMessage(null)
            }, 1000) // Close after brief success show
        } else {
             // Fallback for demo users or non-firebase setups
             setMessage({ type: 'error', text: 'Cannot change password for this account type' })
        }
    } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
            setMessage({ type: 'error', text: 'Please sign out and sign in again to change password' })
        } else {
            setMessage({ type: 'error', text: error.message || 'Failed to update password' })
        }
        console.error(error)
    } finally {
        setLoading(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-6 h-16 lg:ml-64 shadow-sm transition-all duration-300">
        {/* Title */}
        <div className="flex-1 min-w-0 ml-10 sm:ml-0">
          <h2 className="text-xl font-serif font-bold text-[#1A1A1A] tracking-tight">
            Kitchen Dashboard
          </h2>
        </div>

        {/* Profile Trigger */}
        <button
            className="group flex items-center gap-3 pl-6 border-l-2 border-gray-200/60 hover:border-[#7A1E1E]/30 transition-colors outline-none h-10 my-auto"
            onClick={() => setProfileOpen(true)}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#7A1E1E] transition-colors leading-none">
                {userProfile?.name}
              </p>
              <p className="text-xs text-gray-500 mt-1 capitalize font-medium">
                {userProfile?.role}
              </p>
            </div>
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#7A1E1E] text-[#FFF8E7] flex items-center justify-center shadow-md ring-2 ring-transparent group-hover:ring-[#7A1E1E]/20 transition-all">
                    <span className="font-serif font-bold text-sm">
                        {userProfile?.name?.charAt(0).toUpperCase()}
                    </span>
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
          </button>
      </header>

      {/* Overlay */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#1A1A1A]/20 backdrop-blur-[2px] transition-opacity duration-300"
          onClick={() => setProfileOpen(false)}
        />
      )}

      {/* Refined Minimal Sidebar */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-[280px] sm:w-[360px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
          profileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-50 bg-[#FAFAFA]">
          <span className="text-sm font-serif font-bold text-[#1A1A1A] uppercase tracking-wider">User Profile</span>
          <button
            className="p-2 -mr-2 text-gray-400 hover:text-[#7A1E1E] hover:bg-[#7A1E1E]/5 rounded-full transition-colors"
            onClick={() => setProfileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8">
           {/* Profile Card */}
           <div className="flex flex-col items-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7A1E1E] to-[#5d1515] p-1 mb-4 shadow-xl shadow-[#7A1E1E]/10">
                 <div className="w-full h-full rounded-full bg-white flex items-center justify-center border-4 border-white">
                    <span className="text-3xl font-serif font-bold text-[#7A1E1E]">
                        {userProfile?.name?.charAt(0).toUpperCase()}
                    </span>
                 </div>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">{userProfile?.name}</h3>
              <p className="text-sm text-gray-500 font-medium">{userProfile?.email}</p>
              <div className="mt-3 flex gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFF8E7] text-[#7A1E1E] border border-[#7A1E1E]/10 capitalize">
                    {userProfile?.role}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                    Active
                </span>
              </div>
           </div>

           {/* Settings Group */}
           <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Account Settings</h4>
              
              <button 
                onClick={() => setPasswordModalOpen(true)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-[#7A1E1E]/30 hover:shadow-sm transition-all group"
              >
                 <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-gray-50 text-gray-600 group-hover:bg-[#7A1E1E] group-hover:text-white transition-colors">
                        <Lock size={18} />
                    </div>
                    <div className="text-left">
                        <span className="block font-bold text-[#1A1A1A] text-sm">Authentication</span>
                        <span className="block text-xs text-gray-500">Change your password</span>
                    </div>
                 </div>
                 <ChevronRight size={16} className="text-gray-300 group-hover:text-[#7A1E1E] transition-colors" />
              </button>
           </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-[#FAFAFA]">
           <button
             onClick={async () => await signOut()}
             className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-red-100 bg-white text-red-600 font-bold text-sm tracking-wide hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
           >
             <LogOut size={16} />
             <span>Sign Out</span>
           </button>
           <div className="text-center mt-4">
               <p className="text-[10px] text-gray-400 font-medium">RMS v1.0 • Secure Session</p>
           </div>
        </div>
      </aside>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1A1A1A]/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="bg-[#7A1E1E] p-6 text-center">
                   <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3 text-[#FFF8E7]">
                       <Lock size={24} />
                   </div>
                   <h3 className="text-xl font-serif font-bold text-[#FFF8E7]">Change Password</h3>
                   <p className="text-[#FFF8E7]/80 text-xs mt-1">Secure your account with a new password</p>
               </div>
               
               <div className="p-6">
                <form onSubmit={handleChangePassword} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wide mb-2">New Password</label>
                        <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7A1E1E]/20 focus:border-[#7A1E1E] transition-all"
                        placeholder="Enter at least 6 characters"
                        required
                        />
                    </div>

                    {message && (
                        <div className={`text-xs p-3 rounded-lg border flex items-start gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-100' : 'bg-red-50 text-red-800 border-red-100'}`}>
                            <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                            {message.text}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button"
                            onClick={() => {
                                setPasswordModalOpen(false) 
                                setMessage(null)
                                setNewPassword("")
                            }}
                            className="flex-1 py-3 bg-white text-gray-600 text-sm font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        
                        {message?.text.includes("sign out") ? (
                            <button
                                type="button"
                                onClick={async () => {
                                    await signOut()
                                    setPasswordModalOpen(false)
                                }}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-all"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        ) : (
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="flex-1 py-3 bg-[#1A1A1A] hover:bg-black text-white text-sm font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-gray-200 transition-all"
                            >
                                {loading ? <LoadingSpinner variant="tiny" size={16} /> : "Update"}
                            </button>
                        )}
                    </div>
                </form>
               </div>
            </div>
         </div>
      )}
    </>
  )
}