"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import type { Order } from "@/types"

// Local helper (same pattern as in use-orders)
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

// Callback when a new pending order is detected
export function useKitchenOrderNotifications(
  onNewOrder: (order: Order) => void,
) {
  const { userProfile } = useAuth()
  const lastHandled = useRef<Set<string>>(new Set())
  const previousOrdersRef = useRef<Order[]>([])
  const isInitialLoad = useRef(true)
  const onNewOrderRef = useRef(onNewOrder)

  // Keep callback ref updated
  useEffect(() => {
    onNewOrderRef.current = onNewOrder
  }, [onNewOrder])

  useEffect(() => {
    const config = getFirebaseConfig()
    const restaurantId =
      (userProfile as any)?.ownerId || userProfile?.id

    if (!restaurantId) {
      console.log("Kitchen notifications: No restaurantId, skipping setup")
      return
    }

    console.log("Kitchen notifications: Setting up listener for restaurantId:", restaurantId)

    let unsub: (() => void) | undefined
    let localStorageInterval: NodeJS.Timeout | undefined
    let handleStorageChange: ((e: StorageEvent) => void) | undefined

    // Firebase real-time listener
    if (config.apiKey && config.projectId) {
      ;(async () => {
        try {
          const { initializeApp, getApps } = await import("firebase/app")
          const {
            getFirestore,
            collection,
            query,
            where,
            onSnapshot,
            getDocs,
          } = await import("firebase/firestore")

          const apps = getApps()
          const app = apps.length ? apps[0] : initializeApp(config)
          const db = getFirestore(app)

          const baseCollection = collection(
            db,
            "restaurants",
            restaurantId,
            "orders",
          )

          // Listen for new pending orders
          const q = query(
            baseCollection,
            where("status", "==", "pending"),
          )

          // First, get existing orders to mark them as handled (don't notify on initial load)
          const initialSnapshot = await getDocs(q)
          console.log("Kitchen notifications: Initial load, found", initialSnapshot.size, "pending orders")
          initialSnapshot.forEach((doc) => {
            lastHandled.current.add(doc.id)
          })
          isInitialLoad.current = false

          unsub = onSnapshot(
            q,
            (snap) => {
              // Skip notifications on the very first snapshot (initial load)
              if (isInitialLoad.current) {
                console.log("Kitchen notifications: Skipping initial snapshot")
                isInitialLoad.current = false
                snap.forEach((doc) => {
                  lastHandled.current.add(doc.id)
                })
                return
              }

              console.log("Kitchen notifications: Snapshot update, changes:", snap.docChanges().length)
              snap.docChanges().forEach((change) => {
                const id = change.doc.id
                const data = { id, ...(change.doc.data() as any) } as Order

                console.log("Kitchen notifications: Change detected:", change.type, "orderId:", id, "already handled:", lastHandled.current.has(id))

                // Only trigger for newly added pending orders that we haven't seen
                if (change.type === "added" && !lastHandled.current.has(id)) {
                  console.log("Kitchen notifications: NEW ORDER DETECTED! Triggering notification for order:", id)
                  lastHandled.current.add(id)
                  onNewOrderRef.current(data)
                }
              })
            },
            (error) => {
              if ((error as any).code === "permission-denied") {
                console.warn(
                  "Kitchen notifications listener permission denied. Ignoring.",
                )
                return
              }
              console.error("Kitchen notifications listener error", error)
            },
          )
        } catch (error) {
          console.error("Error setting up Firebase listener:", error)
        }
      })()
    } else {
      // Fallback: Poll localStorage for new orders + listen to storage events
      console.log("Kitchen notifications: Using localStorage polling mode")
      
      // Function to check for new orders
      const checkForNewOrders = () => {
        try {
          const storedOrders = localStorage.getItem("orders")
          const allOrders: Order[] = storedOrders
            ? JSON.parse(storedOrders)
            : []

          const pendingOrders = allOrders.filter(
            (o) => o.status === "pending",
          )

          if (isInitialLoad.current) {
            // Mark all existing orders as handled on initial load
            console.log("Kitchen notifications: Initial localStorage load, found", pendingOrders.length, "pending orders")
            pendingOrders.forEach((order) => {
              lastHandled.current.add(order.id)
            })
            previousOrdersRef.current = pendingOrders
            isInitialLoad.current = false
            return
          }

          // Find new orders that weren't in the previous list
          const previousIds = new Set(
            previousOrdersRef.current.map((o) => o.id),
          )
          const newOrders = pendingOrders.filter(
            (o) => !previousIds.has(o.id) && !lastHandled.current.has(o.id),
          )

          if (newOrders.length > 0) {
            console.log("Kitchen notifications: NEW ORDER(S) DETECTED in localStorage! Count:", newOrders.length)
          }

          // Trigger notification for each new order
          newOrders.forEach((order) => {
            console.log("Kitchen notifications: Triggering notification for order:", order.id, "Table:", order.table)
            lastHandled.current.add(order.id)
            onNewOrderRef.current(order)
          })

          previousOrdersRef.current = pendingOrders
        } catch (error) {
          console.error("Error checking localStorage for new orders:", error)
        }
      }

      // Initialize after a short delay
      setTimeout(checkForNewOrders, 500)

      // Poll every 500ms
      localStorageInterval = setInterval(checkForNewOrders, 500)

      // Also listen to storage events (for cross-tab updates)
      handleStorageChange = (e: StorageEvent) => {
        if (e.key === "orders" && e.newValue) {
          console.log("Kitchen notifications: Storage event detected, checking for new orders")
          checkForNewOrders()
        }
      }

      window.addEventListener("storage", handleStorageChange)
    }

    // Return cleanup function
    return () => {
      console.log("Kitchen notifications: Cleaning up listeners")
      if (unsub) unsub()
      if (localStorageInterval) clearInterval(localStorageInterval)
      if (handleStorageChange) {
        window.removeEventListener("storage", handleStorageChange)
      }
    }
  }, [userProfile]) // Removed onNewOrder from dependencies to prevent re-initialization
}

