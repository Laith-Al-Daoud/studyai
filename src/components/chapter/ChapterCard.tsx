/**
 * Chapter Card Component
 * 
 * Card display for a chapter with actions
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, MoreVertical, Trash2 } from 'lucide-react'
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
import { deleteChapter } from '@/lib/actions'
import { toast } from 'sonner'
import type { Chapter } from '@/types'

interface ChapterCardProps {
  chapter: Chapter
  onDelete?: () => void
  index?: number
}

export function ChapterCard({ chapter, onDelete, index = 0 }: ChapterCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    
    try {
      const response = await deleteChapter(chapter.id)
      
      if (!response.success) {
        toast.error(response.error || 'Failed to delete chapter')
        setIsDeleting(false)
        return
      }

      toast.success('Chapter deleted successfully')
      setShowDeleteDialog(false)
      onDelete?.()
    } catch (error) {
      console.error('Delete chapter error:', error)
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
              <Link href={`/chapter/${chapter.id}`} className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="p-2 bg-accent/10 rounded-lg flex-shrink-0"
                  >
                    <FileText className="h-5 w-5 text-accent" />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xl hover:text-accent transition-colors truncate">
                      {chapter.title}
                    </CardTitle>
                    <CardDescription className="truncate">
                      Created {new Date(chapter.created_at).toLocaleDateString()}
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
                    aria-label="Chapter options"
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
        title="Delete Chapter"
        description="Are you sure you want to delete this chapter? This will also delete all files within it. This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  )
}

