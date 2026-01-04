"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DevRegisterAdminPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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

      setSuccess("Admin registered successfully! Redirecting to login...")
      setTimeout(() => router.push("/login"), 2000)
    } catch (err: any) {
      console.error("Registration error:", err)
      setError(err?.message || "Failed to register admin")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF8E7] to-[#F5F1E8] p-4">
      <div className="w-full max-w-2xl glass-effect p-8 rounded-lg">
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold text-[#1A1A1A] mb-2">Developer: Register Admin</h1>
          <p className="text-sm text-[#475569]">Create admin account with restaurant details</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Admin Credentials */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Admin Credentials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Admin Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@restaurant.com"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Restaurant Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Restaurant Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Owner Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Restaurant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="My Awesome Restaurant"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className="input-field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Restaurant Address <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input-field min-h-24"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State, ZIP"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Restaurant Logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-[#475569] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#7A1E1E] file:text-white hover:file:bg-[#5A1515] file:cursor-pointer"
                disabled={submitting}
              />
              <p className="text-xs text-[#475569] mt-1">Optional: Upload restaurant logo (will be stored in Cloudinary)</p>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? "Registering..." : "Register Admin & Restaurant"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/20 text-center">
          <p className="text-sm text-[#475569]">
            After registration, use the admin email to login at{" "}
            <a href="/login" className="text-[#7A1E1E] font-medium hover:underline">
              /login
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}