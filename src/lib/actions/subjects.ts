/**
 * Subject Server Actions
 * 
 * Server-side subject CRUD operations
 */

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateSubjectInput, UpdateSubjectInput } from '@/lib/validations'
import type { Subject } from '@/types'

type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

export async function getSubjects(): Promise<ActionResult<Subject[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data || [] }
}

export async function getSubjectById(id: string): Promise<ActionResult<Subject>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}

export async function createSubject(input: CreateSubjectInput): Promise<ActionResult<Subject>> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('subjects')
    .insert({
      title: input.title,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true, data }
}

export async function updateSubject(id: string, input: UpdateSubjectInput): Promise<ActionResult<Subject>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subjects')
    .update({
      title: input.title,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/subject/${id}`)
  return { success: true, data }
}

export async function deleteSubject(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

