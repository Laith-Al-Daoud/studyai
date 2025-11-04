/**
 * Dashboard Page
 * 
 * Main dashboard showing user's subjects.
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { SubjectCard } from '@/components/subject/SubjectCard'
import { CreateSubjectModal } from '@/components/subject/CreateSubjectModal'
import { EmptyState } from '@/components/common/EmptyState'
import { getSubjects } from '@/lib/actions'
import { Skeleton } from '@/components/ui/skeleton'
import type { Subject } from '@/types'

export default function DashboardPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadSubjects = useCallback(async () => {
    setIsLoading(true)
    const result = await getSubjects()
    if (result.success && result.data) {
      setSubjects(result.data)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSubjects()
  }, [loadSubjects])

  return (
    <>
      <div className="space-y-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">
              My Subjects
            </h1>
            <p className="text-text-secondary mt-2">
              Create subjects to organize your study materials
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Subject
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No subjects yet"
            description="Get started by creating your first subject to organize your study materials and chapters."
            actionLabel="Create Subject"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {subjects.map((subject, index) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                index={index}
                onDelete={loadSubjects}
              />
            ))}
          </div>
        )}
      </div>

      <CreateSubjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={loadSubjects}
      />
    </>
  )
}


