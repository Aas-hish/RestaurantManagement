"use client"

import { useEffect, useState } from "react"
import type { Order } from "@/types"
import { useAuth } from "@/context/auth-context"

// Local helper to read Firebase config from env, mirroring auth-context
function getFirebaseConfig() {
  return {
    apiKey:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.VITE_FIREBASE_API_KEY,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
      process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
      process.env.VITE_FIREBASE_APP_ID,
  }
}

export function useOrders(filter?: {
  status?: string
  waiterId?: string
  limit?: number
}) {
  const { userProfile } = useAuth()

  // Derive the restaurantId from the logged-in user if available
  const restaurantId = (userProfile as any)?.ownerId || userProfile?.id

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const config = getFirebaseConfig()
    let unsub: (() => void) | undefined
    let localStorageInterval: NodeJS.Timeout | undefined
    let handleStorageChange: ((e: StorageEvent) => void) | undefined

    // If Firebase is configured, use real-time listener
    if (config.apiKey && config.projectId) {
      ;(async () => {
        try {
          setLoading(true)
          const { initializeApp, getApps } = await import("firebase/app")
          const {
            getFirestore,
            collection,
            query,
            where,
            orderBy,
            limit: limitFn,
            onSnapshot,
          } = await import("firebase/firestore")

          const apps = getApps()
          const app = apps.length ? apps[0] : initializeApp(config)
          const db = getFirestore(app)

          // If we know the restaurant, read from its nested orders collection
          const baseCollection = restaurantId
            ? collection(db, "restaurants", restaurantId, "orders")
            : collection(db, "orders")

          let q: any = query(baseCollection)

          if (filter?.status) {
            q = query(q, where("status", "==", filter.status))
          }

          if (filter?.waiterId) {
            q = query(q, where("waiterId", "==", filter.waiterId))
          }

          q = query(q, orderBy("timestamp", "desc"))

          if (filter?.limit) {
            q = query(q, limitFn(filter.limit))
          }

          // Use onSnapshot for real-time updates
          unsub = onSnapshot(
            q,
            (snap: any) => {
              console.log("DEBUG useOrders real-time update", {
                restaurantId,
                filter,
                size: snap.size,
              })

              const remoteOrders: Order[] = []
              snap.forEach((docSnap: any) => {
                const data = docSnap.data() as any
                remoteOrders.push({ id: docSnap.id, ...data } as Order)
              })

              setOrders(remoteOrders)
              setError(null)
              setLoading(false)
            },
            (err: any) => {
              console.error("DEBUG useOrders snapshot error", err)
              setError(
                err instanceof Error ? err.message : "Failed to load orders",
              )
              setLoading(false)
            },
          )
        } catch (err) {
          console.error("DEBUG useOrders error", err)
          setError(
            err instanceof Error ? err.message : "Failed to load orders",
          )
          setLoading(false)
        }
      })()
    } else {
      // Fallback: Poll localStorage for updates
      const loadFromLocalStorage = () => {
        try {
          setLoading(true)
          const storedOrders = localStorage.getItem("orders")
          let allOrders: Order[] = storedOrders ? JSON.parse(storedOrders) : []

          if (filter?.status) {
            allOrders = allOrders.filter(
              (order) => order.status === filter.status,
            )
          }

          if (filter?.waiterId) {
            allOrders = allOrders.filter(
              (order) => order.waiterId === filter.waiterId,
            )
          }

          allOrders = allOrders.sort(
            (a, b) =>
              new Date(b.timestamp).getTime() -
              new Date(a.timestamp).getTime(),
          )

          setOrders(filter?.limit ? allOrders.slice(0, filter.limit) : allOrders)
          setError(null)
          setLoading(false)
        } catch (err) {
          console.error("Error loading from localStorage:", err)
          setError(
            err instanceof Error ? err.message : "Failed to load orders",
          )
          setLoading(false)
        }
      }

      // Initial load
      loadFromLocalStorage()

      // Poll every 1 second for updates
      localStorageInterval = setInterval(loadFromLocalStorage, 1000)

      // Also listen to storage events (for cross-tab updates)
      handleStorageChange = (e: StorageEvent) => {
        if (e.key === "orders") {
          loadFromLocalStorage()
        }
      }

      window.addEventListener("storage", handleStorageChange)
    }

    return () => {
      if (unsub) unsub()
      if (localStorageInterval) clearInterval(localStorageInterval)
      if (handleStorageChange) {
        window.removeEventListener("storage", handleStorageChange)
      }
    }
  }, [filter?.status, filter?.waiterId, filter?.limit, restaurantId])

  const createOrder = async (order: Omit<Order, "id">) => {
    try {
      const config = getFirebaseConfig()

      // If Firebase is configured, create order in Firestore
      if (config.apiKey && config.projectId) {
        const { initializeApp, getApps } = await import("firebase/app")
        const {
          getFirestore,
          collection,
          addDoc,
          doc,
          runTransaction,
        } = await import("firebase/firestore")

        const apps = getApps()
        const app = apps.length ? apps[0] : initializeApp(config)
        const db = getFirestore(app)

        const restaurantIdForOrder = (order as any).restaurantId

        if (!restaurantIdForOrder) {
          throw new Error(
            "restaurantId is required to create an order in Firestore",
          )
        }

        // Generate a human-readable unique order number for display
        // Format: <dayOfMonth><counter> e.g. 161, 162 on day 16
        const today = new Date()
        const dayOfMonth = today.getDate() // 1-31
        const dateKey = today.toISOString().slice(0, 10) // YYYY-MM-DD

        const counterDocRef = doc(
          db,
          "restaurants",
          restaurantIdForOrder,
          "order_counters",
          dateKey,
        )

        const nextCounter = await runTransaction(db, async (transaction) => {
          const snap = await transaction.get(counterDocRef)
          const last = snap.exists()
            ? ((snap.data().lastCounter as number) || 0)
            : 0
          const updated = last + 1
          transaction.set(
            counterDocRef,
            { lastCounter: updated },
            { merge: true },
          )
          return updated
        })

        const orderNumber = `${dayOfMonth}${nextCounter}`

        // Always add restaurantId and orderNumber into the stored document
        const orderData = {
          ...order,
          restaurantId: restaurantIdForOrder,
          orderNumber,
        }

        // Store only under the particular restaurant's orders subcollection
        const restaurantOrdersCol = collection(
          db,
          "restaurants",
          restaurantIdForOrder,
          "orders",
        )
        const restaurantDocRef = await addDoc(restaurantOrdersCol, orderData)
        const docId = restaurantDocRef.id

        const newOrder: Order = { ...(orderData as any), id: docId }
        setOrders((prev) => [newOrder, ...prev])
        return docId
      }

      // Fallback: create order in localStorage (existing behavior)
      const storedOrders = localStorage.getItem("orders")
      const allOrders: Order[] = storedOrders ? JSON.parse(storedOrders) : []
      const newId = String(allOrders.length + 1)
      const newOrder = { ...order, id: newId }
      allOrders.push(newOrder)
      localStorage.setItem("orders", JSON.stringify(allOrders))
      setOrders(allOrders)
      return newId
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to create order")
    }
  }

  const updateOrderStatus = async (
    orderId: string,
    status: Order["status"],
  ) => {
    try {
      const config = getFirebaseConfig()

      if (config.apiKey && config.projectId) {
        const { initializeApp, getApps } = await import("firebase/app")
        const { getFirestore, doc, updateDoc } = await import("firebase/firestore")

        const apps = getApps()
        const app = apps.length ? apps[0] : initializeApp(config)
        const db = getFirestore(app)

        // Find order in current state to get restaurantId
        const currentOrder = orders.find((o) => o.id === orderId)
        if (!currentOrder) {
          throw new Error("Order not found in local state")
        }

        const restaurantIdForOrder = (currentOrder as any).restaurantId
        if (!restaurantIdForOrder) {
          throw new Error(
            "restaurantId is required to update order in Firestore",
          )
        }

        const orderRef = doc(
          db,
          "restaurants",
          restaurantIdForOrder,
          "orders",
          orderId,
        )
        await updateDoc(orderRef, {
          status,
          ...(status === "delivered" && {
            completedAt: new Date().toISOString(),
          }),
        })

        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status,
                  ...(status === "delivered" && {
                    completedAt: new Date().toISOString(),
                  }),
                }
              : order,
          ),
        )
        return
      }

      // Fallback: update in localStorage (existing behavior)
      const storedOrders = localStorage.getItem("orders")
      const allOrders: Order[] = storedOrders ? JSON.parse(storedOrders) : []
      const updated = allOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
              ...(status === "delivered" && {
                completedAt: new Date().toISOString(),
              }),
            }
          : order,
      )
      localStorage.setItem("orders", JSON.stringify(updated))
      setOrders(updated)
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to update order")
    }
  }

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrderStatus,
  }
}