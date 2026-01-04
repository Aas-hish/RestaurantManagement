"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useKitchenOrderNotifications } from "@/hooks/use-kitchen-order-notifications"
import { Bell, BellRing } from "lucide-react"
import type { Order } from "@/types"

// Generate a loud, attention-grabbing notification sound
function createNotificationSound(): string {
  const sampleRate = 44100
  const duration = 0.8 // Longer duration
  const samples = Math.floor(sampleRate * duration)
  const buffer = new ArrayBuffer(44 + samples * 2)
  const view = new DataView(buffer)

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }
  writeString(0, "RIFF")
  view.setUint32(4, 36 + samples * 2, true)
  writeString(8, "WAVE")
  writeString(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, "data")
  view.setUint32(40, samples * 2, true)

  // Generate a more attention-grabbing sound pattern
  // Three beeps: high frequency (1200Hz), medium (800Hz), high again
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate
    let value = 0
    
    // First beep (0-0.2s): 1200Hz
    if (t < 0.2) {
      value = Math.sin(2 * Math.PI * 1200 * t) * 0.5
    }
    // Silence (0.2-0.3s)
    else if (t < 0.3) {
      value = 0
    }
    // Second beep (0.3-0.5s): 800Hz
    else if (t < 0.5) {
      value = Math.sin(2 * Math.PI * 800 * (t - 0.3)) * 0.5
    }
    // Silence (0.5-0.6s)
    else if (t < 0.6) {
      value = 0
    }
    // Third beep (0.6-0.8s): 1200Hz again
    else {
      value = Math.sin(2 * Math.PI * 1200 * (t - 0.6)) * 0.5
    }
    
    const sample = Math.max(-1, Math.min(1, value))
    view.setInt16(44 + i * 2, sample * 0x7fff, true)
  }

  const blob = new Blob([buffer], { type: "audio/wav" })
  return URL.createObjectURL(blob)
}

export function KitchenNotification() {
  const [showNotification, setShowNotification] = useState(false)
  const [newOrderInfo, setNewOrderInfo] = useState<Order | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const soundUrlRef = useRef<string | null>(null)

  // Initialize audio with louder volume
  useEffect(() => {
    soundUrlRef.current = createNotificationSound()
    audioRef.current = new Audio(soundUrlRef.current)
    audioRef.current.volume = 1.0 // Maximum volume

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (soundUrlRef.current) {
        URL.revokeObjectURL(soundUrlRef.current)
      }
    }
  }, [])

  // Handle new order notification
  const handleNewOrder = useCallback(
    (order: Order) => {
      console.log("Kitchen Notification: NEW ORDER DETECTED!", order)
      
      // Play notification sound - play it multiple times for attention
      if (audioRef.current) {
        const playSound = () => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch((error) => {
              console.error("Error playing notification sound:", error)
            })
          }
        }

        // Play sound immediately
        playSound()

        // Play again after 0.9 seconds (after first sound completes)
        setTimeout(() => {
          playSound()
        }, 900)
      }

      // Show visual notification
      setNewOrderInfo(order)
      setShowNotification(true)

      // Auto-hide notification after 8 seconds (longer for visibility)
      setTimeout(() => {
        setShowNotification(false)
        setNewOrderInfo(null)
      }, 8000)
    },
    [],
  )

  // Listen for new orders
  useKitchenOrderNotifications(handleNewOrder)

  return (
    <>
      {/* Notification Bell - Fixed Position */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            setShowNotification(false)
            setNewOrderInfo(null)
          }}
          className={`p-3 rounded-full shadow-lg transition-all duration-300 ${
            showNotification
              ? "bg-[#7A1E1E] text-white animate-bounce"
              : "bg-white text-[#1A1A1A] border border-[#E2E8F0] hover:bg-[#F8FAFC]"
          }`}
          title={showNotification ? "New order received!" : "Notifications"}
        >
          {showNotification ? (
            <BellRing className="h-6 w-6" />
          ) : (
            <Bell className="h-6 w-6" />
          )}
        </button>
        {showNotification && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
            !
          </div>
        )}
      </div>

      {/* New Order Notification Toast */}
      {showNotification && newOrderInfo && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-5">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-[#7A1E1E] p-4 max-w-sm animate-pulse">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-[#7A1E1E]/10">
                <BellRing className="h-5 w-5 text-[#7A1E1E] animate-bounce" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-[#0F172A] mb-1">
                  🚨 NEW ORDER! 🚨
                </h3>
                <p className="text-sm font-semibold text-[#64748B]">
                  Table {newOrderInfo.table.replace(/^\D+/, "")} · Order #
                  {newOrderInfo.orderNumber ?? newOrderInfo.id.slice(-6)}
                </p>
                <p className="text-xs text-[#94A3B8] mt-1">
                  {newOrderInfo.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  )}{" "}
                  item
                  {newOrderInfo.items.reduce((sum, item) => sum + item.quantity, 0) !== 1
                    ? "s"
                    : ""}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowNotification(false)
                  setNewOrderInfo(null)
                }}
                className="text-[#94A3B8] hover:text-[#64748B] font-bold text-lg"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

