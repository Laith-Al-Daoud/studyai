/**
 * Error Boundary Component
 * 
 * Catches errors in child components and displays a fallback UI
 */

'use client'

import React, { Component, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackError } from '@/lib/monitoring'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo)
    
    // Track the error
    trackError(error, {
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center min-h-[400px] p-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: 'spring',
              stiffness: 260,
              damping: 20,
              delay: 0.1 
            }}
            className="mb-4 p-4 bg-destructive/10 rounded-full"
          >
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Something went wrong
          </h2>
          
          <p className="text-text-secondary text-center max-w-md mb-6">
            An unexpected error occurred. Please try refreshing the page.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-6 p-4 bg-muted rounded-lg max-w-2xl w-full">
              <summary className="cursor-pointer text-sm font-medium mb-2">
                Error details (development only)
              </summary>
              <pre className="text-xs overflow-auto">
                {this.state.error.toString()}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          
          <Button
            onClick={() => {
              this.setState({ hasError: false })
              window.location.reload()
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>
        </motion.div>
      )
    }

    return this.props.children
  }
}

