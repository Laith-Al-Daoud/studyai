/**
 * Animated Page Wrapper
 * 
 * Provides consistent page transition animations using Framer Motion
 */

'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedPageProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
}

const pageTransition = {
  type: 'spring',
  stiffness: 380,
  damping: 30,
}

export function AnimatedPage({ children, ...props }: AnimatedPageProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      {...props}
    >
      {children}
    </motion.div>
  )
}


