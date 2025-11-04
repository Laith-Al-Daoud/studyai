/**
 * Subject Card Component
 * 
 * Card display for a subject with actions
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, MoreVertical, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { deleteSubject } from '@/lib/actions'
import { toast } from 'sonner'
import type { Subject } from '@/types'

interface SubjectCardProps {
  subject: Subject
  onDelete?: () => void
  index?: number
}

export function SubjectCard({ subject, onDelete, index = 0 }: SubjectCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    
    try {
      const response = await deleteSubject(subject.id)
      
      if (!response.success) {
        toast.error(response.error || 'Failed to delete subject')
        setIsDeleting(false)
        return
      }

      toast.success('Subject deleted successfully')
      setShowDeleteDialog(false)
      onDelete?.()
    } catch (error) {
      console.error('Delete subject error:', error)
      toast.error('An unexpected error occurred')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: index * 0.1,
          ease: 'easeOut',
        }}
        whileHover={{ 
          y: -4,
          transition: { duration: 0.2 }
        }}
      >
        <Card className="hover:border-accent transition-colors h-full">
          <CardHeader>
            <div className="flex items-start justify-between">
              <Link href={`/subject/${subject.id}`} className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="p-2 bg-accent/10 rounded-lg flex-shrink-0"
                  >
                    <BookOpen className="h-5 w-5 text-accent" />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xl hover:text-accent transition-colors truncate">
                      {subject.title}
                    </CardTitle>
                    <CardDescription className="truncate">
                      Created {new Date(subject.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="flex-shrink-0"
                    aria-label="Subject options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Subject"
        description="Are you sure you want to delete this subject? This will also delete all chapters and files within it. This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  )
}

