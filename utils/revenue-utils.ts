"use client"

import type { Order } from "@/types"

// Helper to get Firebase config
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

// Get start and end of day
export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getEndOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

// Get start and end of week
export function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday as first day
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getEndOfWeek(date: Date = new Date()): Date {
  const d = getStartOfWeek(date)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

// Get start and end of month
export function getStartOfMonth(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getEndOfMonth(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1, 0)
  d.setHours(23, 59, 59, 999)
  return d
}

// Calculate revenue from orders
// Only counts orders with status "delivered"
export function calculateRevenueFromOrders(
  orders: Order[],
  startDate?: Date,
  endDate?: Date,
): number {
  // First filter to only delivered orders
  let filtered = orders.filter((o) => o.status === "delivered")

  // Then filter by date range if provided
  // Use completedAt timestamp for delivered orders (when revenue was actually earned)
  if (startDate && endDate) {
    filtered = filtered.filter((o) => {
      const orderDate = new Date(o.timestamp)
      return orderDate >= startDate && orderDate <= endDate
    })
  }

  // Sum up total amounts from delivered orders only
  return filtered.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
}

// Get orders count
export function getOrdersCount(
  orders: Order[],
  startDate?: Date,
  endDate?: Date,
): number {
  // First filter to only delivered orders
  let filtered = orders.filter((o) => o.status === "delivered")

  // Then filter by date range if provided
  if (startDate && endDate) {
    filtered = filtered.filter((o) => {
      const orderDate = new Date(o.timestamp)
      return orderDate >= startDate && orderDate <= endDate
    })
  }

  return filtered.length
}

// Fetch orders from Firebase
export async function fetchOrdersFromFirebase(
  restaurantId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<Order[]> {
  const config = getFirebaseConfig()
  if (!config.apiKey || !config.projectId) {
    // Fallback to localStorage
    const storedOrders = localStorage.getItem("orders")
    return storedOrders ? JSON.parse(storedOrders) : []
  }

  try {
    const { initializeApp, getApps } = await import("firebase/app")
    const {
      getFirestore,
      collection,
      query,
      where,
      orderBy,
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

    let q: any = query(baseCollection, orderBy("timestamp", "desc"))

    if (startDate && endDate) {
      q = query(
        q,
        where("timestamp", ">=", startDate.toISOString()),
        where("timestamp", "<=", endDate.toISOString()),
      )
    }

    const snap = await getDocs(q)
    const orders: Order[] = []
    snap.forEach((doc) => {
      const data = doc.data() as any
      orders.push({ id: doc.id, ...data } as Order)
    })

    return orders
  } catch (error) {
    console.error("Error fetching orders from Firebase:", error)
    // Fallback to localStorage
    const storedOrders = localStorage.getItem("orders")
    return storedOrders ? JSON.parse(storedOrders) : []
  }
}

// Get daily revenue data for the last 7 days
// Only includes delivered orders
export function getWeeklyRevenueData(orders: Order[]): Array<{
  name: string
  revenue: number
  orders: number
  date: Date
}> {
  const data: Array<{
    name: string
    revenue: number
    orders: number
    date: Date
  }> = []

  // Ensure we only work with delivered orders
  const deliveredOnly = orders.filter((o) => o.status === "delivered")

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const start = getStartOfDay(date)
    const end = getEndOfDay(date)

    // Filter by completedAt (when order was delivered) or timestamp as fallback
    const dayOrders = deliveredOnly.filter((o) => {
      const orderDate = new Date(o.timestamp)
      return orderDate >= start && orderDate <= end
    })

    const revenue = dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" })

    data.push({
      name: dayName,
      revenue,
      orders: dayOrders.length,
      date,
    })
  }

  return data
}

// Get monthly revenue data for the last 12 months
// Only includes delivered orders
export function getMonthlyRevenueData(orders: Order[]): Array<{
  name: string
  revenue: number
  orders: number
  month: number
  year: number
}> {
  const data: Array<{
    name: string
    revenue: number
    orders: number
    month: number
    year: number
  }> = []

  // Ensure we only work with delivered orders
  const deliveredOnly = orders.filter((o) => o.status === "delivered")

  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = getStartOfMonth(date)
    const end = getEndOfMonth(date)

    // Filter by completedAt (when order was delivered) or timestamp as fallback
    const monthOrders = deliveredOnly.filter((o) => {
      const orderDate = new Date(o.timestamp)
      return orderDate >= start && orderDate <= end
    })

    const revenue = monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    const monthName = date.toLocaleDateString("en-US", { month: "short" })

    data.push({
      name: monthName,
      revenue,
      orders: monthOrders.length,
      month: date.getMonth(),
      year: date.getFullYear(),
    })
  }

  return data
}

