"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useWaiterReadyNotifications } from "@/hooks/use-waiter-ready-notifications"
import { Bell, BellRing } from "lucide-react"
import type { Order } from "@/types"

// Generate a loud, attention-grabbing notification sound for ready orders
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

  // Generate a pleasant notification sound for ready orders
  // Two beeps: medium frequency (880Hz), then higher (1100Hz)
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate
    let value = 0
    
    // First beep (0-0.3s): 880Hz
    if (t < 0.3) {
      value = Math.sin(2 * Math.PI * 880 * t) * 0.4
    }
    // Silence (0.3-0.4s)
    else if (t < 0.4) {
      value = 0
    }
    // Second beep (0.4-0.8s): 1100Hz
    else {
      value = Math.sin(2 * Math.PI * 1100 * (t - 0.4)) * 0.4
    }
    
    const sample = Math.max(-1, Math.min(1, value))
    view.setInt16(44 + i * 2, sample * 0x7fff, true)
  }

  const blob = new Blob([buffer], { type: "audio/wav" })
  return URL.createObjectURL(blob)
}

export function WaiterNotification() {
  const [showNotification, setShowNotification] = useState(false)
  const [readyOrderInfo, setReadyOrderInfo] = useState<Order | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const soundUrlRef = useRef<string | null>(null)
  const lastHandled = useRef<Set<string>>(new Set())

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

  // Handle ready order notification
  const handleReadyOrder = useCallback(
    (order: any) => {
      // Avoid duplicate notifications for the same order
      if (lastHandled.current.has(order.id)) {
        return
      }
      lastHandled.current.add(order.id)

      console.log("Waiter Notification: ORDER READY!", order)
      
      // Play notification sound - play it twice for attention
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

        // Play again after 0.9 seconds
        setTimeout(() => {
          playSound()
        }, 900)
      }

      // Show visual notification
      setReadyOrderInfo(order as Order)
      setShowNotification(true)

      // Auto-hide notification after 8 seconds
      setTimeout(() => {
        setShowNotification(false)
        setReadyOrderInfo(null)
      }, 8000)
    },
    [],
  )

  // When order is no longer ready (delivered/cancelled)
  const handleOrderNoLongerReady = useCallback((order: any) => {
    lastHandled.current.delete(order.id)
    // If this was the currently shown order, hide the notification
    if (readyOrderInfo?.id === order.id) {
      setShowNotification(false)
      setReadyOrderInfo(null)
    }
  }, [readyOrderInfo])

  // Listen for ready orders
  useWaiterReadyNotifications(handleReadyOrder, handleOrderNoLongerReady)

  return (
    <>
      {/* Notification Bell - Fixed Position */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            setShowNotification(false)
            setReadyOrderInfo(null)
          }}
          className={`p-3 rounded-full shadow-lg transition-all duration-300 ${
            showNotification
              ? "bg-green-600 text-white animate-bounce"
              : "bg-white text-[#1A1A1A] border border-[#E2E8F0] hover:bg-[#F8FAFC]"
          }`}
          title={showNotification ? "Order ready to serve!" : "Notifications"}
        >
          {showNotification ? (
            <BellRing className="h-6 w-6" />
          ) : (
            <Bell className="h-6 w-6" />
          )}
        </button>
        {showNotification && (
          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
            !
          </div>
        )}
      </div>

      {/* Ready Order Notification Toast */}
      {showNotification && readyOrderInfo && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-5">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-green-500 p-4 max-w-sm animate-pulse">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <BellRing className="h-5 w-5 text-green-600 animate-bounce" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-[#0F172A] mb-1">
                  ✅ ORDER READY!
                </h3>
                <p className="text-sm font-semibold text-[#64748B]">
                  Table {readyOrderInfo.table.replace(/^\D+/, "")} · Order #
                  {readyOrderInfo.orderNumber ?? readyOrderInfo.id.slice(-6)}
                </p>
                <p className="text-xs text-[#94A3B8] mt-1">
                  {readyOrderInfo.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                  )}{" "}
                  item
                  {readyOrderInfo.items.reduce((sum, item) => sum + item.quantity, 0) !== 1
                    ? "s"
                    : ""}{" "}
                  ready to serve
                </p>
              </div>
              <button
                onClick={() => {
                  setShowNotification(false)
                  setReadyOrderInfo(null)
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

