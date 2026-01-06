"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
    ChefHat, 
    Mail, 
    Lock, 
    User, 
    Store, 
    MapPin, 
    Phone, 
    Upload, 
    ArrowRight,
    Shield,
    CheckCircle,
    Eye,
    EyeOff
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function DevRegisterAdminPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [ownerName, setOwnerName] = useState("")
  const [restaurantName, setRestaurantName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const getCloudinaryEnv = () => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.VITE_CLOUDINARY_UPLOAD_PRESET
    if (!cloudName || !uploadPreset) throw new Error("Missing Cloudinary config")
    return { cloudName, uploadPreset }
  }

  const uploadLogo = async (file: File): Promise<string> => {
    const { cloudName, uploadPreset } = getCloudinaryEnv()
    const form = new FormData()
    form.append("file", file)
    form.append("upload_preset", uploadPreset)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form })
    if (!res.ok) {
      const t = await res.text().catch(() => "")
      throw new Error(`Cloudinary upload failed ${res.status}: ${t}`)
    }
    const data = (await res.json()) as { secure_url?: string }
    if (!data.secure_url) throw new Error("Cloudinary response missing secure_url")
    return data.secure_url
  }

  const getFirebaseConfig = () => {
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.VITE_FIREBASE_MEASUREMENT_ID,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    if (!email || !password || !ownerName || !restaurantName || !phone || !address) {
      setError("Please fill all required fields")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setSubmitting(true)
    try {
      let logoUrl = ""
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile)
      }

      const { initializeApp, getApps } = await import("firebase/app")
      const { getAuth, createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth")
      const { getFirestore, doc, setDoc, serverTimestamp } = await import("firebase/firestore")

      const config = getFirebaseConfig()
      if (!config.apiKey || !config.projectId) throw new Error("Missing Firebase config in environment variables")
      
      const app = getApps().length ? getApps()[0] : initializeApp(config)
      const auth = getAuth(app)
      const db = getFirestore(app)

      // Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update display name
      try {
        await updateProfile(cred.user, { displayName: ownerName })
      } catch {}

      // Store user profile in Firestore (top-level users collection)
      await setDoc(doc(db, "users", cred.user.uid), {
        name: ownerName,
        email,
        role: "admin",
        ownerId: cred.user.uid,
        createdAt: serverTimestamp(),
      })

      // Store restaurant data in Firestore
      await setDoc(doc(db, "restaurants", cred.user.uid), {
        ownerName,
        restaurantName,
        email,
        phone,
        address,
        logoUrl,
        createdAt: serverTimestamp(),
      })

      // Store admin as a subdocument under the restaurant for clearer structure
      await setDoc(doc(db, "restaurants", cred.user.uid, "admins", cred.user.uid), {
        name: ownerName,
        email,
        role: "admin",
        createdAt: serverTimestamp(),
      })

      // Store registered admin email in localStorage for auth context
      localStorage.setItem("registeredAdminEmail", email)

      setSuccess("Admin registered successfully! Redirecting...")
      setTimeout(() => router.push("/login"), 2000)
    } catch (err: any) {
      console.error("Registration error:", err)
      setError(err?.message || "Failed to register admin")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#FFF8E7] via-[#F5F1E8] to-[#E2E8F0] relative overflow-hidden py-10">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-[#FFD700]/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-[#7A1E1E]/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-4xl mx-4 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-full bg-white shadow-xl shadow-[#7A1E1E]/5 mb-4 border border-[#FFD700]/10">
            <Shield className="h-10 w-10 text-[#7A1E1E]" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-[#1A1A1A] tracking-tight mb-2">
            System Registration
          </h1>
          <p className="text-[#64748B] text-sm tracking-widest uppercase font-medium">
            Deploy New Instance
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden">
          
          {/* Progress / Status Header */}
          <div className="bg-gradient-to-r from-[#7A1E1E] to-[#601010] shadow-lg shadow-[#7A1E1E]/20 p-6 text-white text-center">
             <p className="text-[#FFD700] uppercase tracking-widest text-xs font-bold mb-1">Developer Console</p>
             <h2 className="font-serif text-2xl font-bold">New Restaurant Setup</h2>
          </div>

          <div className="p-8 md:p-10">
            {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                <div className="p-1 bg-red-100 rounded-full">!</div>
                {error}
            </div>
            )}
            
            {success && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                <CheckCircle size={20} />
                {success}
            </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Section 1: Authentication */}
                <div className="space-y-5">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                        <div className="p-2 bg-[#7A1E1E]/10 rounded-lg text-[#7A1E1E]">
                            <Lock size={18} />
                        </div>
                        <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">Admin Credentials</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#475569] uppercase ml-1">Admin Email</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A1E1E] transition-colors" size={18} />
                                <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="owner@restaurant.com"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#7A1E1E] focus:outline-none focus:ring-4 focus:ring-[#7A1E1E]/5 transition-all"
                                required
                                disabled={submitting}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#475569] uppercase ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A1E1E] transition-colors" size={18} />
                                <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#7A1E1E] focus:outline-none focus:ring-4 focus:ring-[#7A1E1E]/5 transition-all"
                                required
                                disabled={submitting}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#7A1E1E] transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Restaurant Profile */}
                <div className="space-y-5">
                     <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                        <div className="p-2 bg-[#FFD700]/20 rounded-lg text-[#b39200]">
                            <Store size={18} />
                        </div>
                        <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">Restaurant Profile</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#475569] uppercase ml-1">Owner Name</label>
                            <input
                            type="text"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#7A1E1E] focus:outline-none focus:ring-4 focus:ring-[#7A1E1E]/5 transition-all"
                            required
                            disabled={submitting}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#475569] uppercase ml-1">Restaurant Name</label>
                            <input
                            type="text"
                            value={restaurantName}
                            onChange={(e) => setRestaurantName(e.target.value)}
                            placeholder="Establishment Name"
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#7A1E1E] focus:outline-none focus:ring-4 focus:ring-[#7A1E1E]/5 transition-all"
                            required
                            disabled={submitting}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#475569] uppercase ml-1">Phone Number</label>
                             <div className="relative group">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A1E1E] transition-colors" size={18} />
                                <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+977 0000000000"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#7A1E1E] focus:outline-none focus:ring-4 focus:ring-[#7A1E1E]/5 transition-all"
                                required
                                disabled={submitting}
                                />
                             </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#475569] uppercase ml-1">Brand Logo</label>
                            <div className="relative group">
                                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7A1E1E] transition-colors" size={18} />
                                <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#7A1E1E] focus:outline-none transition-all text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#1A1A1A] file:text-white hover:file:bg-[#7A1E1E]"
                                disabled={submitting}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[#475569] uppercase ml-1">Full Address</label>
                        <div className="relative group">
                            <MapPin className="absolute left-3 top-4 text-gray-400 group-focus-within:text-[#7A1E1E] transition-colors" size={18} />
                            <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Street Address, City, Zip Code"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#7A1E1E] focus:outline-none focus:ring-4 focus:ring-[#7A1E1E]/5 transition-all min-h-[100px]"
                            required
                            disabled={submitting}
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-gradient-to-r from-[#7A1E1E] to-[#601010] hover:from-[#8B2222] hover:to-[#701515] text-white font-bold rounded-xl shadow-lg shadow-[#7A1E1E]/20 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                    >
                    {submitting ? (
                        <>
                        <LoadingSpinner variant="tiny" size={20} className="text-white" />
                        <span>Provisioning Environment...</span>
                        </>
                    ) : (
                        <>
                        <span>Initialize System</span>
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </>
                    )}
                    </button>
                    <div className="text-center mt-6">
                        <a href="/login" className="text-sm font-medium text-gray-500 hover:text-[#7A1E1E] hover:underline transition-colors">
                            Return to Login Portal
                        </a>
                    </div>
                </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}