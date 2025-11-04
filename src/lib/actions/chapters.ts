/**
 * Chapter Server Actions
 * 
 * Server-side chapter CRUD operations
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateChapterInput, UpdateChapterInput } from '@/lib/validations'
import type { Chapter } from '@/types'

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

export async function getChaptersBySubjectId(subjectId: string): Promise<ActionResult<Chapter[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data || [] }
}

export async function getChapterById(id: string): Promise<ActionResult<Chapter>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function createChapter(input: CreateChapterInput): Promise<ActionResult<Chapter>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('chapters')
    .insert({
      title: input.title,
      subject_id: input.subjectId,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/subject/${input.subjectId}`)
  return { success: true, data }
}

export async function updateChapter(id: string, input: UpdateChapterInput): Promise<ActionResult<Chapter>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('chapters')
    .update({
      title: input.title,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Get chapter to revalidate correct paths
  const { data: chapter } = await supabase
    .from('chapters')
    .select('subject_id')
    .eq('id', id)
    .single()

  if (chapter) {
    revalidatePath(`/subject/${chapter.subject_id}`)
  }
  revalidatePath(`/chapter/${id}`)
  
  return { success: true, data }
}

export async function deleteChapter(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Get chapter to revalidate correct path
  const { data: chapter } = await supabase
    .from('chapters')
    .select('subject_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  if (chapter) {
    revalidatePath(`/subject/${chapter.subject_id}`)
  }
  
  return { success: true }
}

