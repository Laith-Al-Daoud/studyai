/**
 * Pomodoro Timer Component
 * 
 * 45-minute work timer with 10-minute breaks
 * Can be paused/resumed by clicking
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Timer, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'

const WORK_DURATION = 45 * 60 // 45 minutes in seconds
const BREAK_DURATION = 10 * 60 // 10 minutes in seconds

type TimerState = 'idle' | 'work' | 'break' | 'paused'

interface PomodoroTimerProps {
  className?: string
}

export function PomodoroTimer({ className }: PomodoroTimerProps) {
  const [state, setState] = useState<TimerState>('idle')
  const [timeRemaining, setTimeRemaining] = useState(WORK_DURATION)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Start the timer
  const startTimer = (timerType: 'work' | 'break' = 'work') => {
    const duration = timerType === 'work' ? WORK_DURATION : BREAK_DURATION
    setTimeRemaining(duration)
    setState(timerType)
  }

  // Pause/Resume the timer
  const togglePause = () => {
    if (state === 'idle') {
      startTimer('work')
      return
    }

    if (state === 'paused') {
      // Resume - determine if we were in work or break
      const wasInWork = timeRemaining > BREAK_DURATION || timeRemaining === WORK_DURATION
      setState(wasInWork ? 'work' : 'break')
    } else {
      // Pause
      setState('paused')
    }
  }

  // Reset timer
  const resetTimer = () => {
    setState('idle')
    setTimeRemaining(WORK_DURATION)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  // Timer countdown logic
  useEffect(() => {
    if (state === 'idle' || state === 'paused') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timer finished
          clearInterval(intervalRef.current!)
          intervalRef.current = null

          // Switch to break if work finished, or reset if break finished
          if (state === 'work') {
            setTimeout(() => {
              setTimeRemaining(BREAK_DURATION)
              setState('break')
            }, 100)
            return BREAK_DURATION
          } else {
            setTimeout(() => {
              resetTimer()
            }, 100)
            return 0
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [state])

  const isWorkSession = state === 'work' || (state === 'paused' && timeRemaining > BREAK_DURATION)

  // Calculate progress percentage
  const getProgress = () => {
    const total = isWorkSession ? WORK_DURATION : BREAK_DURATION
    return ((total - timeRemaining) / total) * 100
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed bottom-6 left-6 z-50 ${className}`}
    >
      <AnimatePresence mode="wait">
        {state === 'idle' ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Button
              onClick={() => startTimer('work')}
              className="h-16 px-6 rounded-full bg-accent hover:bg-accent/90 text-white shadow-lg text-base"
              aria-label="Start Pomodoro timer"
            >
              <Timer className="h-6 w-6 mr-2" />
              <span className="font-semibold">Start Focus</span>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-panel border border-border rounded-2xl p-4 shadow-xl min-w-[200px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isWorkSession ? (
                  <>
                    <Timer className="h-4 w-4 text-accent" />
                    <span className="text-sm font-semibold text-text-primary">Focus</span>
                  </>
                ) : (
                  <>
                    <Coffee className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-semibold text-text-primary">Break</span>
                  </>
                )}
              </div>
              {(state === 'work' || state === 'break' || state === 'paused') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetTimer}
                  className="h-6 w-6 p-0 text-text-secondary hover:text-text-primary"
                  aria-label="Reset timer"
                >
                  ×
                </Button>
              )}
            </div>

            {/* Timer Display */}
            <div className="text-center mb-3">
              <div className="text-3xl font-bold text-text-primary mb-1">
                {formatTime(timeRemaining)}
              </div>
              {state === 'paused' && (
                <div className="text-xs text-text-secondary">Paused</div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  isWorkSession ? 'bg-accent' : 'bg-amber-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${getProgress()}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Control Button */}
            <Button
              onClick={togglePause}
              className="w-full bg-accent hover:bg-accent/90 text-white"
              aria-label={state === 'paused' ? 'Resume timer' : 'Pause timer'}
            >
              {state === 'paused' ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

