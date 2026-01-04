"use client"

import type React from "react"
import { useState } from "react"
import { useUsers } from "@/hooks/use-users"
import { Trash2, Plus } from "lucide-react"
import type { User } from "@/types"
import { useAlert } from "@/components/alert/alert-dialog"

export default function AdminUsersPage() {
  const { users, deleteUser, addUser } = useUsers()
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "waiter" as "admin" | "waiter" | "kitchen",
  })
  const [loading, setLoading] = useState(false)
  const { showAlert } = useAlert()

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if email already exists
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
      title: "Delete User",
      description: "Are you sure you want to delete this user? This action cannot be undone.",
      actionText: "Delete",
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1A1A1A]">Staff Management</h1>
          <p className="text-[#475569] mt-1">Manage restaurant staff</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="bg-[#7A1E1E] text-white px-6 py-2 rounded-lg hover:bg-[#5d1515] transition-colors font-medium flex items-center gap-2"
        >
          <Plus size={20} />
          Add Staff
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="mt-8 mb-10 animate-in fade-in-50">
          <div className="relative bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 ease-out">
            {/* Form Header */}
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Add New Staff Member</h2>
                  <p className="mt-1 text-sm text-gray-500">Enter the staff member's details below</p>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-200"
                  aria-label="Close form"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6">

                <form onSubmit={handleAddUser} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200"
                        placeholder="john@example.com"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <select
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            role: e.target.value as "waiter" | "kitchen" | "admin",
                          })
                        }
                        className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition duration-200 appearance-none"
                      >
                        <option value="waiter">Waiter</option>
                        <option value="kitchen">Kitchen Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#7A1E1E] focus:ring-offset-2 transition duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center justify-center rounded-lg bg-[#7A1E1E] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#5d1515] focus:outline-none focus:ring-2 focus:ring-[#7A1E1E] focus:ring-offset-2 transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <svg className="-ml-1 mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </>
                      ) : (
                        'Add Staff'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 p-4">
        {users.length === 0 ? (
          <div className="col-span-full text-center py-20 glass-effect rounded-xl p-10 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No Staff Members</h3>
            <p className="text-[#64748B] text-base">Add your first team member to get started</p>
          </div>
        ) : (
          users.map((user) => (
            <div 
              key={user.id} 
              className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-100 relative overflow-hidden h-full flex flex-col"
            >
              {/* User avatar and header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{user.name}</h3>
                    <p className="text-base text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteUser(user.id);
                  }}
                  className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                  title="Delete user"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              
              {/* User details */}
              <div className="space-y-4 mt-6 pt-5 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-gray-500">Role</span>
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : user.role === "waiter"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-gray-500">Joined</span>
                  <span className="text-base font-medium text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-linear-to-br from-blue-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
