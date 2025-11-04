/**
 * Error Tracking and Monitoring
 * 
 * Lightweight error tracking system for production monitoring
 * Can be extended with Sentry, LogRocket, or other services
 */

export interface ErrorContext {
  userId?: string
  url?: string
  userAgent?: string
  timestamp: string
  environment: string
  additionalData?: Record<string, unknown>
}

export interface TrackedError {
  message: string
  stack?: string
  context: ErrorContext
}

/**
 * Log error to console in development, send to monitoring service in production
 */
export function trackError(error: Error, context?: Partial<ErrorContext>): void {
  const errorData: TrackedError = {
    message: error.message,
    stack: error.stack,
    context: {
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      ...context,
    },
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Tracked Error:', errorData)
    return
  }

  // In production, send to monitoring service
  sendToMonitoringService(errorData)
}

/**
 * Send error to monitoring service (Sentry, LogRocket, etc.)
 * This is a placeholder - implement with your preferred service
 */
async function sendToMonitoringService(errorData: TrackedError): Promise<void> {
  try {
    // Example: Send to custom API endpoint
    if (process.env.NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT) {
      await fetch(process.env.NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      })
    }

    // Example: Log to console in production (for now)
    console.error('[Error Tracking]', errorData.message, errorData.context)

    // TODO: Integrate with Sentry
    // Sentry.captureException(new Error(errorData.message), {
    //   extra: errorData.context,
    // })
  } catch (err) {
    // Fail silently - don't let error tracking break the app
    console.error('Failed to send error to monitoring service:', err)
  }
}

/**
 * Track custom events for analytics
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Event:', eventName, properties)
    return
  }

  // Send to analytics service
  if (typeof window !== 'undefined' && (window as any).plausible) {
    // Using Plausible Analytics (privacy-focused)
    (window as any).plausible(eventName, { props: properties })
  }

  // TODO: Add other analytics providers
}

/**
 * Track page views for analytics
 */
export function trackPageView(url: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('📄 Page View:', url)
    return
  }

  // Plausible auto-tracks page views, but you can manually track if needed
  if (typeof window !== 'undefined' && (window as any).plausible) {
    (window as any).plausible('pageview', { url })
  }
}

/**
 * Track user actions
 */
export const Analytics = {
  // Auth events
  signUp: () => trackEvent('signup'),
  login: () => trackEvent('login'),
  logout: () => trackEvent('logout'),

  // Subject events
  createSubject: () => trackEvent('create_subject'),
  deleteSubject: () => trackEvent('delete_subject'),
  updateSubject: () => trackEvent('update_subject'),

  // Chapter events
  createChapter: () => trackEvent('create_chapter'),
  deleteChapter: () => trackEvent('delete_chapter'),
  updateChapter: () => trackEvent('update_chapter'),

  // File events
  uploadFile: (fileType: string) => trackEvent('upload_file', { file_type: fileType }),
  deleteFile: () => trackEvent('delete_file'),

  // Chat events
  sendMessage: () => trackEvent('send_message'),
  receiveResponse: (responseTime: number) =>
    trackEvent('receive_ai_response', { response_time: responseTime }),

  // Flashcard events
  generateFlashcards: () => trackEvent('generate_flashcards'),
  viewFlashcard: () => trackEvent('view_flashcard'),
  deleteFlashcard: () => trackEvent('delete_flashcard'),
} as const


