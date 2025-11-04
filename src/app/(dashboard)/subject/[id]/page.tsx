/**
 * Subject Detail Page
 * 
 * Shows chapters within a subject.
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, ArrowLeft, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChapterCard } from '@/components/chapter/ChapterCard'
import { CreateChapterModal } from '@/components/chapter/CreateChapterModal'
import { EmptyState } from '@/components/common/EmptyState'
import { getSubjectById, getChaptersBySubjectId } from '@/lib/actions'
import { Skeleton } from '@/components/ui/skeleton'
import type { Subject, Chapter } from '@/types'

export default function SubjectPage() {
  const params = useParams()
  const router = useRouter()
  const subjectId = params.id as string

  const [subject, setSubject] = useState<Subject | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    
    const [subjectResult, chaptersResult] = await Promise.all([
      getSubjectById(subjectId),
      getChaptersBySubjectId(subjectId),
    ])

    if (subjectResult.success && subjectResult.data) {
      setSubject(subjectResult.data)
    }

    if (chaptersResult.success && chaptersResult.data) {
      setChapters(chaptersResult.data)
    }

    setIsLoading(false)
  }, [subjectId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  return (
    <>
      <div className="space-y-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              {isLoading ? (
                <>
                  <Skeleton className="h-10 w-64 mb-2 rounded-lg" />
                  <Skeleton className="h-5 w-96 rounded-lg" />
                </>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">
                    {subject?.title || 'Subject'}
                  </h1>
                  <p className="text-text-secondary mt-2">
                    Chapters and materials for this subject
                  </p>
                </>
              )}
            </div>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chapter
            </Button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : chapters.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No chapters yet"
            description="Create your first chapter to start adding study materials and organize your content."
            actionLabel="Create Chapter"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {chapters.map((chapter, index) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                index={index}
                onDelete={loadData}
              />
            ))}
          </div>
        )}
      </div>

      <CreateChapterModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        subjectId={subjectId}
        onSuccess={loadData}
      />
    </>
  )
}

