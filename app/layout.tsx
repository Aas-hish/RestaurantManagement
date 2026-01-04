import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/auth-context"
import { AlertDialogProvider } from "@/components/alert/alert-dialog"

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" })
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Restaurant Management System",
  description: "Premium restaurant management dashboard with real-time order tracking",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} ${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <AlertDialogProvider>
            {children}
          </AlertDialogProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
