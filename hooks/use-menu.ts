"use client"

import { useEffect, useMemo, useState } from "react"
import type { MenuItem } from "@/types"
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

export function useMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user: currentUser } = useAuth()

  const firebaseEnabled = useMemo(() => {
    const cfg = getFirebaseConfig()
    return Boolean(cfg.apiKey && cfg.projectId)
  }, [])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    const init = async () => {
      try {
        if (firebaseEnabled) {
          const { initializeApp, getApps } = await import("firebase/app")
          const { getAuth } = await import("firebase/auth")
          const { getFirestore, collection, onSnapshot, query, orderBy } = await import("firebase/firestore")
          const app = getApps().length ? getApps()[0] : initializeApp(getFirebaseConfig())
          const auth = getAuth(app)
          const fbUser = auth.currentUser
          if (fbUser) {
            const db = getFirestore(app)
            const userRole = (currentUser as any)?.role || "waiter"
            const ownerId = userRole === "admin" ? fbUser.uid : (currentUser as any)?.ownerId
            if (!ownerId) throw new Error("Missing restaurant owner context")
            const col = collection(db, "restaurants", ownerId, "menu")
            const q = query(col, orderBy("createdAt", "desc"))
            unsubscribe = onSnapshot(
              q,
              (snap) => {
                const list: MenuItem[] = snap.docs.map((d) => {
                  const data = d.data() as any
                  return {
                    id: d.id,
                    name: data.name || "",
                    description: data.description || "",
                    category: data.category || "Main Course",
                    price: Number(data.price || 0),
                    imageUrl: data.imageUrl || "",
                    available: Boolean(data.available ?? true),
                    createdAt:
                      typeof data.createdAt === "string"
                        ? data.createdAt
                        : (data.createdAt?.toDate?.() || new Date()).toISOString(),
                  }
                })
                setMenuItems(list)
                setLoading(false)
              },
              (err) => {
                setError(err?.message || "Failed to load menu")
                setLoading(false)
              },
            )
            return
          }
        }
        setMenuItems([])
        setLoading(false)
      } catch (e: any) {
        setError(e?.message || "Failed to load menu")
        setLoading(false)
      }
    }
    init()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [firebaseEnabled, (currentUser as any)?.id, (currentUser as any)?.ownerId, (currentUser as any)?.role])

  const addMenuItem = async (item: Omit<MenuItem, "id">) => {
    const { initializeApp, getApps } = await import("firebase/app")
    const { getAuth } = await import("firebase/auth")
    const { getFirestore, collection, addDoc, serverTimestamp } = await import("firebase/firestore")
    const app = getApps().length ? getApps()[0] : initializeApp(getFirebaseConfig())
    const auth = getAuth(app)
    const fbUser = auth.currentUser
    if (!fbUser) throw new Error("Not authenticated")
    const userRole = (currentUser as any)?.role || "waiter"
    const ownerId = userRole === "admin" ? fbUser.uid : (currentUser as any)?.ownerId
    if (!ownerId) throw new Error("Missing restaurant owner context")
    const db = getFirestore(app)
    const docRef = await addDoc(collection(db, "restaurants", ownerId, "menu"), {
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      imageUrl: item.imageUrl || "",
      available: item.available,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  }

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    const { initializeApp, getApps } = await import("firebase/app")
    const { getAuth } = await import("firebase/auth")
    const { getFirestore, doc, updateDoc } = await import("firebase/firestore")
    const app = getApps().length ? getApps()[0] : initializeApp(getFirebaseConfig())
    const auth = getAuth(app)
    const fbUser = auth.currentUser
    if (!fbUser) throw new Error("Not authenticated")
    const userRole = (currentUser as any)?.role || "waiter"
    const ownerId = userRole === "admin" ? fbUser.uid : (currentUser as any)?.ownerId
    if (!ownerId) throw new Error("Missing restaurant owner context")
    const db = getFirestore(app)
    await updateDoc(doc(db, "restaurants", ownerId, "menu", id), {
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      ...(updates.category !== undefined ? { category: updates.category } : {}),
      ...(updates.price !== undefined ? { price: updates.price } : {}),
      ...(updates.imageUrl !== undefined ? { imageUrl: updates.imageUrl } : {}),
      ...(updates.available !== undefined ? { available: updates.available } : {}),
    })
  }

  const deleteMenuItem = async (id: string) => {
    const { initializeApp, getApps } = await import("firebase/app")
    const { getAuth } = await import("firebase/auth")
    const { getFirestore, doc, deleteDoc } = await import("firebase/firestore")
    const app = getApps().length ? getApps()[0] : initializeApp(getFirebaseConfig())
    const auth = getAuth(app)
    const fbUser = auth.currentUser
    if (!fbUser) throw new Error("Not authenticated")
    const userRole = (currentUser as any)?.role || "waiter"
    const ownerId = userRole === "admin" ? fbUser.uid : (currentUser as any)?.ownerId
    if (!ownerId) throw new Error("Missing restaurant owner context")
    const db = getFirestore(app)
    await deleteDoc(doc(db, "restaurants", ownerId, "menu", id))
  }

  return { menuItems, loading, error, addMenuItem, updateMenuItem, deleteMenuItem }
}
