"use client"

import { useEffect, useMemo, useState } from "react"
import type { User } from "@/types"
import { useAuth } from "@/context/auth-context"

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

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user: currentUser } = useAuth()

  const firebaseEnabled = useMemo(() => {
    const cfg = getFirebaseConfig()
    return Boolean(cfg.apiKey && cfg.projectId)
  }, [])

  useEffect(() => {
    let unsubs: Array<() => void> = []

    const setup = async () => {
      try {
        if (firebaseEnabled) {
          const { initializeApp, getApps } = await import("firebase/app")
          const { getAuth } = await import("firebase/auth")
          const { getFirestore, collection, onSnapshot, query, orderBy } = await import("firebase/firestore")

          const app = getApps().length ? getApps()[0] : initializeApp(getFirebaseConfig())
          const auth = getAuth(app)
          const fbUser = auth.currentUser

          // Only use Firestore when an authenticated Firebase user exists
          if (fbUser) {
            const db = getFirestore(app)
            const ownerId = fbUser.uid

            // Subscribe to role-based staff subcollections
            const waitersCol = collection(db, "restaurants", ownerId, "waiters")
            const kitchenCol = collection(db, "restaurants", ownerId, "kitchen-staff")
            const qw = query(waitersCol, orderBy("createdAt", "desc"))
            const qk = query(kitchenCol, orderBy("createdAt", "desc"))

            let waiters: User[] = []
            let kitchens: User[] = []

            const updateMerged = () => {
              const merged = [...waiters, ...kitchens].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
              )
              setUsers(merged)
              setLoading(false)
            }

            const parseDoc = (d: any): User => {
              const data = d.data() as any
              return {
                id: d.id,
                name: data.name || "",
                email: data.email || "",
                role: (data.role as any) || "waiter",
                createdAt:
                  typeof data.createdAt === "string"
                    ? data.createdAt
                    : (data.createdAt?.toDate?.() || new Date()).toISOString(),
              }
            }

            unsubs.push(
              onSnapshot(
                qw,
                (snap) => {
                  waiters = snap.docs.map(parseDoc)
                  updateMerged()
                },
                (err) => {
                  console.error("Waiters snapshot error", err)
                  setError("Failed to load staff")
                  setLoading(false)
                },
              ),
            )

            unsubs.push(
              onSnapshot(
                qk,
                (snap) => {
                  kitchens = snap.docs.map(parseDoc)
                  updateMerged()
                },
                (err) => {
                  console.error("Kitchen snapshot error", err)
                  setError("Failed to load staff")
                  setLoading(false)
                },
              ),
            )

            return
          }
        }

        // Fallback to localStorage (demo mode)
        const storedUsers = localStorage.getItem("users")
        if (storedUsers) {
          setUsers(JSON.parse(storedUsers))
        } else {
          const mockUsers: User[] = [
            {
              id: "1",
              name: "Admin User",
              email: "admin@restaurant.com",
              role: "admin",
              createdAt: new Date().toISOString(),
            },
            {
              id: "2",
              name: "Waiter User",
              email: "waiter@restaurant.com",
              role: "waiter",
              createdAt: new Date().toISOString(),
            },
            {
              id: "3",
              name: "Kitchen Staff",
              email: "kitchen@restaurant.com",
              role: "kitchen",
              createdAt: new Date().toISOString(),
            },
          ]
          setUsers(mockUsers)
          localStorage.setItem("users", JSON.stringify(mockUsers))
        }
        setLoading(false)
      } catch (err) {
        console.error("useUsers init error", err)
        setError(err instanceof Error ? err.message : "Failed to load users")
        setLoading(false)
      }
    }

    setup()

    return () => {
      for (const u of unsubs) try { u() } catch {}
    }
  }, [firebaseEnabled, currentUser?.id])

  const deleteUser = async (userId: string) => {
    try {
      if (firebaseEnabled) {
        const { initializeApp, getApps } = await import("firebase/app")
        const { getAuth } = await import("firebase/auth")
        const app = getApps().length ? getApps()[0] : initializeApp(getFirebaseConfig())
        const auth = getAuth(app)
        const fbUser = auth.currentUser
        if (fbUser) {
          const idToken = await fbUser.getIdToken()
          const res = await fetch("/api/admin/delete-staff", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ staffUid: userId }),
          })
          if (!res.ok) {
            const t = await res.text().catch(() => "")
            throw new Error(t || "Failed to delete staff user")
          }
          return
        }
      }

      // Fallback local mode
      const updated = users.filter((u) => u.id !== userId)
      setUsers(updated)
      localStorage.setItem("users", JSON.stringify(updated))
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to delete user")
    }
  }

  const addUser = async (user: User & { password?: string }) => {
    try {
      if (firebaseEnabled) {
        const { initializeApp, getApps } = await import("firebase/app")
        const { getAuth } = await import("firebase/auth")
        const app = getApps().length ? getApps()[0] : initializeApp(getFirebaseConfig())
        const auth = getAuth(app)
        const fbUser = auth.currentUser
        if (fbUser) {
          // Include ID token so the API can authorize the admin
          const idToken = await fbUser.getIdToken()

          // Call server API to create Auth user + Firestore docs atomically
          const res = await fetch("/api/admin/create-staff", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              password: user.password, // optional; server will accept empty to force password reset
              role: user.role,
            }),
          })
          if (!res.ok) {
            const t = await res.text().catch(() => "")
            throw new Error(t || "Failed to create staff user")
          }
          return
        }
      }

      // Fallback local mode
      const updated = [...users, user]
      setUsers(updated)
      localStorage.setItem("users", JSON.stringify(updated))
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to add user")
    }
  }

  return {
    users,
    loading,
    error,
    deleteUser,
    addUser,
  }
}