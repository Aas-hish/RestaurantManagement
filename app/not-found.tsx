"use client"

import Link from "next/link"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF8E7] to-[#F5F1E8] p-4">
      <div className="text-center max-w-md">
        {/* Error Code */}
        <div className="mb-6">
          <h1 className="text-9xl font-serif font-bold gradient-text">404</h1>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-serif font-bold text-[#1A1A1A] mb-2">Page Not Found</h2>
        <p className="text-[#475569] mb-8">The page you are looking for doesn't exist or has been moved.</p>

        {/* Link Home */}
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <Home size={20} />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
