/**
 * Dashboard Layout
 * 
 * Layout for all authenticated pages (dashboard, subjects, chapters).
 * Includes header with navigation.
 */

import { Header } from '@/components/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}


