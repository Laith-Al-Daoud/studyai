/**
 * Landing Page
 * 
 * Redirects to dashboard if authenticated, otherwise shows landing content.
 * Middleware will handle the redirect logic.
 */

import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="flex justify-center">
          <BookOpen className="h-20 w-20 text-accent" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-text-primary tracking-tight">
            {APP_NAME}
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            {APP_DESCRIPTION}
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link href="/register">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">
              Sign In
            </Link>
          </Button>
        </div>

        <div className="pt-8 space-y-4">
          <h2 className="text-2xl font-semibold text-text-primary">
            Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6 pt-4">
            <div className="p-6 bg-panel rounded-2xl border border-border">
              <h3 className="font-semibold text-lg text-text-primary mb-2">
                Organize Your Study
              </h3>
              <p className="text-text-secondary text-sm">
                Create subjects and chapters to organize your lecture materials efficiently.
              </p>
            </div>
            <div className="p-6 bg-panel rounded-2xl border border-border">
              <h3 className="font-semibold text-lg text-text-primary mb-2">
                Upload PDFs
              </h3>
              <p className="text-text-secondary text-sm">
                Upload your lecture PDFs and keep all your materials in one secure place.
              </p>
            </div>
            <div className="p-6 bg-panel rounded-2xl border border-border">
              <h3 className="font-semibold text-lg text-text-primary mb-2">
                AI Chat Assistant
              </h3>
              <p className="text-text-secondary text-sm">
                Ask questions about your materials and get instant AI-powered answers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
