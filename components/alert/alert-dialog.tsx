"use client"

import React, { useState, createContext, useContext, useCallback, useRef } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type AlertDialogOptions = {
  title: string
  description: string
  actionText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

type AlertContextType = {
  showAlert: (options: Omit<AlertDialogOptions, 'onConfirm' | 'onCancel'>) => Promise<boolean>
}

const AlertDialogContext = createContext<AlertContextType | null>(null)

export function AlertDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [alertData, setAlertData] = useState<AlertDialogOptions | null>(null)
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const showAlert = useCallback((options: Omit<AlertDialogOptions, 'onConfirm' | 'onCancel'>) => {
    return new Promise<boolean>((resolve) => {
      setAlertData({
        ...options,
        onConfirm: () => {
          setOpen(false)
          resolve(true)
        },
        onCancel: () => {
          setOpen(false)
          resolve(false)
        }
      })
      setOpen(true)
    })
  }, [])

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // When dialog is closing
      setOpen(false)
      resolveRef.current?.(false)
      alertData?.onCancel?.()
    } else {
      setOpen(true)
    }
  }

  const handleCancel = () => {
    setOpen(false)
    resolveRef.current?.(false)
    alertData?.onCancel?.()
  }

  const handleConfirm = () => {
    setOpen(false)
    resolveRef.current?.(true)
    alertData?.onConfirm?.()
  }

  return (
    <AlertDialogContext.Provider value={{ showAlert }}>
      {children}
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertData?.title || 'Are you sure?'}</AlertDialogTitle>
            {alertData?.description && (
              <AlertDialogDescription>
                {alertData.description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {alertData?.cancelText || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {alertData?.actionText || 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertDialogContext.Provider>
  )
}

export function useAlert() {
  const context = useContext(AlertDialogContext)
  if (!context) {
    throw new Error('useAlert must be used within an AlertDialogProvider')
  }
  return context
}
