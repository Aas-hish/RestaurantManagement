"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface UserProfile {
  id: string
  name: string
  email: string
  role: "admin" | "waiter" | "kitchen"
  createdAt: string
  ownerId?: string

}

interface AuthContextType {
  user: UserProfile | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string, role: "admin" | "waiter" | "kitchen") => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEMO_USERS: UserProfile[] = [
  { id: "2", name: "Waiter User", email: "waiter@restaurant.com", role: "waiter", createdAt: new Date().toISOString() },
  { id: "3", name: "Kitchen Staff", email: "kitchen@restaurant.com", role: "kitchen", createdAt: new Date().toISOString() },
]
const DEMO_PASSWORD = "password123"

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [firebaseInitialized, setFirebaseInitialized] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { initializeApp, getApps } = await import("firebase/app")
        const { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } = await import("firebase/auth")
        const { getFirestore, doc, getDoc } = await import("firebase/firestore")

        const config = getFirebaseConfig()
        if (!config.apiKey || !config.projectId) {
          console.warn("Firebase config missing, falling back to demo mode")
          // UI-only mode for demo users/local persistence
          const raw = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null
          if (raw) {
            const parsed = JSON.parse(raw) as UserProfile
            setUser(parsed)
            setUserProfile(parsed)
          }
          setLoading(false)
          return
        }

        const app = getApps().length ? getApps()[0] : initializeApp(config)
        const auth = getAuth(app)
        const db = getFirestore(app)

        await setPersistence(auth, browserLocalPersistence).catch(() => {})
        setFirebaseInitialized(true)

        onAuthStateChanged(auth, async (fbUser) => {
          if (!fbUser) {
            setUser(null)
            setUserProfile(null)
            setLoading(false)
            return
          }

          try {
            const userRef = doc(db, "users", fbUser.uid)
            const snap = await getDoc(userRef)

            if (snap.exists()) {
              const data = snap.data() as any
              const profile: UserProfile = {
                id: fbUser.uid,
                name: data.name || fbUser.displayName || "",
                email: data.email || fbUser.email || "",
                role: data.role || "admin",
                createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
                ownerId: data.ownerId || (data.role === "admin" ? fbUser.uid : undefined),
              }
              setUser(profile)
              setUserProfile(profile)
            }
          } catch (e) {
            console.error("Failed to load user profile:", e)
          } finally {
            setLoading(false)
          }
        })
      } catch (err) {
        console.error("Auth init error:", err)
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    // Try Firebase sign-in first if configured
    try {
      const { initializeApp, getApps } = await import("firebase/app")
      const { getAuth, signInWithEmailAndPassword } = await import("firebase/auth")
      const config = getFirebaseConfig()
      if (config.apiKey && config.projectId) {
        const app = getApps().length ? getApps()[0] : initializeApp(config)
        const auth = getAuth(app)
        await signInWithEmailAndPassword(auth, email, password)
        return
      }
    } catch (e: any) {
      // If Firebase explicitly says invalid credentials, fall through to local/demo
      const code = e?.code || ""
      if (!String(code).startsWith("auth/")) {
        // Non-auth Firebase errors shouldn't block local/demo
        console.warn("Firebase sign-in error:", e)
      }
    }

    // Local staff login (demo/local mode when Firebase isn't used)
    try {
      const rawUsers = typeof window !== "undefined" ? localStorage.getItem("users") : null
      if (rawUsers) {
        const list = JSON.parse(rawUsers) as Array<any>
        const local = list.find((u) => u.email === email)
        if (local && local.password && local.password === password) {
          const profile: UserProfile = {
            id: String(local.id ?? Date.now()),
            name: local.name || "",
            email: local.email || email,
            role: (local.role as any) || "waiter",
            createdAt: typeof local.createdAt === "string" ? local.createdAt : new Date().toISOString(),
          }
          setUser(profile)
          setUserProfile(profile)
          try {
            localStorage.setItem("currentUser", JSON.stringify(profile))
          } catch {}
          return
        }
      }
    } catch {}

    // Demo user login fallback
    if (password !== DEMO_PASSWORD) throw new Error("Invalid email or password")
    const found = DEMO_USERS.find((u) => u.email === email)
    if (!found) throw new Error("Invalid email or password")
    
    setUser(found)
    setUserProfile(found)
    try {
      localStorage.setItem("currentUser", JSON.stringify(found))
    } catch {}
  }

  const handleSignUp = async (
    name: string,
    email: string,
    password: string,
    role: "admin" | "waiter" | "kitchen",
  ) => {
    if (role === "admin") throw new Error("Cannot self-register as admin. Use developer registration.")
    if (password.length < 6) throw new Error("Password must be at least 6 characters")
    if (DEMO_USERS.some((u) => u.email === email)) throw new Error("Email already in use")
    
    try {
      // Initialize Firebase
      const { initializeApp, getApps } = await import("firebase/app")
      const { getAuth, createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth")
      const { getFirestore, doc, setDoc, serverTimestamp } = await import("firebase/firestore")

      const config = getFirebaseConfig()
      
      // Check if Firebase is configured
      if (!config.apiKey || !config.projectId) {
        // Fallback to demo mode if Firebase is not configured
        const newUser: UserProfile = { id: String(Date.now()), name, email, role, createdAt: new Date().toISOString() }
        setUser(newUser)
        setUserProfile(newUser)
        try {
          localStorage.setItem("currentUser", JSON.stringify(newUser))
        } catch {}
        return
      }

      const app = getApps().length ? getApps()[0] : initializeApp(config)
      const auth = getAuth(app)
      const db = getFirestore(app)

      // Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update display name
      try {
        await updateProfile(cred.user, { displayName: name })
      } catch {}

      // Store user profile in Firestore
      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        email,
        role,
        createdAt: serverTimestamp(),
      })

      // Create user profile object
      const newUser: UserProfile = {
        id: cred.user.uid,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      }
      
      setUser(newUser)
      setUserProfile(newUser)
      
      // Store in localStorage for persistence
      try {
        localStorage.setItem("currentUser", JSON.stringify(newUser))
      } catch {}
    } catch (error: any) {
      // Re-throw with more specific error message
      if (error.code === "auth/email-already-in-use") {
        throw new Error("Email already in use")
      }
      throw error
    }
  }

  const handleSignOut = async () => {
    if (firebaseInitialized) {
      const { getAuth, signOut: fbSignOut } = await import("firebase/auth")
      const { getApps } = await import("firebase/app")
      
      if (getApps().length) {
        const auth = getAuth(getApps()[0])
        await fbSignOut(auth)
      }
    }
    
    setUser(null)
    setUserProfile(null)
    try {
      localStorage.removeItem("currentUser")
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut: handleSignOut, signIn: handleSignIn, signUp: handleSignUp }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error("useAuth must be used within AuthProvider")
  return context
}


export const db = null
