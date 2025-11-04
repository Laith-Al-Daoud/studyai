/**
 * Create Chapter Modal Component
 * 
 * Modal dialog for creating a new chapter
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createChapter } from '@/lib/actions'
import { createChapterSchema } from '@/lib/validations'
import { toast } from 'sonner'

interface CreateChapterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectId: string
  onSuccess?: () => void
}

export function CreateChapterModal({
  open,
  onOpenChange,
  subjectId,
  onSuccess,
}: CreateChapterModalProps) {
  const [title, setTitle] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTitle('')
      setErrors({})
      setIsLoading(false)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    // Validate form
    const result = createChapterSchema.safeParse({ title, subjectId })
    
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
      const response = await createChapter(result.data)
      
      if (!response.success) {
        toast.error(response.error || 'Failed to create chapter')
        setIsLoading(false)
        return
      }

      toast.success('Chapter created successfully')
      onOpenChange(false)
      onSuccess?.()
      // Note: isLoading and title will be reset by useEffect when modal closes
    } catch (error) {
      console.error('Create chapter error:', error)
      toast.error('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Chapter</DialogTitle>
            <DialogDescription>
              Add a new chapter to this subject
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Chapter Title</Label>
              <Input
                id="title"
                placeholder="e.g. Introduction, Chapter 1, Week 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Chapter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

