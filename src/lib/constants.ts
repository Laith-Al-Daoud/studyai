/**
 * Application Constants
 * 
 * Centralized configuration and constant values used throughout the app.
 */

export const APP_NAME = 'StudyAI'
export const APP_DESCRIPTION = 'Lightweight, private studying assistant'

// File Upload Constants
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const ALLOWED_FILE_TYPES = ['application/pdf']
export const FILE_UPLOAD_MIME_TYPE = 'application/pdf'

// Storage Configuration
export const STORAGE_BUCKET = 'pdfs'

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  SUBJECT: (id: string) => `/subject/${id}`,
  CHAPTER: (id: string) => `/chapter/${id}`,
} as const

// Auth Configuration
export const AUTH_COOKIE_NAME = 'sb-auth-token'

// API Configuration
export const API_ROUTES = {
  AUTH_CALLBACK: '/api/auth/callback',
  FILES_REGISTER: '/api/files/register',
} as const


