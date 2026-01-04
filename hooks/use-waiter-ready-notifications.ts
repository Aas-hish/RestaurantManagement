"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/context/auth-context"

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

// onReady: called when an order becomes ready or is updated while ready
// onNoLongerReady: called when an order leaves the "ready" query (served/cancelled)
export function useWaiterReadyNotifications(
  onReady: (order: any) => void,
  onNoLongerReady?: (order: any) => void,
) {
  const { userProfile } = useAuth()
  const lastHandled = useRef<Set<string>>(new Set())
  const previousReadyOrdersRef = useRef<any[]>([])
  const isInitialLoad = useRef(true)
  const onReadyRef = useRef(onReady)
  const onNoLongerReadyRef = useRef(onNoLongerReady)

  // Keep callback refs updated
  useEffect(() => {
    onReadyRef.current = onReady
    onNoLongerReadyRef.current = onNoLongerReady
  }, [onReady, onNoLongerReady])

  useEffect(() => {
    const config = getFirebaseConfig()
    if (!userProfile?.id) {
      console.log("Waiter notifications: No userProfile, skipping setup")
      return
    }

    console.log("Waiter notifications: Setting up listener for waiterId:", userProfile.id)

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

          const restaurantId =
            (userProfile as any)?.ownerId || userProfile.id

          const baseCollection = collection(
            db,
            "restaurants",
            restaurantId,
            "orders",
          )

          const q = query(
            baseCollection,
            where("waiterId", "==", userProfile.id),
            where("status", "==", "ready"),
          )

          // First, get existing ready orders to mark them as handled
          const initialSnapshot = await getDocs(q)
          console.log("Waiter notifications: Initial load, found", initialSnapshot.size, "ready orders")
          initialSnapshot.forEach((doc) => {
            lastHandled.current.add(doc.id)
          })
          isInitialLoad.current = false

          unsub = onSnapshot(
            q,
            (snap) => {
              // Skip notifications on the very first snapshot (initial load)
              if (isInitialLoad.current) {
                console.log("Waiter notifications: Skipping initial snapshot")
                isInitialLoad.current = false
                snap.forEach((doc) => {
                  lastHandled.current.add(doc.id)
                })
                return
              }

              console.log("Waiter notifications: Snapshot update, changes:", snap.docChanges().length)
              snap.docChanges().forEach((change) => {
                const id = change.doc.id
                const data = { id, ...(change.doc.data() as any) }

                if (change.type === "added" || change.type === "modified") {
                  if (!lastHandled.current.has(id)) {
                    console.log("Waiter notifications: NEW READY ORDER DETECTED! Triggering notification for order:", id)
                    lastHandled.current.add(id)
                    onReadyRef.current(data)
                  }
                } else if (change.type === "removed") {
                  lastHandled.current.delete(id)
                  if (onNoLongerReadyRef.current) {
                    onNoLongerReadyRef.current(data)
                  }
                }
              })
            },
            (error) => {
              if ((error as any).code === "permission-denied") {
                console.warn(
                  "Waiter notifications listener permission denied. Ignoring.",
                )
                return
              }
              console.error("Waiter notifications listener error", error)
            },
          )
        } catch (error) {
          console.error("Error setting up Firebase listener:", error)
        }
      })()
    } else {
      // Fallback: Poll localStorage for ready orders
      console.log("Waiter notifications: Using localStorage polling mode")
      
      // Function to check for ready orders
      const checkForReadyOrders = () => {
        try {
          const storedOrders = localStorage.getItem("orders")
          const allOrders: any[] = storedOrders
            ? JSON.parse(storedOrders)
            : []

          const readyOrders = allOrders.filter(
            (o) => o.status === "ready" && o.waiterId === userProfile.id,
          )

          if (isInitialLoad.current) {
            // Mark all existing ready orders as handled on initial load
            console.log("Waiter notifications: Initial localStorage load, found", readyOrders.length, "ready orders")
            readyOrders.forEach((order) => {
              lastHandled.current.add(order.id)
            })
            previousReadyOrdersRef.current = readyOrders
            isInitialLoad.current = false
            return
          }

          // Find new ready orders that weren't in the previous list
          const previousIds = new Set(
            previousReadyOrdersRef.current.map((o) => o.id),
          )
          const newReadyOrders = readyOrders.filter(
            (o) => !previousIds.has(o.id) && !lastHandled.current.has(o.id),
          )

          // Find orders that are no longer ready
          const currentIds = new Set(readyOrders.map((o) => o.id))
          const noLongerReady = previousReadyOrdersRef.current.filter(
            (o) => !currentIds.has(o.id),
          )

          if (newReadyOrders.length > 0) {
            console.log("Waiter notifications: NEW READY ORDER(S) DETECTED in localStorage! Count:", newReadyOrders.length)
          }

          // Trigger notification for each new ready order
          newReadyOrders.forEach((order) => {
            console.log("Waiter notifications: Triggering notification for ready order:", order.id, "Table:", order.table)
            lastHandled.current.add(order.id)
            onReadyRef.current(order)
          })

          // Handle orders that are no longer ready
          noLongerReady.forEach((order) => {
            lastHandled.current.delete(order.id)
            if (onNoLongerReadyRef.current) {
              onNoLongerReadyRef.current(order)
            }
          })

          previousReadyOrdersRef.current = readyOrders
        } catch (error) {
          console.error("Error checking localStorage for ready orders:", error)
        }
      }

      // Initialize after a short delay
      setTimeout(checkForReadyOrders, 500)

      // Poll every 500ms
      localStorageInterval = setInterval(checkForReadyOrders, 500)

      // Also listen to storage events (for cross-tab updates)
      handleStorageChange = (e: StorageEvent) => {
        if (e.key === "orders" && e.newValue) {
          console.log("Waiter notifications: Storage event detected, checking for ready orders")
          checkForReadyOrders()
        }
      }

      window.addEventListener("storage", handleStorageChange)
    }

    // Return cleanup function
    return () => {
      console.log("Waiter notifications: Cleaning up listeners")
      if (unsub) unsub()
      if (localStorageInterval) clearInterval(localStorageInterval)
      if (handleStorageChange) {
        window.removeEventListener("storage", handleStorageChange)
      }
    }
  }, [userProfile]) // Removed callbacks from dependencies to prevent re-initialization
}