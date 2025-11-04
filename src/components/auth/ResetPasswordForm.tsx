/**
 * Reset Password Form Component
 * 
 * Handles password reset email request
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword } from '@/lib/actions'
import { resetPasswordSchema } from '@/lib/validations'
import { toast } from 'sonner'

export function ResetPasswordForm() {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    // Validate form
    const result = resetPasswordSchema.safeParse({ email })
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as string] = error.message
        }
      })
      setErrors(fieldErrors)
      setIsLoading(false)
      return
    }

    try {
      const response = await resetPassword(result.data)
      
      if (!response.success) {
        toast.error(response.error || 'Failed to send reset email')
        setIsLoading(false)
        return
      }

      toast.success('Password reset email sent! Check your inbox.')
      setSubmitted(true)
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-text-secondary">
          We&apos;ve sent a password reset link to <strong>{email}</strong>.
          Please check your email and follow the instructions.
        </p>
        <Button 
          onClick={() => {
            setSubmitted(false)
            setEmail('')
          }}
          variant="outline"
          className="w-full"
        >
          Try another email
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email}</p>
        )}
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        size="lg" 
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </Button>
    </form>
  )
}

