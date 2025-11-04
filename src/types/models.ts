/**
 * Domain Model Types
 * 
 * Business logic types that extend or compose database types.
 */

import type { Database } from './database'

// Extract table types from database
export type Subject = Database['public']['Tables']['subjects']['Row']
export type SubjectInsert = Database['public']['Tables']['subjects']['Insert']
export type SubjectUpdate = Database['public']['Tables']['subjects']['Update']

export type Chapter = Database['public']['Tables']['chapters']['Row']
export type ChapterInsert = Database['public']['Tables']['chapters']['Insert']
export type ChapterUpdate = Database['public']['Tables']['chapters']['Update']

export type File = Database['public']['Tables']['files']['Row']
export type FileInsert = Database['public']['Tables']['files']['Insert']
export type FileUpdate = Database['public']['Tables']['files']['Update']

export type Chat = Database['public']['Tables']['chats']['Row']
export type ChatInsert = Database['public']['Tables']['chats']['Insert']
export type ChatUpdate = Database['public']['Tables']['chats']['Update']

// Extended types with relationships
export type SubjectWithChapters = Subject & {
  chapters: Chapter[]
}

export type ChapterWithFiles = Chapter & {
  files: File[]
}

export type ChapterWithFilesAndChats = Chapter & {
  files: File[]
  chats: Chat[]
}

// Auth types
export type User = {
  id: string
  email: string
  created_at: string
}


