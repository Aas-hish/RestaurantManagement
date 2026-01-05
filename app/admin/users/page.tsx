"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useUsers } from "@/hooks/use-users"
import { Trash2, Plus, Users, ChefHat, UtensilsCrossed, ShieldCheck, Mail, Calendar, Search } from "lucide-react"
import type { User } from "@/types"
import { useAlert } from "@/components/alert/alert-dialog"

export default function AdminUsersPage() {
  const { users, deleteUser, addUser, loading: usersLoading } = useUsers()
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "waiter" as "admin" | "waiter" | "kitchen",
  })
  const [loading, setLoading] = useState(false)
  const { showAlert } = useAlert()
  const [searchTerm, setSearchTerm] = useState("")

  // Calculate stats
  const stats = useMemo(() => {
    return {
      waiters: users.filter(u => u.role === "waiter").length,
      kitchen: users.filter(u => u.role === "kitchen").length,
      admins: users.filter(u => u.role === "admin").length,
      total: users.length
    }
  }, [users])

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (users.some((u) => u.email === formData.email)) {
        alert("Email already in use")
        setLoading(false)
        return
      }

      const newUser: User = {
        id: String(users.length + 1),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        createdAt: new Date().toISOString(),
      }

      await addUser({ ...newUser, password: formData.password })
      setFormData({ name: "", email: "", password: "", role: "waiter" })
      setShowAddForm(false)
    } catch (error: any) {
      console.error("Error adding user:", error)
      const msg = error?.message || "Failed to add user"
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const confirmed = await showAlert({
      title: "Delete Staff Member",
      description: "Are you sure you want to remove this staff member? Their access will be revoked immediately.",
      actionText: "Remove Staff",
      cancelText: "Cancel"
    })

    if (confirmed) {
      try {
        await deleteUser(userId)
      } catch (error) {
        console.error("Error deleting user:", error)
      }
    }
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
      {/* Header & Stats Section */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Title Card */}
        <div className="lg:col-span-2 bg-[#7A1E1E] rounded-2xl p-8 text-[#FFF8E7] relative overflow-hidden shadow-lg flex flex-col justify-between min-h-[180px]">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Users size={140} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Team Management</h1>
            <p className="text-[#FFF8E7]/80"> oversee your restaurant's workforce and access controls.</p>
          </div>
          <div className="flex gap-4 mt-6">
            <button 
                onClick={() => setShowAddForm(true)}
                className="bg-[#FFD700] text-[#7A1E1E] px-6 py-2.5 rounded-lg hover:bg-[#E6C200] transition-colors font-bold flex items-center gap-2 shadow-md w-fit"
            >
                <Plus size={20} />
                Add New Staff
            </button>
          </div>
        </div>

        {/* Stats: Waiters */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-[#E2E8F0] flex flex-col justify-center relative overflow-hidden group hover:border-[#FFD700]/50 transition-all">
            <div className="absolute right-[-20px] top-[-20px] bg-[#FFD700]/10 w-32 h-32 rounded-full group-hover:scale-110 transition-transform" />
            <div className="relative z-10">
                <div className="w-12 h-12 bg-[#FFD700]/20 rounded-xl flex items-center justify-center text-[#998100] mb-4">
                    <UtensilsCrossed size={24} />
                </div>
                <h3 className="text-[#64748B] font-medium text-sm uppercase tracking-wider">Active Waiters</h3>
                <p className="text-4xl font-serif font-bold text-[#1A1A1A] mt-1">{stats.waiters}</p>
                 <p className="text-sm text-[#64748B] mt-2">Serving customers</p>
            </div>
        </div>

        {/* Stats: Kitchen */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-[#E2E8F0] flex flex-col justify-center relative overflow-hidden group hover:border-[#7A1E1E]/50 transition-all">
             <div className="absolute right-[-20px] top-[-20px] bg-[#7A1E1E]/5 w-32 h-32 rounded-full group-hover:scale-110 transition-transform" />
            <div className="relative z-10">
                <div className="w-12 h-12 bg-[#7A1E1E]/10 rounded-xl flex items-center justify-center text-[#7A1E1E] mb-4">
                    <ChefHat size={24} />
                </div>
                <h3 className="text-[#64748B] font-medium text-sm uppercase tracking-wider">Kitchen Staff</h3>
                <p className="text-4xl font-serif font-bold text-[#1A1A1A] mt-1">{stats.kitchen}</p>
                 <p className="text-sm text-[#64748B] mt-2">Preparing orders</p>
            </div>
        </div>
      </div>

       {/* Search Bar */}
       <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E2E8F0] flex items-center gap-4 max-w-md">
            <Search className="text-[#94A3B8]" size={20} />
            <input 
                type="text" 
                placeholder="Search staff by name or email..." 
                className="flex-1 outline-none text-[#1A1A1A] placeholder-[#94A3B8]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
       </div>


      {/* Add User Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#7A1E1E] p-6 text-white flex justify-between items-center">
                <h2 className="text-xl font-serif font-bold">New Staff Member</h2>
                <button onClick={() => setShowAddForm(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
                    <Plus size={24} className="rotate-45" />
                </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#475569]">Full Name</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] focus:ring-2 focus:ring-[#7A1E1E]/20 focus:border-[#7A1E1E] outline-none"
                        placeholder="e.g. Michael Chen"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#475569]">Email Address</label>
                    <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] focus:ring-2 focus:ring-[#7A1E1E]/20 focus:border-[#7A1E1E] outline-none"
                        placeholder="staff@restaurant.com"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#475569]">Password</label>
                    <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] focus:ring-2 focus:ring-[#7A1E1E]/20 focus:border-[#7A1E1E] outline-none"
                        placeholder="••••••••"
                        minLength={6}
                    />
                    <p className="text-xs text-[#94A3B8]">Must be at least 6 characters</p>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#475569]">Role</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['waiter', 'kitchen', 'admin'].map((role) => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => setFormData({ ...formData, role: role as any })}
                                className={`py-2 px-3 rounded-lg text-sm font-medium capitalize border transition-all ${
                                    formData.role === role 
                                    ? 'bg-[#7A1E1E] text-white border-[#7A1E1E]' 
                                    : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                                }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="flex-1 px-4 py-2 rounded-lg border border-[#E2E8F0] text-[#64748B] font-medium hover:bg-[#F8FAFC] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 rounded-lg bg-[#7A1E1E] text-white font-medium hover:bg-[#5d1515] transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                        {loading && <Plus className="animate-spin" size={16} />}
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
            <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mx-auto mb-4 text-[#94A3B8]">
                <Search size={32} />
            </div>
            <h3 className="text-lg font-medium text-[#1A1A1A]">No staff members found</h3>
             <p className="text-[#64748B]">Try adjusting your search terms or add a new team member.</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div 
              key={user.id} 
              className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0] hover:shadow-lg hover:border-[#FFD700]/30 transition-all group relative overflow-hidden"
            >
                {/* Decorative background element */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-${user.role === 'admin' ? '[#7A1E1E]' : user.role === 'kitchen' ? 'orange-500' : 'blue-500'}/5 to-transparent rounded-bl-full -mr-4 -mt-4`} />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold font-serif
                        ${user.role === 'admin' ? 'bg-[#7A1E1E]/10 text-[#7A1E1E]' :
                          user.role === 'kitchen' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'}
                    `}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-[#1A1A1A] text-lg leading-tight">{user.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                             <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide
                                ${user.role === 'admin' ? 'bg-[#7A1E1E] text-white' :
                                  user.role === 'kitchen' ? 'bg-orange-100 text-orange-700' :
                                  'bg-blue-100 text-blue-700'}
                             `}>
                                {user.role}
                             </span>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-[#94A3B8] hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove User"
                >
                    <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-3 text-sm text-[#475569]">
                    <Mail size={16} className="text-[#94A3B8]" />
                    <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#475569]">
                    <Calendar size={16} className="text-[#94A3B8]" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                 <div className="flex items-center gap-3 text-sm text-[#475569]">
                    {user.role === 'kitchen' ? <ChefHat size={16} className="text-[#94A3B8]" /> : 
                     user.role === 'admin' ? <ShieldCheck size={16} className="text-[#94A3B8]" /> :
                     <UtensilsCrossed size={16} className="text-[#94A3B8]" />}
                    <span className="capitalize">{user.role} Access</span>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  )
}
