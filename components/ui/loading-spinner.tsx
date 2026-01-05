import { Utensils, Loader2 } from "lucide-react"

export function LoadingSpinner({ 
  className = "", 
  size = 48,
  fullScreen = false,
  variant = 'full' // 'full' | 'card' | 'tiny'
}: { 
  className?: string
  size?: number 
  fullScreen?: boolean
  variant?: 'full' | 'card' | 'tiny'
}) {

  // Tiny variant for buttons (simple but themed)
  if (variant === 'tiny') {
     return (
        <Loader2 
          className={`animate-spin text-current ${className}`} 
          size={size || 16} 
        />
     )
  }

  // Card Layout (medium size, no text)
  if (variant === 'card') {
    return (
        <div className={`relative flex items-center justify-center bg-white rounded-full shadow-md animate-spin-slow border border-[#7A1E1E]/10 ${className}`} style={{ width: size, height: size }}>
            <div className="absolute inset-1 border border-dashed border-[#7A1E1E]/30 rounded-full"></div>
            <Utensils className="text-[#7A1E1E]" size={size * 0.5} />
        </div>
    )
  }

  // Full Layout (for Page Loading)
  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-6 ${className}`}>
      <div className="relative">
        {/* Outer Ring */}
        <div 
           className="absolute inset-0 rounded-full border-4 border-[#7A1E1E]/10" 
           style={{ width: size + 20, height: size + 20, top: -10, left: -10 }} 
        />
        
         {/* Spinning Plate Effect */}
        <div 
          className="relative flex items-center justify-center bg-white rounded-full shadow-xl animate-spin-slow border border-[#7A1E1E]/10"
          style={{ width: size, height: size }}
        >
          <div className="absolute inset-2 border-2 border-dashed border-[#7A1E1E]/30 rounded-full"></div>
          <Utensils 
             className="text-[#7A1E1E] animate-pulse" 
             size={size * 0.5} 
          />
        </div>

        {/* Orbiting Dot */}
        <div 
           className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 animate-spin"
           style={{ width: size + 20, height: size + 20, animationDuration: '3s' }}
        >
             <div className="w-3 h-3 bg-[#FFD700] rounded-full absolute -top-1.5 left-1/2 -translate-x-1/2 shadow-lg"></div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
          <p className="text-[#1A1A1A] font-serif font-bold text-lg tracking-wide animate-pulse">
            Cooking up something good...
          </p>
          <div className="flex gap-1.5">
             <div className="w-1.5 h-1.5 bg-[#7A1E1E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
             <div className="w-1.5 h-1.5 bg-[#7A1E1E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
             <div className="w-1.5 h-1.5 bg-[#7A1E1E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFF8E7]/90 backdrop-blur-md">
        {spinner}
      </div>
    )
  }

  return spinner
}
