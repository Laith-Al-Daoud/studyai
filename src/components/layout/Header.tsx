'use client'

/**
 * Header Component
 * 
 * Main application header with navigation and user profile menu.
 * Displayed on all authenticated pages.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, User, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { APP_NAME } from '@/lib/constants'
import { useAuth } from '@/components/providers/AuthProvider'
import { logout } from '@/lib/actions'
import { toast } from 'sonner'

export function Header() {
  const router = useRouter()
  const { user } = useAuth()

  const handleLogout = async () => {
    try {
      const response = await logout()
      
      if (!response.success) {
        toast.error(response.error || 'Failed to log out')
        return
      }
      
      toast.success('Logged out successfully')
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to log out')
    }
  }

  const userEmail = user?.email || 'user@example.com'
  const userInitials = user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-panel/95 backdrop-blur supports-[backdrop-filter]:bg-panel/60">
      <div className="max-w-7xl mx-auto px-6 flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-accent" />
          <Link href="/dashboard" className="font-bold text-xl text-text-primary hover:text-accent transition-colors">
            {APP_NAME}
          </Link>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-accent text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Account</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}


