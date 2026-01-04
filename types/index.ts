export interface MenuItem {
  id: string
  name: string
  description: string
  category: "Appetizer" | "Main Course" | "Dessert" | "Beverage" | "Special"
  price: number
  imageUrl: string
  available: boolean
  createdAt: string
}

export interface OrderItem {
  menuId: string
  quantity: number
  price: number
  name: string
}

export interface Order {
  id: string
  table: string
  items: OrderItem[]
  status: "pending" | "cooking" | "ready" | "delivered" | "cancelled"
  waiterId: string
  waiterName: string
  totalAmount: number
  timestamp: string
  estimatedTime?: number // in minutes
  completedAt?: string
  orderNumber?: string // human-readable order id for display
}

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "waiter" | "kitchen"
  createdAt: string
}

export interface RestaurantSettings {
  restaurantName: string
  restaurantLogo?: string
  contactInfo: {
    phone: string
    email: string
    address: string
  }
  operatingHours: {
    open: string
    close: string
  }
}
