/**
 * Combined Providers Component
 * 
 * Wraps all context providers for the app
 */

'use client'

import { AuthProvider } from './AuthProvider'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  )
}

