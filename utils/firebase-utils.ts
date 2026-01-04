// UI-only mode: no Firebase. Provide safe stubs and local helpers so the app runs.

export function getFirebaseApp() {
  throw new Error("Firebase disabled: UI-only mode")
}

export function getDb() {
  throw new Error("Firestore disabled: UI-only mode")
}

// Local demo analytics based on localStorage 'orders'
export async function calculateDailyRevenue(): Promise<number> {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("orders") : null
    const orders = raw ? (JSON.parse(raw) as any[]) : []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return orders
      .filter(
        (o) => o.status === "delivered" && new Date(o.completedAt || o.timestamp).getTime() >= today.getTime(),
      )
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
  } catch {
    return 0
  }
}

export async function getTotalOrdersToday(): Promise<number> {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("orders") : null
    const orders = raw ? (JSON.parse(raw) as any[]) : []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return orders.filter((o) => new Date(o.timestamp).getTime() >= today.getTime()).length
  } catch {
    return 0
  }
}
